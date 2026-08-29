// The live widget panel, moved out of the hero. The scan establishes that there's
// something to look at; this answers "what am I actually buying." Same panel and
// same supporting line as before — only its position on the page changed.
export default function WidgetShowcaseSection() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] leading-tight">
            This is what goes on your site.
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            That panel isn't a mockup — it's running on this page right now. Click the pill in the
            lower-left corner and you'll get exactly what your visitors get.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            One widget covers cookie consent, AI disclosure, accessibility, and privacy requests. The
            dashboard behind it runs the response clock and records how you answered.
          </p>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-[340px] md:max-w-[380px] max-h-[300px] md:max-h-[520px] overflow-hidden rounded-2xl shadow-2xl shadow-black/30 ring-1 ring-slate-200">
            <img
              src="https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/378347495_widget1.png"
              alt="The DataRightsOS privacy widget open on a website, showing cookie consent choices, privacy rights request intake, accessibility reporting, and AI disclosure."
              className="w-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}