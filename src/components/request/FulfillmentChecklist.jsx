import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Check, CheckCircle2, Circle, MinusCircle, Loader2, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import {
  checklistProgress,
  canMarkComplete,
  isItemSatisfied,
} from '@/lib/fulfillmentChecklist';

export default function FulfillmentChecklist({ request, actions, userMap = {} }) {
  const checklist = request.fulfillment_checklist || [];
  const [pendingKey, setPendingKey] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Lazily initialize a checklist if this request predates the feature.
  useEffect(() => {
    if (!Array.isArray(request.fulfillment_checklist) || request.fulfillment_checklist.length === 0) {
      actions.ensureChecklist(request);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id]);

  if (!checklist.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
          Preparing fulfillment checklist…
        </CardContent>
      </Card>
    );
  }

  const { complete, total } = checklistProgress(checklist);
  const pct = total ? Math.round((complete / total) * 100) : 0;
  const isComplete = request.request_status === 'fulfilled';
  const completable = canMarkComplete(checklist);
  const locked = isComplete || request.request_status === 'denied';

  async function handleToggle(item) {
    if (locked || pendingKey) return;
    setPendingKey(item.key);
    try {
      await actions.toggleChecklistItem(request, item.key);
    } finally {
      setPendingKey(null);
    }
  }

  async function handleToggleNA(item) {
    if (locked || pendingKey) return;
    setPendingKey(item.key);
    try {
      await actions.toggleChecklistItemApplicable(request, item.key);
    } finally {
      setPendingKey(null);
    }
  }

  async function handleMarkComplete() {
    if (!completable || completing) return;
    setCompleting(true);
    try {
      await actions.markComplete(request);
    } finally {
      setCompleting(false);
    }
  }

  function actorName(email) {
    if (!email) return '';
    const u = Object.values(userMap).find(u => u.email === email);
    return u?.full_name || email;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            Fulfillment Checklist
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            {complete} / {total} steps complete
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted mt-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {checklist.map((item) => {
          const na = !item.required && item.applicable === false;
          const satisfied = isItemSatisfied(item);
          const busy = pendingKey === item.key;
          return (
            <div
              key={item.key}
              className={`flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors ${
                na ? 'bg-muted/40' : satisfied ? 'bg-emerald-50/60' : 'hover:bg-muted/40'
              }`}
            >
              {/* Checkbox / status icon */}
              <button
                type="button"
                onClick={() => handleToggle(item)}
                disabled={locked || busy || na}
                className="mt-0.5 shrink-0 disabled:cursor-not-allowed"
                title={na ? 'Marked not applicable' : item.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {busy ? (
                  <Loader2 className="w-[18px] h-[18px] text-muted-foreground animate-spin" />
                ) : na ? (
                  <MinusCircle className="w-[18px] h-[18px] text-muted-foreground" />
                ) : item.done ? (
                  <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" />
                ) : (
                  <Circle className="w-[18px] h-[18px] text-muted-foreground/50" />
                )}
              </button>

              {/* Label + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm ${na ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.label}
                  </p>
                  {item.required ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">Required</span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Situational</span>
                  )}
                  {na && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">N/A</span>
                  )}
                </div>
                {item.done && item.done_at && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    by {actorName(item.done_by)} · {format(new Date(item.done_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                )}
              </div>

              {/* Not-applicable toggle (situational items only) */}
              {!item.required && !locked && (
                <button
                  type="button"
                  onClick={() => handleToggleNA(item)}
                  disabled={busy}
                  className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                    na
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {na ? 'Applicable' : 'Not applicable'}
                </button>
              )}
            </div>
          );
        })}

        {/* Mark Complete */}
        <div className="pt-3 mt-2 border-t border-border">
          {isComplete ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <Check className="w-4 h-4" />
              Completed
              {request.completed_at && (
                <span className="text-muted-foreground">
                  by {actorName(request.completed_by)} · {format(new Date(request.completed_at), 'MMM d, yyyy · h:mm a')}
                </span>
              )}
            </div>
          ) : (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span wrapper so the tooltip works on a disabled button */}
                  <span className="inline-block">
                    <Button
                      size="sm"
                      onClick={handleMarkComplete}
                      disabled={!completable || completing || locked}
                      className="h-9 text-sm gap-1.5"
                    >
                      {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Mark Complete
                    </Button>
                  </span>
                </TooltipTrigger>
                {!completable && (
                  <TooltipContent>Finish the required steps first.</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}