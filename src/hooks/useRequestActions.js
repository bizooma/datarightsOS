import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addDays } from 'date-fns';
import { buildInitialChecklist, deriveStatusFromChecklist } from '@/lib/fulfillmentChecklist';

/**
 * Central hook for all DataRightsRequest lifecycle actions.
 * Every mutating action automatically creates an AuditEvent.
 */
export function useRequestActions({ requestId, orgId, userEmail }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    queryClient.invalidateQueries({ queryKey: ['audit-events', requestId] });
    queryClient.invalidateQueries({ queryKey: ['requests'] });
  };

  async function logAudit(eventType, description) {
    await base44.entities.AuditEvent.create({
      organization: orgId,
      related_request: requestId,
      event_type: eventType,
      actor: userEmail || 'system',
      description,
    });
  }

  /** Called when a new request is created — sets statutory_deadline */
  async function initNewRequest(requestData) {
    const receivedDate = requestData.received_date
      ? new Date(requestData.received_date)
      : new Date();
    const deadline = addDays(receivedDate, 45).toISOString();

    const created = await base44.entities.DataRightsRequest.create({
      ...requestData,
      received_date: receivedDate.toISOString(),
      statutory_deadline: deadline,
      request_status: 'new',
      verification_status: 'unverified',
      fulfillment_checklist: buildInitialChecklist(requestData.request_type),
    });

    await base44.entities.AuditEvent.create({
      organization: requestData.organization,
      related_request: created.id,
      event_type: 'request_received',
      actor: userEmail || 'system',
      description: `${requestData.request_type} request received from ${requestData.requester_name} (${requestData.requester_email}).`,
    });

    return created;
  }

  async function markVerified() {
    await base44.entities.DataRightsRequest.update(requestId, {
      verification_status: 'verified',
    });
    await logAudit('identity_verified', 'Identity verification completed. Requester identity confirmed.');
    invalidate();
  }

  async function rejectRequest() {
    await base44.entities.DataRightsRequest.update(requestId, {
      verification_status: 'rejected',
      request_status: 'denied',
    });
    await logAudit('request_rejected', 'Request rejected: identity verification failed or request determined invalid.');
    invalidate();
  }

  async function changeStatus(request, newStatus) {
    const oldStatus = request.request_status;

    // Guard: cannot fulfill unless verified
    if (newStatus === 'fulfilled' && request.verification_status !== 'verified') {
      throw new Error('Identity must be verified before fulfilling a request.');
    }

    const updates = { request_status: newStatus };
    if (newStatus === 'fulfilled') {
      updates.fulfilled_date = new Date().toISOString();
    }

    await base44.entities.DataRightsRequest.update(requestId, updates);
    await logAudit(
      newStatus === 'fulfilled' ? 'request_fulfilled' : 'status_changed',
      newStatus === 'fulfilled'
        ? `Request fulfilled. Changed from "${oldStatus}" to "fulfilled".`
        : `Status changed from "${oldStatus}" to "${newStatus}".`
    );
    invalidate();
  }

  async function assignRequest(request, userId, userDisplayName) {
    await base44.entities.DataRightsRequest.update(requestId, { assigned_to: userId });
    await logAudit('request_assigned', `Request assigned to ${userDisplayName}.`);
    invalidate();
  }

  async function addNote(newNote) {
    await base44.entities.DataRightsRequest.update(requestId, { notes: newNote });
    await logAudit('note_added', 'Internal note updated.');
    invalidate();
  }

  // --- Fulfillment checklist actions ---

  // Lazily initialize a checklist on a request that doesn't have one yet.
  // Does NOT change the request's current status.
  async function ensureChecklist(request) {
    if (Array.isArray(request.fulfillment_checklist) && request.fulfillment_checklist.length) {
      return request.fulfillment_checklist;
    }
    const checklist = buildInitialChecklist(request.request_type);
    await base44.entities.DataRightsRequest.update(requestId, { fulfillment_checklist: checklist });
    invalidate();
    return checklist;
  }

  // Toggle an item's done state. Writes audit + derives status. The
  // verify_identity step also syncs verification_status / verified_by / verified_at.
  async function toggleChecklistItem(request, key) {
    const checklist = (request.fulfillment_checklist || []).map(item => {
      if (item.key !== key) return item;
      const nowDone = !item.done;
      return {
        ...item,
        done: nowDone,
        done_by: nowDone ? (userEmail || 'system') : null,
        done_at: nowDone ? new Date().toISOString() : null,
      };
    });

    const target = checklist.find(i => i.key === key);
    const updates = { fulfillment_checklist: checklist };

    // Keep request_status in sync unless the request is in a terminal state.
    if (!['fulfilled', 'denied'].includes(request.request_status)) {
      updates.request_status = deriveStatusFromChecklist(checklist);
    }

    // verify_identity drives the verification fields shown in the inbox.
    if (key === 'verify_identity') {
      if (target.done) {
        updates.verification_status = 'verified';
        updates.verified_by = userEmail || 'system';
        updates.verified_at = new Date().toISOString();
      } else {
        updates.verification_status = 'unverified';
        updates.verified_by = null;
        updates.verified_at = null;
      }
    }

    await base44.entities.DataRightsRequest.update(requestId, updates);

    await logAudit(
      target.done ? 'checklist_step_completed' : 'checklist_step_reopened',
      `Step "${target.label}" ${target.done ? 'marked complete' : 'reopened'}.`
    );
    if (key === 'verify_identity') {
      await logAudit(
        target.done ? 'identity_verified' : 'identity_unverified',
        target.done
          ? 'Identity verification completed via checklist. Requester identity confirmed.'
          : 'Identity verification reverted via checklist. Requester is now unverified.'
      );
    }
    invalidate();
  }

  // Toggle the "Not applicable" flag on a situational (non-required) item.
  async function toggleChecklistItemApplicable(request, key) {
    const checklist = (request.fulfillment_checklist || []).map(item => {
      if (item.key !== key) return item;
      const newApplicable = item.applicable === false ? true : false;
      // Marking N/A clears any prior done state.
      return {
        ...item,
        applicable: newApplicable,
        done: newApplicable ? item.done : false,
        done_by: newApplicable ? item.done_by : null,
        done_at: newApplicable ? item.done_at : null,
      };
    });

    const target = checklist.find(i => i.key === key);
    const updates = { fulfillment_checklist: checklist };
    if (!['fulfilled', 'denied'].includes(request.request_status)) {
      updates.request_status = deriveStatusFromChecklist(checklist);
    }

    await base44.entities.DataRightsRequest.update(requestId, updates);
    await logAudit(
      target.applicable === false ? 'checklist_step_na' : 'checklist_step_applicable',
      `Step "${target.label}" marked ${target.applicable === false ? 'not applicable' : 'applicable'}.`
    );
    invalidate();
  }

  // Mark the request complete (fulfilled). Records completed_by / completed_at.
  async function markComplete(request) {
    await base44.entities.DataRightsRequest.update(requestId, {
      request_status: 'fulfilled',
      fulfilled_date: new Date().toISOString(),
      completed_by: userEmail || 'system',
      completed_at: new Date().toISOString(),
    });
    await logAudit('request_fulfilled', 'Request marked complete. All required fulfillment steps satisfied.');
    invalidate();
  }

  return {
    initNewRequest, markVerified, rejectRequest, changeStatus, assignRequest, addNote,
    ensureChecklist, toggleChecklistItem, toggleChecklistItemApplicable, markComplete,
  };
}