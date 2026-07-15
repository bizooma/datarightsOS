import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Ensures the signed-in user has an Organization. If they don't, creates one on
// the free trial plan, links it to the user, and makes them the owner.
// Idempotent: returns the existing org if one is already linked.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Already has an org — nothing to do.
    if (user.organization) {
      const existing = await base44.asServiceRole.entities.Organization.filter({ id: user.organization });
      if (existing[0]) {
        return Response.json({ created: false, organization: existing[0] });
      }
    }

    // Create a fresh trial organization for this user.
    const now = new Date().toISOString();
    const orgName = user.full_name
      ? `${user.full_name}'s Organization`
      : `${(user.email || 'My').split('@')[0]}'s Organization`;

    const org = await base44.asServiceRole.entities.Organization.create({
      name: orgName,
      plan: 'trial',
      trial_started_at: now,
      billing_status: 'active',
    });

    // Link the org to the user and make them the owner.
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