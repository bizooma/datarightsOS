import { canServeStatements } from '@/lib/planLimits';

// WHY A REASON AND NOT A BOOLEAN: "your pages aren't published" without saying why
// is the same silence in a nicer box. Every notice in the UI renders copy keyed to
// the specific reason, so a subscriber always learns what to change.
//
// This mirrors base44/shared/statementAvailability.ts, which is the authority the
// server actually enforces. Mirrored rather than imported because that module is
// Deno/TS and lives outside src/. Kept deliberately tiny for that reason: if you add
// a precondition there, add it here and give it copy below, or the UI will show a
// blocked state it can't explain.
//
// Returns: null (publishable) | 'plan' | 'business_name'
export function statementBlockReason({ site, org, plan } = {}) {
  const effectivePlan = plan ?? org?.plan;
  if (!canServeStatements(effectivePlan)) return 'plan';
  const businessName = String(site?.business_name || org?.business_name || '').trim();
  if (!businessName) return 'business_name';
  return null;
}

const COPY = {
  business_name: {
    headline: "Your statement pages aren't published",
    body:
      'Add a business name to publish them and turn on the footer links. Statement pages are ' +
      'public and indexable, and they are published under your business name — it appears in the ' +
      'page title, the description search engines show, and the page header. Until it is set, the ' +
      'pages return "not published" rather than going live under a guessed name, and nothing links to them.',
    // Which inline fix to offer. 'business_name' renders the inline field.
    fix: 'business_name',
  },
  plan: {
    headline: "Statement pages aren't included on your plan",
    body:
      'The free plan shows cookie consent only. Your statements stay saved, but they are not ' +
      'published as public pages and the widget does not display them. Upgrading to Notice publishes them.',
    fix: 'upgrade',
  },
};

// An unrecognized reason must still say something true and specific. Silence here
// would recreate the exact failure this whole notice exists to end.
function unknownCopy(reason) {
  return {
    headline: "Your statement pages aren't published",
    body:
      'They are being held back by a requirement this screen does not recognize yet ' +
      `(reason code: ${reason}). Your statements are saved and nothing is lost. Contact support ` +
      'and we will tell you exactly what to change.',
    fix: 'support',
  };
}

export function blockCopyFor(reason) {
  if (!reason) return null;
  return COPY[reason] || unknownCopy(reason);
}