import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

export default function EmbedSnippet({ site }) {
  const [copied, setCopied] = useState(false);
  const APP_ID = '6a3735f4f27dcb14405892ae';
  const snippet = `<script src="https://api.base44.app/api/apps/${APP_ID}/functions/widgetJs" data-tessera-site="${site.site_key}"></script>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Embed Snippet</p>
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
      <p className="text-[11px] text-muted-foreground">
        Paste this into the <code className="bg-muted px-1 rounded">&lt;head&gt;</code> of any page on <strong>{site.domain}</strong>.
      </p>
      <div className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] font-medium text-foreground">Using WordPress?</p>
        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          You don't need to edit your theme files. Just install the free{' '}
          <strong>WPCode</strong> plugin, then add the snippet above as a new header
          code snippet.
        </p>
        <a
          href="https://library.wpcode.com/?ref=201"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Download WPCode
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}