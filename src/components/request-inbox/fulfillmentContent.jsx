// Static reference content for the "How to fulfill a request" help panel.

export const CHECKLIST_HEADING = 'Your 45-day checklist';
export const CHECKLIST_INTRO =
  'When a request lands, the clock starts. Follow these steps for a compliant, provable response.';

// Each step: { text, sub?: string[] }
export const CHECKLIST_STEPS = [
  {
    text: 'Acknowledge receipt (within 10 business days). Send the requester a quick confirmation that you received their request and are processing it.',
  },
  {
    text: "Verify their identity first. Match the name, email, and state to your records before you do anything. Acting on an unverified request — like deleting the wrong person's data — is its own violation. If an authorized agent submitted it, confirm they have permission.",
  },
  {
    text: 'Classify the request: Delete, Access, Correct, or Opt out of sale/sharing. The type decides what you do in step 5.',
  },
  {
    text: "Find the data. List every place this person's info lives: CRM, email/marketing platform, booking or e-commerce, invoicing/accounting, support tickets, analytics, spreadsheets, backups, and any vendor you've shared it with.",
  },
  {
    text: 'Act on the request by type:',
    sub: [
      'Delete: remove or de-identify their personal info everywhere you found it, and tell your vendors to do the same.',
      'Access: compile the categories and specific pieces of data you hold, where it came from, why, and who you shared it with; deliver it in a readable, portable format.',
      'Correct: fix the inaccurate information.',
      'Opt out of sale/sharing: flag them do-not-sell/share, turn off data sharing in your ad and analytics tools, honor Global Privacy Control, and notify the third parties involved.',
    ],
  },
  {
    text: "Check what you're allowed to keep. You don't have to delete data you're legally required to retain (tax records, active transactions, legal holds, fraud/security). Keep only what an exemption covers, and note which one.",
  },
  {
    text: 'Notify third parties. Tell any processors or partners you sold or shared the data with to delete or stop, as applicable.',
  },
  {
    text: "Respond before day 45. Confirm what you did, or explain what you couldn't and why (cite the exemption). Need more time? You may take one 45-day extension (90 days total) if you notify them with the reason.",
  },
  {
    text: "Log it in the audit trail. Record the dates, who handled it, what you deleted or provided, any exemptions applied, and proof of completion. This is your defense if you're ever audited or sued.",
  },
];

export const CHECKLIST_DISCLAIMER =
  'General operational guidance, not legal advice. Timelines and exemptions vary by state law (CCPA/CPRA, VCDPA, CTDPA, and others). Confirm requirements for your jurisdiction and consult counsel for complex requests.';

export const ZAPIER_HEADING = 'Route and action requests automatically';
export const ZAPIER_INTRO =
  "Zapier can push each new request into the tools you already use and help action removals. It speeds the work; it doesn't replace your final review. Keep a human check before any permanent deletion.";

export const ZAPIER_STEPS = [
  {
    text: 'In Zapier, create a Zap. Trigger: "Webhooks by Zapier → Catch Hook." Copy the webhook URL it gives you.',
  },
  {
    text: 'In DataRightsOS, go to Settings → Integrations and paste that URL as your Outbound Webhook. Every new request will POST its details (type, requester name, email, state, deadline date, request ID) to Zapier.',
  },
  {
    text: 'Add notify and task actions, for example:',
    sub: [
      'Slack or email: alert your privacy team, including the deadline.',
      'Task: create a card in Asana, Trello, or ClickUp with the 45-day due date.',
      'Search: look up the requester\'s email in Mailchimp, HubSpot, or Google Contacts.',
    ],
  },
  {
    text: 'For delete or opt-out requests, add removal actions with a review step:',
    sub: [
      'Mailchimp: unsubscribe or archive/delete the contact.',
      'HubSpot: delete or flag the contact, set do-not-contact.',
      'Your CRM or Google Contacts: remove or tag the record.',
    ],
  },
  {
    text: "Close the loop: once you've actioned and verified, mark the request Complete in DataRightsOS so the audit trail captures proof inside the 45-day window.",
  },
];

export const ZAPIER_NOTE =
  "Zapier only reaches the apps you connect, and delete behavior differs per app. It won't guarantee complete erasure everywhere (backups, offline files, unconnected tools). Always confirm the data is gone before marking a request complete.";