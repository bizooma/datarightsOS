// Server-side mirror of the plan gating in src/lib/planLimits.js.
// Backend functions (Deno) cannot import from src/, so the request-engine gate
// that separates the Notice entry tier from Core+ lives here for functions to use.
//
// canTrackRequests: FALSE on Notice — the widget still shows the "Submit a request"
// card, but a submission is FORWARDED by email to the subscriber and only a minimal,
// PII-light counter (RequestForwardLog) is stored. No tracked DataRightsRequest,
// no email verification, no 45-day clock, no fulfillment checklist, no audit trail.
const PLAN_TRACKS_REQUESTS: Record<string, boolean> = {
  trial: true,
  notice: false,
  core: true,
  proof: true,
  agency: true,
};

export function canTrackRequests(plan: string | undefined | null): boolean {
  // Default to TRUE for any unknown plan — safer to track than to silently drop a
  // real privacy request. Only the explicit Notice tier forwards instead of tracks.
  if (!plan) return true;
  return PLAN_TRACKS_REQUESTS[plan] !== false;
}

// Free is the ONLY plan that neither tracks nor forwards privacy requests — the
// widget shows the cookie consent experience only. Notice+ forwards or tracks.
export function canShowRequestCard(plan: string | undefined | null): boolean {
  return plan !== 'free';
}

// Free serves NO legal statements in the widget (privacy, cookie, accessibility,
// AI) and has no accessibility/AI drawers. Cookie consent only. Paid plans serve
// statements normally.
export function canServeStatements(plan: string | undefined | null): boolean {
  return plan !== 'free';
}

// Custom launcher branding (subscriber image + REQUIRED text label). Core and
// above, trial included. Free and Notice always render the standard pill —
// widgetConfig strips the custom launcher fields for gated plans so a stale or
// tampered client config can't enable it.
export function canCustomLauncher(plan: string | undefined | null): boolean {
  return plan === 'trial' || plan === 'core' || plan === 'proof' || plan === 'agency';
}

// Monthly recorded-consent-event cap PER SITE. Only Free is capped (10,000).
// null = uncapped (all paid plans and trial).
export function getVisitorCap(plan: string | undefined | null): number | null {
  return plan === 'free' ? 10000 : null;
}