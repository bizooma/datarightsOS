import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9664d0c97_datarights.png" alt="Data Rights OS" className="h-9 object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
          <a href="#features" className="hover:text-[#14202b] transition-colors">Features</a>
          <a href="#who" className="hover:text-[#14202b] transition-colors">Who it's for</a>
          <a href="#pricing" className="hover:text-[#14202b] transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-[#14202b] transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-[#0d7d74] text-white px-4 py-2 rounded-lg hover:bg-[#0a6b63] transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </header>
  );
}