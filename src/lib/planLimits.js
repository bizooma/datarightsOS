// Plan limits and features for Data Rights OS
//
// retentionDays: how long audit-trail & request records are kept before any
//   automatic purge may remove them. null = unlimited (never auto-purge).
// canExportOwn: account can export its OWN request/audit records to CSV on demand.
// canBulkScheduledExport: account can run bulk & scheduled CSV exports.
// canHideBadge: account can remove the "Powered by DataRightsOS" widget badge.
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
    features: [
      '1 site',
      '2 team members',
      '100 consent records/mo',
      'Basic audit trail',
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
    features: [
      '1 site / 1 domain',
      '2 team members',
      'Cookie consent widget with GPC',
      'Data-rights request intake',
      'Audit trail (1-year retention)',
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
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
}