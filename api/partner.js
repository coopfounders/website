const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendJson(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  return response.status(status).json(body);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

module.exports = async function partnerInquiry(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const fetchSite = request.headers["sec-fetch-site"];
  if (fetchSite && !["same-origin", "same-site"].includes(fetchSite)) {
    return sendJson(response, 403, { error: "Request not allowed." });
  }

  const body = request.body && typeof request.body === "object" ? request.body : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";

  // Silently accept honeypot submissions so bots do not learn the filter.
  if (website) return sendJson(response, 200, { ok: true });

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return sendJson(response, 400, { error: "Enter a valid work email." });
  }

  if (!process.env.RESEND_API_KEY) {
    return sendJson(response, 503, {
      error: "Email service is not configured yet.",
    });
  }

  const safeEmail = escapeHtml(email);
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "coop-website/1.0",
    },
    body: JSON.stringify({
      from: process.env.PARTNER_FROM_EMAIL || "Coop Website <website@cooplabs.com>",
      to: ["founders@cooplabs.com"],
      reply_to: email,
      subject: "New Coop partnership inquiry",
      text: `New partnership inquiry from ${email}`,
      html: `<p>New partnership inquiry from <a href="mailto:${safeEmail}">${safeEmail}</a>.</p>`,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    console.error("Resend rejected partner inquiry:", resendResponse.status, details);
    return sendJson(response, 502, {
      error: "We couldn’t send that right now.",
    });
  }

  return sendJson(response, 200, { ok: true });
};
