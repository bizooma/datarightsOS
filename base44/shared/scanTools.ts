// What a detected privacy tool TELLS US it provides.
//
// A consent vendor on the page is evidence about more than consent. If a site
// runs a tool that ships a rights-request portal, that portal IS a request
// mechanism and reporting COULD NOT DETERMINE for it would be wrong. This file
// holds that mapping so it applies to every vendor we can read — including, but
// never only, our own widget.
//
// The rule is unchanged: we only credit a mechanism when we can point at the
// evidence for it. A vendor that merely *offers* a DSAR module earns nothing;
// we credit it when we see that module's portal on the page.

// Rights-request portals, matched against script sources, network requests, and
// link hrefs. Seeing one of these is direct evidence of a request mechanism.
export const DSAR_PORTAL_MATCHERS = [
  { match: 'privacyportal.onetrust.com', vendor: 'OneTrust' },
  { match: 'privacyportal-', vendor: 'OneTrust' }, // privacyportal-<tenant>.onetrust.com
  { match: 'onetrust.com/webform', vendor: 'OneTrust' },
  { match: 'submit-irm.trustarc.com', vendor: 'TrustArc' },
  { match: 'trustarc.com/dsar', vendor: 'TrustArc' },
  { match: 'transcend.io', vendor: 'Transcend' },
  { match: 'privacy.securiti.ai', vendor: 'Securiti' },
  { match: 'securiti.ai/dsr', vendor: 'Securiti' },
  { match: 'app.termly.io/notify', vendor: 'Termly' },
  { match: 'termly.io/dsar', vendor: 'Termly' },
  { match: 'ketch.com/rights', vendor: 'Ketch' },
  { match: 'my.datasubject.com', vendor: 'DataGuard' },
  { match: 'osano.com/dsar', vendor: 'Osano' },
  { match: 'app.usercentrics.eu/dsr', vendor: 'Usercentrics' },
  { match: 'privacy-request', vendor: null }, // path used by several hosted portals
];

export function detectDsarPortal(hay: string) {
  const h = hay || '';
  const hit = DSAR_PORTAL_MATCHERS.find((m) => h.includes(m.match));
  if (!hit) return null;
  return { vendor: hit.vendor, match: hit.match };
}

// Our own widget. What it serves is not guessed from the page — it is read from
// the site's saved widget configuration, so a drawer the subscriber turned off
// is never credited. Shape: { provides: { <check_key>: observation } }.
const DROS_COPY = 'Provided by the DataRightsOS widget.';

export function datarightsosProvides(
  drawers: string[] | null | undefined,
  activeStatementTypes: string[] | null | undefined,
) {
  const d = new Set(drawers || []);
  const s = new Set(activeStatementTypes || []);
  const provides: Record<string, string> = {};

  if (d.has('privacy_rights')) provides.request_mechanism = DROS_COPY;
  if (d.has('accessibility')) provides.accessibility_reporting = DROS_COPY;

  // Statements are credited only where the widget is configured to serve them:
  // the drawer is enabled AND an active statement exists behind it.
  if (d.has('cookies') || d.has('privacy_rights')) {
    if (s.has('privacy_policy')) provides.privacy_policy = DROS_COPY;
  }
  if (d.has('accessibility') && s.has('accessibility_statement')) {
    provides.accessibility_statement = DROS_COPY;
  }
  if (d.has('ai_disclosure') && s.has('ai_use_statement')) {
    provides.ai_disclosure = DROS_COPY;
  }
  return { vendor: 'DataRightsOS', provides };
}