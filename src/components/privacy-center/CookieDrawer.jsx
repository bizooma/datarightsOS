import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  { key: 'functional', label: 'Functional', description: 'Enables enhanced features like saved preferences and chat widgets.' },
  { key: 'analytics', label: 'Analytics', description: 'Helps us understand how visitors use the site to improve it.' },
  { key: 'advertising', label: 'Advertising', description: 'Used to deliver ads relevant to your interests.' },
];

function getVisitorId() {
  let id = localStorage.getItem('tessera_vid');
  if (!id) { id = 'v_' + Math.random().toString(36).substring(2, 18); localStorage.setItem('tessera_vid', id); }
  return id;
}
function generateReceiptId() {
  return 'cr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

export default function CookieDrawer({ site, primaryColor }) {
  const [choices, setChoices] = useState({ functional: false, analytics: false, advertising: false });
  const [loading, setLoading] = useState(null);
  const [saved, setSaved] = useState(false);

  async function submit(action) {
    setLoading(action);
    const cats = action === 'accept_all'
      ? { functional: true, analytics: true, advertising: true }
      : action === 'reject_all'
      ? { functional: false, analytics: false, advertising: false }
      : choices;

    await base44.entities.ConsentRecord.create({
      site: site.id,
      visitor_id: getVisitorId(),
      action,
      necessary: true,
      functional: cats.functional,
      analytics: cats.analytics,
      advertising: cats.advertising,
      gpc_detected: !!navigator.globalPrivacyControl,
      policy_version: site.policy_version,
      consent_receipt_id: generateReceiptId(),
    });
    setLoading(null);
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 py-2 text-green-700">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Preferences saved.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strictly Necessary — locked */}
      <div className="flex items-start gap-3 opacity-60">
        <div className="mt-0.5 w-4 h-4 rounded border-2 border-gray-400 bg-gray-200 shrink-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-sm bg-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800">Strictly Necessary</p>
          <p className="text-xs text-gray-500 mt-0.5">Required for the site to function. Cannot be disabled.</p>
        </div>
      </div>

      {CATEGORIES.map(cat => (
        <div key={cat.key} className="flex items-start gap-3">
          <button
            type="button"
            className="mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors"
            style={{
              borderColor: choices[cat.key] ? primaryColor : '#d1d5db',
              backgroundColor: choices[cat.key] ? primaryColor : 'white',
            }}
            onClick={() => setChoices(p => ({ ...p, [cat.key]: !p[cat.key] }))}
          >
            {choices[cat.key] && <div className="w-2 h-2 rounded-sm bg-white" />}
          </button>
          <div>
            <p className="text-sm font-medium text-gray-800">{cat.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <button
          style={{ backgroundColor: primaryColor }}
          className="px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => submit('save_choices')}
        >
          {loading === 'save_choices' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save Choices
        </button>
        <button
          className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => submit('accept_all')}
        >
          {loading === 'accept_all' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Accept All
        </button>
        <button
          className="px-4 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => submit('reject_all')}
        >
          {loading === 'reject_all' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Reject All
        </button>
      </div>
    </div>
  );
}