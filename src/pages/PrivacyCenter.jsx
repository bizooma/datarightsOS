import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import CookieDrawer from '@/components/privacy-center/CookieDrawer';
import PrivacyRightsDrawer from '@/components/privacy-center/PrivacyRightsDrawer';
import AccessibilityDrawer from '@/components/privacy-center/AccessibilityDrawer';
import { Shield, Loader2, AlertCircle } from 'lucide-react';

export default function PrivacyCenter() {
  const params = new URLSearchParams(window.location.search);
  const siteKey = params.get('site');

  const [siteData, setSiteData] = useState(null); // { site, org }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gpcApplied, setGpcApplied] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null);

  useEffect(() => {
    if (!siteKey) {
      setError('No site key provided.');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const sites = await base44.entities.Site.filter({ site_key: siteKey });
        const site = sites[0];
        if (!site) { setError('Site not found.'); setLoading(false); return; }

        const orgs = await base44.entities.Organization.filter({ id: site.organization });
        const org = orgs[0] || null;

        setSiteData({ site, org });

        // GPC detection
        if (site.honor_gpc && navigator.globalPrivacyControl) {
          await base44.entities.ConsentRecord.create({
            site: site.id,
            visitor_id: getVisitorId(),
            action: 'gpc_optout',
            necessary: true,
            functional: false,
            analytics: false,
            advertising: false,
            gpc_detected: true,
            policy_version: site.policy_version,
            consent_receipt_id: generateReceiptId(),
          });
          setGpcApplied(true);
        }
      } catch (e) {
        setError('Failed to load privacy center.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [siteKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { site, org } = siteData;
  const primaryColor = org?.brand_primary_color || '#0d7d74';
  const productName = org?.white_label_product_name || 'Privacy & Data Rights Center';
  const logoUrl = org?.brand_logo_url;
  // Allow preview override via query param (used by WidgetStudio live preview)
  const drawersParam = params.get('drawers');
  const drawers = drawersParam !== null
    ? (drawersParam ? drawersParam.split(',') : [])
    : (site.enabled_drawers || []);

  const drawerConfig = [
    { key: 'cookies', label: 'Cookie Preferences', icon: '🍪' },
    { key: 'privacy_rights', label: 'Your Privacy Rights', icon: '🔒' },
    { key: 'accessibility', label: 'Accessibility', icon: '♿' },
  ].filter(d => drawers.includes(d.key));

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div style={{ backgroundColor: primaryColor }} className="px-6 py-8 text-white">
        <div className="max-w-2xl mx-auto">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 mb-4 object-contain" />
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">{org?.name || 'Privacy Center'}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold">{productName}</h1>
          <p className="text-sm mt-1 opacity-80">Manage your privacy preferences and data rights</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {/* GPC Notice */}
        {gpcApplied && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <span className="text-amber-600 text-lg leading-none mt-0.5">⚙</span>
            <p className="text-sm text-amber-800">
              <strong>Global Privacy Control detected</strong> — opt-out applied automatically.
            </p>
          </div>
        )}

        {/* Intro video */}
        {site.intro_video_url && (
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
            <video
              src={site.intro_video_url}
              controls
              className="w-full"
              style={{ maxHeight: 260 }}
            />
          </div>
        )}

        {/* Drawers */}
        {drawerConfig.map(d => (
          <div key={d.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpenDrawer(openDrawer === d.key ? null : d.key)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{d.icon}</span>
                <span className="font-semibold text-gray-900">{d.label}</span>
              </div>
              <span className="text-gray-400 text-lg transition-transform" style={{
                transform: openDrawer === d.key ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-block',
              }}>▾</span>
            </button>

            {openDrawer === d.key && (
              <div className="border-t border-gray-100 px-5 py-5">
                {d.key === 'cookies' && (
                  <CookieDrawer site={site} primaryColor={primaryColor} />
                )}
                {d.key === 'privacy_rights' && (
                  <PrivacyRightsDrawer site={site} primaryColor={primaryColor} />
                )}
                {d.key === 'accessibility' && (
                  <AccessibilityDrawer site={site} primaryColor={primaryColor} />
                )}
              </div>
            )}
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pt-2">
          Powered by Data Rights OS · Policy v{site.policy_version}
        </p>
      </div>
    </div>
  );
}

function getVisitorId() {
  let id = localStorage.getItem('tessera_vid');
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 18);
    localStorage.setItem('tessera_vid', id);
  }
  return id;
}

function generateReceiptId() {
  return 'cr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}