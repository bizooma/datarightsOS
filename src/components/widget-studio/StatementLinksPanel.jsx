import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { statementUrl, STATEMENT_TYPES, STATEMENT_LABELS, STATEMENT_SLUGS } from '@/lib/statementUrls';
import StatementRewriteGuide from '@/components/widget-studio/StatementRewriteGuide';

// The public, crawlable address of each published statement — plus a static block of
// plain anchors for the subscriber's own footer.
//
// Only PUBLISHED statements are listed. Linking to a statement that was never written
// would hand a visitor (or a scanner) a 404, which is worse than no link at all.
export default function StatementLinksPanel({ site, plan }) {
  const [copied, setCopied] = useState(false);

  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['legalStatements', site.id],
    queryFn: () => base44.entities.LegalStatement.filter({ site: site.id, is_active: true }),
  });

  const slug = site.slug || site.site_key;
  const published = STATEMENT_TYPES.map((type) => {
    const s = statements.find((x) => x.statement_type === type && x.body);
    if (!s) return null;
    return {
      type,
      label: s.title || STATEMENT_LABELS[type],
      path: STATEMENT_SLUGS[type],
      url: statementUrl(slug, type),
    };
  }).filter(Boolean);

  const snippet = published
    .map((p) => `<a href="${p.url}">${p.label}</a>`)
    .join('\n');

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return null;

  if (published.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Public Statement Pages</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Nothing to publish yet. Write a statement in the <strong>Legal Statements</strong>{' '}
          tab and it gets its own public web address here — a real page that search engines
          and compliance scanners can read, not just a panel inside the widget.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Public Statement Pages</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Each published statement has its own permanent web address. These pages are plain
          HTML — readable without JavaScript, so search engines and compliance scanners can
          actually see the text.
        </p>
      </div>

      <ul className="space-y-1">
        {published.map((p) => (
          <li key={p.type} className="flex items-start gap-2">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 font-medium break-all"
            >
              {p.label}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </li>
        ))}
      </ul>

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
          Paste these into your site's footer so your statements are findable by search
          engines and compliance scanners, not just inside the widget.
        </p>
      </div>

      <StatementRewriteGuide site={site} isAgency={plan === 'agency'} urls={published} />
    </div>
  );
}