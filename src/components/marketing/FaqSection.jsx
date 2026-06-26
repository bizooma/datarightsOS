import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'Is this just another cookie banner or accessibility widget?',
    a: 'No. The widget is the front door. The real system is behind it: a workflow that captures, verifies, tracks, and proves your response to every privacy and accessibility request, with a complete audit trail. Banners display text. DataRightsOS manages the legal obligation that starts the moment someone clicks.',
  },
  {
    q: 'How do you stop someone from filing a deletion request for another person?',
    a: "Every request requires email verification. When a request is submitted, we send the email address on file a one-time, single-use, expiring confirmation link. Nothing becomes actionable until that person clicks it and proves they control the inbox. That closes the most common abuse in privacy tooling: a stranger trying to access or delete data that isn't theirs. Your \"verified\" record then means something real.",
  },
  {
    q: 'What happens the moment a request comes in?',
    a: "The 45-day clock starts (that's the CCPA/CPRA response window). We immediately email the requester to confirm receipt and verify identity, create the request in your dashboard, and begin a live countdown. As the deadline approaches, your team gets reminders so nothing slips.",
  },
  {
    q: 'How do I prove to a regulator or a court that I actually handled a request?',
    a: 'Every action is written to an immutable audit trail: when the request arrived, when identity was verified and how, each system the data was cleared from, who did it, and when you responded to the requester. A checkbox is not proof. A timestamped, itemized record is, and that record is your defense if you\'re ever audited or sued.',
  },
  {
    q: "Do you delete my customers' data for me automatically?",
    a: "We don't reach into your systems, and you should be cautious of any tool that claims it can erase data everywhere automatically. Instead, DataRightsOS gives your team a guided, per-system checklist (your CRM, email platform, billing, backups) so each location is cleared and proven, and it connects to Zapier to help action removals in the tools you already use. You stay in control; we make sure nothing is missed and everything is documented.",
  },
  {
    q: 'Does this make me ADA or WCAG "compliant"?',
    a: 'No tool can make you compliant, and any that promises it is a legal risk to you. DataRightsOS provides a proper accessibility statement and a "report a barrier" channel that routes complaints into the same tracked-and-proven workflow as your privacy requests. Real accessibility comes from an accessible site; we give you the statement, the intake, and the audit trail that show good-faith effort.',
  },
  {
    q: 'Which laws does this help with?',
    a: "US state privacy laws including CCPA/CPRA (California), VCDPA (Virginia), CTDPA (Connecticut) and the growing list of others, plus AI use disclosure and cookie consent. The widget shows the statement that applies to each visitor's state.",
  },
  {
    q: 'What if a requester never confirms their identity?',
    a: "If they never click the verification link, the request expires and you're not obligated to act on it. The attempt is still logged. \"We asked them to verify and they didn't\" is itself a defensible record, and it keeps unverified or abusive requests from clogging your team's queue.",
  },
  {
    q: 'Do you tell the requester when their request is done?',
    a: 'Yes. When you mark a request complete, the requester automatically receives a confirmation from your business\'s identity, not ours. Closing the loop in writing lowers the odds of a complaint and is part of a defensible response.',
  },
  {
    q: 'How long do you keep my records?',
    a: 'Core keeps request and audit records for one year; Proof and Agency keep them indefinitely. For a compliance record, longer is safer, because audits and lawsuits can look back years after a request was handled.',
  },
  {
    q: 'Can it look like my own brand?',
    a: 'Your logo appears at the top of the widget on every plan. On the Agency plan you can fully white-label it, including using your own product name and removing the "Powered by DataRightsOS" badge.',
  },
  {
    q: 'Can it work with the tools I already use?',
    a: 'Yes. An outbound webhook sends each new request to Zapier or your own systems, so you can automatically create a task, alert your team in Slack, or kick off removals in connected apps the moment a verified request arrives.',
  },
  {
    q: 'Who is this for?',
    a: "Any business that collects personal information through its website and faces multi-state privacy and accessibility obligations, especially those without a legal or privacy team on staff: law firms, agencies and their clients, local and regional service businesses. If you'd struggle to prove how you handled a deletion request from two years ago, this is for you.",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[#0d7d74] text-xs font-semibold bg-[#0d7d74]/8 border border-[#0d7d74]/20 px-3 py-1.5 rounded-full mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently asked questions
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#14202b] leading-tight">
            Questions, answered straight.
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-white border border-slate-200 rounded-xl px-5 data-[state=open]:border-[#0d7d74]/30"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-[#14202b] hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed text-sm pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}