// Daily job: email trial users when ~2 days remain so they upgrade before the
// widget is disabled. Guards against duplicate sends with trial_reminder_sent_at.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TRIAL_DAYS = 7;
const REMIND_AT_DAYS_LEFT = 2;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = Date.now();
    const trialOrgs = await base44.asServiceRole.entities.Organization.filter({ plan: 'trial' });

    // Orgs with 2 or fewer days left, still in trial, and not already reminded.
    // The trial_reminder_sent_at guard ensures each org is emailed only once, so
    // we fire as soon as the threshold is reached rather than within a narrow
    // window the daily run could otherwise skip over.
    const dueForReminder = (trialOrgs || []).filter((o) => {
      if (!o.trial_started_at || o.trial_reminder_sent_at) return false;
      const started = new Date(o.trial_started_at).getTime();
      if (Number.isNaN(started)) return false;
      const daysLeft = TRIAL_DAYS - (now - started) / (1000 * 60 * 60 * 24);
      // Already expired trials are handled by checkSubscriptionStatus, skip them here.
      return daysLeft > 0 && daysLeft <= REMIND_AT_DAYS_LEFT;
    });

    let sent = 0;

    for (const org of dueForReminder) {
      // Owner is the user who created the org.
      const owners = await base44.asServiceRole.entities.User.filter({ id: org.created_by_id });
      let email = owners[0]?.email;
      if (!email && org.created_by_id) {
        // created_by_id may already be an email on some records.
        email = org.created_by_id.includes('@') ? org.created_by_id : null;
      }
      if (!email) {
        console.log('No owner email for org', org.id, '- skipping');
        continue;
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: '⏳ Your Data Rights OS trial ends in 2 days',
        body: `Hi${owners[0]?.full_name ? ' ' + owners[0].full_name : ''},

Your 7-day free trial of Data Rights OS ends in 2 days. When it does, your privacy widget will stop showing on your website and your data-rights intake will pause.

Upgrade now to keep everything running without interruption — all your sites, consent records, and audit trail stay exactly as they are.

Plans start at $99/month. Upgrade from your dashboard:
Settings → Billing

If you have any questions, just reply to this email.

— The Data Rights OS Team`,
      });

      await base44.asServiceRole.entities.Organization.update(org.id, {
        trial_reminder_sent_at: new Date().toISOString(),
      });
      sent++;
    }

    console.log(`trialReminder: ${dueForReminder.length} org(s) due, ${sent} email(s) sent.`);
    return Response.json({ checked: trialOrgs?.length || 0, due: dueForReminder.length, sent });
  } catch (error) {
    console.error('trialReminder error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});