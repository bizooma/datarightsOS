// Serves widget.js as a static JS file with CORS headers.

Deno.serve(async (req) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  const APP_ID = 'VITE_BASE44_APP_ID' in Deno.env ? Deno.env.get('VITE_BASE44_APP_ID') : (Deno.env.get('BASE44_APP_ID') || '6a3735f4f27dcb14405892ae');
  const API = `https://api.base44.app/api/apps/${APP_ID}/functions`;

  const widgetCode = `/* ===== Data Rights OS widget.js ===== */
(function () {
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script'); return s[s.length - 1];
  })();
  var SITE = script.getAttribute('data-tessera-site');
  var API = '${API}';

  if (!SITE) { console.warn('[DataRightsOS] missing data-tessera-site'); return; }

  var GPC = (navigator.globalPrivacyControl === true);

  var vid = localStorage.getItem('dros_vid');
  if (!vid) { vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('dros_vid', vid); }

  function post(payload) {
    payload.site_key = SITE; payload.visitor_id = vid; payload.gpc_detected = GPC;
    return fetch(API + '/widgetEvent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
  }

  var DEFAULT = { product_name: 'Privacy & Data Rights Center', logo_url: '', primary_color: '#0d7d74',
    enabled_drawers: ['privacy_rights', 'cookies', 'accessibility'], honor_gpc: true,
    intro_video_url: '', accessibility_statement_url: '', privacy_policy_url: '', policy_version: '1.0' };

  fetch(API + '/widgetConfig?site=' + encodeURIComponent(SITE))
    .then(function (r) { return r.ok ? r.json() : DEFAULT; })
    .then(render).catch(function () { render(DEFAULT); });

  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function render(cfg) {
    var accent = cfg.primary_color || '#0d7d74';
    var isDark = (cfg.widget_theme || 'dark') !== 'light';
    // Theme tokens
    var launcherBg = isDark ? '#14202b' : '#ffffff';
    var launcherColor = isDark ? '#ffffff' : '#14202b';
    var launcherBorder = isDark ? 'none' : '1px solid #d1d9e0';
    var panelBg = isDark ? '#14202b' : '#ffffff';
    var panelText = isDark ? '#e8edf2' : '#14202b';
    var panelSubText = isDark ? '#8fa3b3' : '#6b7a87';
    var panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,32,43,0.08)';
    var divider = isDark ? '#243040' : '#e4e9ed';
    var itemBg = isDark ? '#1c2c3a' : '#ffffff';
    var itemHover = isDark ? '#243040' : '#fafcfd';
    var footerBg = isDark ? '#111e2a' : '#fbfcfd';
    var inputBg = isDark ? '#1c2c3a' : '#ffffff';
    var inputColor = isDark ? '#e8edf2' : '#14202b';
    var inputBorder = isDark ? '#2e4055' : '#e4e9ed';
    var crestBg = isDark ? '#ffffff' : '#f5f7f9';
    var crestColor = isDark ? '#14202b' : '#14202b';
    var host = document.createElement('div');
    host.id = 'dros-root';
    document.body.appendChild(host);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

    var drawers = cfg.enabled_drawers || [];
    var showCookies = drawers.indexOf('cookies') > -1;
    var showRights = drawers.indexOf('privacy_rights') > -1;
    var showA11y = drawers.indexOf('accessibility') > -1;
    var showAI = drawers.indexOf('ai_disclosure') > -1;

    var pos = cfg.widget_position || 'bottom-right';
    var posCSS = pos === 'bottom-left' ? 'left:22px;bottom:22px;right:auto;top:auto'
      : pos === 'top-right' ? 'right:22px;top:22px;bottom:auto;left:auto'
      : pos === 'top-left' ? 'left:22px;top:22px;bottom:auto;right:auto'
      : 'right:22px;bottom:22px;left:auto;top:auto';
    var panelCSS = pos === 'bottom-left' ? 'left:22px;bottom:22px;right:auto;top:auto'
      : pos === 'top-right' ? 'right:22px;top:22px;bottom:auto;left:auto'
      : pos === 'top-left' ? 'left:22px;top:22px;bottom:auto;right:auto'
      : 'right:22px;bottom:22px;left:auto;top:auto';

    var css = ''
      + ':host{all:initial}'
      + '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}'
      + '.launcher{position:fixed;' + posCSS + ';z-index:2147483000;display:flex;align-items:center;gap:8px;background:' + launcherBg + ';color:' + launcherColor + ';border:' + launcherBorder + ';cursor:pointer;padding:11px 15px;border-radius:999px;box-shadow:0 14px 40px -10px rgba(20,32,43,.45);font-size:13px;font-weight:600}'
      + '.launcher .dot{width:7px;height:7px;border-radius:50%;background:' + accent + '}'
      + '.panel{position:fixed;' + panelCSS + ';z-index:2147483001;width:380px;max-width:calc(100vw - 28px);max-height:86vh;background:' + panelBg + ';border-radius:16px;box-shadow:0 18px 50px -12px rgba(20,32,43,.4);display:flex;flex-direction:column;overflow:hidden;border:1px solid ' + panelBorder + '}'
      + '.hidden{display:none}'
      + '.phead{padding:15px 16px;border-bottom:1px solid ' + divider + ';display:flex;align-items:center;gap:10px;position:relative}'
      + '.crest{width:36px;height:36px;border-radius:8px;background:' + crestBg + ';border:1px solid ' + divider + ';display:flex;align-items:center;justify-content:center;color:' + crestColor + ';font-weight:700;overflow:hidden}'
      + '.crest img{width:100%;height:100%;object-fit:contain;padding:2px}'
      + '.phead h2{margin:0;font-size:14px;font-weight:700;color:' + panelText + '}'
      + '.phead .sub{margin:1px 0 0;font-size:11px;color:' + panelSubText + '}'
      + '.x{position:absolute;top:12px;right:12px;width:26px;height:26px;border:1px solid ' + divider + ';border-radius:7px;background:' + itemBg + ';cursor:pointer;color:' + panelSubText + ';font-size:15px;line-height:1}'
      + '.body{overflow-y:auto;padding:12px 16px}'
      + '.vid{margin:2px 0 12px;aspect-ratio:16/9;border-radius:9px;overflow:hidden;border:1px solid ' + divider + ';background:#000}'
      + '.vid iframe{width:100%;height:100%;border:0}'
      + '.gpc{display:flex;gap:8px;padding:10px;border-radius:9px;background:' + accent + '22;border:1px solid ' + accent + '44;margin-bottom:12px}'
      + '.gpc b{font-size:12px;color:' + accent + '}.gpc p{margin:2px 0 0;font-size:11px;color:' + panelSubText + ';line-height:1.4}'
      + '.drawer{border:1px solid ' + divider + ';border-radius:9px;margin-bottom:9px;overflow:hidden}'
      + '.dh{display:flex;align-items:center;justify-content:space-between;width:100%;background:' + itemBg + ';border:none;cursor:pointer;padding:12px;font-size:13px;font-weight:650;color:' + panelText + ';text-align:left}'
      + '.dh:hover{background:' + itemHover + '}'
      + '.db{padding:0 12px 13px;display:none}.drawer.open .db{display:block}'
      + '.row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-top:1px solid ' + divider + '}.row:first-child{border-top:none}'
      + '.lbl{font-size:12.5px;font-weight:600;color:' + panelText + '}.desc{font-size:11px;color:' + panelSubText + ';max-width:220px}'
      + '.sw{position:relative;width:38px;height:22px;flex:0 0 auto}.sw input{opacity:0;width:0;height:0}'
      + '.tr{position:absolute;inset:0;background:' + (isDark ? '#2e4055' : '#cdd6dc') + ';border-radius:999px;transition:.15s}.kn{position:absolute;top:3px;left:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:.15s;box-shadow:0 1px 2px rgba(0,0,0,.25)}'
      + '.sw input:checked + .tr{background:' + accent + '}.sw input:checked + .tr + .kn{transform:translateX(16px)}'
      + '.sw.lock .tr{background:' + (isDark ? '#4a6070' : '#14202b') + ';opacity:.4}.sw.lock .kn{transform:translateX(16px)}'
      + '.btnrow{display:flex;gap:8px;margin-top:12px}'
      + '.btn{flex:1;border:none;cursor:pointer;font-weight:650;font-size:12.5px;padding:10px;border-radius:8px}'
      + '.btn.p{background:' + accent + ';color:#fff}.btn.g{background:' + itemBg + ';color:' + panelText + ';border:1px solid ' + divider + '}'
      + '.rights{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
      + '.rb{border:1px solid ' + divider + ';background:' + itemBg + ';border-radius:9px;padding:10px;cursor:pointer;text-align:left;font-size:12px;font-weight:650;color:' + panelText + '}'
      + '.rb:hover,.rb.sel{border-color:' + accent + ';background:' + accent + '22}'
      + '.intake{margin-top:11px;border-top:1px dashed ' + divider + ';padding-top:11px;display:none}.intake.show{display:block}'
      + '.fld{width:100%;border:1px solid ' + inputBorder + ';border-radius:8px;padding:9px;font-size:12.5px;margin-bottom:8px;color:' + inputColor + ';background:' + inputBg + '}'
      + '.chk{display:flex;align-items:center;gap:7px;font-size:11.5px;color:' + panelSubText + ';margin-bottom:9px}'
      + '.link{display:flex;align-items:center;justify-content:space-between;width:100%;background:' + itemBg + ';border:1px solid ' + divider + ';border-radius:8px;padding:11px;font-size:12.5px;font-weight:600;color:' + panelText + ';cursor:pointer;margin-bottom:8px;text-decoration:none}'
      + '.note{font-size:11px;color:' + panelSubText + ';background:' + (isDark ? '#1c2c3a' : '#f6f8f9') + ';border:1px solid ' + divider + ';border-radius:8px;padding:10px;margin-bottom:11px;line-height:1.45}'
      + '.cap{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:' + panelSubText + ';font-weight:700;margin:8px 0 2px}'
      + '.foot{border-top:1px solid ' + divider + ';padding:9px 16px;font-size:10.5px;color:' + panelSubText + ';background:' + footerBg + '}'
      + '.toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:2147483002;background:#14202b;color:#fff;padding:10px 15px;border-radius:9px;font-size:12.5px;font-weight:600;opacity:0;transition:.25s;pointer-events:none}.toast.show{opacity:1}'
      + '.stmtlinks{display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px;border-top:1px solid ' + divider + ';background:' + footerBg + '}'
      + '.stmtlink{font-size:10px;color:' + accent + ';background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;font-family:inherit}'
      + '.modal-overlay{position:fixed;inset:0;z-index:2147483010;background:rgba(0,0,0,0.55);display:flex;align-items:flex-end;justify-content:center}'
      + '.modal{width:100%;max-width:480px;max-height:80vh;background:' + panelBg + ';border-radius:16px 16px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,0.3)}'
      + '.modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid ' + divider + ';flex-shrink:0}'
      + '.modal-head h3{margin:0;font-size:14px;font-weight:700;color:' + panelText + '}'
      + '.modal-meta{font-size:10px;color:' + panelSubText + ';margin-top:2px}'
      + '.modal-body{overflow-y:auto;padding:14px 16px;font-size:12.5px;color:' + panelText + ';line-height:1.6}'
      + '.modal-body h1,.modal-body h2,.modal-body h3{color:' + panelText + ';margin:12px 0 4px}'
      + '.modal-body p{margin:0 0 8px}.modal-body ul,.modal-body ol{padding-left:18px;margin:0 0 8px}'
      + '.modal-body a{color:' + accent + '}';

    function ytEmbed(url) {
      var m = (url || '').match(/(?:youtu\\.be\\/|v=)([\\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] + '?rel=0' : '';
    }
    var yt = ytEmbed(cfg.intro_video_url);

    var html = ''
      + '<style>' + css + '</style>'
      + '<button class="launcher" id="L"><span class="dot"></span>Privacy &amp; Data Rights</button>'
      + '<div class="panel hidden" id="P">'
      + '<div class="phead"><div class="crest">' + (cfg.logo_url ? '<img src="' + esc(cfg.logo_url) + '">' : 'D') + '</div>'
      + '<div><h2>' + esc(cfg.product_name) + '</h2><div class="sub">Manage cookies, your data, and access</div></div>'
      + '<button class="x" id="X">&times;</button></div>'
      + '<div class="body">'
      + (yt ? '<div class="vid"><iframe src="' + yt + '" title="Intro" allowfullscreen></iframe></div>' : '')
      + ((cfg.honor_gpc && GPC) ? '<div class="gpc"><div><b>Global Privacy Control detected</b><p>We\\'ve automatically opted you out of sale &amp; sharing, as required in your state.</p></div></div>' : '')
      + (showRights ? '<div class="drawer open" data-d><button class="dh" data-t>Your privacy rights<span>&#9662;</span></button><div class="db">'
        + '<div class="rights">'
        + '<button class="rb" data-req="access">Access my data</button>'
        + '<button class="rb" data-req="delete">Delete my data</button>'
        + '<button class="rb" data-req="correct">Correct my data</button>'
        + '<button class="rb" data-req="opt_out">Opt out of sale/sharing</button>'
        + '</div>'
        + '<div class="intake" id="IN"><input class="fld" id="rn" placeholder="Full name"><input class="fld" id="re" type="email" placeholder="Email on file"><input class="fld" id="rs" placeholder="State (e.g. TX)">'
        + '<label class="chk"><input type="checkbox" id="ra"> I am submitting as an authorized agent</label>'
        + '<button class="btn p" id="RS" style="width:100%">Submit verified request</button></div>'
        + '</div></div>' : '')
      + (showCookies ? '<div class="drawer" data-d><button class="dh" data-t>Cookie preferences<span>&#9662;</span></button><div class="db">'
        + '<div class="row"><div><div class="lbl">Strictly necessary</div><div class="desc">Required for the site. Always on.</div></div><label class="sw lock"><input type="checkbox" checked disabled><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">Functional</div></div><label class="sw"><input type="checkbox" id="cf"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">Analytics</div></div><label class="sw"><input type="checkbox" id="ca"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">Advertising</div></div><label class="sw"><input type="checkbox" id="cad"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="btnrow"><button class="btn g" id="CR">Reject all</button><button class="btn p" id="CS">Save choices</button></div>'
        + '</div></div>' : '')
      + (showA11y ? '<div class="drawer" data-d><button class="dh" data-t>Accessibility<span>&#9662;</span></button><div class="db">'
        + '<div class="note">This is a feedback &amp; preferences tool, not a substitute for an accessible site.</div>'
        + (cfg.accessibility_statement_url ? '<a class="link" href="' + esc(cfg.accessibility_statement_url) + '" target="_blank" rel="noopener">Accessibility statement &#8599;</a>' : '')
        + '<button class="link" id="BR">Report an accessibility barrier &#8250;</button>'
        + '<div class="intake" id="BF"><input class="fld" id="bu" placeholder="Page URL"><textarea class="fld" id="bd" rows="2" placeholder="Describe the barrier"></textarea><input class="fld" id="be" type="email" placeholder="Your email (optional)"><button class="btn p" id="BS" style="width:100%">Send report</button></div>'
        + '<div class="cap">Display preferences (this browser only)</div>'
        + '<div class="row"><div class="lbl">Larger text</div><label class="sw"><input type="checkbox" id="pf"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div class="lbl">Reduce motion</div><label class="sw"><input type="checkbox" id="pm"><span class="tr"></span><span class="kn"></span></label></div>'
        + '</div></div>' : '')
      + (showAI ? '<div class="drawer" data-d><button class="dh" data-t>AI Use Disclosure<span>&#9662;</span></button><div class="db">'
        + '<div class="note">In compliance with FTC guidelines and California AB 302, this site discloses when and how artificial intelligence is used to interact with you.</div>'
        + (((cfg.statements || {}).ai_use_statement || {}).body ? '<p style="font-size:12px;line-height:1.6;margin:8px 0 0">' + esc(((cfg.statements || {}).ai_use_statement || {}).body.replace(/<[^>]*>/g, '')) + '</p>' : '')
        + '</div></div>' : '')
      + '</div>'
      + (function() {
          var stmts = cfg.statements || {};
          var links = [];
          if (stmts.privacy_policy) links.push('<button class="stmtlink" data-stmt="privacy_policy">' + esc(stmts.privacy_policy.title || 'Privacy Policy') + '</button>');
          if (stmts.cookie_policy) links.push('<button class="stmtlink" data-stmt="cookie_policy">' + esc(stmts.cookie_policy.title || 'Cookie Policy') + '</button>');
          if (stmts.accessibility_statement) links.push('<button class="stmtlink" data-stmt="accessibility_statement">' + esc(stmts.accessibility_statement.title || 'Accessibility Statement') + '</button>');
          if (stmts.ai_use_statement) links.push('<button class="stmtlink" data-stmt="ai_use_statement">' + esc(stmts.ai_use_statement.title || 'AI Use Statement') + '</button>');
          return links.length ? '<div class="stmtlinks">' + links.join('<span style="color:' + panelSubText + ';font-size:10px">·</span>') + '</div>' : '';
        })()
      + '<div class="foot">Powered by <a href="https://bizooma.com" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Bizooma, LLC</a></div>'
      + '</div>'
      + '<div class="modal-overlay hidden" id="MO"><div class="modal"><div class="modal-head"><div><h3 id="MT"></h3><div class="modal-meta" id="MM"></div></div><button class="x" id="MX">&times;</button></div><div class="modal-body" id="MB"></div></div></div>'
      + '<div class="toast" id="T"></div>';

    root.innerHTML = html;
    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var q = function (s) { return root.querySelectorAll(s); };

    var L = $('L'), P = $('P'), T = $('T'), tt;
    function toast(m) { T.textContent = m; T.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { T.classList.remove('show'); }, 2200); }
    L.onclick = function () { P.classList.remove('hidden'); L.classList.add('hidden'); };
    $('X').onclick = function () { P.classList.add('hidden'); L.classList.remove('hidden'); };

    q('[data-t]').forEach(function (h) { h.onclick = function () { h.closest('[data-d]').classList.toggle('open'); }; });

    if (cfg.honor_gpc && GPC && !localStorage.getItem('dros_gpc_' + SITE)) {
      post({ type: 'consent', action: 'gpc_optout', necessary: true, functional: false, analytics: false, advertising: false });
      localStorage.setItem('dros_gpc_' + SITE, '1');
    }

    if (showCookies) {
      $('CS').onclick = function () { post({ type: 'consent', action: 'save_choices', necessary: true, functional: $('cf').checked, analytics: $('ca').checked, advertising: $('cad').checked }); toast('Preferences saved'); };
      $('CR').onclick = function () { post({ type: 'consent', action: 'reject_all', necessary: true, functional: false, analytics: false, advertising: false }); toast('All optional cookies rejected'); };
    }

    if (showRights) {
      var reqType = null;
      q('[data-req]').forEach(function (b) { b.onclick = function () { q('[data-req]').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); reqType = b.getAttribute('data-req'); $('IN').classList.add('show'); }; });
      $('RS').onclick = function () {
        if (!reqType) return;
        if (!$('re').value) { toast('Email is required'); return; }
        post({ type: 'rights_request', request_type: reqType, requester_name: $('rn').value, requester_email: $('re').value, requester_state: $('rs').value, is_authorized_agent: $('ra').checked, agent_details: '' });
        $('IN').classList.remove('show'); q('[data-req]').forEach(function (x) { x.classList.remove('sel'); }); reqType = null;
        toast('Request logged. Confirmation sent.');
      };
    }

    if (showA11y) {
      $('BR').onclick = function () { $('BF').classList.toggle('show'); };
      $('BS').onclick = function () { post({ type: 'accessibility_report', page_url: $('bu').value || location.href, description: $('bd').value, reporter_email: $('be').value }); $('BF').classList.remove('show'); toast('Report sent. Thank you.'); };
      $('pf').onchange = function () { document.documentElement.style.fontSize = this.checked ? '112%' : ''; localStorage.setItem('dros_pf', this.checked ? '1' : ''); };
      $('pm').onchange = function () { document.documentElement.style.scrollBehavior = this.checked ? 'auto' : ''; localStorage.setItem('dros_pm', this.checked ? '1' : ''); };
      if (localStorage.getItem('dros_pf')) { $('pf').checked = true; document.documentElement.style.fontSize = '112%'; }
    }

    // Statement modal
    var MO = $('MO'), MT = $('MT'), MM = $('MM'), MB = $('MB');
    if (MO) {
      $('MX').onclick = function () { MO.classList.add('hidden'); };
      MO.onclick = function (e) { if (e.target === MO) MO.classList.add('hidden'); };
      q('[data-stmt]').forEach(function (btn) {
        btn.onclick = function () {
          var key = btn.getAttribute('data-stmt');
          var s = (cfg.statements || {})[key];
          if (!s) return;
          MT.textContent = s.title || key;
          MM.textContent = (s.effective_date ? 'Effective: ' + s.effective_date : '') + (s.version ? '  ·  v' + s.version : '');
          MB.innerHTML = s.body || '';
          MO.classList.remove('hidden');
        };
      });
    }
  }
})();
/* ===== end widget.js ===== */`;

  return new Response(widgetCode, { status: 200, headers: CORS });
});