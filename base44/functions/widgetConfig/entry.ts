import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { canServeStatements, canShowRequestCard, canCustomLauncher } from '../../shared/planLimits.ts';
import { statementUrl } from '../../shared/statementUrls.ts';

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

  // Auto-activate: the first time the widget successfully loads on a site,
  // flip its install status from pending to active.
  if (site.install_status !== 'active') {
    try {
      await base44.asServiceRole.entities.Site.update(site.id, { install_status: 'active' });
      site.install_status = 'active';
    } catch (err) {
      console.error('Failed to auto-activate site', site.id, err);
    }
  }

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
  const slugForUrl = site.slug || site.site_key;
  const statementUrls = {};
  if (privacyStmt) statementUrls.privacy_policy = statementUrl(slugForUrl, 'privacy_policy');
  if (cookieStmt) statementUrls.cookie_policy = statementUrl(slugForUrl, 'cookie_policy');
  if (a11yStmt) statementUrls.accessibility_statement = statementUrl(slugForUrl, 'accessibility_statement');
  if (aiStmt) statementUrls.ai_use_statement = statementUrl(slugForUrl, 'ai_use_statement');

  // Footer-link injection defaults ON everywhere EXCEPT Agency: an Agency subscriber
  // pays to remove our branding, and a datarightsos.com link in their client's footer
  // would undo exactly that. Unset (null) means "use the plan default"; an explicit
  // true/false from the subscriber always wins.
  const isAgency = org.plan === 'agency';
  const injectDefault = !isAgency;
  const injectFooterLinks = (site.inject_footer_links === true || site.inject_footer_links === false)
    ? site.inject_footer_links
    : injectDefault;

  const payload = {
    statement_urls: statementUrls,
    inject_footer_links: injectFooterLinks && Object.keys(statementUrls).length > 0,
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
    install_status: site.install_status || 'active',
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