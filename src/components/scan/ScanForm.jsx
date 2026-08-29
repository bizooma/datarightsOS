import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';

export default function ScanForm({ onScan, busy, defaultUrl = '' }) {
  const [url, setUrl] = useState(defaultUrl);

  const submit = (e) => {
    e.preventDefault();
    const v = url.trim();
    if (v && !busy) onScan(v);
  };

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
      <Input
        type="text"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="yourwebsite.com"
        aria-label="Website URL to scan"
        className="h-11 text-base bg-card"
        disabled={busy}
      />
      <Button type="submit" className="h-11 px-6" disabled={busy || !url.trim()}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        {busy ? 'Scanning…' : 'Scan my site'}
      </Button>
    </form>
  );
}