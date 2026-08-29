// The scanner visits up to 3 pages (the submitted URL, plus a discovered privacy
// policy and accessibility statement). Naming them keeps the scope statement honest.
export default function PagesVisited({ pages }) {
  if (!pages?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Pages we checked</h3>
      <ul className="space-y-1">
        {pages.map((p, i) => (
          <li key={`${p.url}-${i}`} className="text-xs text-muted-foreground break-all">
            <span className="text-foreground/80">{p.url}</span>
            {p.kind ? <span className="text-muted-foreground"> — {p.kind}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}