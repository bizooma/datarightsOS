import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

export default function AccessibilityDrawer({ site, primaryColor }) {
  const [largerText, setLargerText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reportForm, setReportForm] = useState({ page_url: '', description: '', reporter_email: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Apply browser display preferences (no DB writes)
  useEffect(() => {
    document.documentElement.style.fontSize = largerText ? '118%' : '';
  }, [largerText]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.style.setProperty('--motion-duration', '0ms');
    } else {
      document.documentElement.style.removeProperty('--motion-duration');
    }
  }, [reduceMotion]);

  async function submitReport(e) {
    e.preventDefault();
    if (!reportForm.page_url.trim() || !reportForm.description.trim()) {
      setError('Page URL and description are required.');
      return;
    }
    setError('');
    setLoading(true);
    await base44.entities.AccessibilityReport.create({
      site: site.id,
      page_url: reportForm.page_url.trim(),
      description: reportForm.description.trim(),
      reporter_email: reportForm.reporter_email.trim() || undefined,
      status: 'new',
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      {/* Statement link */}
      {site.accessibility_statement_url && (
        <div>
          <a
            href={site.accessibility_statement_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium underline"
            style={{ color: primaryColor }}
          >
            View our Accessibility Statement
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Display preferences — browser only, no DB */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-3">Display Preferences</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-gray-800">Larger Text</p>
              <p className="text-xs text-gray-500">Increase base font size by ~18%</p>
            </div>
            <div
              className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: largerText ? primaryColor : '#d1d5db' }}
              onClick={() => setLargerText(p => !p)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ left: largerText ? '22px' : '2px' }}
              />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-gray-800">Reduce Motion</p>
              <p className="text-xs text-gray-500">Minimize animations and transitions</p>
            </div>
            <div
              className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
              style={{ backgroundColor: reduceMotion ? primaryColor : '#d1d5db' }}
              onClick={() => setReduceMotion(p => !p)}
            >
              <div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ left: reduceMotion ? '22px' : '2px' }}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Report a barrier */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-3">Report an Accessibility Barrier</p>
        {submitted ? (
          <div className="flex items-start gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">Thank you — your report has been submitted and will be reviewed.</p>
          </div>
        ) : (
          <form onSubmit={submitReport} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Page URL *</label>
              <input
                type="url"
                value={reportForm.page_url}
                onChange={e => setReportForm(p => ({ ...p, page_url: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="https://example.com/page"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Describe the barrier *</label>
              <textarea
                value={reportForm.description}
                onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                placeholder="What barrier did you encounter?"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Your email (optional)</label>
              <input
                type="email"
                value={reportForm.reporter_email}
                onChange={e => setReportForm(p => ({ ...p, reporter_email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="so we can follow up"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Report
            </button>
          </form>
        )}
      </div>
    </div>
  );
}