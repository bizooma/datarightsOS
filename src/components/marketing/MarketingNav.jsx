import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function MarketingNav({ isAuthenticated }) {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9c1b23b5f_logo-horizontal-reversed.svg" alt="Data Rights OS" className="h-14 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#who" className="hover:text-white transition-colors">Who it's for</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
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