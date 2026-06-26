import { Building2, Users, Globe } from 'lucide-react';

const audiences = [
  {
    icon: Building2,
    title: 'Law firms',
    description:
      'Advise clients on state privacy law and hand them a fully functional compliance tool. Add your branding, hand off the dashboard, bill the management fee.',
  },
  {
    icon: Users,
    title: 'Digital agencies',
    description:
      'Add a privacy compliance offering to your web projects. White-label the widget with client branding. Manage dozens of sites from a single agency seat.',
  },
  {
    icon: Globe,
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
            <div key={a.title} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg shadow-black/20 hover:bg-white/[0.07] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-[#0d7d74]/20 border border-[#0d7d74]/30 flex items-center justify-center mb-4">
                <a.icon className="w-4.5 h-4.5 text-[#16b3a6]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{a.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}