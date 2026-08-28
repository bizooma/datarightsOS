// Display metadata for the Group A scanner checks. Order matches the spec.
export const CHECK_ORDER = [
  'tracking_scripts',
  'meta_pixel',
  'google_analytics',
  'google_ads',
  'ai_chatbot',
  'forms_pii',
  'pre_consent_tracking',
  'gpc_comparison',
];

export const CHECK_LABELS = {
  tracking_scripts: 'Tracking scripts detected',
  meta_pixel: 'Meta Pixel',
  google_analytics: 'Google Analytics',
  google_ads: 'Google Ads / DoubleClick',
  ai_chatbot: 'AI chatbot / chat widget',
  forms_pii: 'Contact forms collecting personal information',
  pre_consent_tracking: 'Tracking fired before consent',
  gpc_comparison: 'Global Privacy Control comparison',
};

// Neutral styling — these are observations, not verdicts.
export const STATUS_META = {
  found: { label: 'FOUND', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  not_found: { label: 'NOT FOUND', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  could_not_determine: { label: 'COULD NOT DETERMINE', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};