import {
  NEXT_STEPS_AMBER,
  NEXT_STEPS_CLEAR,
  NEXT_STEPS_CLOSER,
  flaggedLabels,
} from '@/components/scan/reportText';

export default function NextSteps({ scan }) {
  const hasFlagged = flaggedLabels(scan.findings?.checks || {}).length > 0;
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2">
        What to do next
      </h3>
      <p className="text-sm text-foreground leading-relaxed">
        {hasFlagged ? NEXT_STEPS_AMBER : NEXT_STEPS_CLEAR}
      </p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{NEXT_STEPS_CLOSER}</p>
    </div>
  );
}