import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown } from 'lucide-react';

export default function PrivacyCenterPreview({ site }) {
  const { data: org } = useQuery({
    queryKey: ['organization', site?.organization],
    queryFn: () => base44.entities.Organization.filter({ id: site.organization }).then(r => r[0] || {}),
    enabled: !!site?.organization,
  });

  if (!site) return null;

  const accent = org?.brand_primary_color || '#0d7d74';
  const logoUrl = org?.brand_logo_url || '';
  const productName = org?.white_label_product_name || 'Privacy & Data Rights Center';
  const drawers = site.enabled_drawers || ['cookies', 'privacy_rights'];
  const isDark = (site.widget_theme || 'dark') !== 'light';

  // Theme tokens mirroring widgetJs
  const panelBg = isDark ? '#14202b' : '#ffffff';
  const panelText = isDark ? '#e8edf2' : '#14202b';
  const panelSubText = isDark ? '#8fa3b3' : '#6b7a87';
  const divider = isDark ? '#243040' : '#e4e9ed';
  const itemBg = isDark ? '#1c2c3a' : '#ffffff';
  const itemHover = isDark ? '#243040' : '#f5f7f9';
  const footerBg = isDark ? '#111e2a' : '#fbfcfd';
  const crestBg = '#ffffff';
  const launcherBg = isDark ? '#14202b' : '#ffffff';
  const launcherColor = isDark ? '#ffffff' : '#14202b';
  const launcherBorder = isDark ? 'none' : '1px solid #d1d9e0';

  const drawerLabels = {
    cookies: 'Cookie Preferences',
    privacy_rights: 'Your Privacy Rights',
    accessibility: 'Accessibility',
  };

  const drawerIcons = {
    cookies: '🍪',
    privacy_rights: '🔒',
    accessibility: '♿',
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Live Preview</p>

      {/* Simulated website background */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm relative"
        style={{ height: 480, background: 'linear-gradient(135deg, #e8edf2 0%, #f5f7f9 100%)' }}>

        {/* Fake page content lines */}
        <div className="absolute inset-0 p-6 opacity-30">
          <div className="h-3 bg-gray-400 rounded w-1/3 mb-3" />
          <div className="h-2 bg-gray-300 rounded w-2/3 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-1/2 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-3/4 mb-5" />
          <div className="h-2 bg-gray-300 rounded w-2/5 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-1/2" />
        </div>

        {/* Widget panel — positioned bottom-right */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{
            bottom: 56,
            right: 12,
            width: 260,
            maxHeight: 400,
            background: panelBg,
            borderRadius: 14,
            boxShadow: '0 12px 40px -8px rgba(20,32,43,0.45)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,32,43,0.08)'}`,
            fontSize: 12,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Panel header */}
          <div style={{ padding: '11px 12px', borderBottom: `1px solid ${divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7, background: crestBg,
              border: `1px solid ${divider}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: '#14202b' }}>P</span>
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11.5, color: panelText, lineHeight: 1.2 }}>{productName}</div>
              <div style={{ fontSize: 10, color: panelSubText, marginTop: 1 }}>Manage your privacy &amp; data rights</div>
            </div>
          </div>

          {/* Drawers */}
          <div style={{ overflowY: 'auto', padding: '8px 10px', flex: 1 }}>
            {drawers.map((d, i) => (
              <div key={d} style={{
                border: `1px solid ${divider}`,
                borderRadius: 8,
                marginBottom: 6,
                overflow: 'hidden',
                background: itemBg,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 10px', cursor: 'default',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12 }}>{drawerIcons[d]}</span>
                    <span style={{ fontWeight: 650, fontSize: 11.5, color: panelText }}>{drawerLabels[d]}</span>
                  </div>
                  <ChevronDown style={{ width: 12, height: 12, color: panelSubText, flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            borderTop: `1px solid ${divider}`, padding: '7px 12px',
            fontSize: 9.5, color: panelSubText, background: footerBg,
          }}>
            Powered by <span style={{ textDecoration: 'underline' }}>Bizooma, LLC</span>
          </div>
        </div>

        {/* Launcher button */}
        <div
          style={{
            position: 'absolute', bottom: 12, right: 12,
            background: launcherBg, color: launcherColor,
            border: launcherBorder,
            borderRadius: 999, padding: '8px 12px',
            fontSize: 11, fontWeight: 600,
            boxShadow: '0 8px 24px -6px rgba(20,32,43,0.4)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: 'default',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
          Privacy &amp; Data Rights
        </div>
      </div>
    </div>
  );
}