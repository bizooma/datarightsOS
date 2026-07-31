import Stripe from 'npm:stripe@17.3.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    // When an org moves onto a paid plan, instantly re-activate every site it
    // owns so the widget starts rendering again (reverses trial deactivation).
    async function reactivateSites(orgId) {
      if (!orgId) return;
      const sites = await base44.asServiceRole.entities.Site.filter({ organization: orgId });
      const pendingSites = (sites || []).filter((s) => s.install_status !== 'active');
      for (const site of pendingSites) {
        await base44.asServiceRole.entities.Site.update(site.id, { install_status: 'active' });
      }
      console.log('Reactivated', pendingSites.length, 'site(s) for org', orgId);
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
      await reactivateSites(orgId);
    } else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const orgId = sub.metadata?.organization_id;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId];
      const status = sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'canceled' : 'active';
      const data = { billing_status: status };
      if (plan) data.plan = plan;
      await updateOrg(orgId, data);
      if (plan && status === 'active') await reactivateSites(orgId);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const orgId = sub.metadata?.organization_id;
      await updateOrg(orgId, { plan: 'trial', billing_status: 'canceled' });
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});