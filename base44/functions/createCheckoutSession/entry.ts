import Stripe from 'npm:stripe@17.3.1';

const PRICE_IDS = {
  core: 'price_1TlqqhPVRIZOMWziK37kGeae',
  proof: 'price_1TlqqhPVRIZOMWzi6HymX1Eu',
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
    const { plan, success_url, cancel_url } = await req.json();
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return Response.json({ error: 'Invalid plan' }, { status: 400, headers: CORS });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin') || ''}/dashboard?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get('origin') || ''}/?checkout=canceled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        plan,
      },
    });

    return Response.json({ url: session.url }, { status: 200, headers: CORS });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});