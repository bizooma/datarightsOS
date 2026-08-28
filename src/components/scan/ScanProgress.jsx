import { Loader2 } from 'lucide-react';

export default function ScanProgress({ domain }) {
  return (
    <div className="max-w-xl mx-auto bg-card border border-border rounded-lg p-6 text-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground">Scanning {domain}…</p>
      <p className="text-xs text-muted-foreground mt-1.5">
        We load your site in a clean browser as a first-time visitor, then a second time
        sending a Global Privacy Control signal, and compare what loads. This usually takes 20–40 seconds.
      </p>
    </div>
  );
}