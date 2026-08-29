import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { statementUrl } from '@/lib/statementUrls';

export default function MarketingNav({ isAuthenticated }) {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9c1b23b5f_logo-horizontal-reversed.svg" alt="Data Rights OS" className="h-14 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/#who" className="hover:text-white transition-colors">Who it's for</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          {/* Points at the static statement page, not the in-app /privacy-policy route.
              This is the first privacy link in the document, so it is the one a crawler
              or scanner follows — it needs to be the real HTML document. */}
          <a href={statementUrl('datarightsos-com', 'privacy_policy')} className="hover:text-white transition-colors">Privacy</a>
          <Link to="/support-request" className="hover:text-white transition-colors">Support</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-sm font-semibold bg-[#0d7d74] text-white px-4 py-2 rounded-lg hover:bg-[#0a6b63] transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-[#0d7d74] text-white px-4 py-2 rounded-lg hover:bg-[#0a6b63] transition-colors"
              >
                Start free trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}