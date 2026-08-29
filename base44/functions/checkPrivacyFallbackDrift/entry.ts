// DRIFT ALARM for the bundled privacy policy copy.
//
// /privacy-policy renders a build-time copy of the policy immediately and swaps in
// the published statement when it arrives. That copy cannot update itself, so it
// can quietly fall behind the live document — silent divergence on a legal page.
// This job compares the live statement to the fingerprint of the bundled copy every
// day and emails when they no longer agree. The drift is accepted only because this
// exists; if this job stops running, the drift is unmonitored again.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import {
  FALLBACK_SITE_SLUG,
  FALLBACK_BODY_SHA256,
  FALLBACK_VERSION,
  FALLBACK_EFFECTIVE_DATE,
  normalizeStatementBody,
  sha256Hex,
} from '../../shared/privacyPolicyFallbackMeta.ts';

// Where the alarm goes. The site's privacy contact is used when one is set;
// otherwise the business contact published in the policy itself.
const DEFAULT_ALARM_EMAIL = 'support@bizooma.com';

async function sendAlarm(to: string, subject: string, lines: string[]) {
  const key = secrets.get('RESEND_API_KEY');
  const from = secrets.get('RESEND_FROM_EMAIL');
  if (!key || !from) {
    console.log('[checkPrivacyFallbackDrift] no mail credentials — alarm not sent');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: lines.map((l) => '<p>' + l + '</p>').join(''),
    }),
  });
  if (!res.ok) {
    console.log('[checkPrivacyFallbackDrift] resend HTTP ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 300));
    return false;
  }
  return true;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const sites = await svc.entities.Site.filter({ slug: FALLBACK_SITE_SLUG });
    const site = sites && sites[0];
    if (!site) {
      // The site the bundled copy belongs to is gone or renamed — that is itself a
      // condition worth hearing about, not a silent no-op.
      await sendAlarm(DEFAULT_ALARM_EMAIL, 'Privacy policy drift check could not run', [
        `No site matches the slug <strong>${FALLBACK_SITE_SLUG}</strong>, so the bundled privacy policy copy on /privacy-policy is currently unmonitored.`,
      ]);
      return Response.json({ ok: false, message: 'Site not found.' }, { status: 404 });
    }

    const to = (site.privacy_contact_email || '').trim() || DEFAULT_ALARM_EMAIL;

    const stmts = await svc.entities.LegalStatement.filter({
      site: site.id,
      statement_type: 'privacy_policy',
      is_active: true,
    });
    const stmt = stmts && stmts[0];

    if (!stmt || !stmt.body) {
      await sendAlarm(to, 'ALARM: published privacy policy is missing', [
        'There is no active published privacy policy for datarightsos.com, so <strong>/privacy-policy is serving the bundled copy to every visitor</strong> with no live document behind it.',
        'Publish the statement, or treat the bundled copy as the document of record until you do.',
      ]);
      return Response.json({ ok: true, drift: true, reason: 'no_published_statement' });
    }

    const liveHash = await sha256Hex(normalizeStatementBody(stmt.body));
    const bodyDrift = liveHash !== FALLBACK_BODY_SHA256;
    const versionDrift = String(stmt.version || '') !== FALLBACK_VERSION;
    const dateDrift = String(stmt.effective_date || '') !== FALLBACK_EFFECTIVE_DATE;

    if (!bodyDrift && !versionDrift && !dateDrift) {
      return Response.json({ ok: true, drift: false, checked_at: new Date().toISOString() });
    }

    const what: string[] = [];
    if (bodyDrift) what.push('the policy <strong>text</strong>');
    if (versionDrift) what.push(`the <strong>version</strong> (published ${stmt.version || '—'}, bundled ${FALLBACK_VERSION})`);
    if (dateDrift) what.push(`the <strong>effective date</strong> (published ${stmt.effective_date || '—'}, bundled ${FALLBACK_EFFECTIVE_DATE})`);

    const sent = await sendAlarm(to, 'ALARM: privacy policy fallback has drifted', [
      `The published privacy policy no longer matches the copy bundled into the site, in ${what.join(' and ')}.`,
      'Until they match, a visitor whose browser cannot reach the live statement — and any crawler that snapshots the page before the fetch returns — reads the <strong>older</strong> policy.',
      'To resolve: copy the current statement body into <code>src/components/marketing/privacyPolicyFallback.js</code>, then update the hash, version, and effective date in <code>base44/shared/privacyPolicyFallbackMeta.ts</code>.',
      `Live text fingerprint: <code>${liveHash}</code>`,
    ]);

    console.log('[checkPrivacyFallbackDrift] drift detected, alarm sent=' + sent);
    return Response.json({
      ok: true,
      drift: true,
      body_drift: bodyDrift,
      version_drift: versionDrift,
      date_drift: dateDrift,
      alarm_sent: sent,
      live_hash: liveHash,
    });
  } catch (error) {
    console.log('[checkPrivacyFallbackDrift] error: ' + error.message);
    return Response.json({ ok: false, message: error.message }, { status: 500 });
  }
}