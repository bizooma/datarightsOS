import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, LogIn, X, Check, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Organizations() {
  const { isSuperAdmin, loading, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [impersonatingOrgId, setImpersonatingOrgId] = useState(
    () => sessionStorage.getItem('dros_impersonate_org') || null
  );
  const [showCreate, setShowCreate] = useState(false);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date'),
    enabled: isSuperAdmin,
  });

  const createOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      toast.success('Organization created');
      setShowCreate(false);
    },
  });

  if (!loading && !isSuperAdmin) return <Navigate to="/" replace />;

  function impersonate(org) {
    sessionStorage.setItem('dros_impersonate_org', org.id);
    sessionStorage.setItem('dros_impersonate_org_name', org.name);
    setImpersonatingOrgId(org.id);
    toast.success(`Now working as: ${org.name}`);
    window.location.href = '/';
  }

  function clearImpersonation() {
    sessionStorage.removeItem('dros_impersonate_org');
    sessionStorage.removeItem('dros_impersonate_org_name');
    setImpersonatingOrgId(null);
    toast.success('Returned to super admin view');
  }

  const planColors = {
    trial: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-primary/10 text-primary',
    agency: 'bg-amber-50 text-amber-700',
  };

  const billingColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    canceled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage all tenant organizations (Super Admin)"
        actions={
          <div className="flex items-center gap-2">
            {impersonatingOrgId && (
              <Button size="sm" variant="outline" className="h-9 text-sm text-amber-700 border-amber-300" onClick={clearImpersonation}>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Exit Impersonation
              </Button>
            )}
            <Button size="sm" className="h-9 text-sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Organization
            </Button>
          </div>
        }
      />

      {impersonatingOrgId && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚡ You are impersonating: <strong>{sessionStorage.getItem('dros_impersonate_org_name')}</strong>.
          All actions you take will affect this organization. <button className="underline ml-1" onClick={clearImpersonation}>Exit</button>
        </div>
      )}

      {showCreate && (
        <CreateOrgForm
          onSubmit={(data) => createOrgMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isPending={createOrgMutation.isPending}
        />
      )}

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Organization</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Plan</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Billing</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Brand Color</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Building2} title="No organizations" description="Organizations will appear here." />
                </td>
              </tr>
            ) : (
              orgs.map(org => (
                <tr key={org.id} className={`hover:bg-muted/40 transition-colors ${impersonatingOrgId === org.id ? 'bg-amber-50/60' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-[11px] text-muted-foreground">{org.white_label_product_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={`text-[11px] capitalize ${planColors[org.plan] || ''}`}>
                      {org.plan}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${billingColors[org.billing_status] || ''}`}>
                      {org.billing_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: org.brand_primary_color || '#0d7d74' }} />
                      <span className="text-[12px] font-mono text-muted-foreground">{org.brand_primary_color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {org.created_date ? new Date(org.created_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {impersonatingOrgId === org.id ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-amber-700 border-amber-300" onClick={clearImpersonation}>
                        <X className="w-3 h-3 mr-1" />Exit
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => impersonate(org)}>
                        <LogIn className="w-3 h-3 mr-1" />
                        Enter
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateOrgForm({ onSubmit, onCancel, isPending }) {
  const [form, setForm] = useState({
    name: '',
    plan: 'trial',
    white_label_product_name: 'Privacy & Data Rights Center',
    brand_primary_color: '#0d7d74',
    billing_status: 'active',
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">New Organization</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Organization Name *</Label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" placeholder="Acme Corp" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Plan</Label>
          <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
          <Input value={form.white_label_product_name} onChange={e => setForm({ ...form, white_label_product_name: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Brand Color</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.brand_primary_color} onChange={e => setForm({ ...form, brand_primary_color: e.target.value })} className="w-9 h-9 rounded border border-border cursor-pointer" />
            <Input value={form.brand_primary_color} onChange={e => setForm({ ...form, brand_primary_color: e.target.value })} className="h-9 text-sm font-mono w-28" />
          </div>
        </div>
        <div className="col-span-2 flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="h-9" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="h-9" onClick={() => onSubmit(form)} disabled={!form.name.trim() || isPending}>
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Create Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}