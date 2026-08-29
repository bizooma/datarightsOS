import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PrintReport from '@/components/scan/print/PrintReport';
import { PRINT_CSS } from '@/components/scan/print/printStyles';

// The route Browserless renders to PDF: no site nav, no download button, no
// consent widget (hidden in PRINT_CSS) — just the document.
// Also usable directly in a browser, where the browser's own print works too.
export default function ScanPrintReport() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    // processScan acts as the public read endpoint for a finished scan.
    base44.functions.invoke('processScan', { scan_id: id })
      .then((res) => {
        const s = res.data?.scan;
        if (s && s.status === 'complete') setScan(s);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <>
      <style>{PRINT_CSS}</style>
      {scan ? (
        <PrintReport scan={scan} />
      ) : (
        <div className="pr-doc" style={{ padding: '24px' }}>
          <p className="pr-meta-row">{notFound ? 'This report is not available.' : 'Loading report…'}</p>
        </div>
      )}
    </>
  );
}