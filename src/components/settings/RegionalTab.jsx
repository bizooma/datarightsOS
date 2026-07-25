import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Check, Globe, Wand2 } from 'lucide-react';
import {
  TIMEZONE_OPTIONS,
  DEFAULT_TIMEZONE,
  detectTimezone,
  formatInTimezone,
  timezoneLabel,
} from '@/lib/timezone';

export default function RegionalTab({ org }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [timezone, setTimezone] = useState(org.timezone || DEFAULT_TIMEZONE);

  // If the org's timezone isn't in our curated list, add it so the Select can show it.
  const options = TIMEZONE_OPTIONS.some(o => o.value === timezone)
    ? TIMEZONE_OPTIONS
    : [{ value: timezone, label: timezoneLabel(timezone) }, ...TIMEZONE_OPTIONS];

  const detected = detectTimezone();
  const detectedIsDifferent = detected && detected !== timezone;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateOrganizationSettings', { organization_id: org.id, updates: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Timezone saved', description: 'Dashboard dates now display in your timezone.' });
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err?.message || 'Could not save your timezone.', variant: 'destructive' });
    },
  });

  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          Timezone
        </CardTitle>
        <CardDescription className="text-xs">
          Deadlines, key dates, and audit timestamps are displayed in this timezone across the dashboard.
          Records are always stored in UTC — this only affects how dates are shown to your team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Organization Timezone</Label>
          <div className="flex items-center gap-2">
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-9 text-sm flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {options.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 text-sm gap-1.5 shrink-0"
              onClick={() => setTimezone(detected)}
              title="Use the timezone detected from your browser"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Detect
            </Button>
          </div>
          {detectedIsDifferent && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Your browser is currently in <span className="font-medium text-foreground">{timezoneLabel(detected)}</span>.
            </p>
          )}
        </div>

        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">Current time in this timezone</p>
          <p className="text-sm font-medium tabular-nums mt-0.5">
            {formatInTimezone(now, timezone, { withTime: true, withZone: true })}
          </p>
        </div>

        <Button
          size="sm"
          className="h-9 text-sm"
          onClick={() => updateMutation.mutate({ timezone })}
          disabled={updateMutation.isPending || timezone === (org.timezone || DEFAULT_TIMEZONE)}
        >
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Save Timezone
        </Button>
      </CardContent>
    </Card>
  );
}