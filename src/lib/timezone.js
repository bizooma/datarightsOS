// Timezone display helpers.
// All records are stored in UTC. These helpers convert a UTC timestamp to a
// chosen IANA timezone for *display only*, using the browser's Intl API — no extra package.

export const DEFAULT_TIMEZONE = 'America/New_York';

// A curated list of common US business timezones plus a few internationals.
// value = IANA identifier, label = human-friendly name.
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time — New York' },
  { value: 'America/Chicago', label: 'Central Time — Chicago' },
  { value: 'America/Denver', label: 'Mountain Time — Denver' },
  { value: 'America/Phoenix', label: 'Mountain Time (no DST) — Phoenix' },
  { value: 'America/Los_Angeles', label: 'Pacific Time — Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska Time — Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time — Honolulu' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time — Puerto Rico' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Central European — Paris' },
  { value: 'Asia/Tokyo', label: 'Japan — Tokyo' },
];

// Detect the browser's current IANA timezone, best-effort.
export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

// Friendly label for a timezone value; falls back to the raw identifier.
export function timezoneLabel(tz) {
  const found = TIMEZONE_OPTIONS.find(o => o.value === tz);
  return found ? found.label : (tz || DEFAULT_TIMEZONE);
}

// Short zone abbreviation for a given date + timezone, e.g. "CST", "EDT".
export function zoneAbbreviation(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || DEFAULT_TIMEZONE,
      timeZoneName: 'short',
    }).formatToParts(date instanceof Date ? date : new Date(date));
    const zonePart = parts.find(p => p.type === 'timeZoneName');
    return zonePart ? zonePart.value : '';
  } catch {
    return '';
  }
}

// Format a UTC timestamp in the given timezone.
// options.withTime -> include time; options.withZone -> append the zone abbreviation.
export function formatInTimezone(value, tz, options = {}) {
  if (!value) return '—';
  const { withTime = true, withZone = false } = options;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '—';

  const fmtOptions = {
    timeZone: tz || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  if (withTime) {
    fmtOptions.hour = 'numeric';
    fmtOptions.minute = '2-digit';
    fmtOptions.hour12 = true;
  }

  let out = new Intl.DateTimeFormat('en-US', fmtOptions).format(date);
  if (withZone) {
    const abbr = zoneAbbreviation(date, tz);
    if (abbr) out += ` ${abbr}`;
  }
  return out;
}