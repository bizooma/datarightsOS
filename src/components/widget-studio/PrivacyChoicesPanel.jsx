import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { privacyChoicesUrl } from '@/lib/statementUrls';

// The public address of this site's "Your Privacy Choices" opt-out page, plus a static
// anchor for the subscriber's own footer (the injected link needs JavaScript; this one
// doesn't). The page is a mechanism, not a statement — it exists whether or not any
// legal statement has been written, so this panel never depends on published content.
export default function PrivacyChoicesPanel({ site, plan }) {
  const [copied, setCopied] = useState(false);
  const slug = site.slug || site.site_key;
  if (!slug) return null;

  const url = privacyChoicesUrl(slug);
  const snippet = `<a href="${url}">Your Privacy Choices</a>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Your Privacy Choices (opt-out page)</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          A plain HTML page where a visitor can submit an opt-out of the sale or sharing of
          their personal information. It says nothing about whether you sell or share data —
          it only gives visitors a working place to record a choice.
        </p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 font-medium break-all"
      >
        Your Privacy Choices
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">Footer Snippet</p>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="bg-muted/60 border border-border rounded-lg px-4 py-3 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
          {snippet}
        </pre>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
          The widget also injects this link automatically, but that version needs JavaScript.
          Pasting it into your footer makes it visible to every crawler and scanner.
          {plan === 'agency' && (
            <>
              {' '}On your plan you can serve it from your own domain instead — use the same
              rewrite instructions shown above for your statement pages, pointing at{' '}
              <code className="font-mono">/functions/privacyChoices</code>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}