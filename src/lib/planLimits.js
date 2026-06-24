// Plan limits and features for Data Rights OS
export const PLAN_LIMITS = {
  trial: {
    sites: 1,
    teamMembers: 2,
    label: 'Free Trial',
    price: 'Free',
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
    features: [
      '1 site / 1 domain',
      '2 team members',
      'Cookie consent widget with GPC',
      'Data-rights request intake',
      'Audit trail (90-day retention)',
    ],
  },
  proof: {
    sites: 10,
    teamMembers: 10,
    label: 'Proof',
    price: '$299/mo',
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