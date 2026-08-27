import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_BYTES = 500 * 1024;
const DEFAULT_LABEL = 'Privacy & Data Rights';

// WCAG relative luminance + contrast ratio for hex colors.
function hexLuminance(hex) {
  const h = (hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  if (full.length !== 6) return null;
  const chan = [0, 2, 4].map(i => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
function contrastRatio(a, b) {
  const l1 = hexLuminance(a);
  const l2 = hexLuminance(b);
  if (l1 == null || l2 == null) return null;
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export default function LauncherStyleSection({ form, canCustomize, onChange }) {
  const [uploading, setUploading] = useState(false);
  const style = canCustomize ? (form.launcher_style || 'pill') : 'pill';
  const isCustom = style === 'custom';

  // Launcher colors mirror widgetJs theme tokens — the label must meet AA against the launcher background.
  const isDark = (form.widget_theme || 'dark') !== 'light';
  const launcherBg = isDark ? '#14202b' : '#ffffff';
  const launcherText = isDark ? '#ffffff' : '#14202b';
  const ratio = contrastRatio(launcherBg, launcherText);
  const contrastFails = ratio != null && ratio < 4.5;

  const label = form.launcher_label ?? DEFAULT_LABEL;
  const labelBlank = !String(label).trim();

  const handleStyleChange = (v) => {
    onChange('launcher_style', v);
    if (v === 'custom' && !(form.launcher_label || '').trim()) {
      onChange('launcher_label', DEFAULT_LABEL);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Use a PNG, JPG, SVG, or WebP image.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 500KB or smaller.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange('launcher_image_url', file_url);
    } catch (err) {
      toast.error(err?.message || 'Could not upload the image. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="pt-2 border-t border-border space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Launcher Style</Label>
        <Select value={style} onValueChange={handleStyleChange} disabled={!canCustomize}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pill">Standard pill</SelectItem>
            <SelectItem value="custom">Custom image + label</SelectItem>
          </SelectContent>
        </Select>
        {!canCustomize && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Custom launcher branding is available on Core and above. Your widget shows the standard pill.
          </p>
        )}
      </div>

      {canCustomize && isCustom && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Launcher Image</Label>
            <div className="flex items-center gap-3">
              {form.launcher_image_url && (
                <span
                  className="inline-flex items-center rounded-md border border-border p-1.5"
                  style={{ background: launcherBg }}
                >
                  <img
                    src={form.launcher_image_url}
                    alt=""
                    style={{ height: 44, width: 'auto', maxWidth: 120, objectFit: 'contain', display: 'block' }}
                  />
                </span>
              )}
              <label className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-md border border-border bg-white text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Uploading…' : form.launcher_image_url ? 'Replace image' : 'Upload image'}
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              PNG, JPG, SVG, or WebP, max 500KB. Renders at <span className="font-medium">44px tall</span>, width auto up to <span className="font-medium">120px</span> — aspect ratio is always preserved.
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Launcher Label (required)</Label>
            <Input
              value={label}
              onChange={e => onChange('launcher_label', e.target.value)}
              placeholder={DEFAULT_LABEL}
              className="h-9 text-sm"
            />
            {labelBlank ? (
              <p className="text-[11px] text-destructive mt-1">
                The label can't be blank — it's how visitors find their privacy choices. A blank label is replaced with "{DEFAULT_LABEL}".
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                Always shown beside the image. Edit the wording, but it can never be removed — an unlabeled launcher makes the privacy path unfindable.
              </p>
            )}
          </div>

          {contrastFails && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800">
                The label text contrast against the launcher background is {ratio.toFixed(1)}:1, below the 4.5:1 AA minimum. Switch the widget theme so the label stays readable.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}