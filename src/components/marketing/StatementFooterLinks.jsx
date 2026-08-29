import { statementUrl, STATEMENT_TYPES, STATEMENT_LABELS } from '@/lib/statementUrls';

// Our own statements, linked the same way we tell subscribers to link theirs:
// plain anchors to the static statement pages. These are real HTML documents that
// a crawler or scanner can read without running JavaScript — unlike the in-app
// /privacy-policy route beside them, which renders client-side.
const OUR_SLUG = 'datarightsos-com';

export default function StatementFooterLinks() {
  return (
    <nav aria-label="Legal statements" className="flex flex-wrap gap-x-7 gap-y-2">
      {STATEMENT_TYPES.map((type) => (
        <a
          key={type}
          href={statementUrl(OUR_SLUG, type)}
          className="text-slate-200 hover:text-white text-sm transition-colors"
        >
          {STATEMENT_LABELS[type]}
        </a>
      ))}
    </nav>
  );
}