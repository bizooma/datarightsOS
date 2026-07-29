import { Label } from '@/components/ui/label';

// Two small labeled previews for choosing the first-visit consent layout.
// 'floating' = card panel (current default); 'bar' = bottom bar.
export default function LayoutPicker({ value = 'floating', accent = '#0d7d74', onChange }) {
  const options = [
    { key: 'floating', label: 'Floating card', hint: 'A panel in the corner' },
    { key: 'bar', label: 'Bottom bar', hint: 'A strip across the bottom' },
  ];

  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">Consent Layout (first visit)</Label>
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => {
          const selected = (value || 'floating') === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              aria-pressed={selected}
              className={`text-left rounded-lg border p-3 transition-colors ${
                selected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Mini illustration of a website with the layout */}
              <div className="relative rounded-md overflow-hidden border border-border mb-2" style={{ height: 78, background: 'linear-gradient(135deg,#e8edf2,#f5f7f9)' }}>
                <div className="absolute inset-0 p-2 opacity-40">
                  <div className="h-1.5 rounded bg-gray-400 w-1/3 mb-1.5" />
                  <div className="h-1 rounded bg-gray-300 w-2/3 mb-1" />
                  <div className="h-1 rounded bg-gray-300 w-1/2" />
                </div>
                {opt.key === 'floating' ? (
                  <div className="absolute" style={{ right: 6, bottom: 6, width: 46, height: 40, borderRadius: 6, background: '#14202b', boxShadow: '0 4px 10px -3px rgba(0,0,0,.4)' }}>
                    <div style={{ height: 12, borderBottom: '1px solid #243040' }} />
                    <div className="flex gap-1 p-1">
                      <div style={{ flex: 1, height: 8, borderRadius: 2, background: accent }} />
                      <div style={{ flex: 1, height: 8, borderRadius: 2, background: '#243040' }} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute flex items-center gap-1 px-1.5" style={{ left: 0, right: 0, bottom: 0, height: 20, background: '#14202b', borderTop: '1px solid #243040' }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 2, background: '#3a4a5a' }} />
                    <div style={{ width: 14, height: 8, borderRadius: 2, background: '#243040' }} />
                    <div style={{ width: 14, height: 8, borderRadius: 2, background: accent }} />
                  </div>
                )}
              </div>
              <p className="text-xs font-medium">{opt.label}</p>
              <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">Presentation only — consent and enforcement are identical in both. On phones both layouts show the bottom bar.</p>
    </div>
  );
}