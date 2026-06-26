import { useState } from 'react';
import { ChevronDown, ListChecks, Zap } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CHECKLIST_HEADING, CHECKLIST_INTRO, CHECKLIST_STEPS, CHECKLIST_DISCLAIMER,
  ZAPIER_HEADING, ZAPIER_INTRO, ZAPIER_STEPS, ZAPIER_NOTE,
} from './fulfillmentContent';

function StepList({ steps }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed">{step.text}</p>
            {step.sub && (
              <ul className="mt-1.5 space-y-1 list-disc pl-5">
                {step.sub.map((s, j) => (
                  <li key={j} className="text-sm text-muted-foreground leading-relaxed">{s}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function FulfillmentGuidePanel({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4 rounded-lg border border-border bg-muted/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">How to fulfill a request</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <Tabs defaultValue="checklist" className="mt-3">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="checklist" className="gap-1.5 text-xs sm:text-sm">
                <ListChecks className="w-3.5 h-3.5" /> Fulfillment checklist
              </TabsTrigger>
              <TabsTrigger value="zapier" className="gap-1.5 text-xs sm:text-sm">
                <Zap className="w-3.5 h-3.5" /> Automate with Zapier
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-4">
              <h3 className="text-base font-semibold text-foreground">{CHECKLIST_HEADING}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">{CHECKLIST_INTRO}</p>
              <StepList steps={CHECKLIST_STEPS} />
              <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">{CHECKLIST_DISCLAIMER}</p>
            </TabsContent>

            <TabsContent value="zapier" className="mt-4">
              <h3 className="text-base font-semibold text-foreground">{ZAPIER_HEADING}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">{ZAPIER_INTRO}</p>
              <StepList steps={ZAPIER_STEPS} />
              <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">{ZAPIER_NOTE}</p>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}