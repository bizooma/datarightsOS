import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

  const orgs = await base44.asServiceRole.entities.Organization.filter({ id: site.organization });
  const org = orgs[0] || {};

  const payload = {
    product_name: org.white_label_product_name || 'Privacy & Data Rights Center',
    logo_url: org.brand_logo_url || '',
    primary_color: org.brand_primary_color || '#0d7d74',
    enabled_drawers: site.enabled_drawers || ['cookies', 'privacy_rights'],
    widget_position: site.widget_position || 'bottom-right',
    widget_theme: site.widget_theme || 'dark',
    honor_gpc: site.honor_gpc !== false,
    intro_video_url: site.intro_video_url || '',
    accessibility_statement_url: site.accessibility_statement_url || '',
    privacy_policy_url: site.privacy_policy_url || '',
    policy_version: site.policy_version || '1.0',
  };

  return Response.json(payload, { status: 200, headers: CORS });
});