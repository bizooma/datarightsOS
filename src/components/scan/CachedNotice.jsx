import { History, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown when a report came from the one-hour domain cache. A stale report
// presented as current is worse than no report, so the ORIGINAL scan time leads
// and a cache-bypassing re-scan is always one click away.
export default function CachedNotice({ scan, onRescan, busy }) {
  const when = scan.completed_at ? new Date(scan.completed_at) : null;
  return (
    <div className="max-w-2xl mx-auto border-2 border-[#D89B2A] bg-[#FDF6E7] rounded-lg p-4">
      <div className="flex items-start gap-3">
        <History className="w-5 h-5 text-[#8A5F12] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#8A5F12]">
            Previously recorded scan
          </p>
          <p className="text-sm font-semibold text-foreground mt-1">
            These results were recorded {when ? when.toLocaleString() : 'earlier'} — not just now.
          </p>
          <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
            We reuse a report for the same domain for one hour. If the site changed since then, this
            report describes the older version of it.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 bg-card"
            onClick={onRescan}
            disabled={busy}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run a fresh scan now
          </Button>
        </div>
      </div>
    </div>
  );
}