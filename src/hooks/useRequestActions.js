import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addDays } from 'date-fns';

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

  return { initNewRequest, markVerified, rejectRequest, changeStatus, assignRequest, addNote };
}