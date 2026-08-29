// Daily job: roll expired trials onto the permanent Free plan.
//
// WHAT THIS USED TO DO, AND WHY IT WAS WRONG: it flipped every site of an expired
// trial to install_status 'pending' to stop the widget rendering — and left the org
// on plan 'trial'. Two failures. First, the public widgetConfig endpoint wrote that
// same column, so the customer's very next page view flipped it straight back to
// 'active': the kill switch could never fire, and the job just churned writes.
// Second, even if it had worked, plan 'trial' keeps canTrackRequests true, so the
// paid request engine stayed unlocked regardless of any site-level gate.
//
// WHAT IT DOES NOW: expiry is a PLAN change, not a service change. Sites are left
// alone — service_status stays 'active' and the widget keeps rendering, because the
// promise is that the widget never dies and cookie consent stays free forever. The
// org moves to plan 'free', which is what actually withholds the paid features, and
// the subscriber is told in plain language.
//
// This job no longer writes service_status at all. Nothing about trial expiry is an
// entitlement suspension.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TRIAL_DAYS = 7;

function expiryEmailBody(name: string | undefined, hasOpenRequests: boolean) {
  return `Hi${name ? ' ' + name : ''},

Your 7-day DataRightsOS trial has ended and your account has moved to the free plan.

WHAT KEEPS WORKING
- Your cookie consent widget is still live on your site. It keeps displaying, recording consent, and enforcing choices, including Global Privacy Control. That does not expire.
- Your published legal pages (privacy policy, cookie policy, accessibility and AI statements) stay online at the same web addresses. We do not take a live legal page offline.
- Everything you created during the trial is intact: consent records, audit trail, statements, and any privacy requests you received.

WHAT PAUSES
- New privacy requests are no longer accepted through your widget, and the request card no longer appears.
- Editing your legal statements. The published pages keep serving; the editor is a paid feature.
- Accessibility barrier reporting, CSV export, and consent history older than the last 7 days in the dashboard.
${hasOpenRequests ? `
ONE THING TO KNOW
You have privacy requests that were already submitted and are still open. Those stay fully manageable in your dashboard, with their deadlines and reminders, until you finish them. We started that clock, so we are not going to get in the way of you meeting it.
` : ''}
Nothing is deleted. Upgrading restores everything exactly as it was.

Settings → Billing in your dashboard has the plan options.

— The DataRightsOS Team`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const cutoff = Date.now() - TRIAL_DAYS * 24 * 60 * 60 * 1000;

    const trialOrgs = await svc.entities.Organization.filter({ plan: 'trial' });

    const expiredOrgs = (trialOrgs || []).filter((o) => {
      if (!o.trial_started_at) return false;
      const started = new Date(o.trial_started_at).getTime();
      if (Number.isNaN(started)) return false;
      return started < cutoff;
    });

    let downgraded = 0;
    let emailed = 0;

    for (const org of expiredOrgs) {
      const now = new Date().toISOString();

      // The plan change IS the enforcement. Sites are deliberately untouched.
      await svc.entities.Organization.update(org.id, {
        plan: 'free',
        trial_expired_at: org.trial_expired_at || now,
      });
      downgraded += 1;

      // Does the org have requests already in flight? They stay actionable, and the
      // email says so — we accepted those requests and started the statutory clock,
      // so blocking the remedy is not ours to do.
      let hasOpenRequests = false;
      try {
        const open = await svc.entities.DataRightsRequest.filter({ organization: org.id }, '-created_date', 200);
        hasOpenRequests = (open || []).some(
          (r) => r.request_status !== 'fulfilled' && r.request_status !== 'denied',
        );
      } catch { /* non-fatal — the email just omits that paragraph */ }

      if (org.trial_expiry_email_sent_at) continue;

      const owners = await svc.entities.User.filter({ id: org.created_by_id });
      let email = owners[0]?.email;
      if (!email && org.created_by_id) {
        email = org.created_by_id.includes('@') ? org.created_by_id : null;
      }
      if (!email) {
        console.log('checkSubscriptionStatus: no owner email for org', org.id, '- downgraded, not emailed');
        continue;
      }

      try {
        await svc.integrations.Core.SendEmail({
          to: email,
          subject: 'Your DataRightsOS trial has ended — your widget is still running',
          body: expiryEmailBody(owners[0]?.full_name, hasOpenRequests),
        });
        await svc.entities.Organization.update(org.id, { trial_expiry_email_sent_at: new Date().toISOString() });
        emailed += 1;
      } catch (e) {
        console.error('checkSubscriptionStatus: expiry email failed for org', org.id, (e as Error).message);
      }
    }

    console.log(
      `checkSubscriptionStatus: ${expiredOrgs.length} expired trial org(s), ${downgraded} moved to free, ${emailed} emailed. No site service_status was changed.`,
    );

    return Response.json({
      checked: trialOrgs?.length || 0,
      expired: expiredOrgs.length,
      downgraded_to_free: downgraded,
      emailed,
      sites_suspended: 0,
    });
  } catch (error) {
    console.error('checkSubscriptionStatus error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});