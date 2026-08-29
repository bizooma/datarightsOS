// FINGERPRINT of the build-time privacy policy fallback shipped in
// src/components/marketing/privacyPolicyFallback.js.
//
// WHY THIS FILE EXISTS: the fallback text lives in the frontend bundle, which a
// backend job cannot read. So the drift job compares the LIVE statement against
// this recorded fingerprint of the bundled copy instead. When they diverge, the
// bundled legal text is no longer the published legal text and someone is told.
//
// WHEN YOU EDIT THE FALLBACK: update these three constants in the same change.
// Forgetting to raises a false alarm rather than hiding a real one — the failure
// direction is deliberate. An unexplained alarm means this file is stale; silence
// is only trustworthy because a wrong hash here cannot produce it.
export const FALLBACK_SITE_SLUG = 'datarightsos-com';

// sha256 of normalizeStatementBody(<the bundled HTML>).
export const FALLBACK_BODY_SHA256 = 'b9978a9dd892d16b17a8ff88061e20df70b024ed18e06528c9eeb34a06eeedd0';
export const FALLBACK_VERSION = '1.0';
export const FALLBACK_EFFECTIVE_DATE = '2026-07-15';

// Whitespace between and inside tags is meaningless in rendered HTML, so it is
// normalized away — otherwise a reflowed paragraph would alarm as a policy change
// and the alarm would stop being believed.
export function normalizeStatementBody(html: string) {
  return String(html || '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

export async function sha256Hex(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}