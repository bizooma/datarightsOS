import { ExternalLink } from 'lucide-react';

export default function PrivacyCenterPreview({ site }) {
  const drawers = (site.enabled_drawers || []).join(',');
  const previewUrl = `/privacy-center?site=${site.site_key}&drawers=${encodeURIComponent(drawers)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Live Preview</p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
        >
          Open full page
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-white" style={{ height: 520 }}>
        <iframe
          key={previewUrl}
          src={previewUrl}
          title="Privacy Center Preview"
          className="w-full h-full border-0"
          style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}