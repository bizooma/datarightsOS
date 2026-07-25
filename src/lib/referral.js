// Referral attribution capture.
// First-touch wins: if a dros_ref cookie already exists we never overwrite it
// (first-to-register rule from the commission agreement).

const COOKIE_NAME = 'dros_ref';
const STORAGE_KEY = 'dros_ref';
const MAX_AGE_DAYS = 90;

// Referral codes are partner slugs: alphanumerics, underscore, hyphen, 1–64 chars.
// Anything else is rejected outright (prevents junk/injection in attribution + Stripe metadata).
const REF_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function readCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Reads ?ref= from the URL and, if a ref exists and no ref has been captured
 * before, stores it in a first-party cookie (90-day) and localStorage.
 * Safe to call on every page load.
 */
export function captureReferral() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref) return;

    // First-touch: do not overwrite an existing captured ref.
    const existing = readCookie(COOKIE_NAME) || localStorage.getItem(STORAGE_KEY);
    if (existing) return;

    const clean = ref.trim();
    if (!REF_PATTERN.test(clean)) return;

    writeCookie(COOKIE_NAME, clean, MAX_AGE_DAYS);
    localStorage.setItem(STORAGE_KEY, clean);
  } catch {
    // Ignore — attribution is best-effort and must never break page load.
  }
}

/** Returns the stored referral value (cookie first, then localStorage), or null. */
export function getStoredReferral() {
  try {
    return readCookie(COOKIE_NAME) || localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}