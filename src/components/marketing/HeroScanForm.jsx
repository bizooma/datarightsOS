import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { parseSiteInput } from '@/lib/domainInput';

// The hero's primary action. Validates BEFORE navigating — an invalid entry never
// sends someone to a scan page that can't run, it just says so inline.
export default function HeroScanForm() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseSiteInput(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError('');
    // The URL is carried over and /scan starts immediately on arrival — no second click.
    navigate(`/scan?url=${encodeURIComponent(parsed.url)}`);
  }

  return (
    <div>
      <p className="text-sm font-semibold text-white mb-2.5">
        Start by seeing what your site does right now.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
          placeholder="yourwebsite.com"
          aria-label="Your website address"
          aria-invalid={!!error}
          aria-describedby={error ? 'hero-scan-error' : undefined}
          className="flex-1 min-w-0 h-11 rounded-lg bg-white px-4 text-sm text-[#14202b] placeholder:text-slate-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#0d7d74]"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-11 shrink-0 bg-[#0d7d74] text-white font-semibold px-6 rounded-lg hover:bg-[#0a6b63] transition-colors text-sm"
        >
          <Search className="w-4 h-4" />
          Scan my site
        </button>
      </form>

      {error && (
        <p id="hero-scan-error" role="alert" className="mt-2 text-sm text-[#ffc9c9]">
          {error}
        </p>
      )}

      <p className="mt-2.5 text-xs text-white/70">
        Free, no signup. Takes about 30 seconds.
      </p>

      <p className="mt-4 text-sm text-white/80">
        Already know you want it?{' '}
        <Link to="/register" className="font-semibold text-white underline underline-offset-4 hover:text-white/90">
          Start free trial
        </Link>
      </p>
    </div>
  );
}