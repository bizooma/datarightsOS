// Public statement URLs — the single source of truth for how a published
// statement is addressed. Mirrored for the frontend in src/lib/statementUrls.js
// (Deno functions cannot import from src/), same as planLimits.
//
// URL SHAPE IS A PLATFORM CONSTRAINT, NOT A CHOICE. Backend functions are only
// reachable at /functions/<name>; any extra path segment 404s, and a pretty path
// like /s/<slug>/privacy-policy is swallowed by the SPA shell (which returns HTML
// with no body content — exactly the problem these pages exist to solve). So the
// statement address is a query string, and it is permanent: every published link,
// footer snippet, and crawler-visited URL depends on it not moving.

export const PUBLIC_BASE = 'https://datarightsos.com';

// statement_type (as stored on LegalStatement) -> URL slug.
export const STATEMENT_SLUGS: Record<string, string> = {
  privacy_policy: 'privacy-policy',
  cookie_policy: 'cookie-policy',
  accessibility_statement: 'accessibility-statement',
  ai_use_statement: 'ai-use-statement',
};

// URL slug -> statement_type.
export const SLUG_TO_TYPE: Record<string, string> = {
  'privacy-policy': 'privacy_policy',
  'cookie-policy': 'cookie_policy',
  'accessibility-statement': 'accessibility_statement',
  'ai-use-statement': 'ai_use_statement',
};

// Fallback link/page titles when a subscriber left the statement title blank.
export const STATEMENT_LABELS: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  cookie_policy: 'Cookie Policy',
  accessibility_statement: 'Accessibility Statement',
  ai_use_statement: 'AI Use Statement',
};

export const STATEMENT_LABELS_ES: Record<string, string> = {
  privacy_policy: 'Política de Privacidad',
  cookie_policy: 'Política de Cookies',
  accessibility_statement: 'Declaración de Accesibilidad',
  ai_use_statement: 'Declaración de Uso de IA',
};

export const STATEMENT_TYPES = ['privacy_policy', 'cookie_policy', 'accessibility_statement', 'ai_use_statement'];

// clientfirm.com -> clientfirm-com. Derived ONCE at site creation and then frozen:
// a slug that tracked domain edits would break every link already published.
export function slugifyDomain(domain: string): string {
  const base = String(domain || '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'site';
}

// "Your Privacy Choices" — a MECHANISM page, not a statement. It carries no claim about
// what a business does with data; it exists so a visitor has a working place to record an
// opt-out. Same URL shape and same rewrite path as the statements above, deliberately: an
// Agency subscriber proxies this from their own domain exactly the way they proxy the
// statement pages, so the white-label problem is solved once.
export function privacyChoicesUrl(siteSlug: string, lang?: string): string {
  return PUBLIC_BASE + '/functions/privacyChoices?site=' + encodeURIComponent(siteSlug) + (lang === 'es' ? '&lang=es' : '');
}

export function statementUrl(siteSlug: string, type: string, lang?: string): string {
  const typeSlug = STATEMENT_SLUGS[type] || type;
  const q = 'site=' + encodeURIComponent(siteSlug) + '&type=' + encodeURIComponent(typeSlug);
  return PUBLIC_BASE + '/functions/statement?' + q + (lang === 'es' ? '&lang=es' : '');
}