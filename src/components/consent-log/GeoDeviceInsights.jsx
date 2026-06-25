import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Globe, Monitor, Smartphone, Tablet, MapPin } from 'lucide-react';
import { parseDevice, parseBrowser, stateName } from '@/lib/uaParse';

const DEVICE_ICONS = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet, Unknown: Monitor };

function aggregate(records, fn) {
  const counts = {};
  for (const r of records) {
    const key = fn(r);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export default function GeoDeviceInsights({ records }) {
  const { devices, browsers, states, geoTotal } = useMemo(() => {
    const devices = aggregate(records, r => parseDevice(r.user_agent));
    const browsers = aggregate(records, r => parseBrowser(r.user_agent));
    const states = aggregate(records, r => (r.region_state ? r.region_state.toUpperCase().trim() : null));
    const geoTotal = states.reduce((sum, s) => sum + s.count, 0);
    return { devices, browsers, states, geoTotal };
  }, [records]);

  if (records.length === 0) return null;

  const total = records.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
      {/* Devices */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Device Breakdown</h3>
        </div>
        <div className="space-y-2.5">
          {devices.map(({ label, count }) => {
            const Icon = DEVICE_ICONS[label] || Monitor;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                  </span>
                  <span className="text-muted-foreground">{count} · {pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Browsers */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Top Browsers</h3>
        </div>
        <div className="space-y-2.5">
          {browsers.slice(0, 5).map(({ label, count }) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground">{count} · {pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Geography */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Top States</h3>
        </div>
        {geoTotal === 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            No geographic data yet. State is auto-detected on new consent events going forward.
          </p>
        ) : (
          <div className="space-y-2.5">
            {states.slice(0, 5).map(({ label, count }) => {
              const pct = Math.round((count / geoTotal) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{stateName(label)}</span>
                    <span className="text-muted-foreground">{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-chart-3 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}