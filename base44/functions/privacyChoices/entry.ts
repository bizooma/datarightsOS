// "Your Privacy Choices" — a public, crawlable OPT-OUT MECHANISM page.
//
// WHAT THIS PAGE IS NOT: it is not a claim. It does not say, imply, or hint that the
// business sells or shares personal information, because we do not know that and
// asserting it would be exactly the overclaiming this product refuses to do. Every line
// of copy below describes only what the VISITOR can do here. Read the copy as legal
// text about the subscriber and it should say nothing at all.
//
// WHY A REAL PAGE AND NOT A WIDGET DEEP LINK: the point is to be reachable and readable
// without JavaScript — by a crawler, a scanner, or a person with a link. A deep link into
// a JS widget satisfies none of those.
//
// The opt-out is RECORDED SERVER-SIDE as a normal opt_out data-rights request through the
// existing intake endpoint — same validation, throttling, emails, and audit trail as every
// other request. Nothing about intake is reimplemented here.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
};

function esc(s: unknown) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#f4f6f8;color:#14202b;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header{background:#14202b;color:#fff;padding:44px 20px;text-align:center}
header h1{margin:0;font-size:30px;line-height:1.2}
header p{margin:10px 0 0;color:#b7c4d0;font-size:14px}
main{max-width:680px;margin:0 auto;padding:36px 20px 64px}
.card{background:#fff;border:1px solid #e2e8ed;border-radius:12px;padding:22px;margin-bottom:20px}
h2{font-size:19px;margin:0 0 8px}
p{margin:0 0 12px}
label{display:block;font-size:13px;font-weight:600;margin:14px 0 5px}
input,select{width:100%;padding:11px;border:1px solid #d3dbe2;border-radius:8px;font-size:15px;font-family:inherit;background:#fff;color:#14202b}
button{margin-top:18px;width:100%;padding:13px;border:none;border-radius:8px;background:#0d7d74;color:#fff;font-size:15px;font-weight:650;cursor:pointer;font-family:inherit}
button:disabled{opacity:.6;cursor:default}
.muted{color:#5d6b78;font-size:13.5px}
.ok,.err{display:none;margin-top:16px;padding:12px;border-radius:8px;font-size:14px}
.ok{background:#e8f5f1;border:1px solid #9fd3c7;color:#0b5c55}
.err{background:#fdecec;border:1px solid #f0b3b3;color:#8a2020}
.alt{border-top:1px solid #e2e8ed;margin-top:22px;padding-top:18px}
footer{text-align:center;padding:0 20px 48px;color:#7d8b98;font-size:12px}
a{color:#0d7d74}
:focus-visible{outline:3px solid #0d7d74;outline-offset:2px}
`;

function page({ name, siteKey, contactEmail, apiBase }: any) {
  // COPY DISCIPLINE: describes the visitor's action and this page's function only.
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your Privacy Choices — ${esc(name)}</title>
<meta name="description" content="Submit a request to opt out of the sale or sharing of your personal information, and to opt out of targeted advertising.">
<meta name="robots" content="index,follow">
<style>${CSS}</style>
</head><body>
<header>
  <h1>Your Privacy Choices</h1>
  <p>${esc(name)}</p>
</header>
<main>
  <div class="card">
    <h2>Opt out of the sale or sharing of your personal information</h2>
    <p>Use this form to submit an opt-out request. It also covers opting out of
       targeted advertising based on your personal information.</p>
    <p class="muted">Submitting this form records your choice. It does not indicate
       whether ${esc(name)} sells or shares personal information — your request is
       recorded and handled either way.</p>

    <form id="f" novalidate>
      <label for="e">Email address <span class="muted">(required, so your request can be matched and confirmed)</span></label>
      <input id="e" name="email" type="email" autocomplete="email" required>
      <label for="n">Full name <span class="muted">(required, so your request can be matched to your records)</span></label>
      <input id="n" name="name" type="text" autocomplete="name" required>
      <label for="s">State</label>
      <input id="s" name="state" type="text" autocomplete="address-level1" placeholder="e.g. TX" maxlength="40">
      <button type="submit" id="b">Submit my opt-out request</button>
      <div class="ok" id="ok" role="status"></div>
      <div class="err" id="err" role="alert"></div>
    </form>

    <div class="alt">
      <p class="muted"><strong>Prefer not to use this form, or have JavaScript turned off?</strong>
      ${contactEmail
        ? `Email <a href="mailto:${esc(contactEmail)}?subject=Opt-out%20request">${esc(contactEmail)}</a> and say you are opting out of the sale or sharing of your personal information.`
        : 'Contact the business directly and say you are opting out of the sale or sharing of your personal information.'}</p>
    </div>
  </div>

  <div class="card">
    <h2>Global Privacy Control</h2>
    <p class="muted">If your browser or an extension sends a Global Privacy Control (GPC)
      signal, it is treated as an opt-out automatically while you browse — no form needed.
      GPC applies to the browser you are using; the form above records your choice
      independently of any browser or device.</p>
  </div>
</main>
<footer>This page is an opt-out mechanism. It is not a privacy policy and makes no statement about how data is used.</footer>
<script>
(function(){
  var f=document.getElementById('f'),b=document.getElementById('b'),
      ok=document.getElementById('ok'),err=document.getElementById('err');
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var email=document.getElementById('e').value.trim();
    var nm=document.getElementById('n').value.trim();
    err.style.display='none'; ok.style.display='none';
    if(!email){ err.textContent='Please enter your email address.'; err.style.display='block'; return; }
    if(!nm){ err.textContent='Please enter your full name.'; err.style.display='block'; return; }
    b.disabled=true; b.textContent='Submitting…';
    fetch(${JSON.stringify(apiBase)}+'/intakeEndpoint',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({site_key:${JSON.stringify(siteKey)},type:'rights_request',
        request_type:'opt_out',requester_email:email,
        requester_name:nm,
        requester_state:document.getElementById('s').value.trim(),
        is_authorized_agent:false})
    }).then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {okk:r.ok,j:j}; }); })
     .then(function(res){
       if(!res.okk){ throw new Error((res.j&&(res.j.error||res.j.message))||'Your request could not be submitted.'); }
       // The endpoint answers 200 with unavailable:true when this site's plan does not
       // accept recorded requests. Saying "recorded" then would be a lie about the one
       // thing this page exists to do, so route the visitor to the contact instead.
       if(res.j && res.j.unavailable){ throw new Error(${JSON.stringify('This site cannot accept requests through this form right now.')}+' '+${JSON.stringify('Please use the email option above so your choice reaches someone.')}); }
       f.querySelectorAll('input').forEach(function(i){ i.value=''; });
       ok.textContent='Your opt-out request has been recorded. A confirmation is on its way to '+email+'.';
       ok.style.display='block'; b.style.display='none';
     })
     .catch(function(e){
       err.textContent=e.message||'Your request could not be submitted. Please try again, or use the email option above.';
       err.style.display='block'; b.disabled=false; b.textContent='Submit my opt-out request';
     });
  });
})();
</script>
</body></html>`;
}

function notFound() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found</title><meta name="robots" content="noindex"><style>${CSS}</style></head>
<body><header><h1>Page not found</h1></header>
<main><div class="card"><p>This privacy choices page isn't available. The link may be out of date.</p></div></main>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const key = (url.searchParams.get('site') || '').trim();
  if (!key) return new Response(notFound(), { status: 404, headers: CORS });

  const base44 = createClientFromRequest(req);
  const svc = base44.asServiceRole;

  // slug first, then site_key — links published before slugs existed still resolve.
  let sites = await svc.entities.Site.filter({ slug: key });
  if (!sites || !sites.length) sites = await svc.entities.Site.filter({ site_key: key });
  const site = sites && sites[0];
  if (!site) return new Response(notFound(), { status: 404, headers: CORS });

  const orgs = await svc.entities.Organization.filter({ id: site.organization });
  const org = orgs[0] || {};

  const name = site.business_name || org.business_name || site.brand_product_name || org.name || site.domain;
  const contactEmail = site.privacy_contact_email || org.privacy_contact_email || '';

  const appId = Deno.env.get('BASE44_APP_ID') || '6a3735f4f27dcb14405892ae';
  const apiBase = `https://api.base44.app/api/apps/${appId}/functions`;

  return new Response(
    page({ name, siteKey: site.site_key, contactEmail, apiBase }),
    { status: 200, headers: CORS },
  );
});