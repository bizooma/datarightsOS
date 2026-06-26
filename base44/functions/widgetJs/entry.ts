// Serves widget.js as a static JS file with CORS headers.

Deno.serve(async (req) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
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

  // Don't render the live widget inside the Data Rights OS dashboard itself —
  // the Widget Studio already shows its own preview. Only suppress it on the app's own host.
  var h = location.hostname;
  if (h === 'datarightsos.com' || h === 'www.datarightsos.com' || /\\.base44\\.app$/.test(h)) {
    return;
  }

  var GPC = (navigator.globalPrivacyControl === true);

  var vid = localStorage.getItem('dros_vid');
  if (!vid) { vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('dros_vid', vid); }

  function post(payload) {
    payload.site_key = SITE; payload.visitor_id = vid; payload.gpc_detected = GPC;
    return fetch(API + '/widgetEvent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
  }

  var DEFAULT = { product_name: 'Privacy & Data Rights Center', logo_url: 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/b5c7df386_vault.png', primary_color: '#0d7d74',
    enabled_drawers: ['privacy_rights', 'cookies', 'accessibility'], honor_gpc: true,
    intro_video_url: '', accessibility_statement_url: '', privacy_policy_url: '', policy_version: '1.0' };

  fetch(API + '/widgetConfig?site=' + encodeURIComponent(SITE) + '&t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : DEFAULT; })
    .then(function (res) { render((res && res.data) ? res.data : res, true); })
    .catch(function () { render(DEFAULT, true); });

  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  var I18N = {
    en: {
      launcher: 'Privacy & Data Rights',
      headerSub: 'Manage cookies, your data, and access',
      statusCompliant: 'Active',
      searchPlaceholder: 'How can we help with your privacy?',
      backHome: 'Back',
      cardRights: 'Privacy Rights', cardRightsSub: 'Submit a request',
      cardCookies: 'Cookies', cardCookiesSub: 'Manage settings',
      cardA11y: 'Accessibility', cardA11ySub: 'View & report',
      cardAI: 'AI Disclosure', cardAISub: 'How we use AI',
      noResults: 'No matches found',
      gpcTitle: 'Global Privacy Control detected',
      gpcBody: "We've automatically opted you out of sale & sharing, as required in your state.",
      rightsTitle: 'Your privacy rights',
      reqAccess: 'Access my data', reqDelete: 'Delete my data', reqCorrect: 'Correct my data', reqOptOut: 'Opt out of sale/sharing',
      fullName: 'Full name', emailOnFile: 'Email on file', state: 'State (e.g. TX)',
      agentLabel: 'I am submitting as an authorized agent', submitReq: 'Submit verified request',
      cookieTitle: 'Cookie preferences',
      necessary: 'Strictly necessary', necessaryDesc: 'Required for the site. Always on.',
      functional: 'Functional', analytics: 'Analytics', advertising: 'Advertising',
      rejectAll: 'Reject all', saveChoices: 'Save choices',
      a11yTitle: 'Accessibility',
      a11yNote: 'This is a feedback & preferences tool, not a substitute for an accessible site.',
      a11yStatement: 'Accessibility statement', reportBarrier: 'Report an accessibility barrier',
      pageUrl: 'Page URL', describeBarrier: 'Describe the barrier', yourEmail: 'Your email (optional)', sendReport: 'Send report',
      displayPrefs: 'Display preferences (this browser only)',
      largerText: 'Larger text', highContrast: 'High contrast', monochrome: 'Monochrome',
      reduceMotion: 'Reduce motion', oversizeCursor: 'Oversize cursor', screenReader: 'Screen reader optimized',
      aiTitle: 'AI Use Disclosure',
      aiNote: 'In compliance with FTC guidelines and California AB 302, this site discloses when and how artificial intelligence is used to interact with you.',
      tPrefsSaved: 'Preferences saved', tRejected: 'All optional cookies rejected',
      tEmailReq: 'Email is required', tReqLogged: 'Request logged. Confirmation sent.', tReportSent: 'Report sent. Thank you.',
      effective: 'Effective'
    },
    es: {
      launcher: 'Privacidad y Derechos de Datos',
      headerSub: 'Administre cookies, sus datos y acceso',
      statusCompliant: 'Activo',
      searchPlaceholder: '¿Cómo podemos ayudarle con su privacidad?',
      backHome: 'Volver',
      cardRights: 'Derechos de Privacidad', cardRightsSub: 'Enviar una solicitud',
      cardCookies: 'Cookies', cardCookiesSub: 'Administrar ajustes',
      cardA11y: 'Accesibilidad', cardA11ySub: 'Ver y reportar',
      cardAI: 'Divulgación de IA', cardAISub: 'Cómo usamos la IA',
      noResults: 'Sin resultados',
      gpcTitle: 'Control de Privacidad Global detectado',
      gpcBody: 'Lo hemos excluido automáticamente de la venta y el intercambio de datos, según lo exige su estado.',
      rightsTitle: 'Sus derechos de privacidad',
      reqAccess: 'Acceder a mis datos', reqDelete: 'Eliminar mis datos', reqCorrect: 'Corregir mis datos', reqOptOut: 'Excluir de venta/intercambio',
      fullName: 'Nombre completo', emailOnFile: 'Correo electrónico registrado', state: 'Estado (ej. TX)',
      agentLabel: 'Presento esta solicitud como agente autorizado', submitReq: 'Enviar solicitud verificada',
      cookieTitle: 'Preferencias de cookies',
      necessary: 'Estrictamente necesarias', necessaryDesc: 'Requeridas para el sitio. Siempre activas.',
      functional: 'Funcionales', analytics: 'Analíticas', advertising: 'Publicidad',
      rejectAll: 'Rechazar todo', saveChoices: 'Guardar opciones',
      a11yTitle: 'Accesibilidad',
      a11yNote: 'Esta es una herramienta de comentarios y preferencias, no un sustituto de un sitio accesible.',
      a11yStatement: 'Declaración de accesibilidad', reportBarrier: 'Reportar una barrera de accesibilidad',
      pageUrl: 'URL de la página', describeBarrier: 'Describa la barrera', yourEmail: 'Su correo (opcional)', sendReport: 'Enviar reporte',
      displayPrefs: 'Preferencias de visualización (solo este navegador)',
      largerText: 'Texto más grande', highContrast: 'Alto contraste', monochrome: 'Monocromo',
      reduceMotion: 'Reducir movimiento', oversizeCursor: 'Cursor grande', screenReader: 'Optimizado para lector de pantalla',
      aiTitle: 'Divulgación de Uso de IA',
      aiNote: 'En cumplimiento con las directrices de la FTC y la ley AB 302 de California, este sitio divulga cuándo y cómo se utiliza la inteligencia artificial para interactuar con usted.',
      tPrefsSaved: 'Preferencias guardadas', tRejected: 'Todas las cookies opcionales rechazadas',
      tEmailReq: 'El correo electrónico es obligatorio', tReqLogged: 'Solicitud registrada. Confirmación enviada.', tReportSent: 'Reporte enviado. Gracias.',
      effective: 'Vigente'
    }
  };

  function render(cfg, keepOpen) {
    if (cfg.install_status && cfg.install_status !== 'active') { return; }
    var lang = localStorage.getItem('dros_lang') === 'es' ? 'es' : 'en';
    var t = I18N[lang];
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
      + '.hidden{display:none !important}'
      + '.phead{padding:15px 16px;border-bottom:1px solid ' + divider + ';display:flex;align-items:center;gap:10px;position:relative}'
      + '.crest{width:36px;height:36px;border-radius:8px;background:' + crestBg + ';border:1px solid ' + divider + ';display:flex;align-items:center;justify-content:center;color:' + crestColor + ';font-weight:700;overflow:hidden}'
      + '.crest img{width:100%;height:100%;object-fit:contain;padding:2px}'
      + '.phead h2{margin:0;font-size:14px;font-weight:700;color:' + panelText + '}'
      + '.phead .sub{margin:1px 0 0;font-size:11px;color:' + panelSubText + '}'
      + '.pill{display:inline-flex;align-items:center;gap:4px;margin-top:4px;background:' + accent + '1f;color:' + accent + ';border-radius:999px;padding:2px 8px;font-size:10px;font-weight:700}'
      + '.pill .pdot{width:6px;height:6px;border-radius:50%;background:' + accent + '}'
      + '.cmdsearch{display:flex;align-items:center;gap:8px;margin:0 0 12px;background:' + itemBg + ';border:1px solid ' + divider + ';border-radius:10px;padding:10px 12px}'
      + '.cmdsearch input{flex:1;border:none;background:none;outline:none;font-size:12.5px;color:' + panelText + ';font-family:inherit}'
      + '.cmdsearch input::placeholder{color:' + panelSubText + '}'
      + '.cardgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:4px}'
      + '.ccard{border:1px solid ' + divider + ';background:' + itemBg + ';border-radius:11px;overflow:hidden;cursor:pointer;text-align:left;display:flex;flex-direction:column;padding:0;transition:border-color .15s,box-shadow .15s,transform .15s}'
      + '.ccard:hover{border-color:' + accent + ';box-shadow:0 8px 22px -10px rgba(20,32,43,.5);transform:translateY(-1px)}'
      + '.ccard .chead{position:relative;height:64px;background-size:cover;background-position:center}'
      + '.ccard .chead::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,32,43,.15) 0%,rgba(20,32,43,.78) 100%)}'
      + '.ccard .ctitle{position:absolute;left:10px;right:10px;bottom:8px;z-index:1;font-size:12.5px;font-weight:700;color:#fff;line-height:1.2;text-shadow:0 1px 3px rgba(0,0,0,.5)}'
      + '.ccard .cbody{padding:8px 11px 11px}'
      + '.ccard .csub{font-size:10.5px;color:' + panelSubText + '}'
      + '.backbtn{display:inline-flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;font-size:11.5px;font-weight:650;color:' + accent + ';padding:0;margin-bottom:10px;font-family:inherit}'
      + '.x{position:absolute;top:12px;right:12px;width:26px;height:26px;border:1px solid ' + divider + ';border-radius:7px;background:' + itemBg + ';cursor:pointer;color:' + panelSubText + ';font-size:15px;line-height:1}'
      + '.langpick{position:absolute;top:12px;right:44px;display:flex;gap:2px;background:' + itemBg + ';border:1px solid ' + divider + ';border-radius:7px;padding:2px}'
      + '.langpick button{border:none;background:none;cursor:pointer;font-size:10px;font-weight:700;padding:3px 6px;border-radius:5px;color:' + panelSubText + ';font-family:inherit}'
      + '.langpick button.on{background:' + accent + ';color:#fff}'
      + '.body{overflow-y:auto;padding:12px 16px}'
      + '.vid{margin:2px 0 12px;aspect-ratio:16/9;border-radius:9px;overflow:hidden;border:1px solid ' + divider + ';background:#000}'
      + '.vid iframe{width:100%;height:100%;border:0}'
      + '.gpc{display:flex;gap:8px;padding:10px;border-radius:9px;background:' + accent + '22;border:1px solid ' + accent + '44;margin-bottom:12px}'
      + '.gpc b{font-size:12px;color:' + accent + '}.gpc p{margin:2px 0 0;font-size:11px;color:' + panelSubText + ';line-height:1.4}'
      + '.section{margin-bottom:4px}'
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
      + '.a11ygrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}'
      + '.a11ycell{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid ' + divider + ';background:' + itemBg + ';border-radius:9px;padding:9px 10px}'
      + '.a11ycell .lbl{font-size:11.5px;font-weight:600;color:' + panelText + ';line-height:1.25}'
      + '.foot{border-top:1px solid ' + divider + ';padding:9px 16px;font-size:10.5px;color:' + panelSubText + ';background:' + footerBg + '}'
      + '.toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:2147483002;background:#14202b;color:#fff;padding:10px 15px;border-radius:9px;font-size:12.5px;font-weight:600;opacity:0;transition:.25s;pointer-events:none}.toast.show{opacity:1}'
      + '.stmtlinks{display:flex;flex-wrap:wrap;gap:6px;padding:8px 16px;border-top:1px solid ' + divider + ';background:' + footerBg + '}'
      + '.stmtlink{font-size:10px;color:' + panelText + ';background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;font-family:inherit}'
      + '.modal-overlay{position:fixed;inset:0;z-index:2147483010;background:rgba(0,0,0,0.55);display:flex;align-items:flex-end;justify-content:center}'
      + '.modal{width:100%;max-width:480px;max-height:80vh;background:' + panelBg + ';border-radius:16px 16px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,0.3)}'
      + '.modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid ' + divider + ';flex-shrink:0}'
      + '.modal-head h3{margin:0;font-size:14px;font-weight:700;color:' + panelText + '}'
      + '.modal-meta{font-size:10px;color:' + panelSubText + ';margin-top:2px}'
      + '.modal-body{overflow-y:auto;padding:14px 16px;font-size:12.5px;color:' + panelText + ';line-height:1.6}'
      + '.modal-body *{color:' + panelText + ' !important}'
      + '.modal-body h1,.modal-body h2,.modal-body h3{margin:12px 0 4px}'
      + '.modal-body p{margin:0 0 8px}.modal-body ul,.modal-body ol{padding-left:18px;margin:0 0 8px}'
      + '.modal-body a{text-decoration:underline}';

    function ytEmbed(url) {
      var m = (url || '').match(/(?:youtu\\.be\\/|v=)([\\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] + '?rel=0' : '';
    }
    var yt = ytEmbed(cfg.intro_video_url);

    // Professional photographic header images for the action cards.
    var IMG = {
      rights: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=70',
      cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=400&q=70',
      a11y: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=70',
      ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=400&q=70'
    };

    var html = ''
      + '<style>' + css + '</style>'
      + '<button class="launcher" id="L"><span class="dot"></span>' + esc(t.launcher) + '</button>'
      + '<div class="panel hidden" id="P">'
      + '<div class="phead"><div class="crest">' + (cfg.logo_url ? '<img src="' + esc(cfg.logo_url) + '">' : 'D') + '</div>'
      + '<div><h2>' + esc(cfg.product_name) + '</h2><div class="pill"><span class="pdot"></span>' + esc(t.statusCompliant) + '</div></div>'
      + '<div class="langpick"><button data-lang="en" class="' + (lang === 'en' ? 'on' : '') + '">EN</button><button data-lang="es" class="' + (lang === 'es' ? 'on' : '') + '">ES</button></div>'
      + '<button class="x" id="X">&times;</button></div>'
      + '<div class="body">'
      + (yt ? '<div class="vid"><iframe src="' + yt + '" title="Intro" allowfullscreen></iframe></div>' : '')
      + ((cfg.honor_gpc && GPC) ? '<div class="gpc"><div><b>' + esc(t.gpcTitle) + '</b><p>' + esc(t.gpcBody) + '</p></div></div>' : '')
      + '<div id="HOME">'
      + '<div class="cmdsearch"><span style="font-size:13px;color:' + panelSubText + '">&#128269;</span><input id="CMDQ" placeholder="' + esc(t.searchPlaceholder) + '"></div>'
      + '<div class="cardgrid">'
      + (showRights ? '<button class="ccard" data-card="rights" data-kw="' + esc(t.rightsTitle) + '"><div class="chead" style="background-image:url(' + IMG.rights + ')"><div class="ctitle">' + esc(t.cardRights) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardRightsSub) + '</div></div></button>' : '')
      + (showCookies ? '<button class="ccard" data-card="cookies" data-kw="' + esc(t.cookieTitle) + '"><div class="chead" style="background-image:url(' + IMG.cookies + ')"><div class="ctitle">' + esc(t.cardCookies) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardCookiesSub) + '</div></div></button>' : '')
      + (showA11y ? '<button class="ccard" data-card="a11y" data-kw="' + esc(t.a11yTitle) + '"><div class="chead" style="background-image:url(' + IMG.a11y + ')"><div class="ctitle">' + esc(t.cardA11y) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardA11ySub) + '</div></div></button>' : '')
      + (showAI ? '<button class="ccard" data-card="ai" data-kw="' + esc(t.aiTitle) + '"><div class="chead" style="background-image:url(' + IMG.ai + ')"><div class="ctitle">' + esc(t.cardAI) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardAISub) + '</div></div></button>' : '')
      + '</div></div>'
      + '<div id="SECTIONS">'
      + (showRights ? '<div class="section hidden" data-section="rights"><button class="backbtn" data-back>&#8249; ' + esc(t.backHome) + '</button><div class="drawer open" data-d><button class="dh" data-t>' + esc(t.rightsTitle) + '<span>&#9662;</span></button><div class="db">'
        + '<div class="rights">'
        + '<button class="rb" data-req="access">' + esc(t.reqAccess) + '</button>'
        + '<button class="rb" data-req="delete">' + esc(t.reqDelete) + '</button>'
        + '<button class="rb" data-req="correct">' + esc(t.reqCorrect) + '</button>'
        + '<button class="rb" data-req="opt_out">' + esc(t.reqOptOut) + '</button>'
        + '</div>'
        + '<div class="intake" id="IN"><input class="fld" id="rn" placeholder="' + esc(t.fullName) + '"><input class="fld" id="re" type="email" placeholder="' + esc(t.emailOnFile) + '"><input class="fld" id="rs" placeholder="' + esc(t.state) + '">'
        + '<label class="chk"><input type="checkbox" id="ra"> ' + esc(t.agentLabel) + '</label>'
        + '<button class="btn p" id="RS" style="width:100%">' + esc(t.submitReq) + '</button></div>'
        + '</div></div></div>' : '')
      + (showCookies ? '<div class="section hidden" data-section="cookies"><button class="backbtn" data-back>&#8249; ' + esc(t.backHome) + '</button><div class="drawer open" data-d><button class="dh" data-t>' + esc(t.cookieTitle) + '<span>&#9662;</span></button><div class="db">'
        + '<div class="row"><div><div class="lbl">' + esc(t.necessary) + '</div><div class="desc">' + esc(t.necessaryDesc) + '</div></div><label class="sw lock"><input type="checkbox" checked disabled><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">' + esc(t.functional) + '</div></div><label class="sw"><input type="checkbox" id="cf"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">' + esc(t.analytics) + '</div></div><label class="sw"><input type="checkbox" id="ca"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="row"><div><div class="lbl">' + esc(t.advertising) + '</div></div><label class="sw"><input type="checkbox" id="cad"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="btnrow"><button class="btn g" id="CR">' + esc(t.rejectAll) + '</button><button class="btn p" id="CS">' + esc(t.saveChoices) + '</button></div>'
        + '</div></div></div>' : '')
      + (showA11y ? '<div class="section hidden" data-section="a11y"><button class="backbtn" data-back>&#8249; ' + esc(t.backHome) + '</button><div class="drawer open" data-d><button class="dh" data-t>' + esc(t.a11yTitle) + '<span>&#9662;</span></button><div class="db">'
        + '<div class="note">' + esc(t.a11yNote) + '</div>'
        + (cfg.accessibility_statement_url ? '<a class="link" href="' + esc(cfg.accessibility_statement_url) + '" target="_blank" rel="noopener">' + esc(t.a11yStatement) + ' &#8599;</a>' : '')
        + '<button class="link" id="BR">' + esc(t.reportBarrier) + ' &#8250;</button>'
        + '<div class="intake" id="BF"><input class="fld" id="bu" placeholder="' + esc(t.pageUrl) + '"><textarea class="fld" id="bd" rows="2" placeholder="' + esc(t.describeBarrier) + '"></textarea><input class="fld" id="be" type="email" placeholder="' + esc(t.yourEmail) + '"><button class="btn p" id="BS" style="width:100%">' + esc(t.sendReport) + '</button></div>'
        + '<div class="cap">' + esc(t.displayPrefs) + '</div>'
        + '<div class="a11ygrid">'
        + '<div class="a11ycell"><div class="lbl">' + esc(t.largerText) + '</div><label class="sw"><input type="checkbox" id="pf"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="a11ycell"><div class="lbl">' + esc(t.highContrast) + '</div><label class="sw"><input type="checkbox" id="phc"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="a11ycell"><div class="lbl">' + esc(t.monochrome) + '</div><label class="sw"><input type="checkbox" id="pmo"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="a11ycell"><div class="lbl">' + esc(t.reduceMotion) + '</div><label class="sw"><input type="checkbox" id="pm"><span class="tr"></span><span class="kn"></span></label></div>'
        + '<div class="a11ycell"><div class="lbl">' + esc(t.oversizeCursor) + '</div><label class="sw"><input type="checkbox" id="poc"><span class="tr"></span><span class="kn"></span></label></div>'
        + '</div>'
        + '</div></div></div>' : '')
      + (showAI ? '<div class="section hidden" data-section="ai"><button class="backbtn" data-back>&#8249; ' + esc(t.backHome) + '</button><div class="drawer open" data-d><button class="dh" data-t>' + esc(t.aiTitle) + '<span>&#9662;</span></button><div class="db">'
        + '<div class="note">' + esc(t.aiNote) + '</div>'
        + '</div></div></div>' : '')
      + '</div>'
      + '</div>'
      + (function() {
          var stmts = cfg.statements || {};
          var stitle = function(s) { return (lang === 'es' && s.title_es) ? s.title_es : s.title; };
          var links = [];
          if (stmts.privacy_policy) links.push('<button class="stmtlink" data-stmt="privacy_policy">' + esc(stitle(stmts.privacy_policy) || 'Privacy Policy') + '</button>');
          if (stmts.cookie_policy) links.push('<button class="stmtlink" data-stmt="cookie_policy">' + esc(stitle(stmts.cookie_policy) || 'Cookie Policy') + '</button>');
          if (stmts.accessibility_statement) links.push('<button class="stmtlink" data-stmt="accessibility_statement">' + esc(stitle(stmts.accessibility_statement) || 'Accessibility Statement') + '</button>');
          if (stmts.ai_use_statement) links.push('<button class="stmtlink" data-stmt="ai_use_statement">' + esc(stitle(stmts.ai_use_statement) || 'AI Use Statement') + '</button>');
          return links.length ? '<div class="stmtlinks">' + links.join('<span style="color:' + panelSubText + ';font-size:10px">·</span>') + '</div>' : '';
        })()
      + (cfg.show_badge === false ? '' : '<div class="foot">Powered by <a href="https://datarightsos.com" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">DataRightsOS</a></div>')
      + '</div>'
      + '<div class="modal-overlay hidden" id="MO"><div class="modal"><div class="modal-head"><div><h3 id="MT"></h3><div class="modal-meta" id="MM"></div></div><button class="x" id="MX">&times;</button></div><div class="modal-body" id="MB"></div></div></div>'
      + '<div class="toast" id="T"></div>';

    root.innerHTML = html;
    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var q = function (s) { return root.querySelectorAll(s); };

    var L = $('L'), P = $('P'), T = $('T'), tt;
    function toast(m) { T.textContent = m; T.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { T.classList.remove('show'); }, 2200); }
    if (keepOpen) { P.classList.remove('hidden'); L.classList.add('hidden'); }
    L.onclick = function () { P.classList.remove('hidden'); L.classList.add('hidden'); };
    $('X').onclick = function () { P.classList.add('hidden'); L.classList.remove('hidden'); };

    // Language picker — persist choice and re-render the panel in the new language (keeping it open).
    q('[data-lang]').forEach(function (b) {
      b.onclick = function () {
        var next = b.getAttribute('data-lang');
        if (next === lang) return;
        localStorage.setItem('dros_lang', next);
        host.remove();
        render(cfg, true);
      };
    });

    q('[data-t]').forEach(function (h) { h.onclick = function () { h.closest('[data-d]').classList.toggle('open'); }; });

    // Command Center navigation: cards open sections, back returns home.
    var HOME = $('HOME'), SECTIONS = $('SECTIONS');
    function showHome() {
      HOME.classList.remove('hidden');
      q('[data-section]').forEach(function (s) { s.classList.add('hidden'); });
    }
    function showSection(name) {
      HOME.classList.add('hidden');
      q('[data-section]').forEach(function (s) { s.classList.toggle('hidden', s.getAttribute('data-section') !== name); });
    }
    q('[data-card]').forEach(function (c) { c.onclick = function () { showSection(c.getAttribute('data-card')); }; });
    q('[data-back]').forEach(function (b) { b.onclick = showHome; });

    // Search filters the action cards on the home view.
    var CMDQ = $('CMDQ');
    if (CMDQ) {
      CMDQ.oninput = function () {
        var term = CMDQ.value.toLowerCase().trim();
        q('[data-card]').forEach(function (c) {
          var kw = (c.getAttribute('data-kw') || '').toLowerCase();
          c.style.display = (!term || kw.indexOf(term) > -1) ? '' : 'none';
        });
      };
    }

    if (cfg.honor_gpc && GPC && !localStorage.getItem('dros_gpc_' + SITE)) {
      post({ type: 'consent', action: 'gpc_optout', necessary: true, functional: false, analytics: false, advertising: false });
      localStorage.setItem('dros_gpc_' + SITE, '1');
    }

    if (showCookies) {
      $('CS').onclick = function () { post({ type: 'consent', action: 'save_choices', necessary: true, functional: $('cf').checked, analytics: $('ca').checked, advertising: $('cad').checked }); toast(t.tPrefsSaved); };
      $('CR').onclick = function () { post({ type: 'consent', action: 'reject_all', necessary: true, functional: false, analytics: false, advertising: false }); toast(t.tRejected); };
    }

    if (showRights) {
      var reqType = null;
      q('[data-req]').forEach(function (b) { b.onclick = function () { q('[data-req]').forEach(function (x) { x.classList.remove('sel'); }); b.classList.add('sel'); reqType = b.getAttribute('data-req'); $('IN').classList.add('show'); }; });
      $('RS').onclick = function () {
        if (!reqType) return;
        if (!$('re').value) { toast(t.tEmailReq); return; }
        post({ type: 'rights_request', request_type: reqType, requester_name: $('rn').value, requester_email: $('re').value, requester_state: $('rs').value, is_authorized_agent: $('ra').checked, agent_details: '' });
        $('IN').classList.remove('show'); q('[data-req]').forEach(function (x) { x.classList.remove('sel'); }); reqType = null;
        toast(t.tReqLogged);
      };
    }

    if (showA11y) {
      $('BR').onclick = function () { $('BF').classList.toggle('show'); };
      $('BS').onclick = function () { post({ type: 'accessibility_report', page_url: $('bu').value || location.href, description: $('bd').value, reporter_email: $('be').value }); $('BF').classList.remove('show'); toast(t.tReportSent); };

      // Global stylesheet injected into the host page (outside shadow DOM) for visual a11y overrides.
      var a11yStyle = document.getElementById('dros-a11y-style');
      if (!a11yStyle) {
        a11yStyle = document.createElement('style');
        a11yStyle.id = 'dros-a11y-style';
        a11yStyle.textContent =
          'html.dros-bigtext{font-size:112% !important}'
          + 'html.dros-contrast{filter:contrast(150%) !important}'
          + 'html.dros-mono{filter:grayscale(100%) !important}'
          + 'html.dros-contrast.dros-mono{filter:contrast(150%) grayscale(100%) !important}'
          + 'html.dros-reduce-motion *{animation:none !important;transition:none !important;scroll-behavior:auto !important}'
          + 'html.dros-bigcursor,html.dros-bigcursor *{cursor:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2748%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23000%27 stroke=%27%23fff%27 stroke-width=%271%27 d=%27M5 2l14 9-6 1 4 7-3 1-4-7-5 4z%27/%3E%3C/svg%3E") 4 2,auto !important}'
          + 'html.dros-screenreader :focus{outline:3px solid #1a73e8 !important;outline-offset:2px !important}'
          + 'html.dros-screenreader a,html.dros-screenreader button{text-decoration:underline !important}';
        document.head.appendChild(a11yStyle);
      }

      var prefs = [
        { id: 'pf', key: 'dros_pf', cls: 'dros-bigtext' },
        { id: 'phc', key: 'dros_hc', cls: 'dros-contrast' },
        { id: 'pmo', key: 'dros_mono', cls: 'dros-mono' },
        { id: 'pm', key: 'dros_pm', cls: 'dros-reduce-motion' },
        { id: 'poc', key: 'dros_oc', cls: 'dros-bigcursor' }
      ];
      prefs.forEach(function (p) {
        var on = localStorage.getItem(p.key) === '1';
        if (on) { $(p.id).checked = true; document.documentElement.classList.add(p.cls); }
        $(p.id).onchange = function () {
          document.documentElement.classList.toggle(p.cls, this.checked);
          localStorage.setItem(p.key, this.checked ? '1' : '');
        };
      });
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
          var useEs = (lang === 'es');
          MT.textContent = (useEs && s.title_es ? s.title_es : s.title) || key;
          MM.textContent = (s.effective_date ? t.effective + ': ' + s.effective_date : '') + (s.version ? '  ·  v' + s.version : '');
          MB.innerHTML = (useEs && s.body_es ? s.body_es : s.body) || '';
          MO.classList.remove('hidden');
        };
      });
    }
  }
})();
/* ===== end widget.js ===== */`;

  return new Response(widgetCode, { status: 200, headers: CORS });
});