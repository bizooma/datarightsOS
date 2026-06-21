import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    const requestId = event.entity_id;
    const requestData = data;

    // Only set deadline if not already set
    if (requestData?.statutory_deadline) {
      return Response.json({ skipped: 'deadline already set' });
    }

    const receivedDate = requestData?.received_date
      ? new Date(requestData.received_date)
      : new Date();

    // Add 45 days
    const deadline = new Date(receivedDate.getTime() + 45 * 24 * 60 * 60 * 1000);

    await base44.asServiceRole.entities.DataRightsRequest.update(requestId, {
      statutory_deadline: deadline.toISOString(),
      received_date: receivedDate.toISOString(),
    });

    // Create the initial audit event
    if (requestData?.organization) {
      await base44.asServiceRole.entities.AuditEvent.create({
        organization: requestData.organization,
        related_request: requestId,
        event_type: 'request_received',
        actor: 'system',
        description: `${requestData.request_type || 'Unknown'} request received from ${requestData.requester_name || 'unknown'} (${requestData.requester_email || ''}). Statutory deadline set to ${deadline.toISOString().slice(0, 10)}.`,
      });
    }

    return Response.json({ success: true, deadline: deadline.toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});