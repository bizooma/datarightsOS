import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// The two former halves of install_status, now shown as what they actually are.
//
// install_status is INFORMATIONAL and read-only in the UI — it is set one-way by the
// widget endpoints and means "we have seen a config fetch or event for this site".
// It decides nothing.
//
// service_status is ENTITLEMENT and is the only thing that gates rendering. It is not
// editable by the subscriber at all: the control below appears for DataRightsOS
// platform admins only, and even then it writes through a backend function, because
// Site RLS grants write to any member of the owning organization and a subscriber must
// never be able to restore their own service. Every change is audited.
export default function ServiceStatusPanel({ site, isSuperAdmin }) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const installed = site.install_status === 'installed';
  const serviceActive = (site.service_status || 'active') === 'active';

  const setStatus = async (next) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('setSiteServiceStatus', {
        site_id: site.id,
        service_status: next,
        reason: next === 'suspended' ? 'suspended manually by support' : 'restored manually by support',
      });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success(next === 'active' ? 'Service restored' : 'Service suspended');
    } catch (err) {
      toast.error(err?.message || 'Could not change service status');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Widget Installation</Label>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${installed ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
          <span className="text-sm">{installed ? 'Widget has loaded on this site' : 'Not seen yet'}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Informational only. This turns on the first time we see the widget fetch its
          configuration and never turns off. It does not affect whether your widget runs.
        </p>
      </div>

      <div className="pt-2 border-t border-border">
        <Label className="text-xs text-muted-foreground mb-1.5 block">Service Status</Label>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${serviceActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{serviceActive ? 'Active — your widget is being served' : 'Suspended'}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {serviceActive
            ? 'Set by your billing status. Your widget keeps running on the free plan — an ended trial does not suspend service.'
            : 'Your widget is not being served. Contact support if you believe this is wrong.'}
        </p>

        {isSuperAdmin && (
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={busy}
              onClick={() => setStatus(serviceActive ? 'suspended' : 'active')}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              {serviceActive ? 'Suspend service (admin)' : 'Restore service (admin)'}
            </Button>
            <span className="text-[11px] text-muted-foreground">Audited with your email.</span>
          </div>
        )}
      </div>
    </div>
  );
}