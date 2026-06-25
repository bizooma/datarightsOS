// Lightweight user-agent parser — derives device type and browser from a UA string.
// No external dependency; good enough for analytics aggregation.

export function parseDevice(ua = '') {
  if (!ua) return 'Unknown';
  const s = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(s) || (/android/.test(s) && !/mobile/.test(s))) return 'Tablet';
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry|bb10/.test(s)) return 'Mobile';
  return 'Desktop';
}

export function parseBrowser(ua = '') {
  if (!ua) return 'Unknown';
  const s = ua.toLowerCase();
  if (/edg\//.test(s)) return 'Edge';
  if (/opr\/|opera/.test(s)) return 'Opera';
  if (/chrome|crios/.test(s) && !/edg\//.test(s)) return 'Chrome';
  if (/firefox|fxios/.test(s)) return 'Firefox';
  if (/safari/.test(s) && !/chrome|crios/.test(s)) return 'Safari';
  return 'Other';
}

// Full US state code -> name map for friendly display of region_state values.
export const US_STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

export function stateName(code) {
  if (!code) return null;
  const c = code.toUpperCase().trim();
  return US_STATES[c] || code;
}