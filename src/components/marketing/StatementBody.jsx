import { useEffect, useState } from 'react';
import { statementUrl, STATEMENT_SLUGS } from '@/lib/statementUrls';

// Renders one of our own published legal statements FROM the statement source, so
// this branded page and the statement URL serve the same document.
//
// OPTIONAL `fallback`: a build-time copy of the text, rendered immediately and then
// replaced by the fetched copy when it arrives. A legal document must never be behind
// a spinner or an error — so the text ships in the bundle and the fetch only upgrades
// it. If the fetch fails outright, the copy stays and a notice says it may be out of
// date, because a bundled copy can lag the published one and the reader has to be able
// to tell. Pages without a fallback keep the previous behavior (link to the statement).
export default function StatementBody({ slug, type, fallbackHeading, fallback }) {
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
  // Serving the bundled text whenever the fetched text is not on the page yet —
  // while the fetch is in flight AND if it fails. The text is therefore present in
  // the very first render, which matters twice over: a reader never waits on a
  // spinner for a legal document, and a crawler or scanner that snapshots the page
  // early still finds the policy instead of an empty shell. The fetched copy
  // replaces it the moment it lands.
  const usingFallback = !!fallback?.html && (loading || failed);
  const heading = data?.heading || (usingFallback && fallback.heading) || fallbackHeading;
  const effectiveDate = data?.effective_date || (usingFallback ? fallback.effective_date : '');
  const version = data?.version || (usingFallback ? fallback.version : '');
  const metaBits = [];
  if (effectiveDate) metaBits.push(`Effective date: ${effectiveDate}`);
  if (version) metaBits.push(`Version ${version}`);

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
        {loading && !usingFallback && (
          <p className="text-sm text-muted-foreground">Loading the current version…</p>
        )}

        {/* The notice appears only on actual FAILURE. While the fetch is still in
            flight the bundled text is almost certainly current, and warning about
            staleness on every page load would cry wolf. */}
        {failed && usingFallback && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 mb-8">
            <p className="text-sm text-amber-900">
              We couldn't reach the live version of this document just now, so the text below is a
              saved copy and may not reflect the most recent update. The current version is always
              available at{' '}
              <a className="font-medium underline" href={statementUrl(slug, type)}>
                the published statement
              </a>
              .
            </p>
          </div>
        )}

        {/* No bundled copy for this statement — point at the URL that always serves
            the text without JavaScript. */}
        {!loading && failed && !usingFallback && (
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

        {(usingFallback || (!loading && !failed)) && (
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-[15px] prose-li:text-muted-foreground prose-li:text-[15px] prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: usingFallback ? fallback.html : data.body }}
          />
        )}
      </section>
    </>
  );
}