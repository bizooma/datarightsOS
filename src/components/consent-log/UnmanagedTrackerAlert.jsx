import { AlertTriangle } from 'lucide-react';

// Persistent warning: surfaces unmanaged (ungated) trackers detected across consent
// records in the last 7 days, naming each tracker. These are tags found on the site
// that are NOT wired through the widget's consent gate, so their firing cannot be
// prevented — only detected and recorded.
export default function UnmanagedTrackerAlert({ records = [] }) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const trackers = new Set();
  records.forEach(r => {
    const ts = r.created_date ? new Date(r.created_date).getTime() : 0;
    if (ts < cutoff) return;
    (r.unmanaged_detected || []).forEach(name => name && trackers.add(name));
  });

  if (trackers.size === 0) return null;

  const names = Array.from(trackers).sort();

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-amber-800">
          Unmanaged trackers detected in the last 7 days
        </p>
        <p className="text-amber-700 mt-0.5 leading-relaxed">
          These trackers are present on your site but are <strong>not wired through the consent gate</strong>, so
          the widget cannot block them — it can only record that they fired. To enforce consent on them, install
          each as a gated tag (<code className="text-[12px] bg-amber-100 px-1 rounded">type="text/plain" data-dros-category="…"</code>).
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {names.map(n => (
            <span key={n} className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}