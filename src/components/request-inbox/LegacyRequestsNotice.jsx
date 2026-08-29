import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

// Shown when a plan without request intake still has requests that were accepted
// while it did (typically after a trial rolled onto Free).
//
// These requests stay FULLY actionable — not read-only. We accepted them and started
// the 45-day statutory clock, so blocking the remedy would leave a real consumer
// without their right and the subscriber in breach of a deadline we set running.
// What stops is NEW intake: the widget no longer shows the request card.
export default function LegacyRequestsNotice({ count }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-xs text-blue-900 leading-relaxed">
        <p className="text-sm font-semibold mb-1">
          {count === 1 ? 'Your open request stays fully manageable' : `Your ${count} existing requests stay fully manageable`}
        </p>
        <p>
          Your plan no longer accepts new privacy requests — the request card is gone from your
          widget. The requests you already received keep everything they had: verification,
          the 45-day deadline clock, fulfillment steps, reminder emails, and the audit trail.
          You can work them through to completion.{' '}
          <Link to="/settings?tab=billing" className="font-semibold underline hover:text-blue-700">
            Upgrade
          </Link>{' '}
          to start accepting new ones again.
        </p>
      </div>
    </div>
  );
}