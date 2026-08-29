import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

// How a subscriber puts these statements on THEIR OWN domain.
//
// For Agency this is not an optional extra. An Agency subscriber pays to remove our
// branding, and a datarightsos.com URL in their client's footer undoes that — so on
// Agency the guide is expanded by default and framed as a setup step.
export default function StatementRewriteGuide({ site, isAgency, urls }) {
  const [open, setOpen] = useState(!!isAgency);
  const [copied, setCopied] = useState(false);

  const first = urls[0];
  const nginx = `location /privacy-policy {
  proxy_pass ${first ? first.url : ''};
}`;

  const netlify = `# netlify.toml / _redirects — one line per statement
${urls.map((u) => `/${u.path}  ${u.url}  200`).join('\n')}`;

  function copy() {
    navigator.clipboard.writeText(netlify);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`rounded-lg border px-4 py-3 ${isAgency ? 'border-amber-300 bg-amber-50' : 'border-border bg-muted/40'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        <span className="text-[11px] font-semibold text-foreground">
          {isAgency
            ? 'Required for white-label: serve these on your client\'s own domain'
            : 'Optional: serve these on your own domain instead'}
        </span>
      </button>

      {open && (
        <div className="mt-2 pl-5 space-y-3">
          {isAgency && (
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Your plan removes the DataRightsOS badge, but the statement URLs above still
              point at <strong>datarightsos.com</strong>. Anyone who clicks a statement link
              in your client's footer will see our domain in their address bar. Adding the
              rewrite below keeps the URL on your client's domain — do this before you hand
              the site over.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Add a rewrite (not a redirect — a redirect still shows our URL) on{' '}
            <strong>{site.domain}</strong> so a clean path on your own domain serves the
            statement page. The page is plain HTML, so it works behind any proxy.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Netlify / Vercel
              </p>
              <button
                onClick={copy}
                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-background border border-border rounded-md px-3 py-2 text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed">
              {netlify}
            </pre>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              nginx / Apache (one block per statement)
            </p>
            <pre className="bg-background border border-border rounded-md px-3 py-2 text-[10px] font-mono whitespace-pre-wrap break-all leading-relaxed">
              {nginx}
            </pre>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Once the rewrite is live, use your own URLs in the footer snippet above — and
            tell us if you'd rather we host these on a domain you control. That needs work
            on our side, not yours.
          </p>
        </div>
      )}
    </div>
  );
}