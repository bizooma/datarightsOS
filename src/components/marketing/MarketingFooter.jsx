import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="bg-[#14202b] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#0d7d74] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold text-sm">Data Rights OS</span>
            </div>
            <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
              Privacy compliance infrastructure for law firms, agencies, and the sites they protect.
              A Bizooma product.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-2">
            <Link to="/about" className="text-slate-400 hover:text-white text-sm transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">
              Contact
            </Link>
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-slate-400 hover:text-white text-sm transition-colors">
              Start free trial
            </Link>
            <Link to="/privacy-center" className="text-slate-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Bizooma. All rights reserved.</p>
          <p className="text-slate-600 text-xs">Built for US state privacy law compliance.</p>
        </div>
      </div>
    </footer>
  );
}