import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

export default function ColumnHeader({ label, what, captured }) {
  return (
    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help">
              {label}
              <Info className="w-3 h-3 text-muted-foreground/60" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs normal-case tracking-normal text-left p-3 space-y-1.5">
            <p className="text-[12px] leading-relaxed">{what}</p>
            <p className="text-[11px] leading-relaxed text-primary-foreground/70">
              <span className="font-semibold">How it's captured: </span>{captured}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </th>
  );
}