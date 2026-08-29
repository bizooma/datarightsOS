// Shared parsing/validation for the "enter your website" inputs (homepage hero
// and the /scan form). Kept in one place so the hero can never accept something
// the scan page would choke on.
//
// Accepts: example.com · www.example.com · https://example.com · http://example.com/pricing
// Rejects: empty, bare words with no dot, spaces, and anything without a plausible TLD.

const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

/**
 * @returns {{ ok: true, url: string, domain: string } | { ok: false, error: string }}
 */
export function parseSiteInput(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { ok: false, error: 'Enter your website address to scan it.' };
  if (/\s/.test(trimmed)) return { ok: false, error: "That doesn't look like a website address — remove any spaces." };

  // Strip the protocol so we validate the host the same way whether or not one was typed.
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const [hostPart, ...rest] = withoutProtocol.split('/');
  const host = hostPart.replace(/:\d+$/, '').toLowerCase();

  if (!host || !HOST_RE.test(host)) {
    return { ok: false, error: "That doesn't look like a website address. Try something like yourwebsite.com." };
  }

  const path = rest.length ? '/' + rest.join('/') : '';
  return { ok: true, url: 'https://' + host + path, domain: host.replace(/^www\./, '') };
}