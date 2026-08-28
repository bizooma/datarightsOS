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