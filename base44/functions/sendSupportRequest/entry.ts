import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SUPPORT_INBOX = 'support@bizooma.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const subject = (body.subject || '').trim();
    const category = (body.category || 'General').trim();
    const message = (body.message || '').trim();

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    // Resolve org name for context
    let orgName = '';
    try {
      if (user.organization) {
        const orgs = await base44.asServiceRole.entities.Organization.filter({ id: user.organization });
        orgName = orgs[0]?.name || '';
      }
    } catch (_e) { /* non-fatal */ }

    const emailBody = `New support request from Data Rights OS\n\n` +
      `From: ${user.full_name || ''} <${user.email}>\n` +
      `Organization: ${orgName || '—'}\n` +
      `Category: ${category}\n` +
      `Subject: ${subject}\n\n` +
      `Message:\n${message}\n`;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    if (!resendApiKey || !fromEmail) {
      return Response.json({ error: 'Email delivery is not configured.' }, { status: 500 });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Data Rights OS Support <${fromEmail}>`,
        to: [SUPPORT_INBOX],
        reply_to: user.email,
        subject: `[Support] ${category}: ${subject}`,
        text: emailBody,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(`sendSupportRequest resend error ${resendRes.status}: ${errBody}`);
      return Response.json({ error: 'Failed to send support request.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('sendSupportRequest error:', error?.message || error);
    return Response.json({ error: error?.message || 'Failed to send support request.' }, { status: 500 });
  }
});