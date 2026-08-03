// Plan limits and features for Data Rights OS
//
// retentionDays: how long audit-trail & request records are kept before any
//   automatic purge may remove them. null = unlimited (never auto-purge).
// canExportOwn: account can export its OWN request/audit records to CSV on demand.
// canBulkScheduledExport: account can run bulk & scheduled CSV exports.
// canHideBadge: account can remove the "Powered by DataRightsOS" widget badge.
// canTrackRequests: account gets the full data-rights request ENGINE — a tracked
//   Request record per submission, email verification, the 45-day statutory clock,
//   fulfillment checklists, deadline alerts, and requester ack/completion emails.
//   When FALSE (Notice tier), the widget still shows the "Submit a request" card,
//   but a submission is FORWARDED by email to the subscriber and only a minimal,
//   PII-light counter is stored — no tracked Request, no clock, no audit trail.
export const PLAN_LIMITS = {
  trial: {
    sites: 1,
    teamMembers: 2,
    label: 'Free Trial',
    price: 'Free',
    retentionDays: 365,
    canExportOwn: true,
    canBulkScheduledExport: false,
    canHideBadge: false,
    canTrackRequests: true,
    features: [
      '1 site',
      '2 team members',
      '100 consent records/mo',
      'Basic audit trail',
    ],
  },
  notice: {
    sites: 1,
    teamMembers: 1,
    label: 'Notice',
    price: '$39/mo',
    priceMonthly: '$39/mo',
    priceAnnual: '$390/yr',
    // Consent log shows the last 90 days in-dashboard, no export. Older records are
    // retained in the database (never deleted), just not displayed until upgrade.
    retentionDays: 90,
    canExportOwn: false,
    canBulkScheduledExport: false,
    canHideBadge: false,
    // Entry tier: no tracked request engine — submissions are forwarded by email.
    canTrackRequests: false,
    features: [
      '1 site / 1 domain',
      '1 team member',
      'Cookie consent with full GPC enforcement',
      'Accessibility statement + barrier reports',
      'AI use statement (incl. Spanish)',
      'All four legal statements in-widget',
      'Consent log (90 days of history)',
      'Privacy requests forwarded by email',
    ],
  },
  core: {
    sites: 1,
    teamMembers: 2,
    label: 'Core',
    price: '$99/mo',
    retentionDays: 365,
    canExportOwn: true,
    canBulkScheduledExport: false,
    canHideBadge: false,
    canTrackRequests: true,
    features: [
      'Everything in Notice, plus:',
      'Data-rights request intake with identity verification',
      '45-day deadline tracking + alerts',
      'Per-request fulfillment checklists',
      'Audit trail (1-year retention)',
      'CSV export of your own records',
      '2 team members',
    ],
  },
  proof: {
    sites: 10,
    teamMembers: 10,
    label: 'Proof',
    price: '$299/mo',
    retentionDays: null,
    canExportOwn: true,
    canBulkScheduledExport: true,
    canHideBadge: false,
    canTrackRequests: true,
    features: [
      'Up to 10 sites',
      '10 team members',
      'Unlimited audit trail retention',
      'CSV export for regulatory responses',
      'White-label widget (client branding)',
    ],
  },
  agency: {
    sites: Infinity,
    teamMembers: Infinity,
    label: 'Agency',
    price: '$399/mo',
    retentionDays: null,
    canExportOwn: true,
    canBulkScheduledExport: true,
    canHideBadge: true,
    canTrackRequests: true,
    features: [
      'Unlimited sites',
      'Unlimited team members',
      'Unlimited consent records',
      'Multi-org management',
      'Custom branding',
      'Dedicated support',
    ],
  },
};

export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.trial;
}

export function canAddSite(plan, currentCount) {
  return currentCount < getPlanLimits(plan).sites;
}

export function canAddMember(plan, currentCount) {
  return currentCount < getPlanLimits(plan).teamMembers;
}

// Audit-trail / request retention in days. null = unlimited (never auto-purge).
//
// COMPLIANCE-CRITICAL: null retentionDays = unlimited retention; any future cleanup
// MUST call hasUnlimitedRetention() first and skip purge when true. Never pass null
// into date math. This is a compliance product — accidental deletion of audit
// records is the worst possible bug.
export function getRetentionDays(plan) {
  return getPlanLimits(plan).retentionDays;
}

// True when records on this plan are kept forever (no automatic purge).
//
// COMPLIANCE-CRITICAL: null retentionDays = unlimited retention; any future cleanup
// MUST call hasUnlimitedRetention() first and skip purge when true. Never pass null
// into date math. This is a compliance product — accidental deletion of audit
// records is the worst possible bug.
export function hasUnlimitedRetention(plan) {
  return getPlanLimits(plan).retentionDays == null;
}

// Defense-in-depth guard for any FUTURE purge logic. Returns the cutoff Date past
// which records on this plan MAY be deleted, or null when records must NEVER be
// deleted (unlimited retention). Callers MUST treat a null return as "skip purge".
// null retentionDays can never reach date math here — it short-circuits to null.
export function getPurgeCutoffDate(plan, now = new Date()) {
  if (hasUnlimitedRetention(plan)) return null; // unlimited — never delete
  const days = getRetentionDays(plan);
  if (days == null || !Number.isFinite(days)) return null; // belt-and-suspenders: null/NaN never deletes
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Self-serve CSV export of the account's own records.
export function canExportOwn(plan) {
  return !!getPlanLimits(plan).canExportOwn;
}

// Bulk & scheduled CSV exports (Proof / Agency).
export function canBulkScheduledExport(plan) {
  return !!getPlanLimits(plan).canBulkScheduledExport;
}

// Only the Agency (white-label) plan can remove the "Powered by DataRightsOS" badge.
export function canHideBadge(plan) {
  return !!getPlanLimits(plan).canHideBadge;
}

// Full data-rights request ENGINE: tracked Request record, email verification,
// 45-day statutory clock, fulfillment checklists, deadline alerts, and requester
// acknowledgment/completion emails. FALSE on Notice — submissions are forwarded by
// email and only a minimal counter is stored. This is THE gate that separates the
// entry (Notice) tier from Core+. Route every request-engine gate through here.
export function canTrackRequests(plan) {
  return !!getPlanLimits(plan).canTrackRequests;
}

// Team-member seat limit for the plan.
export function getMemberLimit(plan) {
  return getPlanLimits(plan).teamMembers;
}

// Site limit for the plan.
export function getSiteLimit(plan) {
  return getPlanLimits(plan).sites;
}

// Outbound webhook (Zapier / any endpoint). Available on all PAID plans for now.
// Route all webhook UI and sending through this helper so access can be tightened
// later (e.g. Proof+ only) without touching component or function code.
export function canUseOutboundWebhook(plan) {
  return ['core', 'proof', 'agency'].includes(plan);
}

const TRIAL_DAYS = 7;

export function isTrialExpired(org) {
  if (!org || org.plan !== 'trial') return false;
  const started = org.trial_started_at ? new Date(org.trial_started_at) : null;
  if (!started) return false;
  const daysSinceStart = (Date.now() - started.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceStart > TRIAL_DAYS;
}

export function trialDaysRemaining(org) {
  if (!org || org.plan !== 'trial') return null;
  const started = org.trial_started_at ? new Date(org.trial_started_at) : null;
  if (!started) return TRIAL_DAYS;
  const elapsed = (Date.now() - started.getTime()) / (1000 * 60 * 60 * 24);
  // Whole days left, decrementing once per 24h. floor of the remaining time so
  // the count drops steadily each day instead of lingering on the same number.
  return Math.max(0, Math.floor(TRIAL_DAYS - elapsed));
}