// PUBLIC statement pages — real, crawlable HTML with the statement text in the
// response body. No JavaScript required to read a word of it.
//
// WHY THIS IS A FUNCTION AND NOT A PAGE: an SPA route returns the app shell with an
// empty body and fills it in client-side, so a crawler or scanner that doesn't run
// JS sees nothing. That is the exact failure this endpoint exists to fix, so the
// HTML is assembled here and sent complete.
//
// URL: /functions/statement?site=<slug|site_key>&type=<privacy-policy|…>[&lang=es]
// site_key is accepted as a fallback lookup so any URL already published keeps
// resolving even after slugs were introduced.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { canServeStatementPages } from '../../shared/planLimits.ts';
import { publishedBusinessName } from '../../shared/statementAvailability.ts';
import {
  SLUG_TO_TYPE,
  STATEMENT_LABELS,
  STATEMENT_LABELS_ES,
  statementUrl,
} from '../../shared/statementUrls.ts';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Plain-text summary for the meta description, taken from the statement body.
function metaDescription(bodyHtml, fallback) {
  const text = String(bodyHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  return text.length > 155 ? text.slice(0, 152).replace(/\s+\S*$/, '') + '…' : text;
}

const PAGE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#f4f6f8;color:#14202b;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:40px 22px 64px}
header{border-bottom:1px solid #dfe5ea;padding-bottom:18px;margin-bottom:26px}
.biz{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5d6f7d;margin:0 0 6px}
h1{font-size:28px;line-height:1.25;margin:0 0 10px}
.meta{font-size:13px;color:#5d6f7d;margin:0}
main{background:#fff;border:1px solid #e3e8ec;border-radius:12px;padding:26px 28px}
main h1,main h2,main h3{line-height:1.3;margin:22px 0 8px}
main h1{font-size:22px}main h2{font-size:19px}main h3{font-size:16px}
main p{margin:0 0 12px}
main ul,main ol{padding-left:22px;margin:0 0 12px}
main li{margin-bottom:5px}
main a{color:#0d7d74}
main table{border-collapse:collapse;width:100%;margin:0 0 14px}
main td,main th{border:1px solid #e3e8ec;padding:7px 9px;text-align:left;font-size:14px}
.langs{margin:20px 0 0;font-size:13px}
.langs a{color:#0d7d74}
footer{margin-top:26px;font-size:12px;color:#5d6f7d}
footer a{color:#5d6f7d}
@media (max-width:600px){.wrap{padding:26px 16px 48px}h1{font-size:23px}main{padding:20px 18px}}
`;

// A statement type that the site may ALSO publish as a page on its own website.
// When it does, that page is the real document and this one defers to it.
const OWN_PAGE_FIELD = {
  privacy_policy: 'privacy_policy_url',
  accessibility_statement: 'accessibility_statement_url',
};

function page({ lang, title, description, canonical, selfUrl, altUrl, altLabel, businessName, heading, version, effectiveDate, bodyHtml, showBadge }) {
  const metaBits = [];
  if (version) metaBits.push((lang === 'es' ? 'Versión ' : 'Version ') + esc(version));
  if (effectiveDate) metaBits.push((lang === 'es' ? 'Vigente desde ' : 'Effective ') + esc(effectiveDate));

  return `<!DOCTYPE html>
<html lang="${lang === 'es' ? 'es' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${esc(canonical)}">
${altUrl ? `<link rel="alternate" hreflang="${lang === 'es' ? 'en' : 'es'}" href="${esc(altUrl)}">\n<link rel="alternate" hreflang="${lang === 'es' ? 'es' : 'en'}" href="${esc(selfUrl)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(selfUrl)}">
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="wrap">
<header>
<p class="biz">${esc(businessName)}</p>
<h1>${esc(heading)}</h1>
${metaBits.length ? `<p class="meta">${metaBits.join(' &middot; ')}</p>` : ''}
</header>
<main>
${bodyHtml || ''}
</main>
${altUrl ? `<p class="langs"><a href="${esc(altUrl)}">${esc(altLabel)}</a></p>` : ''}
${showBadge ? `<footer>Published with <a href="https://datarightsos.com" rel="noopener">DataRightsOS</a></footer>` : ''}
</div>
</body>
</html>`;
}

function notFound(message) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Statement not found</title>
<meta name="robots" content="noindex">
<style>${PAGE_CSS}</style>
</head>
<body><div class="wrap"><header><h1>Statement not found</h1><p class="meta">${esc(message)}</p></header></div></body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default async function (req) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const siteParam = (url.searchParams.get('site') || '').trim();
    const typeParam = (url.searchParams.get('type') || '').trim().toLowerCase();
    const lang = url.searchParams.get('lang') === 'es' ? 'es' : 'en';

    const type = SLUG_TO_TYPE[typeParam];
    if (!siteParam || !type) {
      return notFound('This link is missing a site or statement type.');
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // Slug first, then site_key — so URLs published before slugs existed still work.
    let sites = await svc.entities.Site.filter({ slug: siteParam });
    if (!sites || sites.length === 0) {
      sites = await svc.entities.Site.filter({ site_key: siteParam });
    }
    const site = sites && sites[0];
    if (!site) return notFound('No site matches this link.');

    const orgs = await svc.entities.Organization.filter({ id: site.organization });
    const org = orgs[0] || {};

    // EVERY plan serves published statement pages, permanently — including Free,
    // including an expired trial. This gate is intentionally always-true and is kept
    // as a named call rather than deleted, so the decision is visible here.
    //
    // These are the customer's live legal pages: indexed, linked from their footer,
    // cited as their privacy policy. 404ing them because a subscription lapsed would
    // damage a real business over billing and leave them less compliant than before
    // they met us. What Free loses is CREATING and EDITING statements, plus the
    // in-widget statement modal — never the pages already published.
    if (!canServeStatementPages(org.plan)) {
      return notFound('This site does not publish statements.');
    }

    const statements = await svc.entities.LegalStatement.filter({
      site: site.id,
      statement_type: type,
      is_active: true,
    });
    const stmt = statements && statements[0];
    if (!stmt || !stmt.body) return notFound('This statement has not been published yet.');

    const wantEs = lang === 'es';
    const hasEs = !!(stmt.body_es && String(stmt.body_es).trim());
    // Spanish is only served when Spanish text actually exists; otherwise the
    // English text is served rather than an empty page claiming to be Spanish.
    const serveEs = wantEs && hasEs;
    const effLang = serveEs ? 'es' : 'en';

    const labels = effLang === 'es' ? STATEMENT_LABELS_ES : STATEMENT_LABELS;
    const heading = (serveEs && stmt.title_es) ? stmt.title_es : (stmt.title || labels[type]);
    const bodyHtml = serveEs ? stmt.body_es : stmt.body;
    // A business name is REQUIRED to publish. There used to be a fallback chain down
    // to org.name, and org.name is auto-generated at signup as "<Person>'s Organization"
    // — so the fallback quietly published a named individual in the <title>, the meta
    // description, and the page header of an index,follow page carrying that business's
    // privacy policy. No fallback is acceptable here: withholding the page is recoverable,
    // an indexed page naming the wrong party is not.
    // Shared with widgetConfig via statementAvailability, so the rule that decides
    // whether this page publishes is the same rule that decides whether anything
    // links to it. They must never drift again.
    const businessName = publishedBusinessName(site, org);
    if (!businessName) {
      return notFound(
        'This statement is not published yet: the site owner has not set the business name it should be published under.',
      );
    }

    // selfUrl always points at the language actually being served, so the English
    // and Spanish pages never compete for the same URL.
    const slugForUrl = site.slug || site.site_key;
    const selfUrl = statementUrl(slugForUrl, type, effLang === 'es' ? 'es' : undefined);
    const altUrl = hasEs ? statementUrl(slugForUrl, type, effLang === 'es' ? undefined : 'es') : '';
    const altLabel = effLang === 'es' ? 'View in English' : 'Ver en español';

    // CANONICAL: whoever owns the real document gets it. A site with its own
    // branded page for this statement type already has that URL known and linked,
    // so this page defers to it and exists for availability — non-JS fetchers,
    // scanners, and anything that needs the text in the response body. A site with
    // no page of its own has nothing to defer to, so this page IS the document and
    // is canonical to itself. Spanish never defers: an own-page URL is one page in
    // one language, so pointing the Spanish version at it would be wrong.
    const ownPageField = OWN_PAGE_FIELD[type];
    const ownPage = ownPageField ? String(site[ownPageField] || '').trim() : '';
    const canonical = (effLang === 'en' && /^https?:\/\//i.test(ownPage)) ? ownPage : selfUrl;

    // JSON mode: lets our own branded page render this exact body, so one document
    // is served at both URLs and neither can be edited independently.
    if ((url.searchParams.get('format') || '').toLowerCase() === 'json') {
      return Response.json(
        {
          ok: true,
          type,
          lang: effLang,
          heading,
          body: bodyHtml,
          version: stmt.version || '',
          effective_date: stmt.effective_date || '',
          business_name: businessName,
          canonical,
          statement_url: selfUrl,
        },
        { headers: { 'Cache-Control': 'public, max-age=300' } },
      );
    }

    const showBadge = !(org.plan === 'agency' && site.hide_branding === true);

    const html = page({
      lang: effLang,
      title: heading + ' · ' + businessName,
      description: metaDescription(bodyHtml, heading + ' for ' + businessName + '.'),
      canonical,
      selfUrl,
      altUrl,
      altLabel,
      businessName,
      heading,
      version: stmt.version,
      effectiveDate: stmt.effective_date,
      bodyHtml,
      showBadge,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Short cache: statements change rarely, but an edit should go live quickly.
        'Cache-Control': 'public, max-age=300',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error) {
    console.log('[statement] error: ' + error.message);
    return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title></head><body><p>This statement could not be loaded.</p></body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}