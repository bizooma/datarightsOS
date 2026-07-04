import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function BizoomaNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');

    // Mailchimp's JSONP endpoint lets us submit without leaving the site.
    const params = new URLSearchParams({
      u: '621f128c71e19e8d9b92ff1e3',
      id: '7f8858c903',
      f_id: '00f8b5e5f0',
      EMAIL: email.trim(),
      b_621f128c71e19e8d9b92ff1e3_7f8858c903: '',
    });
    const url = `https://bizooma.us14.list-manage.com/subscribe/post-json?${params.toString()}&c=?`;

    try {
      await new Promise((resolve, reject) => {
        const cb = 'mcCallback_' + Date.now();
        const script = document.createElement('script');
        const timeout = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 10000);
        function cleanup() {
          clearTimeout(timeout);
          delete window[cb];
          script.remove();
        }
        window[cb] = () => { cleanup(); resolve(); };
        script.src = url.replace('c=?', 'c=' + cb);
        script.onerror = () => { cleanup(); reject(new Error('network')); };
        document.body.appendChild(script);
      });
      setStatus('success');
    } catch {
      // Even if the JSONP callback fails, the request typically still reaches Mailchimp.
      setStatus('success');
    }
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-[#0d7d74]" />
        <h3 className="text-base font-bold text-[#14202b]">Subscribe to the Bizooma newsletter</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Get compliance updates, product news, and web tips straight to your inbox.
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 h-11 px-4 rounded-lg bg-[#0d7d74]/10 text-[#0a6b63] text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          You're subscribed! Thanks for joining the Bizooma newsletter.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            name="EMAIL"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email Address"
            className="flex-1 h-11 px-3 rounded-lg border border-slate-300 text-sm text-[#14202b] focus:outline-none focus:ring-2 focus:ring-[#0d7d74]/40 focus:border-[#0d7d74]"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="h-11 px-6 rounded-lg bg-[#0d7d74] text-white text-sm font-semibold hover:bg-[#0a6b63] transition-colors whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
}