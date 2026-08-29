import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useOrg } from '@/lib/useOrg';
import { orgFilter } from '@/lib/tenantUtils';
import { statementBlockReason } from '@/lib/statementBlockReasons';
import StatementsBlockedNotice from '@/components/statements/StatementsBlockedNotice';

// WHY THIS EXISTS SEPARATELY FROM THE WIDGET STUDIO NOTICE: a subscriber who never
// opens Widget Studio would never see that one. This is the case worth interrupting
// someone over — they WROTE the statements and got nothing for it.
//
// Deliberately narrow: it only appears when statements exist AND are blocked. A
// subscriber who hasn't written anything yet is not missing anything and is not nagged.
export default function StatementsBlockedBanner() {
  const { org, orgId } = useOrg();
  const [dismissed, setDismissed] = useState(false);

  const { data: sites = [] } = useQuery({
    queryKey: ['sites', orgId],
    queryFn: () => (orgId ? base44.entities.Site.filter(orgFilter(orgId)) : []),
    enabled: !!orgId,
  });

  const { data: statements = [] } = useQuery({
    queryKey: ['legalStatements', 'org', orgId],
    queryFn: () => (orgId ? base44.entities.LegalStatement.filter({ organization: orgId, is_active: true }) : []),
    enabled: !!orgId,
  });

  if (!org || !orgId) return null;

  // Sites that have real written statements AND can't publish them.
  const written = new Set(statements.filter((s) => s.body).map((s) => s.site));
  const affected = sites
    .filter((s) => written.has(s.id))
    .map((s) => ({ site: s, reason: statementBlockReason({ site: s, org }) }))
    .filter((x) => x.reason);

  if (affected.length === 0) return null;

  // Keyed by reason so a NEW reason surfaces again rather than inheriting an old
  // dismissal. Browser-scoped, which is acceptable for a notice but not a receipt —
  // the underlying state stays visible in Widget Studio regardless.
  const reason = affected[0].reason;
  const key = `drs_stmt_blocked_dismissed_${orgId}_${reason}`;
  let stored = false;
  try { stored = window.localStorage.getItem(key) === '1'; } catch { /* private mode */ }
  if (dismissed || stored) return null;

  const domains = affected.map((a) => a.site.domain);

  const hide = () => {
    try { window.localStorage.setItem(key, '1'); } catch { /* private mode */ }
    setDismissed(true);
  };

  return (
    <div className="relative mb-6">
      <StatementsBlockedNotice reason={reason} orgId={orgId}>
        <p className="mt-2">
          You've written statements for{' '}
          <span className="font-medium">{domains.join(', ')}</span>, so this is the only thing
          standing between them and being live.{' '}
          <Link to="/widget-studio" className="font-semibold underline hover:text-amber-700">
            Review in Widget Studio
          </Link>
        </p>
      </StatementsBlockedNotice>
      <button
        onClick={hide}
        className="absolute top-2 right-2 p-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss this notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}