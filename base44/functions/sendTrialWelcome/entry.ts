// Sends the welcome email to the owner of a newly created trial Organization.
// Called by the "Trial Signup — Welcome Email" workflow on Organization create.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { organization_id } = await req.json();
    if (!organization_id) return Response.json({ error: 'organization_id is required' }, { status: 400 });

    let org = null;
    try {
      org = await base44.asServiceRole.entities.Organization.get(organization_id);
    } catch (e) {
      console.log('sendTrialWelcome: org not found', organization_id, e.message);
    }
    if (!org) return Response.json({ sent: false, reason: 'org_not_found' });

    // Owner is the user who created the org.
    const owners = await base44.asServiceRole.entities.User.filter({ id: org.created_by_id });
    let email = owners[0]?.email;
    if (!email && org.created_by_id) {
      email = org.created_by_id.includes('@') ? org.created_by_id : null;
    }
    if (!email) {
      console.log('sendTrialWelcome: no owner email for org', organization_id, '- skipping');
      return Response.json({ sent: false, reason: 'no_email' });
    }

    const fullName = owners[0]?.full_name || '';
    const firstName = fullName ? fullName.split(' ')[0] : 'there';

    // Internal alert: notify the team whenever a new trial starts. Uses Resend
    // directly so it reliably reaches an internal address (not a registered app user).
    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
      if (resendApiKey && fromEmail) {
        const signupTime = org.trial_started_at || org.created_date || new Date().toISOString();
        const alertRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `DataRightsOS <${fromEmail}>`,
            to: ['joe@bizooma.com'],
            reply_to: email,
            subject: `🎉 New trial signup: ${org.name}`,
            text: `A new free trial just started on DataRightsOS.\n\n` +
              `Organization: ${org.name}\n` +
              `Owner: ${fullName || '(no name)'} <${email}>\n` +
              (org.referral_source ? `Referral: ${org.referral_source}\n` : '') +
              `Signed up: ${signupTime}\n`,
          }),
        });
        if (!alertRes.ok) {
          console.error(`sendTrialWelcome internal alert failed ${alertRes.status}: ${await alertRes.text()}`);
        }
      } else {
        console.log('sendTrialWelcome: Resend not configured, skipping internal alert');
      }
    } catch (e) {
      console.error('sendTrialWelcome internal alert error', e?.message || e);
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: "Welcome to DataRightsOS, Your 7-day trial just started. Here's where to begin.",
      body: `Hi ${firstName},

Your DataRightsOS account is live, and your 7-day free trial started the moment you signed up. No credit card needed until you decide it's worth paying for.

[ Open your dashboard ] → https://datarightsos.com/dashboard

One tip: people who get the most out of DataRightsOS do one thing in their first session, install the widget snippet on their site. It takes about five minutes, your site shows "Active" in the dashboard, and everything clicks after that.

Questions? Just reply. This inbox goes to a real person.

— Joe`,
    });

    console.log('sendTrialWelcome: sent to', email, 'for org', organization_id);
    return Response.json({ sent: true, to: email });
  } catch (error) {
    console.error('sendTrialWelcome error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});