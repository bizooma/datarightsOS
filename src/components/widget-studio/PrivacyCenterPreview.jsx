import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2 } from 'lucide-react';

export default function PrivacyCenterPreview({ site }) {
  const { data: org } = useQuery({
    queryKey: ['organization', site?.organization],
    queryFn: () => base44.entities.Organization.filter({ id: site.organization }).then(r => r[0] || {}),
    enabled: !!site?.organization,
  });

  if (!site) return null;

  const accent = site.brand_primary_color || org?.brand_primary_color || '#0d7d74';
  const logoUrl = site.brand_logo_url || org?.brand_logo_url || 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/b5c7df386_vault.png';
  const productName = site.brand_product_name || org?.white_label_product_name || 'Privacy & Data Rights Center';
  const drawers = site.enabled_drawers || ['cookies', 'privacy_rights'];
  const isDark = (site.widget_theme || 'dark') !== 'light';
  const openByDefault = site.default_open !== false;
  const layout = site.widget_layout === 'bar' ? 'bar' : 'floating';
  const launcherPos = site.launcher_position || 'bottom-right';
  const launcherOffset = Number(site.launcher_offset_bottom) || 0;
  // Preview is a desktop-sized frame, so it reflects the desktop behavior of the chosen layout.
  const showBar = layout === 'bar';
  // Only Agency can hide the badge; otherwise it's always shown.
  const showBadge = !(org?.plan === 'agency' && site.hide_branding === true);

  // Theme tokens mirroring widgetJs
  const panelBg = isDark ? '#14202b' : '#ffffff';
  const panelText = isDark ? '#e8edf2' : '#14202b';
  const panelSubText = isDark ? '#8fa3b3' : '#6b7a87';
  const divider = isDark ? '#243040' : '#e4e9ed';
  const cardBg = isDark ? '#1c2c3a' : '#f7f9fa';
  const searchBg = isDark ? '#1c2c3a' : '#f2f5f7';
  const footerBg = isDark ? '#111e2a' : '#fbfcfd';
  const crestBg = '#ffffff';
  const launcherBg = isDark ? '#14202b' : '#ffffff';
  const launcherColor = isDark ? '#ffffff' : '#14202b';
  const launcherBorder = isDark ? 'none' : '1px solid #d1d9e0';

  const cardConfig = {
    cookies: { label: 'Cookies', sub: 'Manage settings', img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=70' },
    privacy_rights: { label: 'Privacy Rights', sub: 'Submit a request', img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=70' },
    accessibility: { label: 'Accessibility', sub: 'View statement', img: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=70' },
    ai_disclosure: { label: 'AI Disclosure', sub: 'How we use AI', img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=70' },
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Live Preview
        {!openByDefault && <span className="ml-2 font-normal text-[11px]">— collapsed on load; visitors click the launcher to open</span>}
      </p>

      {/* Simulated website background */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm relative"
        style={{ height: 520, background: 'linear-gradient(135deg, #e8edf2 0%, #f5f7f9 100%)' }}>

        {/* Fake page content lines */}
        <div className="absolute inset-0 p-6 opacity-30">
          <div className="h-3 bg-gray-400 rounded w-1/3 mb-3" />
          <div className="h-2 bg-gray-300 rounded w-2/3 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-1/2 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-3/4 mb-5" />
          <div className="h-2 bg-gray-300 rounded w-2/5 mb-2" />
          <div className="h-2 bg-gray-300 rounded w-1/2" />
        </div>

        {/* Command Center panel — honors widget_position; hidden when collapsed by default or in bar layout */}
        <div
          className="absolute flex flex-col overflow-hidden"
          style={{
            display: (openByDefault && !showBar) ? 'flex' : 'none',
            ...(() => {
              const wp = site.widget_position || 'bottom-right';
              if (wp === 'bottom-left') return { bottom: 56, left: 12 };
              if (wp === 'bottom-center') return { bottom: 56, left: '50%', transform: 'translateX(-50%)' };
              if (wp === 'top-right') return { top: 12, right: 12 };
              if (wp === 'top-left') return { top: 12, left: 12 };
              return { bottom: 56, right: 12 };
            })(),
            width: 290,
            maxWidth: 'calc(100% - 24px)',
            maxHeight: 440,
            background: panelBg,
            borderRadius: 16,
            boxShadow: '0 12px 40px -8px rgba(20,32,43,0.45)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,32,43,0.08)'}`,
            fontSize: 12,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Panel header */}
          <div style={{ padding: '12px 13px', borderBottom: `1px solid ${divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 11.5, color: panelText, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{productName}</div>
              {/* Status pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3,
                background: `${accent}1f`, color: accent,
                borderRadius: 999, padding: '2px 7px', fontSize: 9.5, fontWeight: 600,
              }}>
                <CheckCircle2 style={{ width: 10, height: 10 }} />
                Active
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ padding: '11px 13px 7px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: searchBg, borderRadius: 9, padding: '8px 10px',
              border: `1px solid ${divider}`,
            }}>
              <Search style={{ width: 13, height: 13, color: panelSubText, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: panelSubText }}>How can we help with your privacy?</span>
            </div>
          </div>

          {/* Action card grid */}
          <div style={{ overflowY: 'auto', padding: '4px 13px 12px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {drawers.map((d) => {
                const c = cardConfig[d];
                if (!c) return null;
                return (
                  <div key={d} style={{
                    background: cardBg,
                    border: `1px solid ${divider}`,
                    borderRadius: 11,
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    cursor: 'default',
                  }}>
                    {/* Photographic header band with title overlay */}
                    <div style={{
                      position: 'relative', height: 54,
                      backgroundImage: `url(${c.img})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(20,32,43,0.15) 0%, rgba(20,32,43,0.78) 100%)',
                      }} />
                      <div style={{
                        position: 'absolute', left: 8, right: 8, bottom: 6, zIndex: 1,
                        fontWeight: 700, fontSize: 11, color: '#fff', lineHeight: 1.2,
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                      }}>{c.label}</div>
                    </div>
                    <div style={{ padding: '7px 10px 9px' }}>
                      <div style={{ fontSize: 9.5, color: panelSubText }}>{c.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick action */}
            <div style={{
              marginTop: 9, background: accent, color: '#ffffff',
              borderRadius: 9, padding: '9px 10px', textAlign: 'center',
              fontSize: 11, fontWeight: 600, cursor: 'default',
            }}>
              Accept All &amp; Continue
            </div>
          </div>

          {/* Footer */}
          {showBadge && (
            <div style={{
              borderTop: `1px solid ${divider}`, padding: '7px 13px',
              fontSize: 9.5, color: panelSubText, background: footerBg,
            }}>
              Powered by <span style={{ textDecoration: 'underline' }}>DataRightsOS</span>
            </div>
          )}
        </div>

        {/* Bottom-bar consent moment — shown in bar layout instead of the floating panel */}
        {showBar && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: launcherOffset,
              background: panelBg, color: panelText,
              borderTop: `1px solid ${divider}`,
              boxShadow: '0 -8px 30px -10px rgba(20,32,43,0.35)',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            <div style={{ flex: '1 1 180px', minWidth: 140, fontSize: 12, fontWeight: 600, color: panelText, lineHeight: 1.4 }}>
              We use cookies. Choose how this site can use them.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {['Reject all', 'Accept all', 'Manage settings'].map((lbl, i) => (
                <div key={lbl} style={{
                  border: `1px solid ${i === 1 ? accent : divider}`,
                  background: i === 1 ? accent : cardBg,
                  color: i === 1 ? '#fff' : panelText,
                  borderRadius: 8, padding: '8px 14px', fontSize: 11.5, fontWeight: 650, cursor: 'default',
                }}>{lbl}</div>
              ))}
              <span style={{ fontSize: 11.5, fontWeight: 600, color: accent, textDecoration: 'underline' }}>Privacy Center</span>
            </div>
          </div>
        )}

        {/* Launcher button — honors launcher position & bottom offset (collapsed state).
            In bar layout the launcher is bottom-anchored and rounded-square (persistent bar treatment);
            in floating layout it's the pill. Hidden here only while the first-visit consent bar is showing. */}
        <div
          style={{
            position: 'absolute', bottom: 12 + launcherOffset,
            ...(launcherPos === 'bottom-left'
              ? { left: 12 }
              : launcherPos === 'bottom-center'
                ? { left: '50%', transform: 'translateX(-50%)' }
                : { right: 12 }),
            background: launcherBg, color: launcherColor,
            border: launcherBorder,
            borderRadius: showBar ? 12 : 999, padding: showBar ? '9px 13px' : '8px 12px',
            fontSize: 11, fontWeight: 600,
            boxShadow: '0 8px 24px -6px rgba(20,32,43,0.4)',
            display: showBar ? 'none' : 'flex', alignItems: 'center', gap: 6,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: 'default',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
          Privacy &amp; Data Rights
        </div>
      </div>
      {showBar && (
        <p className="text-[11px] text-muted-foreground">
          Bar layout is persistent: first visit shows this consent bar. After a choice it collapses to a bottom-anchored launcher, and clicking it expands a full-width panel from the bottom (a bottom sheet on phones) — never the floating card.
        </p>
      )}
    </div>
  );
}