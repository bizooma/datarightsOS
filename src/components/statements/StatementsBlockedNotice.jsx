import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { blockCopyFor } from '@/lib/statementBlockReasons';
import BusinessNameField from '@/components/statements/BusinessNameField';

// One notice body, rendered from the REASON — used by both the Widget Studio
// placement and the dashboard banner so the two can never say different things
// about the same state.
export default function StatementsBlockedNotice({ reason, orgId, domain, children }) {
  const copy = blockCopyFor(reason);
  if (!copy) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-sm mb-1">{copy.headline}</p>
        <p>
          {domain && <><span className="font-medium">{domain}</span> — </>}
          {copy.body}
        </p>

        {copy.fix === 'business_name' && orgId && <BusinessNameField orgId={orgId} />}

        {copy.fix === 'upgrade' && (
          <p className="mt-2">
            <Link to="/settings?tab=plan" className="font-semibold underline hover:text-amber-700">
              See plans
            </Link>
          </p>
        )}

        {copy.fix === 'support' && (
          <p className="mt-2">
            <Link to="/support" className="font-semibold underline hover:text-amber-700">
              Contact support
            </Link>
          </p>
        )}

        {children}
      </div>
    </div>
  );
}