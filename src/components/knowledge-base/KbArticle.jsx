export default function KbArticle({ section }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{section.summary}</p>

      <div className="mt-4 rounded-lg bg-primary/5 border border-primary/15 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
          Why it matters
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">{section.why}</p>
      </div>

      <ul className="mt-4 space-y-2.5">
        {section.points.map((p) => (
          <li key={p.label} className="text-sm leading-relaxed">
            <span className="font-medium text-foreground">{p.label}:</span>{' '}
            <span className="text-muted-foreground">{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}