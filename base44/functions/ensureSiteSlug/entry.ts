// Assigns a site's IMMUTABLE public slug, used in its statement URLs.
//
// This lives server-side because uniqueness has to be checked across ALL sites,
// including sites belonging to other organizations that the calling tenant cannot
// read. It is also the guard on immutability: a site that already has a slug gets
// that slug back, never a fresh one — published links must not move.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { slugifyDomain } from '../../shared/statementUrls.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const siteId = String(body.site_id || '').trim();
    if (!siteId) return Response.json({ ok: false, message: 'Missing site_id.' }, { status: 400 });

    const svc = base44.asServiceRole;

    let site;
    try { site = await svc.entities.Site.get(siteId); } catch { site = null; }
    if (!site) return Response.json({ ok: false, message: 'Site not found.' }, { status: 404 });

    // Only the owning organization (or a platform admin) may touch this site.
    const sameOrg = site.organization && user.organization && site.organization === user.organization;
    if (!sameOrg && user.role !== 'admin') {
      return Response.json({ ok: false, message: 'Forbidden' }, { status: 403 });
    }

    // IMMUTABLE: already assigned, so hand back what every published link uses.
    if (site.slug) return Response.json({ ok: true, slug: site.slug, created: false });

    const base = slugifyDomain(site.domain);
    let candidate = base;
    for (let i = 2; i < 60; i++) {
      const taken = await svc.entities.Site.filter({ slug: candidate });
      if (!taken || taken.length === 0) break;
      candidate = base + '-' + i;
    }

    const updated = await svc.entities.Site.update(site.id, { slug: candidate });
    return Response.json({ ok: true, slug: updated.slug || candidate, created: true });
  } catch (error) {
    console.log('[ensureSiteSlug] error: ' + error.message);
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }
}