import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { pdfFilename } from '@/components/scan/reportText';

// First click renders the PDF server-side and caches it; later clicks serve the
// cached file. The button reflects that the first one takes a moment.
export default function DownloadPdfButton({ scan }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('generateScanReportPdf', { scan_id: scan.id });
      const d = res.data || {};
      if (!d.ok || !d.url) {
        setError(d.message || 'The PDF could not be prepared. Please try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = d.url;
      a.download = d.filename || pdfFilename(scan);
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError('The PDF could not be prepared. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[#0E1B26] text-white hover:bg-[#16293a] disabled:opacity-60 transition-colors"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? 'Preparing PDF…' : 'Download PDF'}
      </button>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}