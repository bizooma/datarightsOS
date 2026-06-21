import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data: reportData } = payload;

    if (event?.type !== 'create') {
      return Response.json({ skipped: true });
    }

    if (!reportData?.site) {
      return Response.json({ skipped: 'no site' });
    }

    // Load the site to get barrier_report_email
    const sites = await base44.asServiceRole.entities.Site.filter({ id: reportData.site });
    const site = sites[0];

    if (!site?.barrier_report_email) {
      return Response.json({ skipped: 'no barrier_report_email configured for site' });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: site.barrier_report_email,
      subject: `New Accessibility Barrier Report — ${site.domain}`,
      body: `A new accessibility barrier has been reported on ${site.domain}.

Page URL: ${reportData.page_url || 'Not provided'}
Description: ${reportData.description || 'No description provided'}
${reportData.reporter_email ? `Reporter Email: ${reportData.reporter_email}` : 'Reporter: Anonymous'}
Submitted: ${new Date().toISOString().slice(0, 10)}

Please review and take appropriate action. Log in to the Tessera Privacy dashboard to manage this report.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});