import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import SampleStatementDialog from './SampleStatementDialog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const STATEMENT_TYPES = [
  {
    key: 'privacy_policy',
    label: 'Privacy Policy',
    description: 'Required by CCPA, VCDPA, CTDPA and most US state privacy laws. Must disclose what data you collect, why, and consumer rights.',
    defaultTitle: 'Privacy Policy',
    required: true,
  },
  {
    key: 'cookie_policy',
    label: 'Cookie Policy',
    description: 'Best practice under GDPR and US state laws. Explains what cookies are used, their purpose, and how visitors can manage them.',
    defaultTitle: 'Cookie Policy',
    required: false,
  },
  {
    key: 'accessibility_statement',
    label: 'Accessibility Statement',
    description: 'Required under ADA, Section 508, and the EU Web Accessibility Directive. States your WCAG compliance level and how to report barriers.',
    defaultTitle: 'Accessibility Statement',
    required: false,
  },
  {
    key: 'ai_use_statement',
    label: 'AI Use Statement',
    description: 'Recommended under FTC guidelines and required in California (AB 13 / AICPA). Discloses when visitors interact with AI, the purpose of the AI, and any human-in-the-loop protocols.',
    defaultTitle: 'AI Use Statement',
    required: false,
  },
];

export default function LegalStatementsEditor({ site }) {
  const queryClient = useQueryClient();

  const { data: statements = [], isLoading } = useQuery({
    queryKey: ['legal-statements', site.id],
    queryFn: () => base44.entities.LegalStatement.filter({ site: site.id, is_active: true }),
    enabled: !!site.id,
  });

  const getStatement = (type) => statements.find(s => s.statement_type === type);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          These statements are served directly inside your widget as a modal. Visitors from any US state will see the applicable statement — no separate page needed. Keeping them current is critical for multi-state compliance, including the new AI disclosure requirements in California and under FTC guidelines.
        </p>
      </div>

      <Tabs defaultValue="privacy_policy">
        <TabsList className="h-9">
          {STATEMENT_TYPES.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs gap-1.5">
              {t.label}
              {t.required && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">Required</Badge>}
              {getStatement(t.key) && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATEMENT_TYPES.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <StatementForm
              site={site}
              statementType={t}
              existing={getStatement(t.key)}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['legal-statements', site.id] })}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StatementForm({ site, statementType, existing, onSaved }) {
  const [title, setTitle] = useState(existing?.title || statementType.defaultTitle);
  const [body, setBody] = useState(existing?.body || '');
  const [version, setVersion] = useState(existing?.version || '1.0');
  const [effectiveDate, setEffectiveDate] = useState(existing?.effective_date || new Date().toISOString().split('T')[0]);

  // Sync form fields when the existing statement loads/changes (e.g. after the query resolves on remount)
  useEffect(() => {
    if (existing) {
      setTitle(existing.title || statementType.defaultTitle);
      setBody(existing.body || '');
      setVersion(existing.version || '1.0');
      setEffectiveDate(existing.effective_date || new Date().toISOString().split('T')[0]);
    }
  }, [existing?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        site: site.id,
        organization: site.organization,
        statement_type: statementType.key,
        title,
        body,
        version,
        effective_date: effectiveDate,
        is_active: true,
      };
      if (existing?.id) {
        return base44.entities.LegalStatement.update(existing.id, data);
      }
      return base44.entities.LegalStatement.create(data);
    },
    onSuccess: () => {
      toast.success(`${statementType.label} saved`);
      onSaved();
    },
    onError: () => toast.error('Failed to save statement'),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{statementType.label}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xl">{statementType.description}</p>
            <div className="mt-2">
              <SampleStatementDialog statementType={statementType} onInsert={setBody} />
            </div>
          </div>
          {existing && (
            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
              v{existing.version} · Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Version</Label>
            <Input value={version} onChange={e => setVersion(e.target.value)} className="h-9 text-sm" placeholder="1.0" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Effective Date</Label>
            <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Statement Body</Label>
          <div className="rounded-md border border-input overflow-hidden">
            <ReactQuill
              theme="snow"
              value={body}
              onChange={setBody}
              style={{ minHeight: 280 }}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            This content is served inside the widget modal. Visitors will see it when they click the statement link.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-9 text-sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !body.trim()}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {saveMutation.isPending ? 'Saving…' : 'Save Statement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}