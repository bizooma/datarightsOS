import { Mail } from 'lucide-react';

export default function BizoomaNewsletter() {
  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-[#0d7d74]" />
        <h3 className="text-base font-bold text-[#14202b]">Subscribe to the Bizooma newsletter</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Get compliance updates, product news, and web tips straight to your inbox.
      </p>

      <form
        action="https://bizooma.us14.list-manage.com/subscribe/post?u=621f128c71e19e8d9b92ff1e3&amp;id=7f8858c903&amp;f_id=00f8b5e5f0"
        method="post"
        target="_blank"
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="email"
          name="EMAIL"
          required
          placeholder="you@example.com"
          aria-label="Email Address"
          className="flex-1 h-11 px-3 rounded-lg border border-slate-300 text-sm text-[#14202b] focus:outline-none focus:ring-2 focus:ring-[#0d7d74]/40 focus:border-[#0d7d74]"
        />
        {/* Mailchimp anti-bot honeypot — do not fill */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-5000px' }}>
          <input type="text" name="b_621f128c71e19e8d9b92ff1e3_7f8858c903" tabIndex={-1} defaultValue="" />
        </div>
        <button
          type="submit"
          name="subscribe"
          className="h-11 px-6 rounded-lg bg-[#0d7d74] text-white text-sm font-semibold hover:bg-[#0a6b63] transition-colors whitespace-nowrap"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}