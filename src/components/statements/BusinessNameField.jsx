import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

// The fix, inline. Sending someone to Settings to type one field they were just
// told about is how the field stays empty.
//
// Writes through updateOrganizationSettings (business_name is already whitelisted
// there) rather than the entity directly, because Organization RLS write is
// admin-only — a direct update would silently fail for an owner.
export default function BusinessNameField({ orgId, onSaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const save = async () => {
    const name = value.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke('updateOrganizationSettings', {
        organization_id: orgId,
        updates: { business_name: name },
      });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Business name saved — your statement pages are live.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.message || 'Could not save the business name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3">
      <label htmlFor="drs-business-name" className="block text-[11px] font-semibold mb-1.5">
        Business name
      </label>
      <div className="flex items-start gap-2">
        <Input
          id="drs-business-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          placeholder="e.g. Acme Legal Group, LLC"
          className="h-9 text-sm bg-white max-w-sm"
          disabled={saving}
        />
        <Button size="sm" className="h-9" onClick={save} disabled={saving || !value.trim()}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Publish'}
        </Button>
      </div>
      <p className="text-[11px] mt-1.5 opacity-80">
        Use the legal entity name your policies should be published under, not a brand or domain.
      </p>
    </div>
  );
}