// Shared analysis for the website scanner (Group A checks).
//
// TWO RULES that apply to every check — baked in here, do not weaken them:
// 1) Report OBSERVATIONS, never VERDICTS. No "compliant/violation/risk/exposed"
//    language anywhere, and never a claim that a site is required to do anything.
// 2) Every check has three states: found | not_found | could_not_determine.
//    A timeout, blocked request, partial load, or ambiguous result is ALWAYS
//    could_not_determine — never not_found. A failed check must never read as
//    a negative finding.

export const STATUS = {
  FOUND: 'found',
  NOT_FOUND: 'not_found',
  CND: 'could_not_determine',
};

// Maintained tracking/ad domain list. `match` is a lowercase substring tested
// against the full request URL; `vendor` is the name reported to the user.
export const TRACKER_MATCHERS = [
  { match: 'connect.facebook.net', vendor: 'Meta Pixel' },
  { match: 'facebook.com/tr', vendor: 'Meta Pixel' },
  { match: 'fbevents.js', vendor: 'Meta Pixel' },
  { match: 'googletagmanager.com', vendor: 'Google Tag Manager' },
  { match: 'google-analytics.com', vendor: 'Google Analytics' },
  { match: 'analytics.google.com', vendor: 'Google Analytics' },
  { match: 'googleadservices.com', vendor: 'Google Ads' },
  { match: 'doubleclick.net', vendor: 'DoubleClick' },
  { match: 'googlesyndication.com', vendor: 'Google Ad Syndication' },
  { match: 'analytics.tiktok.com', vendor: 'TikTok Pixel' },
  { match: 'px.ads.linkedin.com', vendor: 'LinkedIn Insight Tag' },
  { match: 'snap.licdn.com', vendor: 'LinkedIn Insight Tag' },
  { match: 'bat.bing.com', vendor: 'Microsoft Advertising (UET)' },
  { match: 'clarity.ms', vendor: 'Microsoft Clarity' },
  { match: 'hotjar.com', vendor: 'Hotjar' },
  { match: 'hotjar.io', vendor: 'Hotjar' },
  { match: 'mixpanel.com', vendor: 'Mixpanel' },
  { match: 'cdn.segment.com', vendor: 'Segment' },
  { match: 'api.segment.io', vendor: 'Segment' },
  { match: 'amplitude.com', vendor: 'Amplitude' },
  { match: 'fullstory.com', vendor: 'FullStory' },
  { match: 'mouseflow.com', vendor: 'Mouseflow' },
  { match: 'crazyegg.com', vendor: 'Crazy Egg' },
  { match: 'quantserve.com', vendor: 'Quantcast' },
  { match: 'scorecardresearch.com', vendor: 'Comscore' },
  { match: 'criteo.com', vendor: 'Criteo' },
  { match: 'criteo.net', vendor: 'Criteo' },
  { match: 'taboola.com', vendor: 'Taboola' },
  { match: 'outbrain.com', vendor: 'Outbrain' },
  { match: 'ct.pinterest.com', vendor: 'Pinterest Tag' },
  { match: 'ads-twitter.com', vendor: 'X (Twitter) Pixel' },
  { match: 'analytics.twitter.com', vendor: 'X (Twitter) Analytics' },
  { match: 'redditstatic.com/ads', vendor: 'Reddit Pixel' },
  { match: 'events.reddit.com', vendor: 'Reddit Pixel' },
  { match: 'hs-scripts.com', vendor: 'HubSpot' },
  { match: 'track.hubspot.com', vendor: 'HubSpot' },
  { match: 'hs-analytics.net', vendor: 'HubSpot' },
  { match: 'static.klaviyo.com', vendor: 'Klaviyo' },
  { match: 'a.klaviyo.com', vendor: 'Klaviyo' },
  { match: 'plausible.io', vendor: 'Plausible Analytics' },
  { match: 'matomo.cloud', vendor: 'Matomo' },
  { match: 'mc.yandex', vendor: 'Yandex Metrica' },
  { match: 'adroll.com', vendor: 'AdRoll' },
  { match: 'pardot.com', vendor: 'Salesforce Pardot' },
  { match: 'munchkin.marketo.net', vendor: 'Marketo' },
];

// Known chat/AI widget vendor scripts — reported by name.
export const CHATBOT_MATCHERS = [
  { match: 'intercom.io', vendor: 'Intercom' },
  { match: 'intercomcdn.com', vendor: 'Intercom' },
  { match: 'drift.com', vendor: 'Drift' },
  { match: 'driftt.com', vendor: 'Drift' },
  { match: 'tidio.co', vendor: 'Tidio' },
  { match: 'crisp.chat', vendor: 'Crisp' },
  { match: 'intaker.com', vendor: 'Intaker' },
  { match: 'intaker.co', vendor: 'Intaker' },
  { match: 'podium.com', vendor: 'Podium' },
  { match: 'livechatinc.com', vendor: 'LiveChat' },
  { match: 'livechat.com', vendor: 'LiveChat' },
  { match: 'ada.support', vendor: 'Ada' },
  { match: 'zdassets.com', vendor: 'Zendesk' },
  { match: 'zopim.com', vendor: 'Zendesk' },
  { match: 'zendesk.com', vendor: 'Zendesk' },
  { match: 'voiceflow.com', vendor: 'Voiceflow' },
];

// Match a list of request URLs against a matcher list.
// Returns [{vendor, matches: [matched substrings]}], one entry per vendor.
export function matchUrls(urls, matchers) {
  const hits = new Map();
  for (const u of urls || []) {
    const lu = String(u).toLowerCase();
    for (const m of matchers) {
      if (lu.includes(m.match)) {
        if (!hits.has(m.vendor)) hits.set(m.vendor, new Set());
        hits.get(m.vendor).add(m.match);
      }
    }
  }
  return Array.from(hits.entries()).map(([vendor, matches]) => ({ vendor, matches: Array.from(matches) }));
}

function hostOf(u) {
  try { return new URL(u).hostname.toLowerCase(); } catch { return null; }
}

// pass1: { ok, requests, forms, nav_error } — first load, clean browser, no interaction.
// pass2: { ok, requests, nav_error } — second load with Sec-GPC: 1. May be null/failed.
export function analyzeScan({ url, pass1, pass2 }) {
  const apex = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const p1urls = pass1.requests || [];
  // Partial first load (navigation timed out but some requests were captured):
  // positive matches are still real observations, but absence proves nothing.
  const p1partial = !!pass1.nav_error;

  const thirdParty = Array.from(new Set(
    p1urls.map(hostOf).filter((h) => h && h !== apex && !h.endsWith('.' + apex))
  )).sort();

  const found = (observation, details) => ({ status: STATUS.FOUND, observation, details: details || [] });
  const notFound = (observation) => p1partial
    ? { status: STATUS.CND, observation: 'The page did not finish loading, so this could not be determined.', details: [] }
    : { status: STATUS.NOT_FOUND, observation, details: [] };
  const cnd = (observation, details) => ({ status: STATUS.CND, observation, details: details || [] });

  const trackers = matchUrls(p1urls, TRACKER_MATCHERS);
  const trackerNames = trackers.map((t) => t.vendor);

  // 1. Tracking scripts detected
  const tracking_scripts = trackers.length
    ? found(
        'Third-party tracking scripts loaded: ' + trackerNames.join(', ') + '.',
        trackers.map((t) => t.vendor + ' — matched ' + t.matches.join(', '))
      )
    : notFound('No known tracking or advertising scripts were observed on load.');

  // 2. Meta Pixel
  const metaHits = trackers.filter((t) => t.vendor === 'Meta Pixel');
  const meta_pixel = metaHits.length
    ? found('Requests to Meta Pixel endpoints were observed.', metaHits[0].matches.map((m) => 'Matched: ' + m))
    : notFound('No requests to Meta Pixel endpoints were observed.');

  // 3. Google Analytics (GA4 vs Universal when determinable)
  const ga4 = p1urls.some((u) => /google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/i.test(u));
  const universal = !ga4 && p1urls.some((u) => /google-analytics\.com\/analytics\.js|google-analytics\.com\/(r\/)?collect(\?|$)/i.test(u));
  const gtagLoader = p1urls.some((u) => /googletagmanager\.com\/gtag\/js/i.test(u));
  let google_analytics;
  if (ga4) google_analytics = found('Google Analytics requests were observed.', ['Version: GA4 (g/collect endpoint observed)']);
  else if (universal) google_analytics = found('Google Analytics requests were observed.', ['Version: Universal Analytics (analytics.js/collect endpoint observed)']);
  else if (gtagLoader) google_analytics = found('The Google gtag.js loader was observed.', ['Version: could not be determined from network traffic alone']);
  else google_analytics = notFound('No Google Analytics requests were observed.');

  // 4. Google Ads / DoubleClick
  const adsHits = trackers.filter((t) => ['Google Ads', 'DoubleClick', 'Google Ad Syndication'].includes(t.vendor));
  const google_ads = adsHits.length
    ? found(
        'Requests to Google advertising endpoints were observed: ' + adsHits.map((t) => t.vendor).join(', ') + '.',
        adsHits.map((t) => t.vendor + ' — matched ' + t.matches.join(', '))
      )
    : notFound('No requests to Google Ads, DoubleClick, or Google Ad Syndication endpoints were observed.');

  // 5. AI chatbot / chat widget
  const chatHits = matchUrls(p1urls, CHATBOT_MATCHERS);
  const ai_chatbot = chatHits.length
    ? found(
        'Chat widget scripts were observed: ' + chatHits.map((t) => t.vendor).join(', ') + '.',
        chatHits.map((t) => t.vendor + ' — matched ' + t.matches.join(', '))
      )
    : notFound('No known chat widget vendor scripts were observed.');

  // 6. Contact forms collecting personal information — FIELD TYPES ONLY, values are never captured.
  let forms_pii;
  if (!Array.isArray(pass1.forms)) {
    forms_pii = cnd('Form elements could not be read from the rendered page, so this could not be determined.');
  } else if (pass1.forms.length === 0) {
    forms_pii = notFound('No forms with fields that collect personal information were found in the rendered page.');
  } else {
    forms_pii = found(
      pass1.forms.length + (pass1.forms.length === 1 ? ' form collects' : ' forms collect') + ' personal information fields.',
      pass1.forms.map((f, i) => 'Form ' + (i + 1) + ': ' + f.fields.join(', ')).concat(['Field types only — no values were captured or stored.'])
    );
  }

  // 7. Tracking fired before consent — THE MOST IMPORTANT CHECK.
  // Pass 1 is a fresh load with no cookies and no interaction, so every tracker
  // seen there loaded before any consent choice was recorded.
  const pre_consent_tracking = trackers.length
    ? found('These trackers loaded before any consent choice was recorded: ' + trackerNames.join(', ') + '.')
    : notFound('No tracking requests were observed before any consent choice was recorded.');

  // 8. GPC comparison — observed behavior only, never a claim about intent.
  let gpc_comparison;
  if (!pass2 || !pass2.ok) {
    gpc_comparison = cnd('The comparison load with a Global Privacy Control signal could not be completed, so this could not be determined.');
  } else if (pass2.nav_error || p1partial) {
    gpc_comparison = cnd('One of the two loads did not finish, so the comparison could not be determined.');
  } else {
    const set1 = new Set(trackerNames);
    const set2 = new Set(matchUrls(pass2.requests || [], TRACKER_MATCHERS).map((t) => t.vendor));
    const dropped = Array.from(set1).filter((v) => !set2.has(v));
    const added = Array.from(set2).filter((v) => !set1.has(v));
    if (set1.size === 0 && set2.size === 0) {
      // Nothing to measure is not a finding: no trackers on either load means
      // there was no behavior to compare, which is distinct from "compared and
      // saw no change". Reported as its own neutral state, never flagged.
      gpc_comparison = {
        status: STATUS.NOT_FOUND,
        zero_baseline: true,
        observation: 'No tracking requests were observed on either load, so there was no behavior to compare.',
        details: [],
      };
    } else if (dropped.length > 0 && added.length === 0) {
      gpc_comparison = found('Fewer trackers loaded when GPC was enabled.', ['Not observed on the GPC load: ' + dropped.join(', ')]);
    } else {
      gpc_comparison = {
        status: STATUS.NOT_FOUND,
        observation: 'Tracking behavior did not change when a Global Privacy Control signal was sent.',
        details: [],
      };
    }
  }

  return {
    checks: {
      tracking_scripts,
      meta_pixel,
      google_analytics,
      google_ads,
      ai_chatbot,
      forms_pii,
      pre_consent_tracking,
      gpc_comparison,
    },
    third_party_domains: thirdParty,
  };
}