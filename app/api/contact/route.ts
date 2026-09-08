import { deliverInquiry, validateInquiry } from '@/lib/contact';

export const runtime = 'nodejs';
export const maxDuration = 30;

const maxBodyBytes = 24_000;
const json = (body: object, status: number) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  // Preserve the browser's hostname when Next.js normalizes the internal URL.
  const host = request.headers.get('host');
  if (host) requestUrl.host = host;
  if (!origin || origin !== requestUrl.origin)
    return json({ error: 'Please submit the form from this website.' }, 403);
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    return json({ error: 'Please submit the contact form.' }, 415);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Please complete the form.' }, 400);
  let body: unknown;
  try {
    const decoder = new TextDecoder();
    let text = '';
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) {
        await reader.cancel();
        return json(
          {
            error: 'Your inquiry is too long. Please shorten it and try again.',
          },
          413,
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    body = JSON.parse(text + decoder.decode());
  } catch {
    return json({ error: 'Please check the form and try again.' }, 400);
  }
  const result = validateInquiry(body);
  if (!result.inquiry) return json({ error: result.error }, 400);

  // Next.js reads .env locally and Vercel supplies these values in production.
  // Credentials are accessed only in this server-side route.
  const delivery = await deliverInquiry(result.inquiry, {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM,
    to: process.env.RESEND_TO ?? 'founders@cooplabs.com',
  });
  return json(
    delivery.ok ? { ok: true } : { error: delivery.error },
    delivery.status,
  );
}
