import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function MarketingFooter() {
  return (
    <footer className="bg-[#14202b] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center">
                <img src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/d6c9d39a9_vault.png" alt="Data Rights OS" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold text-sm">Data Rights OS</span>
            </div>
            <div className="text-slate-500 text-xs max-w-xs leading-relaxed space-y-3">
              <p>
                <span className="text-slate-300 font-semibold block mb-1">Compliance Is Becoming a Moving Target</span>
                Privacy rights, accessibility statements, cookie disclosures, AI notices, and consumer request links are no longer "nice to have." Data RightS OS gives your website a simple way to display important statements and help visitors find the rights information they're looking for.
              </p>
              <p>
                Data RightS OS helps businesses organize and display privacy, accessibility, AI, and data-rights statements. It does not replace legal advice or guarantee compliance.
              </p>
            </div>
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
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-600 text-xs">© 2026 <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bizooma, LLC</a>. All Rights Reserved.</p>
          <p className="text-slate-600 text-xs">Built for US state privacy law compliance.</p>
        </div>
      </div>
    </footer>
  );
}