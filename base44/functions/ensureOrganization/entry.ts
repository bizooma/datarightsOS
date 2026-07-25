import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Ensures the signed-in user has an Organization.
// Order of resolution:
//  1. Already linked to an org -> return it (idempotent).
//  2. A pending invite exists for their email -> link them to THAT org with the
//     invited role, mark the invite consumed. (No new org created.)
//  3. Otherwise -> create a fresh trial org and make them the owner.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Referral attribution captured client-side (first-touch, ?ref= cookie/localStorage).
    let referralSource = '';
    try {
      const body = await req.json();
      referralSource = (body?.referral_source || '').toString().trim().slice(0, 200);
    } catch {
      // No body / not JSON — fine, no referral to attribute.
    }

    // 1. Already has an org — nothing to do.
    if (user.organization) {
      const existing = await base44.asServiceRole.entities.Organization.filter({ id: user.organization });
      if (existing[0]) {
        return Response.json({ created: false, organization: existing[0] });
      }
    }

    // 2. Look for a pending invite matching this user's email.
    const email = (user.email || '').toLowerCase();
    if (email) {
      const invites = await base44.asServiceRole.entities.PendingInvite.filter({
        email,
        consumed: false,
      });
      const invite = invites[0];
      if (invite?.organization) {
        const orgs = await base44.asServiceRole.entities.Organization.filter({ id: invite.organization });
        if (orgs[0]) {
          await base44.asServiceRole.entities.User.update(user.id, {
            organization: invite.organization,
            role: invite.role || 'staff',
          });
          await base44.asServiceRole.entities.PendingInvite.update(invite.id, { consumed: true });
          return Response.json({ created: false, invited: true, organization: orgs[0] });
        }
      }
    }

    // 3. No invite — create a fresh trial organization for this user.
    const now = new Date().toISOString();
    const orgName = user.full_name
      ? `${user.full_name}'s Organization`
      : `${(user.email || 'My').split('@')[0]}'s Organization`;

    const org = await base44.asServiceRole.entities.Organization.create({
      name: orgName,
      plan: 'trial',
      trial_started_at: now,
      billing_status: 'active',
      // Permanent partner attribution — cookie expiry no longer matters once stored here.
      ...(referralSource
        ? { referral_source: referralSource, referral_captured_at: now }
        : {}),
    });

    await base44.asServiceRole.entities.User.update(user.id, {
      organization: org.id,
      role: 'owner',
    });

    return Response.json({ created: true, organization: org });
  } catch (error) {
    console.error('ensureOrganization failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});