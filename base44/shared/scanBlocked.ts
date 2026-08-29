// Did we actually load the SITE, or something standing in front of it?
//
// A challenge page, a bot block, or a CDN error page loads fine and has words on
// it. Analyzed normally it produces a full report describing the challenge page:
// no consent mechanism, no tracking, no policy links — every line technically
// true and completely wrong about the business.
//
// Same principle as the zero-tracker GPC case: when there was nothing real to
// measure, that is not a finding. A blocked load produces NO findings at all.

// Language that only appears on challenge / block / CDN-error pages.
const HARD_MARKERS = [
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
  'access denied',
  'request blocked',
  'request unsuccessful',
  'unusual traffic from your computer',
  'your request has been blocked',
  'attention required',
  'one more step before you continue',
  'sorry, you have been blocked',
];

// 'cloudflare' on its own is weak — it appears in legitimate footers and privacy
// policies. It counts only alongside one of these.
const CDN_CORROBORATION = [
  'ray id',
  'web server is down',
  'host error',
  'connection timed out',
  'error 10',
  'error 52',
  'error 100',
  'performance & security by',
  'performance and security by',
  'just a moment',
];

// Challenge widgets/frames. Deliberately excludes plain reCAPTCHA, which is
// normal on legitimate contact forms.
const CHALLENGE_SCRIPTS = [
  'challenges.cloudflare.com',
  '/cdn-cgi/challenge-platform',
  'cf-chl',
  'perimeterx.net',
  'captcha-delivery.com',
  'geo.captcha-delivery',
  'imperva.com/captcha',
  '_incapsula_resource',
];

export function detectBlockedPage({ status, page }: any) {
  // The main document was refused outright.
  if (status === 403) return { blocked: true, reason: 'The site returned HTTP 403 for the page itself.' };
  if (status === 429) return { blocked: true, reason: 'The site returned HTTP 429 (too many requests) for the page itself.' };
  if (status === 503) return { blocked: true, reason: 'The site returned HTTP 503 for the page itself.' };

  if (!page) return { blocked: false };
  const text = page.text || '';
  const scripts = page.script_hay || '';
  const anchors = (page.anchors || []).length;

  const hard = HARD_MARKERS.find((m) => text.includes(m));
  if (hard) return { blocked: true, reason: `The page contained challenge-page language ("${hard}").` };

  if (text.includes('cloudflare')) {
    const corr = CDN_CORROBORATION.find((m) => text.includes(m));
    if (corr) return { blocked: true, reason: `The page looked like a Cloudflare interstitial ("${corr}").` };
  }

  const challenge = CHALLENGE_SCRIPTS.find((m) => scripts.includes(m));
  if (challenge) return { blocked: true, reason: `A bot-challenge script was serving the page (${challenge}).` };

  // A real homepage has more than a couple of kilobytes of text and more than a
  // handful of links. Below both, there is nothing to analyze.
  if (text.length < 2000 && anchors < 5) {
    return { blocked: true, reason: 'The page returned almost no content or links, so there was nothing to analyze.' };
  }

  return { blocked: false };
}

export const BLOCKED_MESSAGE =
  "We couldn't reach this site the way a normal visitor would — the page returned a security check instead of the site. This usually means the site's protection blocked our scanner. Try again, or check the site manually.";