const audiences = [
  {
    image: 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/5156a4c1f_generated_image.png',
    title: 'Law firms',
    description:
      'Advise clients on state privacy law and hand them a fully functional compliance tool. Add your branding, hand off the dashboard, bill the management fee.',
  },
  {
    image: 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/8f564f100_generated_image.png',
    title: 'Digital agencies',
    description:
      'Add a privacy compliance offering to your web projects. White-label the widget with client branding. Manage dozens of sites from a single agency seat.',
  },
  {
    image: 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/e1df6f9b7_generated_image.png',
    title: 'Resellers',
    description:
      'The Agency plan supports multi-tenant organizations. Set your own pricing, use your own product name, and give each client their own isolated dashboard.',
  },
];

export default function AudienceSection() {
  return (
    <section id="who" className="bg-[#14202b] py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Built for the people who manage privacy, not just the people who need it.
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            White-label and reseller friendly from day one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((a) => (
            <div key={a.title} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg shadow-black/20 hover:bg-white/[0.07] transition-colors overflow-hidden">
              <div className="h-36 w-full overflow-hidden">
                <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-white mb-2">{a.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{a.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}