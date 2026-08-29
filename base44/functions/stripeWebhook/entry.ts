import Stripe from 'npm:stripe@17.3.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { analytics } from 'npm:@heycatch/sdk';
import { applyServiceStatus } from '../../shared/serviceStatus.ts';

analytics.init({ projectKey: 'hck_pk_yyHEbzjZch9KOqIkpdjxpYfslt96gwzM' });

const PRICE_TO_PLAN = {
  // Notice — monthly ($39) and annual ($390)
  'price_1Tz4EXEV6sbsDlR8hXJDUbm0': 'notice',
  'price_1Tz4EXEV6sbsDlR85bePAOse': 'notice',
  'price_1TlqlJEV6sbsDlR8DGP4QpH6': 'core',
  'price_1TlqnTEV6sbsDlR8JPOeWIEz': 'proof',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    async function updateOrg(orgId, data) {
      if (!orgId) { console.error('No organization_id in event'); return; }
      await base44.asServiceRole.entities.Organization.update(orgId, data);
      console.log('Updated org', orgId, JSON.stringify(data));
    }

    // Restore service for every site the org owns. One of exactly three writers of
    // service_status, and it goes through applyServiceStatus so the transition is
    // audited into ServiceStatusEvent with this event type as the actor.
    //
    // Note it no longer touches install_status: whether the widget was ever
    // installed is not something a payment tells us.
    async function restoreService(orgId, eventType) {
      if (!orgId) return;
      const sites = await base44.asServiceRole.entities.Site.filter({ organization: orgId });
      let restored = 0;
      for (const site of sites || []) {
        const changed = await applyServiceStatus(base44.asServiceRole, {
          site,
          next: 'active',
          actor: `stripe:${eventType}`,
          reason: 'payment succeeded — service restored',
        });
        if (changed) restored += 1;
      }
      console.log('Restored service on', restored, 'site(s) for org', orgId);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orgId = session.metadata?.organization_id;
      const plan = session.metadata?.plan;
      await updateOrg(orgId, {
        plan,
        billing_status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      });
      await restoreService(orgId, event.type);

      // Report the paid conversion to HeyCatch, keyed on the org owner's stable
      // user id — the SAME id the browser sends via setIdentity — so the two join.
      try {
        if (orgId) {
          const org = await base44.asServiceRole.entities.Organization.get(orgId);
          const userId = org?.created_by_id;
          if (userId) {
            await analytics.setIdentity(userId, { plan });
            await analytics.trackEvent('subscription_started', { plan }, { userId });
          }
        }
      } catch (e) {
        console.error('HeyCatch subscription_started failed:', e.message);
      }
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const orgId = sub.metadata?.organization_id;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId];
      const status = sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'canceled' : 'active';
      const data = { billing_status: status };
      if (plan) data.plan = plan;
      await updateOrg(orgId, data);
      if (plan && status === 'active') await restoreService(orgId, event.type);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const orgId = sub.metadata?.organization_id;
      // 'free', NOT 'trial'. Sending a cancelled subscriber back to 'trial' handed
      // them the full paid request engine (canTrackRequests is true on trial) for
      // nothing — a second route to the paid product, independent of the cron.
      // Cancelling drops you to the permanent free plan; the widget keeps running.
      await updateOrg(orgId, { plan: 'free', billing_status: 'canceled' });
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});