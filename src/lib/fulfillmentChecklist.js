// Per-request fulfillment checklist definition + derivation helpers.
// Shared by the Request detail UI, the inbox status hint, and request creation.
// Core functionality for ALL plans — never plan-gated.

// The "act" step label depends on the request type.
const ACT_LABELS = {
  delete: 'Delete or de-identify their personal data everywhere it lives',
  access: 'Compile their data (categories, sources, purposes, recipients) in a portable format',
  correct: 'Correct the inaccurate information',
  opt_out: 'Flag do-not-sell/share, disable data sharing in ad/analytics tools, honor GPC',
};

/**
 * Build the initial checklist for a request, in order.
 * Returns a fresh array of plain item objects.
 */
export function buildInitialChecklist(requestType) {
  const actLabel = ACT_LABELS[requestType] || 'Fulfill the request';
  const defs = [
    { key: 'acknowledge', label: 'Acknowledge receipt (within 10 business days)', required: true },
    { key: 'verify_identity', label: "Verify the requester's identity", required: true },
    { key: 'locate_data', label: "Locate the requester's data across your systems", required: true },
    { key: 'act', label: actLabel, required: true },
    { key: 'check_exemptions', label: "Check what you're legally required to keep (exemptions)", required: false },
    { key: 'notify_third_parties', label: 'Notify processors/third parties to delete or stop', required: false },
    { key: 'respond', label: 'Respond to the requester before the deadline', required: true },
    { key: 'log_complete', label: 'Confirm the audit trail is complete', required: true },
  ];
  return defs.map(d => ({
    key: d.key,
    label: d.label,
    required: d.required,
    applicable: true,
    done: false,
    done_by: null,
    done_at: null,
  }));
}

// An item "counts" toward completion if it's done, or if it's a situational
// (non-required) item that the user marked Not Applicable.
export function isItemSatisfied(item) {
  if (item.done) return true;
  if (!item.required && item.applicable === false) return true;
  return false;
}

// Progress: how many steps are satisfied out of the total.
export function checklistProgress(checklist = []) {
  const total = checklist.length;
  const complete = checklist.filter(isItemSatisfied).length;
  return { complete, total };
}

// Every required item done AND every situational item done-or-N/A.
export function canMarkComplete(checklist = []) {
  if (!checklist.length) return false;
  return checklist.every(item => {
    if (item.required) return item.done;
    return item.done || item.applicable === false;
  });
}

/**
 * Derive request_status from the checklist (does not override denied/fulfilled).
 * - nothing started -> "new" (Not Started)
 * - something started but not all required satisfied -> "in_progress"
 * Complete is never auto-derived — it's set explicitly via Mark Complete.
 */
export function deriveStatusFromChecklist(checklist = []) {
  const anyStarted = checklist.some(item => item.done || item.applicable === false);
  if (!anyStarted) return 'new';
  return 'in_progress';
}

// Short label for the inbox status hint, e.g. "In Progress · 4/8".
export function statusHint(status, checklist = []) {
  if (!checklist || !checklist.length) return null;
  const { complete, total } = checklistProgress(checklist);
  return `${complete}/${total}`;
}