import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus } from 'lucide-react';
import { SAMPLE_STATEMENTS } from './sampleStatements';

export default function SampleStatementDialog({ statementType, onInsert }) {
  const [open, setOpen] = useState(false);
  const sample = SAMPLE_STATEMENTS[statementType.key];

  if (!sample) return null;

  const handleInsert = () => {
    onInsert?.(sample);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary underline underline-offset-2 hover:no-underline inline-flex items-center gap-1">
          <FileText className="w-3 h-3" />
          View sample template
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Sample {statementType.label}</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground -mt-1">
          A generic starting point. Insert it into the editor, then replace the bracketed placeholders and tailor it to your site. This is not legal advice.
        </p>
        <div
          className="flex-1 overflow-y-auto rounded-md border border-border bg-muted/40 p-4 text-sm prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sample }}
        />
        <div className="flex justify-end">
          <Button size="sm" className="h-9 text-sm" onClick={handleInsert}>
            <FilePlus className="w-3.5 h-3.5 mr-1.5" />
            Insert into editor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}