// Display metadata for the Group A scanner checks. Order matches the spec.
export const CHECK_ORDER = [
  'tracking_scripts',
  'meta_pixel',
  'google_analytics',
  'google_ads',
  'ai_chatbot',
  'forms_pii',
  'pre_consent_tracking',
  'gpc_comparison',
  // Group B — what appears to be missing.
  'cookie_consent',
  'privacy_policy',
  'do_not_sell',
  'accessibility_statement',
  'request_mechanism',
  'accessibility_reporting',
  'ai_disclosure',
];

// Group B checks look for ABSENCE, so their context reads in the inverse of
// Group A: a FOUND result needs no explanation, while NOT FOUND and COULD NOT
// DETERMINE carry the full "why this matters" and "what to check".
export const GROUP_B_KEYS = new Set([
  'cookie_consent',
  'privacy_policy',
  'do_not_sell',
  'accessibility_statement',
  'request_mechanism',
  'accessibility_reporting',
  'ai_disclosure',
]);

export const CHECK_LABELS = {
  tracking_scripts: 'Tracking scripts detected',
  meta_pixel: 'Meta Pixel',
  google_analytics: 'Google Analytics',
  google_ads: 'Google Ads / DoubleClick',
  ai_chatbot: 'AI chatbot / chat widget',
  forms_pii: 'Contact forms collecting personal information',
  pre_consent_tracking: 'Tracking fired before consent',
  gpc_comparison: 'Global Privacy Control comparison',
  cookie_consent: 'Cookie consent mechanism',
  privacy_policy: 'Privacy policy',
  do_not_sell: '"Do Not Sell or Share" mechanism',
  accessibility_statement: 'Accessibility statement',
  request_mechanism: 'Privacy request mechanism',
  accessibility_reporting: 'Accessibility reporting channel',
  ai_disclosure: 'AI disclosure',
};

// Plain-language status per check. The label must describe the observation and
// read correctly on its own — a bare "NOT FOUND" is confusing on the last two
// checks (the GPC check compares two loads; it isn't looking for a thing).
//
// NOTE ON GPC DIRECTION: for gpc_comparison the analyzer sets
//   found     = fewer trackers loaded with the GPC signal ("Tracking reduced under GPC")
//   not_found = behavior was identical on both loads ("No change observed")
// so this mapping is by MEANING, not by the found/not_found slot.
const STATUS_LABELS = {
  tracking_scripts: {
    found: (check) => `${vendorCount(check)} detected`,
    not_found: () => 'None detected',
  },
  meta_pixel: { found: () => 'Detected', not_found: () => 'Not detected' },
  google_analytics: { found: () => 'Detected', not_found: () => 'Not detected' },
  google_ads: { found: () => 'Detected', not_found: () => 'Not detected' },
  ai_chatbot: { found: () => 'Detected', not_found: () => 'Not detected' },
  forms_pii: {
    found: (check) => {
      const n = formCount(check);
      return `${n} ${n === 1 ? 'form' : 'forms'}`;
    },
    not_found: () => 'None detected',
  },
  pre_consent_tracking: {
    found: () => 'Fired before consent',
    not_found: () => 'None fired before consent',
  },
  gpc_comparison: {
    found: () => 'Tracking reduced under GPC',
    // zero_baseline = no trackers on either load, so no comparison happened.
    not_found: (check) => (check?.zero_baseline ? 'No tracking to compare' : 'No change observed'),
  },
  cookie_consent: { found: () => 'Detected', not_found: () => 'Not found' },
  privacy_policy: { found: () => 'Found', not_found: () => 'Not found' },
  do_not_sell: { found: () => 'Found', not_found: () => 'Not found' },
  accessibility_statement: { found: () => 'Found', not_found: () => 'Not found' },
  request_mechanism: { found: () => 'Found', not_found: () => 'Not found' },
  accessibility_reporting: { found: () => 'Found', not_found: () => 'Not found' },
  ai_disclosure: { found: () => 'Found', not_found: () => 'Not found' },
};

// tracking_scripts details carry one line per matched vendor.
function vendorCount(check) {
  return (check?.details || []).length;
}

// forms_pii details are one line per form plus a trailing "field types only" note.
function formCount(check) {
  return (check?.details || []).filter((d) => /^Form\s/i.test(d)).length;
}

export function statusLabelFor(checkKey, check) {
  const status = check?.status;
  if (status === 'could_not_determine' || !status) return "Couldn't determine";
  const fn = STATUS_LABELS[checkKey]?.[status];
  return fn ? fn(check) : status;
}

// Whether a check is worth REVIEWING — a separate question from whether
// something was detected. A properly gated tracker is not a finding, so
// presence alone never flags. Only these two outcomes do:
//   - tracking actually fired before a consent choice existed
//   - the GPC signal produced no change in behavior
export function needsAttention(checkKey, check) {
  // The two Group B combination flags — internal inconsistencies the analyzer
  // observed directly (tracking with no way to decline it, a chat widget with no
  // disclosure). A missing policy or link on its own is never flagged: whether
  // it's required depends on the business, and we don't know their revenue or
  // where their customers live.
  if (check?.attention) return true;
  if (checkKey === 'pre_consent_tracking') return check?.status === 'found';
  // Only the real case: trackers were observed and behavior didn't change.
  // A zero-tracker baseline had nothing to measure, so it is never a finding.
  if (checkKey === 'gpc_comparison') return check?.status === 'not_found' && !check?.zero_baseline;
  return false;
}