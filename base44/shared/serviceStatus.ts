// The ONLY way Site.service_status may change, and the only way install_status
// gets set. Both writes live here so the audit trail cannot be forgotten at a
// call site.
//
// WHY TWO FIELDS: install_status and service_status used to be one column doing
// two unrelated jobs — "has the widget ever loaded" and "are we entitled to serve
// this site" — and widgetConfig, a PUBLIC GET keyed on a site_key visible in any
// page's source, wrote it. So the daily job would suspend an expired trial and the
// customer's very next page view would silently restore it: the entitlement gate
// could never fire, because the only thing that read it reset it first.
//
// Now:
//   install_status  — informational. never_installed -> installed, ONE WAY.
//                     May be set by public endpoints. Being wrong here means
//                     "somebody fetched the config", which is harmless.
//   service_status  — entitlement. Written ONLY by checkSubscriptionStatus, the
//                     Stripe webhook, and the super-admin control. Every change
//                     is audited. NEVER writable by a public endpoint.
//
// This also removes a deadlock that a naive fix would create: if rendering
// required install_status === installed, and marking installed required the
// widget to render, a genuine first install could never start. Rendering gates on
// entitlement; install detection is one-way and never gates anything.

/**
 * Change service_status and record the transition. No-op (returns false) when the
 * value already matches, so callers can be re-run safely and the trail contains
 * real transitions only — not one row per cron tick.
 */
export async function applyServiceStatus(
  svc: any,
  { site, next, actor, reason }: { site: any; next: 'active' | 'suspended'; actor: string; reason: string },
): Promise<boolean> {
  const current = site.service_status || 'active';
  if (current === next) return false;

  await svc.entities.Site.update(site.id, { service_status: next });
  await svc.entities.ServiceStatusEvent.create({
    site: site.id,
    organization: site.organization,
    old_value: current,
    new_value: next,
    actor,
    reason,
    changed_at: new Date().toISOString(),
  });
  return true;
}

/**
 * One-way install detection: never_installed -> installed, never the reverse, and
 * never any other field. Safe to call from a public endpoint precisely because
 * nothing gates on the result.
 */
export async function markInstalled(svc: any, site: any): Promise<boolean> {
  if (site.install_status === 'installed') return false;
  try {
    await svc.entities.Site.update(site.id, { install_status: 'installed' });
    site.install_status = 'installed';
    return true;
  } catch (err) {
    // Never break a config/event response over an informational flag.
    console.error('[serviceStatus] markInstalled failed for site', site.id, (err as Error).message);
    return false;
  }
}

/**
 * Records WHERE the widget was loaded from (script host + page URL). Informational,
 * exactly like install_status, and for the same reason safe to call from a public
 * endpoint: nothing gates on it, and both inputs are client-supplied (the script
 * reports its own src; Referer is forgeable).
 *
 * Writes ONLY when a value actually changed, so a site with traffic does not
 * generate one update per page view — the tradeoff is that install_source_seen_at
 * is the last CHANGE, not the last fetch.
 */
export async function recordInstallSource(
  svc: any,
  site: any,
  { scriptHost, pageUrl }: { scriptHost: string; pageUrl: string },
): Promise<boolean> {
  const host = (scriptHost || '').slice(0, 200);
  const page = (pageUrl || '').slice(0, 500);
  if (!host && !page) return false;
  const patch: Record<string, string> = {};
  if (host && host !== site.install_script_host) patch.install_script_host = host;
  if (page && page !== site.install_page_url) patch.install_page_url = page;
  if (!Object.keys(patch).length) return false;
  patch.install_source_seen_at = new Date().toISOString();
  try {
    await svc.entities.Site.update(site.id, patch);
    Object.assign(site, patch);
    return true;
  } catch (err) {
    // Never break a config response over an informational field.
    console.error('[serviceStatus] recordInstallSource failed for site', site.id, (err as Error).message);
    return false;
  }
}

/** True when we are entitled to serve this site. The ONLY render gate. */
export function isServiceActive(site: any): boolean {
  return (site?.service_status || 'active') === 'active';
}