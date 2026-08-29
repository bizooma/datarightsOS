import { CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  ANSWER_CLEAR,
  ANSWER_CLEAR_SUB,
  ANSWER_FLAGGED_SUB,
  answerHeadline,
  flaggedLabels,
} from '@/components/scan/reportText';

// The plain-language answer, directly under the summary. It says what WE
// OBSERVED and nothing about the reader's legal status.
export default function ScanAnswer({ scan }) {
  const checks = scan.findings?.checks || {};
  const labels = flaggedLabels(checks);

  if (labels.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">{ANSWER_CLEAR}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ANSWER_CLEAR_SUB}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#D89B2A] bg-[#FDF6E7] rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[#8A5F12] shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-foreground">{answerHeadline(labels.length)}</p>
        <ul className="mt-1.5 space-y-1">
          {labels.map((label) => (
            <li key={label} className="text-sm text-foreground">• {label}</li>
          ))}
        </ul>
        <p className="text-xs text-[#6B5220] mt-2 leading-relaxed">{ANSWER_FLAGGED_SUB}</p>
      </div>
    </div>
  );
}