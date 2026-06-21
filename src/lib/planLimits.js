// Plan limits and features for Tessera Privacy
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
  starter: {
    sites: 3,
    teamMembers: 5,
    label: 'Starter',
    price: '$49/mo',
    features: [
      '3 sites',
      '5 team members',
      '5,000 consent records/mo',
      'Full audit trail',
      'CSV export',
    ],
  },
  pro: {
    sites: 10,
    teamMembers: 15,
    label: 'Pro',
    price: '$149/mo',
    features: [
      '10 sites',
      '15 team members',
      '50,000 consent records/mo',
      'Priority support',
      'White-label branding',
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