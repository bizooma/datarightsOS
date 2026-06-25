import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Info, Languages, Loader2 } from 'lucide-react';
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
  const [titleEs, setTitleEs] = useState(existing?.title_es || '');
  const [bodyEs, setBodyEs] = useState(existing?.body_es || '');
  const [lang, setLang] = useState('en');
  const [version, setVersion] = useState(existing?.version || '1.0');
  const [effectiveDate, setEffectiveDate] = useState(existing?.effective_date || new Date().toISOString().split('T')[0]);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!body.trim()) {
      toast.error('Add the English statement first');
      return;
    }
    setTranslating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following website legal statement into clear, natural Latin American Spanish suitable for a general audience. Preserve all HTML tags and structure exactly — only translate the human-readable text inside them. Do not add commentary.\n\nTITLE: ${title}\n\nBODY (HTML):\n${body}`,
        response_json_schema: {
          type: 'object',
          properties: {
            title_es: { type: 'string' },
            body_es: { type: 'string' },
          },
          required: ['title_es', 'body_es'],
        },
      });
      setTitleEs(result.title_es || '');
      setBodyEs(result.body_es || '');
      setLang('es');
      toast.success('Spanish translation generated — review and save');
    } catch {
      toast.error('Translation failed, please try again');
    } finally {
      setTranslating(false);
    }
  };

  // Sync form fields when the existing statement loads/changes (e.g. after the query resolves on remount)
  useEffect(() => {
    if (existing) {
      setTitle(existing.title || statementType.defaultTitle);
      setBody(existing.body || '');
      setTitleEs(existing.title_es || '');
      setBodyEs(existing.body_es || '');
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
        title_es: titleEs,
        body_es: bodyEs,
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

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted w-fit">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('es')}
              className={`px-3 py-1 text-xs font-medium rounded ${lang === 'es' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              Español
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleTranslate}
            disabled={translating || !body.trim()}
          >
            {translating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Languages className="w-3.5 h-3.5 mr-1.5" />}
            {translating ? 'Translating…' : 'Auto-translate to Spanish'}
          </Button>
        </div>

        {lang === 'es' && (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Spanish Title (optional)</Label>
            <Input value={titleEs} onChange={e => setTitleEs(e.target.value)} className="h-9 text-sm" placeholder="Falls back to English if empty" />
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Statement Body {lang === 'es' ? '(Spanish — optional)' : '(English)'}
          </Label>
          <div className="rounded-md border border-input overflow-hidden">
            <ReactQuill
              key={lang}
              theme="snow"
              value={lang === 'es' ? bodyEs : body}
              onChange={lang === 'es' ? setBodyEs : setBody}
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
            {lang === 'es'
              ? 'Spanish visitors will see this version. If left empty, the English statement is shown instead.'
              : 'This content is served inside the widget modal. Visitors will see it when they click the statement link.'}
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