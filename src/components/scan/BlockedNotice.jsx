import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// A blocked load is not a report. We loaded a security check, not the site, so
// there is nothing to show and nothing worth claiming about the business.
export default function BlockedNotice({ scan, busy, onRescan }) {
  return (
    <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            We couldn't reach {scan.domain}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{scan.error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            No findings are reported for a load like this — a report built from a security check
            would describe that page, not your site.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={busy}
            onClick={onRescan}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Try the scan again
          </Button>
        </div>
      </div>
    </div>
  );
}