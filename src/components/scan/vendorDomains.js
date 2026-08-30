// Who a third-party domain belongs to, where we can say.
//
// "You contacted 5 third parties" is a number, not information — and three of the
// five on our own site were us. A reader cannot act on an unlabeled hostname, and
// an unlabeled hostname reads as suspicious whether or not it is. So each domain we
// recognize is annotated with the vendor and, in plain words, what it does.
//
// UNKNOWN STAYS UNKNOWN. A domain we can't identify is listed as-is under
// "Not identified" — never guessed at, never quietly dropped.
const VENDORS = [
  { match: ['base44.app', 'base44.com', 'datarightsos.com'], vendor: 'DataRightsOS', role: 'your consent widget' },
  { match: ['challenges.cloudflare.com'], vendor: 'Cloudflare Turnstile', role: 'bot protection' },
  { match: ['cloudflareinsights.com'], vendor: 'Cloudflare', role: 'site analytics' },
  { match: ['google-analytics.com', 'analytics.google.com'], vendor: 'Google Analytics', role: 'analytics' },
  { match: ['googletagmanager.com'], vendor: 'Google Tag Manager', role: 'tag loader' },
  { match: ['doubleclick.net', 'googleadservices.com', 'googlesyndication.com'], vendor: 'Google Ads', role: 'advertising' },
  { match: ['facebook.net', 'facebook.com'], vendor: 'Meta Pixel', role: 'advertising' },
  { match: ['hotjar.com', 'hotjar.io'], vendor: 'Hotjar', role: 'session recording' },
  { match: ['clarity.ms'], vendor: 'Microsoft Clarity', role: 'session recording' },
  { match: ['linkedin.com', 'licdn.com'], vendor: 'LinkedIn', role: 'advertising' },
  { match: ['tiktok.com'], vendor: 'TikTok', role: 'advertising' },
  { match: ['hs-scripts.com', 'hubspot.com', 'hsforms.net', 'hs-analytics.net'], vendor: 'HubSpot', role: 'marketing and forms' },
  { match: ['intercom.io', 'intercomcdn.com'], vendor: 'Intercom', role: 'chat' },
  { match: ['tawk.to'], vendor: 'Tawk.to', role: 'chat' },
  { match: ['drift.com'], vendor: 'Drift', role: 'chat' },
  { match: ['youtube.com', 'ytimg.com'], vendor: 'YouTube', role: 'embedded video' },
  { match: ['vimeo.com', 'vimeocdn.com'], vendor: 'Vimeo', role: 'embedded video' },
  { match: ['fonts.googleapis.com', 'fonts.gstatic.com'], vendor: 'Google Fonts', role: 'fonts' },
  { match: ['gravatar.com'], vendor: 'Gravatar', role: 'profile images' },
  { match: ['recaptcha.net', 'google.com/recaptcha'], vendor: 'Google reCAPTCHA', role: 'bot protection' },
  { match: ['stripe.com', 'stripe.network'], vendor: 'Stripe', role: 'payments' },
  { match: ['onetrust.com', 'cookielaw.org'], vendor: 'OneTrust', role: 'consent management' },
  { match: ['cookiebot.com'], vendor: 'Cookiebot', role: 'consent management' },
  { match: ['cookieyes.com'], vendor: 'CookieYes', role: 'consent management' },
  { match: ['termly.io'], vendor: 'Termly', role: 'consent management' },
  { match: ['wp.com', 'wordpress.com'], vendor: 'WordPress.com', role: 'site platform' },
  { match: ['jquery.com', 'jsdelivr.net', 'unpkg.com', 'cloudflare.com/ajax'], vendor: 'Public code CDN', role: 'script hosting' },
];

function labelFor(domain) {
  const d = String(domain || '').toLowerCase();
  return VENDORS.find((v) => v.match.some((m) => d === m || d.endsWith('.' + m) || d.includes(m))) || null;
}

/**
 * Groups observed domains by the vendor they belong to, preserving the order the
 * domains were observed in. Unidentified domains land in a final group with a null
 * vendor so the caller can present them plainly.
 */
export function groupByVendor(domains) {
  const groups = [];
  const unknown = [];
  for (const domain of domains || []) {
    const hit = labelFor(domain);
    if (!hit) { unknown.push(domain); continue; }
    const existing = groups.find((g) => g.vendor === hit.vendor);
    if (existing) existing.domains.push(domain);
    else groups.push({ vendor: hit.vendor, role: hit.role, domains: [domain] });
  }
  if (unknown.length) groups.push({ vendor: null, role: null, domains: unknown });
  return groups;
}