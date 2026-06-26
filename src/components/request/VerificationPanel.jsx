import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { ShieldCheck, ShieldX, Loader2, MailCheck, Clock } from 'lucide-react';
import { formatStatus } from '@/lib/tenantUtils';
import { format } from 'date-fns';

export default function VerificationPanel({ request, onMarkVerified, onRejectRequest }) {
  const [loading, setLoading] = useState(null); // 'verify' | 'reject'
  const [error, setError] = useState('');

  const isTerminal = ['fulfilled', 'denied'].includes(request.request_status);
  const alreadyVerified = request.verification_status === 'verified';
  const alreadyRejected = request.verification_status === 'rejected';
  const isExpired = request.verification_status === 'expired';
  const selfVerified = !!request.email_verified_at;

  async function handle(action, fn) {
    setError('');
    setLoading(action);
    try {
      await fn();
    } catch (e) {
      setError(e.message || 'An error occurred.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Identity Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={request.verification_status} />
          <span className="text-sm text-muted-foreground">
            {formatStatus(request.verification_status)}
          </span>
        </div>

        {/* Email-link verification status (requester self-verifies via the single-use link) */}
        {selfVerified ? (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 flex items-start gap-1.5">
            <MailCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Requester confirmed their email via the verification link on {format(new Date(request.email_verified_at), 'MMM d, yyyy')}.
          </p>
        ) : isExpired ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            The verification link expired before the requester confirmed. You're not obligated to act on it; the attempt is logged.
          </p>
        ) : !alreadyVerified && !alreadyRejected ? (
          <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Awaiting the requester to confirm via the email link. You can also verify manually below.
          </p>
        ) : null}

        {!isTerminal && !alreadyVerified && !alreadyRejected && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!!loading}
              onClick={() => handle('verify', onMarkVerified)}
            >
              {loading === 'verify' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              Mark Identity Verified
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-destructive text-destructive hover:bg-destructive/10"
              disabled={!!loading}
              onClick={() => handle('reject', onRejectRequest)}
            >
              {loading === 'reject' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldX className="w-3.5 h-3.5" />
              )}
              Reject Request
            </Button>
          </div>
        )}

        {alreadyVerified && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            ✓ Identity verified — request may proceed to fulfillment.
          </p>
        )}

        {alreadyRejected && (
          <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">
            ✗ Identity rejected — request has been denied.
          </p>
        )}

        {error && (
          <p className="text-xs text-destructive bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}