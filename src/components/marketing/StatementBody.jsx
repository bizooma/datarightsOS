import { useEffect, useState } from 'react';
import { statementUrl, STATEMENT_SLUGS } from '@/lib/statementUrls';

// Renders one of our own published legal statements FROM the statement source, so
// this branded page and the statement URL serve the same document and cannot drift.
// The text is not duplicated in this file on purpose — there is one copy of it, in
// the statement body, and both URLs read it.
export default function StatementBody({ slug, type, fallbackHeading }) {
  const [state, setState] = useState({ loading: true, data: null, failed: false });

  useEffect(() => {
    let live = true;
    const typeSlug = STATEMENT_SLUGS[type] || type;
    fetch(`/functions/statement?site=${encodeURIComponent(slug)}&type=${encodeURIComponent(typeSlug)}&format=json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unavailable'))))
      .then((d) => { if (live) setState({ loading: false, data: d, failed: !d?.body }); })
      .catch(() => { if (live) setState({ loading: false, data: null, failed: true }); });
    return () => { live = false; };
  }, [slug, type]);

  const { loading, data, failed } = state;
  const heading = data?.heading || fallbackHeading;
  const metaBits = [];
  if (data?.effective_date) metaBits.push(`Effective date: ${data.effective_date}`);
  if (data?.version) metaBits.push(`Version ${data.version}`);

  return (
    <>
      <section className="bg-[#14202b] text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{heading}</h1>
          {metaBits.length > 0 && (
            <p className="mt-4 text-sm text-slate-300">{metaBits.join(' · ')}</p>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading the current version…</p>
        )}

        {/* The text must never appear to be missing when it is simply unreachable —
            the direct URL always serves it without JavaScript. */}
        {!loading && failed && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-foreground font-medium">This page could not load the current text.</p>
            <p className="text-sm text-muted-foreground mt-1">
              You can read it directly at{' '}
              <a className="text-primary underline" href={statementUrl(slug, type)}>
                the published statement
              </a>
              .
            </p>
          </div>
        )}

        {!loading && !failed && (
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[15px] prose-li:text-muted-foreground prose-li:text-[15px] prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: data.body }}
          />
        )}
      </section>
    </>
  );
}