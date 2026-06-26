/**
 * Public email-verification endpoint. The requester clicks the single-use link
 * in their acknowledgment email; this confirms they control the inbox on file.
 *
 * GET /verifyRequest?request_id=...&token=...
 *
 * Auth: the token itself. No user session. Service role used for all writes.
 *
 * Rules:
 *  - Token must match the stored verification_token (single-use).
 *  - Token must not be expired (verification_token_expires_at).
 *  - Already-verified / already-rejected requests are reported, not re-verified.
 *  - On success: email_verified_at + verification_status='verified' + verified_by='requester (email link)',
 *    the token is cleared (so the link can't be reused), and an immutable audit event is written.
 *
 * Returns a small self-contained HTML page (the link opens directly in a browser).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function page({ title, heading, message, accent = '#0d7d74' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${title}</title>
<style>
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background:#f1f5f9; color:#14202b; }
  .wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; max-width:460px; width:100%; padding:40px 32px; text-align:center; box-shadow:0 8px 30px rgba(20,32,43,0.06); }
  .badge { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:28px; }
  h1 { font-size:20px; margin:0 0 10px; }
  p { color:#475569; line-height:1.6; font-size:14px; margin:0; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="badge" style="background:${accent}14; color:${accent};">${heading}</div>
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' };

  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get('request_id');
    const token = url.searchParams.get('token');

    if (!requestId || !token) {
      return new Response(
        page({ title: 'Invalid link', heading: '⚠️', message: 'This verification link is missing required information. Please use the exact link from your email.', accent: '#b58a2e' }),
        { status: 400, headers: htmlHeaders }
      );
    }

    const base44 = createClientFromRequest(req);
    const request = await base44.asServiceRole.entities.DataRightsRequest.get(requestId);

    if (!request) {
      return new Response(
        page({ title: 'Request not found', heading: '⚠️', message: 'We could not find a request matching this link. It may have been removed.', accent: '#b58a2e' }),
        { status: 404, headers: htmlHeaders }
      );
    }

    // Already verified — idempotent success.
    if (request.verification_status === 'verified' || request.email_verified_at) {
      return new Response(
        page({ title: 'Already verified', heading: '✓', message: 'Your identity has already been confirmed. No further action is needed — you can close this page.' }),
        { status: 200, headers: htmlHeaders }
      );
    }

    if (request.verification_status === 'rejected' || request.verification_status === 'expired') {
      return new Response(
        page({ title: 'Link no longer valid', heading: '⚠️', message: 'This request can no longer be verified. If you still need help, please reply to the email you received.', accent: '#b58a2e' }),
        { status: 410, headers: htmlHeaders }
      );
    }

    // Token must exist and match (single-use).
    if (!request.verification_token || request.verification_token !== token) {
      return new Response(
        page({ title: 'Invalid or used link', heading: '⚠️', message: 'This verification link is invalid or has already been used. Please use the most recent link from your email.', accent: '#b58a2e' }),
        { status: 400, headers: htmlHeaders }
      );
    }

    // Expiry check.
    const expiresAt = request.verification_token_expires_at ? new Date(request.verification_token_expires_at) : null;
    if (expiresAt && Date.now() > expiresAt.getTime()) {
      await base44.asServiceRole.entities.DataRightsRequest.update(requestId, {
        verification_status: 'expired',
        verification_token: null,
      });
      if (request.organization) {
        await base44.asServiceRole.entities.AuditEvent.create({
          organization: request.organization,
          related_request: requestId,
          event_type: 'verification_expired',
          actor: 'system',
          description: `Verification link expired before the requester (${request.requester_email}) confirmed. Request is no longer actionable.`,
        });
      }
      return new Response(
        page({ title: 'Link expired', heading: '⌛', message: 'This verification link has expired. If you still wish to proceed, please submit a new request.', accent: '#b58a2e' }),
        { status: 410, headers: htmlHeaders }
      );
    }

    // Success — confirm, consume the token, audit.
    const nowIso = new Date().toISOString();
    await base44.asServiceRole.entities.DataRightsRequest.update(requestId, {
      verification_status: 'verified',
      email_verified_at: nowIso,
      verified_at: nowIso,
      verified_by: 'requester (email link)',
      verification_token: null,
    });

    if (request.organization) {
      await base44.asServiceRole.entities.AuditEvent.create({
        organization: request.organization,
        related_request: requestId,
        event_type: 'identity_verified',
        actor: 'requester (email link)',
        description: `Requester ${request.requester_email} confirmed their identity by clicking the single-use email verification link. Email control proven.`,
      });
    }

    return new Response(
      page({ title: 'Identity confirmed', heading: '✓', message: "Thank you — we've confirmed your email and your request is now being processed. You can close this page." }),
      { status: 200, headers: htmlHeaders }
    );
  } catch (error) {
    console.log(`[verifyRequest] error: ${error.message}`);
    return new Response(
      page({ title: 'Something went wrong', heading: '⚠️', message: 'We hit an unexpected error verifying your request. Please try again shortly.', accent: '#b58a2e' }),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
});