import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import StatementFooterLinks from '@/components/marketing/StatementFooterLinks';

export default function MarketingFooter() {
  return (
    <footer className="bg-[#14202b] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="mb-3">
              <img src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9c1b23b5f_logo-horizontal-reversed.svg" alt="DataRightsOS" className="h-12 object-contain" />
            </div>
            <div className="text-slate-200 text-xs max-w-xs leading-relaxed space-y-3">
              <p>
                <span className="text-white font-semibold block mb-1">Compliance Is Becoming a Moving Target</span>
                Privacy rights, accessibility statements, cookie disclosures, AI notices, and consumer request links are no longer "nice to have." DataRightsOS gives your website a simple way to display important statements and help visitors find the rights information they're looking for.
              </p>
              <p>
                DataRightsOS helps businesses organize and display privacy, accessibility, AI, and data-rights statements. It does not replace legal advice or guarantee compliance.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-2">
            <Link to="/about" className="text-slate-200 hover:text-white text-sm transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-slate-200 hover:text-white text-sm transition-colors">
              Contact
            </Link>
            <Link to="/support-request" className="text-slate-200 hover:text-white text-sm transition-colors">
              Support
            </Link>
            <Link to="/login" className="text-slate-200 hover:text-white text-sm transition-colors">
              Log in
            </Link>
            <Link to="/register" className="text-slate-200 hover:text-white text-sm transition-colors">
              Start free trial
            </Link>
            <Link to="/privacy-policy" className="text-slate-200 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-slate-200 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <StatementFooterLinks />
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-300 text-xs">© 2026 <a href="https://bizooma.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Bizooma, LLC</a>. All Rights Reserved.</p>
          <p className="text-slate-300 text-xs">Built for US state privacy law compliance.</p>
        </div>
      </div>
    </footer>
  );
}