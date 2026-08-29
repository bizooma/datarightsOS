import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { canServeStatements, canServeStatementPages, canShowRequestCard, canCustomLauncher } from '../../shared/planLimits.ts';
import { markInstalled } from '../../shared/serviceStatus.ts';
import { statementUrl, privacyChoicesUrl } from '../../shared/statementUrls.ts';
import { canServeStatementPage, canPublishStatementPages, publishedBusinessName } from '../../shared/statementAvailability.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store, max-age=0',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  const url = new URL(req.url);
  const siteKey = url.searchParams.get('site');
  if (!siteKey) return Response.json({ error: 'missing site' }, { status: 400, headers: CORS });

  const base44 = createClientFromRequest(req);

  const sites = await base44.asServiceRole.entities.Site.filter({ site_key: siteKey });
  if (!sites || sites.length === 0) return Response.json({ error: 'not found' }, { status: 404, headers: CORS });
  const site = sites[0];

  const [orgs, statements] = await Promise.all([
    base44.asServiceRole.entities.Organization.filter({ id: site.organization }),
    base44.asServiceRole.entities.LegalStatement.filter({ site: site.id, is_active: true }),
  ]);
  const org = orgs[0] || {};

  // Install detection ONLY — one-way never_installed -> installed, informational.
  //
  // THIS IS A PUBLIC GET and site_key is visible in the page source of every site
  // running the widget, so anything this endpoint can write, anyone can trigger.
  // That is acceptable for install_status (worst case: "somebody fetched the
  // config") and unacceptable for entitlement. This endpoint previously wrote the
  // single combined status column, which meant a crawler — or the customer's own
  // next page view — silently restored service to an expired trial and made the
  // suspension gate unfireable. service_status is NOT written here, ever.
  await markInstalled(base44.asServiceRole, site);

  // Only the Agency (white-label) plan can remove the "Powered by DataRightsOS" badge.
  // Core and Proof always show it, regardless of the site's hide_branding flag.
  const canHideBadge = org.plan === 'agency';
  const showBadge = !(canHideBadge && site.hide_branding === true);

  // FREE plan: the widget shows the cookie consent experience ONLY. Force the
  // enabled drawers down to cookies, and serve no legal statements. The consent
  // engine (GPC enforcement, default-deny, script gating) is identical to paid
  // plans — only the extra drawers/statements are withheld. This is enforced
  // server-side so a stale/tampered client config can't re-enable gated drawers.
  const servesStatements = canServeStatements(org.plan);
  const showsRequestCard = canShowRequestCard(org.plan);

  let enabledDrawers = site.enabled_drawers || ['cookies', 'privacy_rights'];
  if (!servesStatements) {
    enabledDrawers = ['cookies'];
  } else if (!showsRequestCard) {
    enabledDrawers = enabledDrawers.filter((d) => d !== 'privacy_rights');
  }

  const getStatement = (type) => (servesStatements ? statements.find(s => s.statement_type === type) : null);
  const privacyStmt = getStatement('privacy_policy');
  const cookieStmt = getStatement('cookie_policy');
  const a11yStmt = getStatement('accessibility_statement');
  const aiStmt = getStatement('ai_use_statement');

  // Custom launcher branding: Core+ only (plan-gated server-side). The label is
  // REQUIRED — a blank/missing label falls back to the default so the launcher
  // is NEVER unlabeled; an unlabeled image makes the privacy path unfindable.
  const customLauncher = canCustomLauncher(org.plan) && site.launcher_style === 'custom' && !!site.launcher_image_url;

  // Public, crawlable URL per published statement. Built here (not in the widget)
  // so the widget never has to know the URL shape. site_key is the fallback for
  // sites that predate slugs, and is a valid lookup on the statement endpoint.
  //
  // NEVER PUBLISH A URL THE STATEMENT ENDPOINT WOULD REFUSE. A URL only appears
  // here when canServeStatementPage says that exact page returns 200 — the same
  // rule the endpoint itself applies, imported rather than restated. Having a
  // LegalStatement record is NOT sufficient: the endpoint also requires a business
  // name to publish under, and gating on the record alone is precisely what put
  // four links to 404s in a live customer's footer. A URL absent from this map is
  // a link the widget cannot render anywhere — footer, drawer, or elsewhere.
  // NOTE: statement PAGES are gated on canServeStatementPages (always true), not on
  // canServeStatements (false for Free). A downgraded customer keeps their published
  // legal pages and the footer links to them; what they lose is the ability to edit
  // them, plus the in-widget statement modal below.
  const slugForUrl = site.slug || site.site_key;
  const pagesServable = canServeStatementPages(org.plan);
  const statementUrls = {};
  const servable = (statement) => canServeStatementPage({ site, org, statement, servesStatements: pagesServable });
  if (servable(privacyStmt)) statementUrls.privacy_policy = statementUrl(slugForUrl, 'privacy_policy');
  if (servable(cookieStmt)) statementUrls.cookie_policy = statementUrl(slugForUrl, 'cookie_policy');
  if (servable(a11yStmt)) statementUrls.accessibility_statement = statementUrl(slugForUrl, 'accessibility_statement');
  if (servable(aiStmt)) statementUrls.ai_use_statement = statementUrl(slugForUrl, 'ai_use_statement');

  // Surfaced so Widget Studio can tell the subscriber WHY their statement links
  // aren't appearing. Without this the failure is silent: they wrote the
  // statements, the pages exist, and nothing links to them.
  const statementPagesBlocked = !canPublishStatementPages({ site, org, servesStatements: pagesServable })
    && (!!privacyStmt || !!cookieStmt || !!a11yStmt || !!aiStmt);

  // Footer-link injection defaults ON everywhere EXCEPT Agency: an Agency subscriber
  // pays to remove our branding, and a datarightsos.com link in their client's footer
  // would undo exactly that. Unset (null) means "use the plan default"; an explicit
  // true/false from the subscriber always wins.
  const isAgency = org.plan === 'agency';
  const injectDefault = !isAgency;
  const injectFooterLinks = (site.inject_footer_links === true || site.inject_footer_links === false)
    ? site.inject_footer_links
    : injectDefault;

  // "Your Privacy Choices" — an opt-out MECHANISM, not hosted content, so it defaults ON
  // for EVERY plan, Agency included. That is deliberately inconsistent with the statement
  // links above: statements are optional content whose link would put our name in an
  // Agency client's footer, but a visitor's route to an opt-out is not optional, and
  // Agency answers the branding concern by rewriting this path onto their own domain (the
  // same rewrite they already use for statements). An explicit choice always wins.
  const injectPrivacyChoicesPref = (site.inject_privacy_choices_link === true || site.inject_privacy_choices_link === false)
    ? site.inject_privacy_choices_link
    : true;

  // NEVER INJECT A LINK TO A MECHANISM THAT CANNOT WORK. On the Free plan the intake
  // endpoint refuses to record requests, so the page's only working path is the contact
  // email. Where that email exists, routing to it is a legitimate opt-out mechanism and
  // the link stays. Where it doesn't, there is no mechanism to point at — a footer link
  // to a dead end is worse than no link, specifically for the visitor, who would walk
  // away believing they opted out. This gate is a hard override: an explicit subscriber
  // "on" cannot resurrect a link that leads nowhere.
  const privacyContactEmail = site.privacy_contact_email || org.privacy_contact_email || '';
  const choicesMechanismWorks = canShowRequestCard(org.plan) || !!privacyContactEmail;
  const injectPrivacyChoices = injectPrivacyChoicesPref && choicesMechanismWorks;

  const payload = {
    statement_urls: statementUrls,
    // Injection can only ever put up links that are known-servable, because
    // statementUrls now contains nothing else.
    inject_footer_links: injectFooterLinks && Object.keys(statementUrls).length > 0,
    statement_pages_blocked: statementPagesBlocked,
    statement_pages_blocked_reason: statementPagesBlocked ? 'business_name' : '',
    // Always published: the page works for any site, with or without statements.
    privacy_choices_url: privacyChoicesUrl(slugForUrl),
    inject_privacy_choices_link: injectPrivacyChoices,
    product_name: site.brand_product_name || org.white_label_product_name || 'Privacy & Data Rights Center',
    logo_url: site.brand_logo_url || org.brand_logo_url || 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/b5c7df386_vault.png',
    primary_color: site.brand_primary_color || org.brand_primary_color || '#0d7d74',
    enabled_drawers: enabledDrawers,
    widget_position: site.widget_position || 'bottom-right',
    widget_layout: site.widget_layout === 'bar' ? 'bar' : 'floating',
    launcher_position: site.launcher_position || 'bottom-right',
    launcher_offset_bottom: Number(site.launcher_offset_bottom) || 0,
    launcher_offset_bottom_mobile: (site.launcher_offset_bottom_mobile === null || site.launcher_offset_bottom_mobile === undefined || site.launcher_offset_bottom_mobile === '') ? null : Number(site.launcher_offset_bottom_mobile),
    launcher_style: customLauncher ? 'custom' : 'pill',
    launcher_image_url: customLauncher ? site.launcher_image_url : '',
    launcher_label: (typeof site.launcher_label === 'string' && site.launcher_label.trim()) ? site.launcher_label.trim() : 'Privacy & Data Rights',
    // THE RENDER GATE. widgetJs refuses to render when this is not 'active'.
    // Read-only here — see the markInstalled comment above.
    service_status: site.service_status || 'active',
    // Informational, echoed for the dashboard/debugging. Never gate on it.
    install_status: site.install_status || 'never_installed',
    widget_theme: site.widget_theme || 'dark',
    default_open: site.default_open !== false,
    honor_gpc: site.honor_gpc !== false,
    show_badge: showBadge,
    intro_video_url: site.intro_video_url || '',
    accessibility_statement_url: site.accessibility_statement_url || '',
    privacy_policy_url: site.privacy_policy_url || '',
    policy_version: site.policy_version || '1.0',
    statements: {
      privacy_policy: privacyStmt ? { title: privacyStmt.title, body: privacyStmt.body, title_es: privacyStmt.title_es || '', body_es: privacyStmt.body_es || '', version: privacyStmt.version, effective_date: privacyStmt.effective_date } : null,
      cookie_policy: cookieStmt ? { title: cookieStmt.title, body: cookieStmt.body, title_es: cookieStmt.title_es || '', body_es: cookieStmt.body_es || '', version: cookieStmt.version, effective_date: cookieStmt.effective_date } : null,
      accessibility_statement: a11yStmt ? { title: a11yStmt.title, body: a11yStmt.body, title_es: a11yStmt.title_es || '', body_es: a11yStmt.body_es || '', version: a11yStmt.version, effective_date: a11yStmt.effective_date } : null,
      ai_use_statement: aiStmt ? { title: aiStmt.title, body: aiStmt.body, title_es: aiStmt.title_es || '', body_es: aiStmt.body_es || '', version: aiStmt.version, effective_date: aiStmt.effective_date } : null,
    },
  };

  return Response.json(payload, { status: 200, headers: CORS });
});