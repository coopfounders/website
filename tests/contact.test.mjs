import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInquiry, deliverInquiry } from '../lib/contact.ts';

const inquiry = {
  name: 'Test Researcher',
  email: 'test@example.com',
  company: 'Test team',
  message: 'Compare two policies on a pick and place task.',
};

const config = {
  apiKey: 'test-key',
  from: 'Coop Website <website@example.com>',
  to: 'team@example.com',
};

test('valid inquiry is normalized and unwanted fields are not forwarded', () => {
  const result = validateInquiry({
    ...inquiry,
    name: '  Test Researcher  ',
    website: '',
    authorization: 'untrusted',
  });
  assert.deepEqual(result.inquiry, inquiry);
});

test('malformed input, missing fields, spam, invalid emails and excess lengths are rejected', () => {
  for (const value of [
    null,
    [],
    'text',
    {},
    { ...inquiry, website: 'spam' },
    { ...inquiry, name: ' ' },
    { ...inquiry, name: 'First\nInjected' },
    { ...inquiry, email: 'invalid' },
    { ...inquiry, email: 'x@example.com\r\nInjected' },
    { ...inquiry, company: 'x'.repeat(151) },
    { ...inquiry, message: 'too short' },
    { ...inquiry, message: 'x'.repeat(5001) },
  ]) {
    assert.ok(validateInquiry(value).error, JSON.stringify(value));
  }
});

test('missing credentials or invalid mailboxes never send or return success', async () => {
  let called = false;
  const send = async () => {
    called = true;
    return new Response();
  };
  for (const invalidConfig of [
    {},
    { ...config, apiKey: '' },
    { ...config, from: 'invalid' },
    { ...config, from: 'sender@example.com\r\nInjected' },
    { ...config, to: 'invalid' },
  ]) {
    const result = await deliverInquiry(inquiry, invalidConfig, send);
    assert.equal(result.status, 503);
    assert.notEqual(result.ok, true);
  }
  assert.equal(called, false);
});

test('confirmed Resend delivery uses the configured inbox and visitor reply address', async () => {
  const result = await deliverInquiry(inquiry, config, async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    assert.match(
      options.headers['Idempotency-Key'],
      /^coop-inquiry\/[a-f0-9]{64}$/,
    );
    assert.deepEqual(JSON.parse(options.body), {
      from: config.from,
      to: [config.to],
      reply_to: inquiry.email,
      subject: 'New Coop experiment inquiry',
      text: [
        'New experiment inquiry from the Coop website',
        '',
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company}`,
        '',
        'Experiment details',
        inquiry.message,
      ].join('\n'),
    });
    return Response.json({ id: 'test-email-id' });
  });
  assert.equal(result.ok, true);
});

test('identical retries reuse the same delivery idempotency key', async () => {
  const keys = [];
  const send = async (_url, options) => {
    keys.push(options.headers['Idempotency-Key']);
    return Response.json({ id: 'test-email-id' });
  };
  await deliverInquiry(inquiry, config, send);
  await deliverInquiry(inquiry, config, send);
  await deliverInquiry(
    { ...inquiry, message: `${inquiry.message} A different task.` },
    config,
    send,
  );
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[0], keys[2]);
});

test('receiver errors and network failures never become successful submissions', async () => {
  for (const send of [
    async () => new Response(null, { status: 429 }),
    async () => new Response(null, { status: 500 }),
    async () => Response.json({}),
    async () => Response.json({ id: '' }),
    async () => new Response('invalid JSON'),
    async () => {
      throw new Error('network failure');
    },
  ]) {
    const result = await deliverInquiry(inquiry, config, send);
    assert.equal(result.status, 502);
    assert.notEqual(result.ok, true);
  }
});
