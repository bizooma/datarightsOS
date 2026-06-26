import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import BizoomaSection from '@/components/marketing/BizoomaSection';
import { Mail, LifeBuoy, Briefcase } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-3">Contact Us</h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Have a question about Data Rights OS, need help with your account, or want to talk about pricing?
          Reach out and our team will get back to you.
        </p>

        <div className="space-y-4">
          <a href="mailto:support@datarightsos.com" className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Support</p>
              <p className="text-sm text-muted-foreground">support@datarightsos.com</p>
            </div>
          </a>

          <a href="mailto:sales@datarightsos.com" className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Sales</p>
              <p className="text-sm text-muted-foreground">sales@datarightsos.com</p>
            </div>
          </a>

          <a href="mailto:hello@bizooma.com" className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">General Inquiries</p>
              <p className="text-sm text-muted-foreground">hello@bizooma.com</p>
            </div>
          </a>
        </div>
      </main>
      <BizoomaSection />
      <MarketingFooter />
    </div>
  );
}