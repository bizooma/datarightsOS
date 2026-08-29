import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileWarning } from 'lucide-react';
import { PUBLIC_BASE } from '@/lib/statementUrls';

// A site can end up hosting the same legal document twice: once as a published
// statement here, and once at a URL on its own site entered in the config. Two
// independently-edited copies of one legal document means whichever is found
// first may be the stale one, so it is surfaced rather than silently hosted.
const PAIRS = [
  { urlField: 'privacy_policy_url', type: 'privacy_policy', label: 'Privacy policy' },
  { urlField: 'accessibility_statement_url', type: 'accessibility_statement', label: 'Accessibility statement' },
];

export default function DuplicateDocumentWarning({ site }) {
  const { data: statements = [] } = useQuery({
    queryKey: ['legal-statements', site?.id],
    queryFn: () => base44.entities.LegalStatement.filter({ site: site.id, is_active: true }),
    enabled: !!site?.id,
  });

  const conflicts = PAIRS.filter((p) => {
    const own = String(site?.[p.urlField] || '').trim();
    if (!own) return false;
    // A URL on our own domain is a page that renders FROM the statement body, so it
    // is the same document and cannot drift. Only an external page is hand-maintained.
    if (own.startsWith(PUBLIC_BASE)) return false;
    return statements.some((s) => s.statement_type === p.type && String(s.body || '').trim());
  });
  if (!conflicts.length) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
      <FileWarning className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-sm mb-1">
          {conflicts.length === 1 ? 'This document exists in two places' : 'These documents exist in two places'}
        </p>
        <p>
          For {conflicts.map((c) => c.label.toLowerCase()).join(' and ')}, you have both a published
          statement here and a URL pointing at a copy on your own site. Both are live, and they are
          edited separately — so updating one leaves the other stale, and a visitor or regulator may
          read whichever they find first.
        </p>
        <p className="mt-2">
          Because you have your own page, search engines are pointed at it as the real
          document and this statement page serves as a plain-HTML backup. That only holds up
          if the two say the same thing — so either keep them in step deliberately, or clear
          the URL{conflicts.length > 1 ? 's' : ''} below and publish here only.
        </p>
      </div>
    </div>
  );
}