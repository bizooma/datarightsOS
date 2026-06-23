import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { appParams } from '@/lib/app-params';

export default function EmbedSnippet({ site }) {
  const [copied, setCopied] = useState(false);
  const baseUrl = (appParams.appBaseUrl || window.location.origin).replace(/\/$/, '');
  const snippet = `<script src="${baseUrl}/api/widgetJs" data-tessera-site="${site.site_key}"></script>`;

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
    </div>
  );
}