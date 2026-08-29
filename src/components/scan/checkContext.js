import { GROUP_B_KEYS } from '@/components/scan/checkMeta';

// Context layer for each check: general statements about the law/landscape and a
// question the site owner can answer themselves. Never a verdict about this site.
export const CHECK_CONTEXT = {
  tracking_scripts: {
    why: 'Each third-party script sends data about your visitors to another company. Most US state privacy laws define "sale" or "sharing" broadly enough to include advertising trackers, even when no money changes hands. Whether those laws apply to you depends on your revenue and how much consumer data you handle.',
    check: 'Do you know what each of these vendors does with the data, and do you have an agreement in place with them?',
  },
  meta_pixel: {
    why: 'Advertising pixels are commonly treated as "sharing" personal information under state privacy laws, which generally require you to honor an opt-out.',
    check: 'If you have a cookie banner, does declining it actually stop this pixel from loading — or does it just record the choice?',
  },
  google_analytics: {
    why: "Analytics generally carries less exposure than advertising tools, but it's still a third party receiving data about your visitors, and expectations around consent for analytics vary by state.",
    check: 'Is it configured to respect consent, and does your privacy policy mention it by name?',
  },
  google_ads: {
    why: "This is the clearest case of sharing data for advertising. California's privacy regulator has issued penalties in cases involving opt-out mechanisms that didn't function as described.",
    check: 'When someone opts out on your site, does that opt-out actually reach these tools?',
  },
  ai_chatbot: {
    why: "California's bot-disclosure law and FTC guidance on deceptive AI both point toward telling people when they're interacting with an automated system rather than a person.",
    check: 'Does your site disclose anywhere that this chat is powered by AI?',
  },
  forms_pii: {
    why: 'Collecting personal information generally triggers notice obligations — telling people what you collect, why, and what you do with it.',
    check: 'Does your privacy policy actually describe the information these forms collect?',
  },
  pre_consent_tracking: {
    why: "A banner that records a choice but doesn't stop the scripts creates a written record that someone declined and the tracking ran anyway. Regulators have specifically pursued businesses whose opt-out mechanisms didn't work the way they were presented.",
    check: 'Open your site in a private window, decline the banner, and watch whether these same trackers still load.',
  },
  gpc_comparison: {
    why: "Global Privacy Control is a signal a visitor's browser sends automatically, and a growing number of states treat it as a valid opt-out of sale or sharing that businesses must honor.",
    check: 'Does your consent tool read the GPC signal, or does it only respond to banner clicks?',
  },

  // --- Group B: things that appear to be missing. ---
  cookie_consent: {
    why: 'Most US state privacy laws expect visitors to be able to decline non-essential tracking, and several expect that choice to be honored before the tracking runs. Whether that applies to you depends on your revenue, your data volume, and where your customers live.',
    check: 'If you have tracking on the page, can a visitor decline it before it loads?',
  },
  privacy_policy: {
    why: "Publishing a privacy policy is one of the most consistent requirements across US state privacy laws, and it's usually the first thing anyone looks for.",
    check: 'Does yours describe the tracking tools and forms actually on your site today, rather than a template you started from?',
  },
  do_not_sell: {
    why: 'Several state privacy laws require businesses that sell or share personal information to provide a clear way to opt out, often as a link in the footer. Advertising and analytics tools can count as sharing even when no money changes hands.',
    check: 'If your site runs advertising tools, is there a visible way for a visitor to opt out of that sharing?',
  },
  accessibility_statement: {
    why: "Website accessibility claims are among the most litigated areas in this space, and unlike privacy laws there's generally no revenue threshold — the same standard applies to a small firm and a national retailer. An accessibility statement doesn't make a site accessible, but it tells visitors where you stand and how to reach you.",
    check: 'Does your statement say what standard you work toward, and give someone a real way to report a problem they hit?',
  },
  request_mechanism: {
    why: 'State privacy laws that grant deletion, access, and correction rights also expect a way for people to exercise them — and once a request arrives, a response clock starts. Most businesses have the rights described in their policy but no actual process behind them.',
    check: 'If someone asked you to delete their data today, who at your organization would handle it, and how would you prove you did?',
  },
  accessibility_reporting: {
    why: 'A documented response to someone reporting a barrier is worth more than any automated widget. It shows you were told and you acted.',
    check: "If a visitor couldn't use your site, how would they tell you, and would anyone see it?",
  },
  ai_disclosure: {
    why: "California's bot-disclosure law and FTC guidance on deceptive AI both point toward telling people when they're interacting with an automated system rather than a person.",
    check: 'If your site uses a chatbot or AI-generated responses, does anything tell visitors that?',
  },
};

// Session-recording tools get a different context block on the tracking_scripts check.
const SESSION_RECORDERS = /clarity|hotjar|fullstory|logrocket|mouseflow|smartlook/i;

const SESSION_RECORDING_CONTEXT = {
  why: 'Session-recording tools capture what visitors do on your site, sometimes including what they type. Recording tools of this kind have been the subject of a wave of state wiretapping and privacy claims in recent years, particularly where visitors weren\'t told.',
  check: 'Does your privacy policy disclose that visitor sessions are recorded, and are form fields masked?',
};

export function contextFor(checkKey, check) {
  if (checkKey === 'tracking_scripts') {
    const hay = [check?.observation || '', ...(check?.details || [])].join(' ');
    if (SESSION_RECORDERS.test(hay)) return SESSION_RECORDING_CONTEXT;
  }
  return CHECK_CONTEXT[checkKey] || null;
}

// When a check found NOTHING, "what to check" asks the reader to inspect a tool
// they don't have. Those checks get one short forward-looking line instead of the
// full context block.
const NOT_DETECTED_NOTES = {
  tracking_scripts: "If you add analytics or advertising tools later, they'll need to respect consent.",
  meta_pixel: "If you add one later, it needs to respect a visitor's opt-out.",
  google_analytics: 'If you add analytics later, it needs to respect consent.',
  google_ads: "If you start running ads, these tools need to respect a visitor's opt-out.",
  ai_chatbot: "If you add a chatbot later, visitors should be told they're talking to AI.",
  gpc_comparison: 'With no tracking on the page, there was nothing for a privacy signal to change.',
};

// Single decision point for how much context a finding earns, shared by the
// screen cards and the print document so both stay in step.
// { mode: 'full', ctx } — detected or flagged: observation + why + what to check.
// { mode: 'note', note } — nothing detected: observation + one forward-looking line.
// { mode: 'none' }       — nothing useful to add.
export function resolveContext(checkKey, check) {
  // Group B is the inverse of Group A: absence is the finding, so a FOUND result
  // needs no explanation (its observation already says what was found), while
  // NOT FOUND and COULD NOT DETERMINE carry the full context.
  if (GROUP_B_KEYS.has(checkKey)) {
    if (check?.status === 'found') return { mode: 'none' };
    const ctx = CHECK_CONTEXT[checkKey];
    return ctx ? { mode: 'full', ctx } : { mode: 'none' };
  }
  const detected = check?.status === 'found';
  if (detected) {
    const ctx = contextFor(checkKey, check);
    return ctx ? { mode: 'full', ctx } : { mode: 'none' };
  }
  // The GPC check reports "no change observed" as not_found, and that IS the
  // flagged finding — it keeps the full context. Only the zero-tracker case,
  // where there was nothing to compare, gets the short note.
  if (checkKey === 'gpc_comparison' && check?.status === 'not_found' && !check?.zero_baseline) {
    return { mode: 'full', ctx: CHECK_CONTEXT.gpc_comparison };
  }
  const note = NOT_DETECTED_NOTES[checkKey];
  return note ? { mode: 'note', note } : { mode: 'none' };
}