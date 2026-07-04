import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BizoomaNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await base44.functions.invoke('mailchimpSubscribe', { email: email.trim() });
      if (res.data?.success) {
        setStatus('success');
      } else {
        setErrorMsg(res.data?.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || 'Something went wrong. Please try again.');
      setStatus('error');
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
      {status === 'error' && errorMsg && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}