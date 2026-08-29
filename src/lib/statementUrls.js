// Frontend mirror of base44/shared/statementUrls.ts. Deno backend functions cannot
// import from src/, so the URL shape is defined in both places — keep them in step.
// The URL is a query string because the platform only routes /functions/<name>:
// extra path segments 404, and a pretty /s/<slug>/… path is served by the SPA shell
// with no body content, which is the exact problem these pages solve.

export const PUBLIC_BASE = 'https://datarightsos.com';

export const STATEMENT_SLUGS = {
  privacy_policy: 'privacy-policy',
  cookie_policy: 'cookie-policy',
  accessibility_statement: 'accessibility-statement',
  ai_use_statement: 'ai-use-statement',
};

export const STATEMENT_LABELS = {
  privacy_policy: 'Privacy Policy',
  cookie_policy: 'Cookie Policy',
  accessibility_statement: 'Accessibility Statement',
  ai_use_statement: 'AI Use Statement',
};

export const STATEMENT_TYPES = [
  'privacy_policy',
  'cookie_policy',
  'accessibility_statement',
  'ai_use_statement',
];

export function statementUrl(siteSlug, type, lang) {
  const typeSlug = STATEMENT_SLUGS[type] || type;
  const q = 'site=' + encodeURIComponent(siteSlug) + '&type=' + encodeURIComponent(typeSlug);
  return PUBLIC_BASE + '/functions/statement?' + q + (lang === 'es' ? '&lang=es' : '');
}