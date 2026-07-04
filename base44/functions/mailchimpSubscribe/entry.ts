Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
    if (!apiKey) {
      console.error('MAILCHIMP_API_KEY is not set');
      return Response.json({ error: 'Mailchimp is not configured' }, { status: 500 });
    }

    // Datacenter is the suffix after the dash in the API key, e.g. "...-us14"
    const dc = apiKey.split('-')[1];
    if (!dc) {
      console.error('Invalid Mailchimp API key format (missing datacenter suffix)');
      return Response.json({ error: 'Mailchimp is not configured correctly' }, { status: 500 });
    }

    const listId = '7f8858c903'; // Bizooma audience ID
    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email.trim(),
        status: 'subscribed',
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return Response.json({ success: true });
    }

    // Already a member is a success from the user's perspective.
    if (data?.title === 'Member Exists') {
      return Response.json({ success: true, alreadySubscribed: true });
    }

    console.error('Mailchimp subscribe failed:', res.status, JSON.stringify(data));
    return Response.json({ error: data?.detail || 'Subscription failed' }, { status: 502 });
  } catch (error) {
    console.error('mailchimpSubscribe error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});