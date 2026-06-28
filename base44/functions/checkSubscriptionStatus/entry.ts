// Daily job: expire trials older than 7 days by deactivating their sites.
// When a trial organization passes its 7-day window without upgrading, every
// site it owns is flipped to install_status: 'pending'. Because the public
// widget checks install_status on every load (via widgetConfig), the widget
// stops rendering on those customers' websites on the next page view.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TRIAL_DAYS = 7;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const cutoff = Date.now() - TRIAL_DAYS * 24 * 60 * 60 * 1000;

    // All organizations still on the trial plan.
    const trialOrgs = await base44.asServiceRole.entities.Organization.filter({ plan: 'trial' });

    const expiredOrgs = (trialOrgs || []).filter((o) => {
      if (!o.trial_started_at) return false;
      const started = new Date(o.trial_started_at).getTime();
      if (Number.isNaN(started)) return false;
      return started < cutoff;
    });

    let sitesDeactivated = 0;
    const affectedOrgIds = [];

    for (const org of expiredOrgs) {
      const sites = await base44.asServiceRole.entities.Site.filter({ organization: org.id });
      const activeSites = (sites || []).filter((s) => s.install_status !== 'pending');
      for (const site of activeSites) {
        await base44.asServiceRole.entities.Site.update(site.id, { install_status: 'pending' });
        sitesDeactivated += 1;
      }
      if (activeSites.length > 0) affectedOrgIds.push(org.id);
    }

    console.log(
      `checkSubscriptionStatus: ${expiredOrgs.length} expired trial org(s), ${sitesDeactivated} site(s) deactivated.`
    );

    return Response.json({
      checked: trialOrgs?.length || 0,
      expired: expiredOrgs.length,
      sites_deactivated: sitesDeactivated,
      affected_org_ids: affectedOrgIds,
    });
  } catch (error) {
    console.error('checkSubscriptionStatus error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});