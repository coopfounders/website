export type Inquiry = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export const deliveryUnavailable =
  'We couldn’t send your inquiry right now. Please try again later.';

export async function deliverInquiry(
  inquiry: Inquiry,
  config: { apiKey?: unknown; from?: unknown; to?: unknown },
  send: typeof fetch = fetch,
) {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  const from = typeof config.from === 'string' ? config.from.trim() : '';
  const to = typeof config.to === 'string' ? config.to.trim() : '';
  const mailbox = /^(?:[^<>\r\n]+ <)?[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>?$/;
  if (!apiKey || !mailbox.test(from) || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(to))
    return { error: deliveryUnavailable, status: 503 };
  try {
    const email = {
      from,
      to: [to],
      reply_to: inquiry.email,
      subject: 'New Coop experiment inquiry',
      text: [
        'New experiment inquiry from the Coop website',
        '',
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company || 'Not provided'}`,
        '',
        'Experiment details',
        inquiry.message,
      ].join('\n'),
    };
    const body = JSON.stringify(email);
    // Resend reuses the accepted result for identical retries for 24 hours.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const response = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': `coop-inquiry/${key}`,
      },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { error: deliveryUnavailable, status: 502 };
    const accepted: unknown = await response.json();
    if (!accepted || typeof accepted !== 'object' || !('id' in accepted) || typeof accepted.id !== 'string' || !accepted.id.trim())
      return { error: deliveryUnavailable, status: 502 };
    return { ok: true, status: 200 };
  } catch {
    return { error: deliveryUnavailable, status: 502 };
  }
}

export function validateInquiry(
  value: unknown,
): { inquiry: Inquiry; error?: never } | { error: string; inquiry?: never } {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return { error: 'Please check the form and try again.' };
  const fields = value as Record<string, unknown>;
  if (fields.website !== undefined && fields.website !== '')
    return { error: 'Please check the form and try again.' };
  const string = (key: string) =>
    typeof fields[key] === 'string' ? fields[key].trim() : '';
  const name = string('name');
  const email = string('email');
  const company = string('company');
  const message = string('message');
  if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name))
    return { error: 'Please enter your name (2 to 100 characters).' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: 'Please enter a valid email address.' };
  if (company.length > 150 || /[\r\n]/.test(company))
    return { error: 'Please keep the company name under 150 characters.' };
  if (message.length < 20 || message.length > 5000)
    return {
      error: 'Please describe your experiment in 20 to 5,000 characters.',
    };
  return { inquiry: { name, email, company, message } };
}
