import CheckCard from '@/components/scan/CheckCard';
import NeutralCheckList from '@/components/scan/NeutralCheckList';

// A sample report excerpt for the homepage, rendered with the REAL report
// components (CheckCard + NeutralCheckList) and hardcoded findings. Not a
// screenshot: it stays in sync when the report design changes, and it is real
// text for crawlers and screen readers.
//
// THE DOMAIN MUST BE RESERVED, NOT MERELY FABRICATED. example.com is reserved by IANA
// under RFC 2606 for documentation and can never be registered by a third party, so
// fabricated findings shown against it can never describe a real business's site.
// A made-up-sounding domain is NOT safe: example-firm.com looked invented but is in
// fact registered and resolving. Only example.com, example.net, example.org and
// anything under the .example TLD are guaranteed unowned — use one of those and
// nothing else here.
//
// COPY FOLLOWS THE REPORT'S RULES: observations only. No score, grade, or verdict,
// and none of "violation", "risk", "non-compliant", or "exposed" — this is showing
// our product's output, so it obeys our product's rules.
const SAMPLE_DOMAIN = 'example.com';

const AMBER = {
  key: 'pre_consent_tracking',
  check: {
    status: 'found',
    observation: 'Meta Pixel and Google Ads loaded before any consent choice was recorded.',
    details: [],
  },
};

const NEUTRAL = [
  {
    key: 'gpc_comparison',
    check: {
      status: 'not_found',
      observation: 'Tracking behavior did not change when a Global Privacy Control signal was sent.',
      details: [],
    },
  },
  {
    key: 'accessibility_statement',
    check: {
      status: 'not_found',
      observation: 'Not found on the pages we checked.',
      details: [],
    },
  },
];

export default function SampleReport() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-black/30 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 bg-slate-100 border border-slate-200 rounded px-2 py-1">
          Sample report
        </span>
        <span className="text-xs font-medium text-slate-500 truncate">{SAMPLE_DOMAIN}</span>
      </div>

      <div className="space-y-3">
        <CheckCard checkKey={AMBER.key} check={AMBER.check} attention />

        {/* On narrow screens this drops to a single neutral finding — the amber one
            always stays. Done in CSS so the text is present in the DOM once. */}
        <div className="[&>div>div:last-child]:hidden sm:[&>div>div:last-child]:block">
          <NeutralCheckList items={NEUTRAL} />
        </div>
      </div>
    </div>
  );
}