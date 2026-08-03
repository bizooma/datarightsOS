import Stripe from 'npm:stripe@17.3.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Monthly price IDs by plan. Annual is a separate map — only Notice has an annual
// price today (Core/Proof annual do not exist yet).
const PRICE_IDS = {
  notice: 'price_1Tz4EXEV6sbsDlR8hXJDUbm0',
  core: 'price_1TlqlJEV6sbsDlR8DGP4QpH6',
  proof: 'price_1TlqnTEV6sbsDlR8JPOeWIEz',
};

const PRICE_IDS_ANNUAL = {
  notice: 'price_1Tz4EXEV6sbsDlR85bePAOse',
  core: 'price_1U0PB1EV6sbsDlR8UkUlb4hy',
};

Deno.serve(async (req) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: CORS });

  try {
    const { plan, billing_interval, success_url, cancel_url } = await req.json();
    const wantsAnnual = billing_interval === 'annual' || billing_interval === 'year';
    // Fall back to monthly when no annual price exists for the plan.
    const priceId = (wantsAnnual && PRICE_IDS_ANNUAL[plan]) || PRICE_IDS[plan];
    if (!priceId) {
      return Response.json({ error: 'Invalid plan' }, { status: 400, headers: CORS });
    }

    // Derive the organization from the authenticated user — NEVER trust a
    // client-supplied organization_id. Prevents a caller from driving a
    // checkout/upgrade against an org they don't belong to.
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: CORS });
    }
    const organization_id = user?.organization;
    if (!organization_id) {
      return Response.json({ error: 'No organization associated with this account' }, { status: 403, headers: CORS });
    }

    // Look up the org's referral attribution so every payment is self-documenting
    // in Stripe and portable to Rewardful/FirstPromoter later.
    let referralSource = '';
    try {
      const orgs = await base44.asServiceRole.entities.Organization.filter({ id: organization_id });
      referralSource = orgs[0]?.referral_source || '';
    } catch (e) {
      console.error('createCheckoutSession: failed to load referral_source:', e.message);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin') || 'https://app.base44.com'}/dashboard?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get('origin') || 'https://app.base44.com'}/settings?checkout=canceled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plan,
        organization_id: organization_id || '',
        ...(referralSource ? { referral_source: referralSource } : {}),
      },
      subscription_data: {
        metadata: {
          plan,
          organization_id: organization_id || '',
          ...(referralSource ? { referral_source: referralSource } : {}),
        },
      },
    });

    return Response.json({ url: session.url }, { status: 200, headers: CORS });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});