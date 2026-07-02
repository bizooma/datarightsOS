// Knowledge base content describing each dashboard area and widget element.

export const dashboardSections = [
  {
    id: 'request-inbox',
    title: 'Request Inbox',
    summary: 'The central queue for every consumer data-rights request your sites receive.',
    why: 'US state privacy laws (CCPA/CPRA, VCDPA, CPA and others) require you to respond to consumer requests — access, deletion, correction, and opt-out — within a statutory deadline. The Inbox makes sure none slip through the cracks and gives you a defensible record that you acted.',
    points: [
      { label: 'Request type', text: 'Whether the consumer wants to access, delete, correct, or opt out of the sale/sharing of their data. Each type has different fulfillment obligations.' },
      { label: '45-day deadline', text: 'Most states require a response within 45 days of receipt. The Inbox tracks this countdown so you stay compliant.' },
      { label: 'Status', text: 'New, in progress, awaiting info, fulfilled, or denied — a clear audit-friendly lifecycle for every request.' },
      { label: 'Identity verification', text: 'You must reasonably verify a requester before acting. Verification status protects you from acting on fraudulent requests.' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    summary: 'A high-level view of consent rates, request volume, and compliance trends across your sites.',
    why: 'Analytics turns raw compliance activity into insight — helping you spot spikes in requests, monitor opt-out rates, and demonstrate program health to leadership or regulators.',
    points: [
      { label: 'Consent trends', text: 'See how visitors are responding to your cookie banner over time (accept, reject, customize).' },
      { label: 'Request volume', text: 'Track how many data-rights requests arrive and how quickly they are resolved.' },
      { label: 'Geographic insight', text: 'Understand which states your requests come from, which matters because obligations vary by state.' },
    ],
  },
  {
    id: 'consent-log',
    title: 'Consent Log',
    summary: 'An immutable record of every consent choice a visitor makes through your widget.',
    why: 'When a regulator or plaintiff asks "can you prove this visitor consented?", the Consent Log is your evidence. Each entry is a timestamped consent receipt capturing exactly what the visitor agreed to.',
    points: [
      { label: 'Consent receipt', text: 'A unique ID and timestamp for each choice — the cornerstone of provable consent.' },
      { label: 'Granular choices', text: 'Records which cookie categories (necessary, functional, analytics, advertising) the visitor accepted.' },
      { label: 'GPC detection', text: 'Logs when a Global Privacy Control signal was honored automatically, which several states now legally require.' },
      { label: 'Region & device', text: 'Captures inferred state and browser details to support state-specific compliance.' },
    ],
  },
  {
    id: 'widget-studio',
    title: 'Widget Studio',
    summary: 'Where you configure, brand, and generate the embed code for the privacy widget on your site.',
    why: 'The widget is the visitor-facing front door to your compliance program. Widget Studio lets you tailor it to your brand and choose which compliance drawers appear, then gives you a one-line snippet to install.',
    points: [
      { label: 'Enabled drawers', text: 'Turn on the panels you need — cookies, privacy rights, accessibility, AI disclosure.' },
      { label: 'White-label branding', text: 'Match the widget to your (or your client\'s) brand name, logo, and color so it feels native.' },
      { label: 'Legal statements editor', text: 'Maintain your privacy policy, cookie policy, accessibility, and AI-use statements in one place.' },
      { label: 'Embed snippet', text: 'A single script tag you paste into any site to go live.' },
    ],
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    summary: 'A chronological, tamper-evident log of every compliance-relevant action taken in the system.',
    why: 'Compliance is about being able to prove what you did and when. The Audit Trail records each event — request received, identity verified, status changed — so you have a defensible history if you are ever challenged.',
    points: [
      { label: 'Who & when', text: 'Every event records the actor (a team member or the system) and a timestamp.' },
      { label: 'Linked records', text: 'Events tie back to the specific request or consent record they relate to.' },
      { label: 'Retention', text: 'Higher plans keep the trail indefinitely so you can respond to inquiries about historical activity.' },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility Reports',
    summary: 'Where visitor-submitted accessibility barrier reports land for your team to triage.',
    why: 'ADA and WCAG-related litigation against websites continues to rise. Offering a clear way for users to report barriers — and tracking your response — demonstrates good-faith remediation efforts.',
    points: [
      { label: 'Barrier reports', text: 'Visitors describe the page and the accessibility issue they encountered.' },
      { label: 'Report detail view', text: 'Click any report to open its full detail page, where you can jump straight to the reported page or email the reporter.' },
      { label: 'Assign to a team member', text: 'From a report\'s detail page, hand the issue off to a specific team member to investigate — so ownership is always clear.' },
      { label: 'Status tracking', text: 'Move reports from new to reviewing to resolved so nothing is forgotten.' },
      { label: 'Accountability', text: 'A documented remediation process is a strong signal of good-faith compliance effort.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    summary: 'Manage your profile, organization details, branding, billing, and plan.',
    why: 'Settings is your control center for account and subscription management — keeping your organization information current ensures the widget and statements reflect the right brand and legal entity.',
    points: [
      { label: 'Organization & branding', text: 'Set your product name, logo, and primary color used across the widget.' },
      { label: 'Billing & plan', text: 'View and manage your subscription, including which features and limits apply.' },
      { label: 'Team members', text: 'Control who on your team has access to the compliance dashboard.' },
    ],
  },
];

export const widgetDrawers = [
  {
    id: 'launcher',
    title: 'Widget Launcher',
    summary: 'The small floating button visitors click to open your privacy center.',
    why: 'Regulators and accessibility standards expect privacy controls to be persistently and easily accessible. A consistent launcher in a corner of every page meets that expectation.',
    points: [
      { label: 'Position', text: 'Place it in any corner so it never blocks key content.' },
      { label: 'Theme', text: 'Light or dark to blend with your site design.' },
    ],
  },
  {
    id: 'cookies',
    title: 'Cookie Consent Drawer',
    summary: 'Lets visitors accept, reject, or customize cookie categories.',
    why: 'State laws and EU rules require informed, granular consent before non-essential cookies run. This drawer collects that consent and the Consent Log proves it.',
    points: [
      { label: 'Granular categories', text: 'Necessary, functional, analytics, and advertising — each controllable.' },
      { label: 'Global Privacy Control', text: 'Automatically honors GPC browser signals, which several states mandate.' },
      { label: 'Re-consent on policy change', text: 'Policy versioning prompts visitors again when your terms change.' },
    ],
  },
  {
    id: 'privacy-rights',
    title: 'Privacy Rights Drawer',
    summary: 'The intake form where consumers submit access, deletion, correction, and opt-out requests.',
    why: 'This is how consumers exercise the rights state laws grant them. Every submission flows directly into your Request Inbox with a deadline attached.',
    points: [
      { label: 'Request types', text: 'Access, delete, correct, and opt out — covering core statutory rights.' },
      { label: 'Authorized agents', text: 'Supports requests made on a consumer\'s behalf, as the law allows.' },
      { label: 'Automatic deadline', text: 'Each request gets a statutory deadline the moment it is received.' },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility Drawer',
    summary: 'Displays your accessibility statement and lets visitors report barriers.',
    why: 'A visible accessibility statement plus a reporting channel demonstrates good-faith ADA/WCAG effort and gives users an inclusive path to flag problems.',
    points: [
      { label: 'Accessibility statement', text: 'Publishes your commitment and conformance approach.' },
      { label: 'Barrier reporting', text: 'Routes reported issues into your Accessibility Reports queue.' },
    ],
  },
  {
    id: 'ai-disclosure',
    title: 'AI Disclosure Drawer',
    summary: 'Communicates how and where your business uses AI to visitors.',
    why: 'Emerging transparency rules (and growing consumer expectation) push businesses to disclose AI use. This drawer provides a clear, standing notice.',
    points: [
      { label: 'AI use statement', text: 'Explains where AI is used and how it affects visitors.' },
      { label: 'Transparency', text: 'Builds trust and gets ahead of new disclosure requirements.' },
    ],
  },
];