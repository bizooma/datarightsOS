import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SUPPORT_INBOX = 'support@bizooma.com';

Deno.serve(async (req) => {
  try {
    // Public endpoint — no auth required. The requester provides their own name/email.
    const body = await req.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const subject = (body.subject || '').trim();
    const category = (body.category || 'General').trim();
    const message = (body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'Name, email, subject, and message are required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const emailBody = `New support request from the DataRightsOS website\n\n` +
      `From: ${name} <${email}>\n` +
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
        from: `DataRightsOS Support <${fromEmail}>`,
        to: [SUPPORT_INBOX],
        reply_to: email,
        subject: `[Website Support] ${category}: ${subject}`,
        text: emailBody,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(`sendPublicSupportRequest resend error ${resendRes.status}: ${errBody}`);
      return Response.json({ error: 'Failed to send support request.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('sendPublicSupportRequest error:', error?.message || error);
    return Response.json({ error: error?.message || 'Failed to send support request.' }, { status: 500 });
  }
});