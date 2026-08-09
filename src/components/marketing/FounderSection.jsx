export default function FounderSection() {
  return (
    <section className="mt-14 pt-10 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">The person behind it</h2>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Headshot placeholder — replace src with Joseph Murphy's photo */}
        <div
          className="w-28 h-28 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center text-center text-xs text-muted-foreground px-2"
          aria-label="Founder headshot placeholder"
        >
          Headshot
          <br />
          placeholder
        </div>
        <div className="space-y-3 text-muted-foreground leading-relaxed">
          <div>
            <p className="text-foreground font-semibold">Joseph Murphy</p>
            <p className="text-sm">Owner, Bizooma LLC</p>
          </div>
          <p>
            A client forwarded me an email from one of their customers asking to delete their data,
            and asked me what they were supposed to do with it. They had four compliance widgets
            installed on their site — and not one of them answered that email. That was the whole
            problem in a single message: the banners were up, but the moment a real request came in,
            nobody knew what happened next. I built Data Rights OS to answer that email.
          </p>
        </div>
      </div>
    </section>
  );
}