/**
 * Requester-facing email templates, defaults, and merge logic.
 *
 * Emails are sent under the SUBSCRIBER's identity (business_name + privacy_contact_email),
 * never DataRightsOS. The same default copy and merge logic is mirrored inside the
 * `sendRequesterEmail` backend function (Deno can't import local files).
 */

export const REQUEST_TYPE_LABELS = {
  delete: 'Delete my data',
  access: 'Access my data',
  correct: 'Correct my data',
  opt_out: 'Opt out of sale/sharing',
};

export const COMPLETION_TYPE_LINES = {
  delete: "We've deleted or de-identified your personal information from our systems and asked our service providers to do the same.",
  access: "Your personal information is available as requested; we'll follow up with the details if not already provided.",
  correct: "We've corrected the information you identified.",
  opt_out: "We've opted you out of the sale and sharing of your personal information.",
};

export const DEFAULT_ACK_SUBJECT = 'We received your privacy request — {business_name}';

export const DEFAULT_ACK_BODY = `Hi {requester_name},

We received your request and we're processing it. For your records:
- Request type: {request_type_label}
- Reference ID: {request_id}
- Date received: {submitted_date}

We'll complete your request and respond by {deadline_date}. If we need more time, we'll let you know with the reason.

Questions? Reply to this email or contact us at {contact_email}.

— {business_name}`;

export const DEFAULT_COMPLETION_SUBJECT = 'Your privacy request is complete — {business_name}';

export const DEFAULT_COMPLETION_BODY = `Hi {requester_name},

Your request has been completed:
- Request type: {request_type_label}
- Reference ID: {request_id}
- Completed on: {completion_date}

{type_specific_line}

If you have questions or believe this wasn't handled correctly, reply to this email or contact us at {contact_email}.

— {business_name}`;

export const MERGE_FIELDS = [
  '{requester_name}',
  '{request_type_label}',
  '{request_id}',
  '{submitted_date}',
  '{deadline_date}',
  '{completion_date}',
  '{business_name}',
  '{contact_email}',
];

/** Replace {merge_fields} in a template string with values, leaving unknown tokens intact. */
export function renderTemplate(template, values) {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? (values[key] ?? '') : match
  );
}