import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Check, Copy, RefreshCw, Send, Webhook, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { canUseOutboundWebhook } from '@/lib/planLimits';

function generateSecret() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'whsec_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidHttpsUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

const PAYLOAD_EXAMPLE = `{
  "event": "request.created",
  "request_id": "<id>",
  "request_type": "delete" | "access" | "correct" | "opt_out",
  "status": "not_started",
  "requester": { "name": "<name>", "email": "<email>", "state": "<state>" },
  "authorized_agent": false,
  "submitted_at": "<ISO8601>",
  "deadline_at": "<ISO8601>",
  "site_id": "<id>",
  "organization_id": "<id>"
}`;

export default function IntegrationsTab({ org }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [url, setUrl] = useState(org.webhook_url || '');
  const [enabled, setEnabled] = useState(!!org.webhook_enabled);
  const [secret, setSecret] = useState(org.webhook_secret || '');
  const [urlError, setUrlError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('updateOrganizationSettings', { organization_id: org.id, updates: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Integration saved', description: 'Your outbound webhook settings have been updated.' });
    },
  });

  if (!canUseOutboundWebhook(org.plan)) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 justify-center text-center">
          <div>
            <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Integrations</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Outbound webhooks are available on paid plans. Upgrade to connect Zapier and other tools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function handleSave() {
    setUrlError('');
    if (url && !isValidHttpsUrl(url)) {
      setUrlError('Enter a valid HTTPS URL (http:// is not allowed).');
      return;
    }
    if (enabled && !url) {
      setUrlError('A webhook URL is required to enable delivery.');
      return;
    }
    // Auto-generate the signing secret on first save.
    let nextSecret = secret;
    if (!nextSecret) {
      nextSecret = generateSecret();
      setSecret(nextSecret);
    }
    saveMutation.mutate({ webhook_url: url, webhook_enabled: enabled, webhook_secret: nextSecret });
  }

  function handleRegenerate() {
    const next = generateSecret();
    setSecret(next);
    saveMutation.mutate({ webhook_secret: next });
    toast({ title: 'Secret regenerated', description: 'Update your endpoint with the new signing secret.' });
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    toast({ title: 'Copied', description: 'Signing secret copied to clipboard.' });
  }

  async function handleTest() {
    setTestResult(null);
    if (!isValidHttpsUrl(url)) {
      setUrlError('Enter a valid HTTPS URL before sending a test.');
      return;
    }
    setTesting(true);
    try {
      // Persist current URL/secret first so the backend test hits the latest values.
      let nextSecret = secret || generateSecret();
      if (!secret) setSecret(nextSecret);
      await base44.functions.invoke('updateOrganizationSettings', { organization_id: org.id, updates: { webhook_url: url, webhook_secret: nextSecret } });
      const res = await base44.functions.invoke('testOutboundWebhook', { organization_id: org.id });
      setTestResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    } catch (err) {
      setTestResult({ ok: false, http_code: 0, message: err.message });
    }
    setTesting(false);
  }

  // Plan gate — after all hooks so hook order stays stable. The Settings tab is
  // already hidden for ineligible plans; this is a defensive fallback.
  if (!canUseOutboundWebhook(org.plan)) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-10 justify-center text-center">
          <div>
            <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Integrations</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Outbound webhooks are available on paid plans. Upgrade to connect Zapier and other tools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastStatus = org.webhook_last_status;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Webhook className="w-4 h-4 text-primary" />
          Outbound Webhook
        </CardTitle>
        <CardDescription className="text-xs">
          POST each new data-rights request to Zapier or any HTTPS endpoint. See the{' '}
          <Link to="/dashboard" className="text-primary underline underline-offset-2">Automate with Zapier</Link> guide on the Request Inbox for setup steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 max-w-xl">
        {/* URL */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Webhook URL</Label>
          <Input
            value={url}
            onChange={e => { setUrl(e.target.value); setUrlError(''); }}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            className="h-9 text-sm font-mono"
          />
          {urlError && <p className="text-[11px] text-destructive mt-1">{urlError}</p>}
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Enable delivery</p>
            <p className="text-[11px] text-muted-foreground">Send each new request to the URL above.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Signing secret */}
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Signing secret</Label>
          <div className="flex items-center gap-2">
            <Input
              value={secret || '— generated on first save —'}
              readOnly
              className="h-9 text-sm font-mono bg-muted/40"
            />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={copySecret} disabled={!secret} title="Copy">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-9 flex-shrink-0 gap-1.5" onClick={handleRegenerate} disabled={!secret} title="Regenerate">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            We sign each request body with HMAC-SHA256 using this secret and send it in the
            {' '}<code className="font-mono text-foreground">X-DataRightsOS-Signature</code> header. Verify it on your endpoint to confirm authenticity.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9 text-sm" onClick={handleSave} disabled={saveMutation.isPending}>
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" className="h-9 text-sm gap-1.5" onClick={handleTest} disabled={testing || !url}>
            <Send className="w-3.5 h-3.5" />
            {testing ? 'Sending…' : 'Send test'}
          </Button>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${testResult.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>
              {testResult.ok ? 'Test delivered' : 'Test failed'}
              {testResult.http_code ? ` · HTTP ${testResult.http_code}` : ''}
              {testResult.message ? ` · ${testResult.message}` : ''}
            </span>
          </div>
        )}

        {/* Last delivery status */}
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Last delivery</p>
          {lastStatus?.at ? (
            <div className="flex items-center gap-2 text-xs">
              {lastStatus.ok
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                : <XCircle className="w-3.5 h-3.5 text-destructive" />}
              <span className="text-foreground">
                {lastStatus.ok ? 'Success' : 'Failed'}
                {lastStatus.http_code ? ` · HTTP ${lastStatus.http_code}` : ''}
                {lastStatus.message ? ` · ${lastStatus.message}` : ''}
              </span>
              <span className="text-muted-foreground ml-auto">{new Date(lastStatus.at).toLocaleString()}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No deliveries yet.</p>
          )}
        </div>

        {/* Payload reference */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Payload shape</p>
          <pre className="text-[11px] font-mono bg-foreground text-background rounded-md p-3 overflow-x-auto leading-relaxed">{PAYLOAD_EXAMPLE}</pre>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            <code className="font-mono text-foreground">deadline_at</code> is <code className="font-mono text-foreground">submitted_at</code> + 45 days. A completed request also sends
            {' '}<code className="font-mono text-foreground">event: "request.status_changed"</code> with <code className="font-mono text-foreground">status: "complete"</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}