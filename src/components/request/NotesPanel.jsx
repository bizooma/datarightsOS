import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, Check, X } from 'lucide-react';

export default function NotesPanel({ request, onAddNote }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(request.notes || '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await onAddNote(draft);
      setEditing(false);
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setDraft(request.notes || '');
    setEditing(false);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Internal Notes</CardTitle>
          {!editing && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              className="text-sm resize-none"
              placeholder="Add internal notes about this request..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={loading} onClick={save} className="gap-1.5">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Note
              </Button>
              <Button size="sm" variant="outline" onClick={cancel} className="gap-1.5">
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {request.notes || 'No internal notes yet. Click Edit to add notes.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}