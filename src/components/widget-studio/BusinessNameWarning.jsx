import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

// Statement pages are public and indexable, so the name they are published under
// has to be a real business name. It is deliberately NOT defaulted from the
// organization name — that value is auto-generated at signup ("Sara Walsh's
// Organization"), and publishing a person's name on a firm's privacy policy is
// worse than publishing nothing. Until this is set, the pages return not-found.
export default function BusinessNameWarning({ site, org }) {
  const resolved = (site?.business_name || org?.business_name || '').trim();
  if (resolved) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-xs text-amber-900 leading-relaxed">
        <p className="font-semibold text-sm mb-1">
          Set your business name before publishing statements
        </p>
        <p>
          Your statement pages for <span className="font-medium">{site?.domain}</span> are public
          and indexable, and they are published under your business name — it appears in the page
          title, the description search engines show, and the page header. It isn't set yet, so
          those pages currently return "not published" instead of going live under a guessed name.
        </p>
        <p className="mt-2">
          Add it in{' '}
          <Link to="/settings" className="font-semibold underline hover:text-amber-700">
            Settings → Requester Emails
          </Link>{' '}
          for the whole organization, or set a per-site name in Branding below if this site trades
          under a different name.
        </p>
      </div>
    </div>
  );
}