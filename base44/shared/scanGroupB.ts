// Group B analysis: what a site does NOT appear to have.
//
// THE RULE FOR THIS FILE: every Group B finding is a claim about ABSENCE, and a
// wrong absence claim is the worst thing this tool can do. So the default for any
// ambiguity — a link we couldn't follow, a page that errored, an in-house pattern
// we can't classify, consent language with no identifiable control — is
// COULD NOT DETERMINE. NOT_FOUND is reserved for "we looked everywhere we could
// see and there was genuinely nothing".
//
// Never a verdict: no compliant/required/violation language, here or in the copy.
import { STATUS } from './scanChecks.ts';
import { PATTERNS, CMP_MATCHERS } from './scanPatterns.ts';
import { detectDsarPortal } from './scanTools.ts';

const MIN_POLICY_TEXT = 500; // below this a "policy page" is a stub, not a policy

const found = (observation: string, details?: string[]) =>
  ({ status: STATUS.FOUND, observation, details: details || [] });
const notFound = (observation: string) => ({ status: STATUS.NOT_FOUND, observation, details: [] });
const cnd = (observation: string, details?: string[]) =>
  ({ status: STATUS.CND, observation, details: details || [] });

function hasAny(hay: string, list: string[]) {
  const h = hay || '';
  return list.some((p) => h.includes(p));
}

function firstMatch(hay: string, list: string[]) {
  const h = hay || '';
  return list.find((p) => h.includes(p)) || null;
}

// Anchors are {text, href, href_l}. Match on either the visible text or the href.
function anchorMatch(anchors: any[], list: string[]) {
  for (const a of anchors || []) {
    if (hasAny(a.text || '', list) || hasAny(a.href_l || '', list)) return a;
  }
  return null;
}

function mailtoIn(anchors: any[], contextWords: string[]) {
  for (const a of anchors || []) {
    const href = a.href_l || '';
    if (!href.startsWith('mailto:')) continue;
    const hay = href + ' ' + (a.text || '');
    if (contextWords.some((w) => hay.includes(w))) {
      return href.replace('mailto:', '').split('?')[0];
    }
  }
  return null;
}

function apexOf(u: string) {
  try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; }
}

function sameSite(u: string, apex: string) {
  const h = apexOf(u);
  return !!h && (h === apex || h.endsWith('.' + apex));
}

// Turn one followed-page record into a "did we confirm this page" verdict, used
// identically by the privacy policy and accessibility statement checks.
// When no link matched our patterns, a policy may still exist at a URL or under a
// label we don't recognize ("Your Data", /legal/notices). Telling a business they
// have no privacy policy when they do is unrecoverable, so a loose signal — any
// legal-ish link, or the phrase in the page text — downgrades the result to
// COULD NOT DETERMINE. Only a page with no such signal at all earns NOT FOUND.
function looseAbsent(anchors: any[], text: string, loose: string[], label: string) {
  const hit = anchors.find((a: any) => hasAny(a.text || '', loose) || hasAny(a.href_l || '', loose));
  if (hit) {
    return cnd(`We found links that may lead to ${label}, but none we could confirm, so this could not be determined.`, [`Link text: ${hit.text || '(no text)'}`]);
  }
  if (hasAny(text, [label.replace(/^an? /, '')])) {
    return cnd(`${label.charAt(0).toUpperCase() + label.slice(1)} is mentioned on the page, but we could not find a link to one, so this could not be determined.`);
  }
  return notFound(`No link to ${label} was found on the pages we checked.`);
}

// A page that loads and has words on it is NOT proof it is the document we claim.
// A link labeled "privacy policy" pointing at /disclaimer/ loaded fine and read as
// FOUND — a false claim we made after checking only that a page existed. The
// followed page must actually read like the thing before we credit it.
const CONTENT_TERMS: Record<string, { terms: string[]; min: number; noun: string }> = {
  'a privacy policy': {
    terms: ['personal information', 'we collect', 'third part', 'your rights', 'opt out', 'data we', 'cookies'],
    min: 3,
    noun: 'privacy policy',
  },
  'an accessibility statement': {
    terms: ['accessibility', 'wcag', 'disability', 'assistive', 'barrier', 'screen reader'],
    min: 2,
    noun: 'accessibility statement',
  },
};

function countTerms(text: string, terms: string[]) {
  const h = text || '';
  return terms.filter((t) => h.includes(t)).length;
}

// Whenever the link's wording and the URL it resolved to differ, show both. A
// mismatch is exactly the thing the reader needs to see, not something to hide
// behind a tidy "Found at".
function linkDetails(rec: any) {
  const anchor = (rec.anchor_text || '').trim();
  const url = rec.final_url || rec.requested_url || '';
  if (!anchor) return [];
  const slug = anchor.replace(/[^a-z0-9]+/g, '-');
  if (slug && url.toLowerCase().includes(slug)) return [];
  return [`Link text: "${anchor}"`, `Resolved to: ${url}`];
}

function confirmPage(rec: any, apex: string, label: string, absent: any, mainUrl?: string) {
  if (!rec) return { ok: false, check: absent };
  if (!rec.ok || rec.error) {
    return { ok: false, check: cnd(`A link to ${label} was found, but the page could not be loaded, so we could not confirm it.`, [`Link: ${rec.requested_url}`]) };
  }
  // No response object means the navigation itself never completed. The browser
  // may still be sitting on the previous page, so anything we read now could
  // describe the page we came from rather than the one we followed.
  if (!rec.status) {
    return { ok: false, check: cnd(`A link to ${label} was found, but we could not confirm the page finished loading, so we could not confirm it.`, [`Link: ${rec.requested_url}`]) };
  }
  if (rec.status < 200 || rec.status >= 400) {
    return { ok: false, check: cnd(`A link to ${label} was found, but the page returned HTTP ${rec.status}, so we could not confirm it.`, [`Link: ${rec.requested_url}`]) };
  }
  if (mainUrl && rec.final_url === mainUrl) {
    return { ok: false, check: cnd(`A link to ${label} was found, but following it did not leave the page we scanned, so we could not confirm it.`, [`Link: ${rec.requested_url}`]) };
  }
  if (rec.final_url && !sameSite(rec.final_url, apex)) {
    return { ok: false, check: cnd(`A link to ${label} was found, but it led to another domain, so we could not confirm it.`, [`Link: ${rec.requested_url}`, `Led to: ${rec.final_url}`]) };
  }
  // SUBSTANCE IS MEASURED ON MAIN CONTENT, NOT THE WHOLE PAGE. Header, nav, and
  // footer travel with every page on a site and routinely mention privacy,
  // cookies and rights — so whole-page text let boilerplate alone satisfy both
  // tests below and credited a page whose body was empty. A 200 with no
  // substantive content of its own is COULD NOT DETERMINE, never FOUND.
  const content = rec.main_text || '';
  if (content.length < MIN_POLICY_TEXT) {
    return { ok: false, check: cnd(`A link to ${label} was found and the page loaded, but it had almost no content of its own, so we could not confirm it.`, [`Link: ${rec.final_url || rec.requested_url}`]) };
  }
  // Content check: does the page read like the document the link promised?
  const spec = CONTENT_TERMS[label];
  if (spec && countTerms(content, spec.terms) < spec.min) {
    const anchor = (rec.anchor_text || '').trim() || label;
    const url = rec.final_url || rec.requested_url;
    return {
      ok: false,
      check: cnd(
        `A link labeled "${anchor}" pointed to ${url}, but that page doesn't read like a ${spec.noun}. Worth confirming where yours actually lives.`,
      ),
    };
  }
  return { ok: true, check: found(`Found at ${rec.final_url || rec.requested_url}.`, linkDetails(rec)) };
}

// groupA: { trackersPresent, chatbotPresent } — needed for the two combination flags.
// tool:   { vendor, provides: { <check_key>: observation } } — mechanisms a detected
//         privacy tool is known to supply, resolved by the caller.
export function analyzeGroupB({ url, pass1, groupA, tool }: any) {
  const apex = apexOf(url) || '';
  const page = pass1?.page || null;
  const followed = pass1?.followed || [];
  const privacyRec = followed.find((f: any) => f.kind === 'privacy') || null;
  const a11yRec = followed.find((f: any) => f.kind === 'accessibility') || null;

  const pages_visited = [
    { url: page?.url || url, kind: 'scanned page', status: 200 },
    ...followed.map((f: any) => ({
      url: f.final_url || f.requested_url,
      kind: f.kind === 'privacy' ? 'privacy policy' : 'accessibility statement',
      status: f.status ?? null,
    })),
  ];

  // The whole page could not be read → every Group B check is undetermined.
  if (!page) {
    const u = cnd('The page contents could not be read, so this could not be determined.');
    return {
      checks: {
        cookie_consent: u, privacy_policy: u, do_not_sell: u, accessibility_statement: u,
        request_mechanism: u, accessibility_reporting: u, ai_disclosure: u,
      },
      pages_visited,
    };
  }

  const mainText = page.text || '';
  // Consent language is only tested against body text with anchor text removed —
  // a link to a cookie policy is a document, not a consent mechanism.
  const consentHay = page.text_no_links ?? page.text ?? '';
  const mainAnchors = page.anchors || [];
  const privacyText = privacyRec?.ok ? (privacyRec.text || '') : '';
  const privacyAnchors = privacyRec?.ok ? (privacyRec.anchors || []) : [];
  const a11yText = a11yRec?.ok ? (a11yRec.text || '') : '';
  const a11yAnchors = a11yRec?.ok ? (a11yRec.anchors || []) : [];

  // ---- 1. Cookie consent mechanism ----
  const cmpHay = [page.script_hay || '', mainText, (pass1.requests || []).join(' ').toLowerCase()].join(' ');
  const cmp = CMP_MATCHERS.find((m) => cmpHay.includes(m.match));
  let cookie_consent;
  if (cmp) {
    cookie_consent = found(`A consent mechanism was detected (${cmp.vendor}).`);
  } else if (page.banner_text && page.banner_control) {
    cookie_consent = found('A consent mechanism was detected (custom banner).');
  } else if (page.banner_text) {
    cookie_consent = cnd('Consent language appeared in a banner-style element, but no clear accept or decline control could be identified, so this could not be determined.');
  } else if (hasAny(consentHay, PATTERNS.consentText)) {
    cookie_consent = cnd('Cookie or consent language appears on the page, but no consent banner or controls could be identified, so this could not be determined.');
  } else {
    cookie_consent = notFound('No known consent management vendor and no cookie or consent language were found on the page we scanned.');
  }
  // COMBINATION FLAG — an internal inconsistency we observed directly: trackers
  // ran and we found no way for a visitor to decline them. Only on a definite
  // NOT_FOUND; flagging an undetermined result would be a claim we can't support.
  if (groupA?.trackersPresent && cookie_consent.status === STATUS.NOT_FOUND) {
    cookie_consent = {
      ...cookie_consent,
      attention: true,
      observation: 'Tracking scripts loaded on this page, and we did not find a consent mechanism that would let a visitor decline them.',
    };
  }

  // ---- 2. Privacy policy ----
  const privacy_policy = confirmPage(
    privacyRec, apex, 'a privacy policy',
    looseAbsent(mainAnchors, mainText, ['privacy', 'polic', '/legal', 'your data', 'data protection'], 'a privacy policy'),
    page.url,
  ).check;

  // ---- 3. "Do Not Sell or Share" mechanism ----
  let do_not_sell;
  const dnsAnchor = anchorMatch(mainAnchors, PATTERNS.doNotSell) || anchorMatch(privacyAnchors, PATTERNS.doNotSell);
  if (dnsAnchor) {
    do_not_sell = found('A link was found.', [`Link text: ${dnsAnchor.text || '(no text)'}`]);
  } else if (page.cpra_icon) {
    do_not_sell = found('A link was found.', ['Matched the CPRA opt-out icon.']);
  } else if (hasAny(mainText, PATTERNS.doNotSell) || hasAny(privacyText, PATTERNS.doNotSell)) {
    do_not_sell = cnd('Opt-out language appears in the page text, but no link or control we could confirm, so this could not be determined.');
  } else {
    do_not_sell = notFound('No "Do Not Sell or Share" or "Your Privacy Choices" link was found on the pages we checked.');
  }

  // ---- 4. Accessibility statement ----
  const a11yConfirmed = confirmPage(
    a11yRec, apex, 'an accessibility statement',
    looseAbsent(mainAnchors, mainText, ['accessib', 'ada compliance', 'wcag'], 'an accessibility statement'),
    page.url,
  );
  const accessibility_statement = a11yConfirmed.check;

  // ---- 5. Privacy request mechanism ----
  let request_mechanism;
  const reqForm = hasAny(page.form_hay || '', PATTERNS.request) || hasAny(privacyRec?.form_hay || '', PATTERNS.request);
  const reqAnchor = anchorMatch(mainAnchors, PATTERNS.request) || anchorMatch(privacyAnchors, PATTERNS.request);
  const reqMail = mailtoIn(privacyAnchors, ['privacy', 'dpo', 'data', 'legal', 'compliance'])
    || mailtoIn(mainAnchors, ['privacy', 'dpo', 'data rights']);
  // A hosted rights-request portal on the page is direct evidence of a mechanism,
  // whoever supplies it.
  const portalHay = [
    page.script_hay || '',
    [...mainAnchors, ...privacyAnchors].map((a: any) => a.href_l || '').join(' '),
    (pass1.requests || []).join(' ').toLowerCase(),
  ].join(' ');
  const portal = detectDsarPortal(portalHay);
  if (portal) {
    request_mechanism = found(
      portal.vendor
        ? `Found: a privacy request portal provided by ${portal.vendor}.`
        : 'Found: a hosted privacy request portal.',
    );
  } else if (reqForm) {
    request_mechanism = found('Found: a request form.');
  } else if (reqAnchor) {
    request_mechanism = found('Found: a link to a request page.', [`Link text: ${reqAnchor.text || '(no text)'}`]);
  } else if (reqMail) {
    request_mechanism = found(`Found: an email address (${reqMail}).`);
  } else if (privacy_policy.status === STATUS.FOUND) {
    // Default per spec: a policy exists but we couldn't parse a mechanism out of it.
    request_mechanism = cnd('A privacy policy was reachable, but we could not identify a form, link, or address for submitting a request, so this could not be determined.');
  } else if (privacyText) {
    // A page was reachable but we could not confirm it IS a policy — so we must
    // not describe it as one here either.
    request_mechanism = cnd('We could not identify a form, link, or address for submitting a request on the pages we checked, so this could not be determined.');
  } else {
    request_mechanism = notFound('No request form, request page, or privacy contact address was found on the pages we checked.');
  }

  // ---- 6. Accessibility reporting channel ----
  let accessibility_reporting;
  const a11yFormHit = hasAny(a11yRec?.form_hay || '', PATTERNS.a11yReport) || hasAny(page.form_hay || '', PATTERNS.a11yReport);
  const a11yAnchorHit = anchorMatch(a11yAnchors, PATTERNS.a11yReport) || anchorMatch(mainAnchors, PATTERNS.a11yReport);
  const a11yTextHit = hasAny(a11yText, PATTERNS.a11yReport);
  const a11yMail = mailtoIn(a11yAnchors, ['accessib', 'ada', 'barrier']) || mailtoIn(mainAnchors, ['accessib']);
  if (a11yFormHit) {
    accessibility_reporting = found('Found.', ['A form in an accessibility context was identified.']);
  } else if (a11yAnchorHit) {
    accessibility_reporting = found('Found.', [`Link text: ${a11yAnchorHit.text || '(no text)'}`]);
  } else if (a11yMail) {
    accessibility_reporting = found('Found.', [`Contact address: ${a11yMail}`]);
  } else if (a11yTextHit || a11yText || accessibility_statement.status === STATUS.FOUND) {
    // Default per spec — an accessibility page exists but no channel we can confirm.
    accessibility_reporting = cnd('An accessibility page was reachable, but we could not identify a form or contact method for reporting a barrier, so this could not be determined.');
  } else if (mainText.includes('accessib')) {
    accessibility_reporting = cnd('Accessibility language appears on the page, but no reporting channel we could confirm, so this could not be determined.');
  } else {
    accessibility_reporting = notFound('No accessibility reporting form or contact method was found on the pages we checked.');
  }

  // ---- 7. AI disclosure ----
  let ai_disclosure;
  const aiHay = mainText + ' ' + privacyText;
  const strong = firstMatch(aiHay, PATTERNS.aiDisclosureStrong);
  if (strong) {
    ai_disclosure = found('Found.');
  } else if (hasAny(aiHay, PATTERNS.aiAny)) {
    ai_disclosure = cnd('AI or automation is mentioned on the pages we checked, but not clearly as a disclosure to visitors, so this could not be determined.');
  } else {
    ai_disclosure = notFound('No language describing use of AI or automated systems was found on the pages we checked.');
  }
  // COMBINATION FLAG — we saw a chat widget and no disclosure. Applies to both
  // NOT_FOUND and COULD NOT DETERMINE: the inconsistency is that a widget is
  // present and we could not find a statement, which is what the copy says.
  if (groupA?.chatbotPresent && ai_disclosure.status !== STATUS.FOUND) {
    ai_disclosure = {
      ...ai_disclosure,
      attention: true,
      observation: 'A chat widget was detected on this page, and we did not find a statement disclosing that visitors may be interacting with AI.',
    };
  }

  const checks: Record<string, any> = {
    cookie_consent,
    privacy_policy,
    do_not_sell,
    accessibility_statement,
    request_mechanism,
    accessibility_reporting,
    ai_disclosure,
  };

  // A detected privacy tool supplies mechanisms of its own. Where the caller
  // resolved what it serves, that is evidence — so it upgrades an undetermined or
  // absent result and clears any combination flag that was raised for it. It never
  // downgrades something we confirmed on the page ourselves.
  for (const [key, observation] of Object.entries(tool?.provides || {})) {
    if (!checks[key] || checks[key].status === STATUS.FOUND) continue;
    checks[key] = found(observation as string);
  }

  return { checks, pages_visited };
}