import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ScanForm from '@/components/scan/ScanForm';
import ScanProgress from '@/components/scan/ScanProgress';
import ScanReport from '@/components/scan/ScanReport';

export default function Scan() {
  const [scan, setScan] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };
  useEffect(() => stopPolling, []);

  // Shared report link: /scan?id=<scanId>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    setRunning(true);
    base44.functions.invoke('processScan', { scan_id: id })
      .then((res) => { if (res.data?.scan) setScan(res.data.scan); else setError('Scan not found.'); })
      .catch(() => setError('Scan not found.'))
      .finally(() => setRunning(false));
  }, []);

  // Live status while a scan record is running.
  useEffect(() => {
    if (!scan?.id || scan.status !== 'running') return;
    const scanId = scan.id;
    let unsubscribe;
    try {
      unsubscribe = base44.entities.Scan.subscribe((event) => {
        if (event?.data?.id === scanId) setScan(event.data);
      });
    } catch {
      // Realtime unavailable for anonymous visitors — polling covers status.
    }
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, [scan?.id, scan?.status]);

  const startPolling = (scanId) => {
    stopPolling();
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const res = await base44.functions.invoke('processScan', { scan_id: scanId });
        const s = res.data?.scan;
        if (s && s.status !== 'running') {
          setScan(s); setRunning(false); stopPolling();
        }
      } catch { /* transient — next tick retries */ }
      if (tries >= 30) {
        stopPolling(); setRunning(false);
        setError('The scan is taking longer than expected. Please try again in a few minutes.');
      }
    }, 6000);
  };

  const handleScan = async (url) => {
    setError(''); setScan(null); stopPolling();
    setRunning(true);
    let res;
    try {
      res = await base44.functions.invoke('startScan', { url });
    } catch {
      setError('The scan could not be started. Please try again.');
      setRunning(false);
      return;
    }
    const d = res.data || {};
    if (!d.ok) {
      setError(d.message || 'The scan could not be started.');
      setRunning(false);
      return;
    }
    setScan(d.scan);
    if (d.cached || d.scan.status !== 'running') { setRunning(false); return; }
    try {
      const pr = await base44.functions.invoke('processScan', { scan_id: d.scan.id });
      const s = pr.data?.scan;
      if (s) setScan(s);
      if (s && s.status === 'running') startPolling(d.scan.id);
      else setRunning(false);
    } catch {
      // Connection dropped mid-scan — keep watching the record instead of guessing an outcome.
      startPolling(d.scan.id);
    }
  };

  const showProgress = running || scan?.status === 'running';
  const showReport = scan && scan.status !== 'running' && !running;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold text-foreground">Data Rights OS</Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            What loads on your site before anyone consents?
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your website. We load it in a clean browser as a first-time visitor, record every
            tracking request that fires, then load it again with a Global Privacy Control signal and
            compare. Observations only — you'll see exactly what we saw.
          </p>
        </div>

        <ScanForm onScan={handleScan} busy={showProgress} />

        {error && (
          <p className="text-sm text-destructive text-center max-w-xl mx-auto" role="alert">{error}</p>
        )}

        {showProgress && <ScanProgress domain={scan?.domain || ''} />}

        {showReport && <ScanReport scan={scan} />}
      </main>
    </div>
  );
}