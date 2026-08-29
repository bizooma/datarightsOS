// ONE definition of "is this statement page actually servable?", shared by the
// endpoint that serves statement pages and by the widget config that decides
// whether to inject links to them.
//
// WHY THIS MODULE EXISTS: these two decisions used to be made independently.
// widgetConfig injected a footer link whenever a LegalStatement record existed,
// while the statement endpoint additionally refuses to publish a page when no
// business name is set (publishing an indexed privacy policy headed by an
// auto-generated "<Person>'s Organization" names the wrong legal party). Both
// rules were individually correct and together they put four links to 404s in a
// paying customer's production footer.
//
// So the injection side must never re-derive this. Anything that links to a
// statement page asks here, and a new precondition added to serving is a
// precondition for linking on the same edit.
//
// ============================================================================
// KNOWN DEBT — THIS MODULE HAS A HAND-KEPT MIRROR (logged 2026-08-29)
//
// src/lib/statementBlockReasons.js restates the rule below for the dashboard UI,
// because this file is Deno TS outside src/ and the frontend can't import it.
// ADD A PRECONDITION HERE => YOU MUST ALSO EDIT THAT FILE, or the UI will show a
// blocked state it cannot explain (or, worse, no blocked state at all).
//
// That is the same one-rule-in-two-places shape as the bug described above. The
// real fix is to generate the JS mirror from this file at build time, or to expose
// a read-only, side-effect-free block-state endpoint the UI can call. Do one of
// those the next time this module changes. Do not add a third copy.
//
// NOTE: widgetConfig is NOT usable as that endpoint — it mutates on GET
// (auto-activates Site.install_status), so calling it from the dashboard would
// falsely mark sites installed.
// ============================================================================

/**
 * The name a statement page is published under. Site overrides org.
 * Deliberately NO fallback to org.name — that value is auto-generated at signup
 * ("Sara Walsh's Organization"), so falling back publishes an individual's name
 * as the legal entity on an index,follow page.
 */
export function publishedBusinessName(site, org) {
  return String((site && site.business_name) || (org && org.business_name) || '').trim();
}

/**
 * Why a statement page can't be served, or null when it can.
 * `servesStatements` is the plan gate (canServeStatements) — passed in so this
 * module stays free of plan logic.
 *
 * Returns: null | 'plan' | 'business_name' | 'not_published'
 */
export function statementBlockReason({ site, org, statement, servesStatements }) {
  if (!servesStatements) return 'plan';
  if (!publishedBusinessName(site, org)) return 'business_name';
  if (!statement || !statement.body) return 'not_published';
  return null;
}

/** True when a statement page will return 200 — i.e. it is safe to link to. */
export function canServeStatementPage(args) {
  return statementBlockReason(args) === null;
}

/**
 * The business-name precondition on its own. Useful where the caller is deciding
 * about ALL statement types at once (no page can be served without it), rather
 * than about one specific statement.
 */
export function canPublishStatementPages({ site, org, servesStatements }) {
  return !!servesStatements && !!publishedBusinessName(site, org);
}