// Did we actually load the SITE, or something standing in front of it?
//
// A challenge page, a bot block, or a CDN error page loads fine and has words on
// it. Analyzed normally it produces a full report describing the challenge page:
// no consent mechanism, no tracking, no policy links — every line technically
// true and completely wrong about the business.
//
// Same principle as the zero-tracker GPC case: when there was nothing real to
// measure, that is not a finding. A blocked load produces NO findings at all.
//
// THE RULE: blocked is decided from RENDERED CONTENT, never from what the page
// requested. This previously keyed off script/request URLs and treated
// challenges.cloudflare.com as proof of a block — but Turnstile, reCAPTCHA and
// hCaptcha are form widgets that sit on perfectly working contact pages. That
// misread bizooma.com (title present, 18,182 characters of real content, zero
// challenge phrases) as an interstitial and returned no findings at all. A
// request to a challenge domain is not a block; a page that fails to render
// substantive content is. Any business with a protected contact form is exactly
// the kind of site worth reporting on, so this direction of error is expensive.

// Language that only appears on challenge / block / CDN-error pages. On its own
// this is NOT enough: a privacy policy or security page can quote any of it. It
// counts only when the page also failed to render substantive content, because a
// real interstitial is a near-empty page whose whole content IS the challenge.
const CHALLENGE_PHRASES = [
  'checking your browser',
  'verify you are human',
  'verifying you are human',
  'enable javascript and cookies to continue',
  'ddos protection by',
  'please stand by, while we are checking your browser',
  'are you a robot',
  'press and hold',
  'press & hold',
  'access to this page has been denied',
  'request blocked',
  'request unsuccessful',
  'unusual traffic from your computer',
  'your request has been blocked',
  'one more step before you continue',
  'sorry, you have been blocked',
  'ray id',
  'web server is down',
  'performance & security by',
  'performance and security by',
];

// A real business homepage is never TITLED this. The <title> is set by whatever
// actually served the document, so a challenge title stands on its own.
const BLOCK_TITLES = [
  'just a moment',
  'attention required',
  'access denied',
  'access to this page has been denied',
  'security check',
  'are you a robot',
  'you have been blocked',
  'blocked',
  'forbidden',
  '403',
  '429',
];

// The document we ended up on IS the challenge — not merely a page that loaded
// one. Matched against the FINAL url only.
const CHALLENGE_URLS = [
  'challenges.cloudflare.com',
  '/cdn-cgi/challenge-platform',
  'geo.captcha-delivery.com',
  '/_incapsula_resource',
  'perimeterx.net',
  '/distil_r_captcha',
  '/recaptcha/api2/bframe',
];

// Below this much rendered text there is nothing to analyze either way.
const SUBSTANTIVE_TEXT = 2000;

export function detectBlockedPage({ status, page }: any) {
  // The main document was refused outright.
  if (status === 403) return { blocked: true, reason: 'The site returned HTTP 403 for the page itself.' };
  if (status === 429) return { blocked: true, reason: 'The site returned HTTP 429 (too many requests) for the page itself.' };
  if (status === 503) return { blocked: true, reason: 'The site returned HTTP 503 for the page itself.' };

  if (!page) return { blocked: false };
  const text = page.text || '';
  const mainText = page.main_text || '';
  const title = (page.title || '').toLowerCase().trim();
  const finalUrl = (page.url || '').toLowerCase();
  const anchors = (page.anchors || []).length;

  // Did the page render like a real site? Either a substantive body or a
  // substantive main region plus a normal set of links.
  const substantive = text.length >= SUBSTANTIVE_TEXT || mainText.length >= SUBSTANTIVE_TEXT || anchors >= 5;

  // The document we landed on is itself a challenge endpoint.
  const badUrl = CHALLENGE_URLS.find((m) => finalUrl.includes(m));
  if (badUrl) return { blocked: true, reason: `The final URL was a challenge endpoint (${badUrl}).` };

  // Titled as a block page by whatever served it.
  const badTitle = BLOCK_TITLES.find((m) => title === m || title.startsWith(m + ' ') || title.includes(' ' + m));
  if (badTitle) return { blocked: true, reason: `The page was titled like a block page ("${badTitle}").` };

  // Challenge language, but ONLY on a page that did not render real content.
  // On a substantive page this same wording is ordinary copy.
  if (!substantive) {
    const phrase = CHALLENGE_PHRASES.find((m) => text.includes(m));
    if (phrase) {
      return { blocked: true, reason: `The page rendered no substantive content and contained challenge language ("${phrase}").` };
    }
  }

  // Nothing rendered at all — no content and almost no links.
  if (text.length < SUBSTANTIVE_TEXT && anchors < 5) {
    return { blocked: true, reason: 'The page returned almost no content or links, so there was nothing to analyze.' };
  }

  return { blocked: false };
}

export const BLOCKED_MESSAGE =
  "We couldn't reach this site the way a normal visitor would — the page returned a security check instead of the site. This usually means the site's protection blocked our scanner. Try again, or check the site manually.";