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

  const widgetCode = `/* ===== DataRightsOS widget.js ===== */
(function () {
  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName('script'); return s[s.length - 1];
  })();
  var SITE = script.getAttribute('data-tessera-site');
  var API = '${API}';

  if (!SITE) { console.warn('[DataRightsOS] missing data-tessera-site'); return; }

  // Don't render the live widget inside the DataRightsOS dashboard app itself
  // (the base44 preview/app host) — the Widget Studio already shows its own preview.
  // The public marketing site (datarightsos.com) SHOULD show the live widget.
  var h = location.hostname;
  if (/\\.base44\\.app$/.test(h)) {
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

  /* ============================================================
     ENFORCEMENT ENGINE
     Turns a consent decision into actual browser behavior:
     - blocks/activates tags wired via <script type="text/plain" data-dros-category="...">
     - clears cookies belonging to denied categories
     - sends Google Consent Mode signals
     - honors GPC as a do-not-sell/share opt-out
     - scans for unmanaged trackers it could NOT control
     - self-verifies the result
     The widget runs this on first paint AND on every saved decision, and
     re-applies the stored decision on return visits before any gated tag loads.
     ============================================================ */
  var CATS = ['functional', 'analytics', 'advertising'];

  // Known cookie name fragments per category, for cleanup of already-set cookies.
  // NOTE ON THIRD-PARTY COOKIES: Some tracker cookies are set on the tracker's OWN
  // domain (e.g. LinkedIn 'bcookie'/'lidc'/'li_sugr' on .linkedin.com, Google 'IDE' on
  // .doubleclick.net, Meta 'fr' on .facebook.com) and/or are HttpOnly. Those are NOT
  // readable or deletable from this first-party context via document.cookie — we cannot
  // clear them here and do not pretend to. Only first-party cookies (set on the site's
  // own domain and JS-readable) below can actually be removed by clearCategoryCookies.
  var COOKIE_SIGNATURES = {
    analytics: ['_ga', '_gid', '_gat', '__utm', '_hj', 'amplitude', 'mp_', 'ajs_', '_clck', '_clsk'],
    // First-party advertising cookies we can clear: Meta _fbp/_fbc, TikTok _ttp,
    // LinkedIn first-party li_fat_id and other li_* set on our domain, Google _gcl*,
    // Microsoft MUID, Pinterest _pin_unauth. ('fr'/'IDE'/'test_cookie' removed — they are
    // third-party-only and, matched as prefixes, could clobber unrelated host cookies.)
    advertising: ['_fbp', '_fbc', '_gcl', 'MUID', '_ttp', '_pin_unauth', 'personalization_id', 'li_fat_id', 'li_gc', 'li_mc', 'li_sugr', 'lms_ads', 'UserMatchHistory'],
    functional: ['intercom-', '_hp2_', 'yt-remote', 'wistia']
  };
  // localStorage / sessionStorage key fragments set by trackers, swept on deny.
  var STORAGE_SIGNATURES = {
    analytics: ['_ga', 'amplitude', 'mp_', 'ajs_', 'hjViewportId', 'hjActiveViewportIds', '_hjSession'],
    advertising: ['_fbp', '_fbc', 'fbq', 'ttq', '_tt_', 'li_', '_gcl', 'doubleclick'],
    functional: ['intercom', 'wistia']
  };
  // Tracker signatures that identify unmanaged (not-wired-through-widget) tags.
  // Each is matched against BOTH inline script text AND src URLs (see scanUnmanaged).
  var UNMANAGED_SIGNATURES = [
    { name: 'Google Analytics / GA4', re: /googletagmanager\\.com\\/gtag|google-analytics\\.com|\\bG-[A-Z0-9]{6,}\\b|gtag\\(\\s*['"]config['"]\\s*,\\s*['"]G-/i, cat: 'analytics' },
    { name: 'Google Tag Manager', re: /googletagmanager\\.com\\/gtm|\\bGTM-[A-Z0-9]{4,}\\b/i, cat: 'analytics' },
    { name: 'Google Ads', re: /googleads\\.g\\.doubleclick\\.net|googleadservices\\.com|\\bAW-[0-9]{6,}\\b|gtag\\(\\s*['"]config['"]\\s*,\\s*['"]AW-/i, cat: 'advertising' },
    { name: 'Meta / Facebook Pixel', re: /connect\\.facebook\\.net|facebook\\.com\\/tr|\\bfbq\\s*\\(/i, cat: 'advertising' },
    { name: 'TikTok Pixel', re: /analytics\\.tiktok\\.com|\\bttq\\./i, cat: 'advertising' },
    { name: 'LinkedIn Insight', re: /snap\\.licdn\\.com|px\\.ads\\.linkedin\\.com|_linkedin_partner_id/i, cat: 'advertising' },
    { name: 'Hotjar', re: /static\\.hotjar\\.com|\\bhj\\s*\\(/i, cat: 'analytics' },
    { name: 'Hubspot', re: /js\\.hs-scripts\\.com|js\\.hsforms\\.net/i, cat: 'analytics' },
    { name: 'Segment', re: /cdn\\.segment\\.com|analytics\\.track\\(/i, cat: 'analytics' },
    { name: 'Twitter / X Pixel', re: /static\\.ads-twitter\\.com|\\btwq\\s*\\(/i, cat: 'advertising' }
  ];

  function readGrants() {
    try { var raw = localStorage.getItem('dros_consent_' + SITE); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeGrants(g) {
    try { localStorage.setItem('dros_consent_' + SITE, JSON.stringify(g)); } catch (e) {}
    // Mirror to a cookie so server/edge and non-localStorage contexts can read it too.
    try { document.cookie = 'dros_consent=' + encodeURIComponent(JSON.stringify(g)) + ';path=/;max-age=' + (180 * 86400) + ';SameSite=Lax'; } catch (e) {}
  }

  function deleteCookie(name) {
    var host = location.hostname;
    var domains = ['', host, '.' + host];
    var parts = host.split('.');
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    domains.forEach(function (d) {
      var base = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = base + (d ? ';domain=' + d : '');
    });
  }

  function clearCategoryCookies(deniedCats) {
    var cleared = [];
    var present = document.cookie ? document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); }) : [];
    deniedCats.forEach(function (cat) {
      (COOKIE_SIGNATURES[cat] || []).forEach(function (sig) {
        present.forEach(function (cn) {
          if (cn.indexOf(sig) === 0) { deleteCookie(cn); cleared.push(cn); }
        });
      });
    });
    // Sweep localStorage/sessionStorage keys set by trackers in denied categories.
    // (Third-party storage on the tracker's own origin is not accessible here — same
    // limitation noted for third-party cookies above — so only same-origin keys clear.)
    ['localStorage', 'sessionStorage'].forEach(function (store) {
      var s;
      try { s = window[store]; } catch (e) { return; }
      if (!s) return;
      var keys = [];
      try { for (var i = 0; i < s.length; i++) keys.push(s.key(i)); } catch (e) { return; }
      deniedCats.forEach(function (cat) {
        (STORAGE_SIGNATURES[cat] || []).forEach(function (sig) {
          keys.forEach(function (k) {
            if (k && k.indexOf(sig) > -1 && k.indexOf('dros_') !== 0) {
              try { s.removeItem(k); cleared.push(store + ':' + k); } catch (e) {}
            }
          });
        });
      });
    });
    return cleared;
  }

  // Consent-gated loading: tags authored as
  //   <script type="text/plain" data-dros-category="analytics" data-src="..."> or inline
  // are inert until granted, then activated here.
  function activateGatedTags(grants) {
    var gated = document.querySelectorAll('script[type="text/plain"][data-dros-category]');
    gated.forEach(function (s) {
      var cat = s.getAttribute('data-dros-category');
      if (cat === 'necessary' || grants[cat] === true) {
        if (s.getAttribute('data-dros-activated')) return;
        var n = document.createElement('script');
        for (var i = 0; i < s.attributes.length; i++) {
          var a = s.attributes[i];
          if (a.name === 'type' || a.name === 'data-dros-category' || a.name === 'data-src') continue;
          n.setAttribute(a.name, a.value);
        }
        var src = s.getAttribute('data-src') || s.getAttribute('src');
        if (src) n.src = src; else n.text = s.textContent || '';
        s.setAttribute('data-dros-activated', '1');
        s.parentNode.insertBefore(n, s.nextSibling);
      }
    });
  }

  // Google Consent Mode v2 signals.
  function sendConsentMode(grants) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('consent', 'update', {
      analytics_storage: grants.analytics ? 'granted' : 'denied',
      ad_storage: grants.advertising ? 'granted' : 'denied',
      ad_user_data: grants.advertising ? 'granted' : 'denied',
      ad_personalization: grants.advertising ? 'granted' : 'denied',
      functionality_storage: grants.functional ? 'granted' : 'denied',
      personalization_storage: grants.functional ? 'granted' : 'denied'
    });
  }

  function scanUnmanaged(deniedCats) {
    var found = [];
    // Scan EVERY script element — inline text content AND src URLs — so inline
    // bootstraps (Meta fbq, LinkedIn _linkedin_partner_id, TikTok ttq, gtag configs)
    // are caught, not just external src loads.
    var scripts = document.querySelectorAll('script');
    scripts.forEach(function (s) {
      // Exclude tags wired through the widget: gated <script type="text/plain" data-dros-category>.
      if (s.getAttribute('type') === 'text/plain' && s.getAttribute('data-dros-category') !== null) return;
      // Also skip our own activated clones so we don't flag tags we intentionally loaded.
      var src = s.getAttribute('src') || '';
      var text = s.textContent || '';
      var hay = src + '\\n' + text;
      UNMANAGED_SIGNATURES.forEach(function (sig) {
        if (sig.re.test(hay) && deniedCats.indexOf(sig.cat) > -1 && found.indexOf(sig.name) === -1) {
          found.push(sig.name);
        }
      });
    });
    return found;
  }

  // Self-verify: after enforcement, confirm denied-category cookies are gone and
  // gated tags in denied categories did not execute.
  function verify(deniedCats) {
    var present = document.cookie ? document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); }) : [];
    var leaked = false;
    deniedCats.forEach(function (cat) {
      (COOKIE_SIGNATURES[cat] || []).forEach(function (sig) {
        present.forEach(function (cn) { if (cn.indexOf(sig) === 0) leaked = true; });
      });
    });
    var ranGated = false;
    document.querySelectorAll('script[type="text/plain"][data-dros-category]').forEach(function (s) {
      var cat = s.getAttribute('data-dros-category');
      if (deniedCats.indexOf(cat) > -1 && s.getAttribute('data-dros-activated')) ranGated = true;
    });
    return !leaked && !ranGated;
  }

  // Apply a full decision. Returns an enforcement-evidence object for the receipt.
  function applyDecision(grants, opts) {
    opts = opts || {};
    var deniedCats = CATS.filter(function (c) { return grants[c] !== true; });
    var signals = [];

    activateGatedTags(grants);
    var cleared = clearCategoryCookies(deniedCats);
    sendConsentMode(grants);
    signals.push(deniedCats.length ? 'consent_mode:denied' : 'consent_mode:granted');

    if (GPC && grants.advertising !== true) {
      try { document.cookie = 'dros_do_not_sell=1;path=/;max-age=' + (180 * 86400) + ';SameSite=Lax'; } catch (e) {}
      try { localStorage.setItem('dros_do_not_sell', '1'); } catch (e) {}
      signals.push('gpc:honored');
      signals.push('do_not_sell:set');
    }

    var unmanaged = scanUnmanaged(deniedCats);
    var verified = verify(deniedCats);

    writeGrants({ functional: !!grants.functional, analytics: !!grants.analytics, advertising: !!grants.advertising, ts: Date.now() });

    return {
      enforcement_applied: true,
      enforced_categories: deniedCats,
      signals_sent: signals,
      unmanaged_detected: unmanaged,
      verification_passed: verified,
      decision_persisted: opts.persisted === true,
      cookies_cleared: cleared
    };
  }

  // --- BOOT: default-deny + re-apply prior decision before gated tags load ---
  // Establish a deny-by-default Consent Mode baseline as early as possible.
  (function () {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
      functionality_storage: 'denied', personalization_storage: 'denied'
    });
  })();

  var priorGrants = readGrants();
  if (GPC) {
    // GPC drives enforcement: force advertising denied (opt-out of sale/sharing).
    priorGrants = priorGrants || { functional: false, analytics: false, advertising: false };
    priorGrants.advertising = false;
  }
  if (priorGrants) {
    var bootEnf = applyDecision(priorGrants, { persisted: true });
    // Record that the prior decision persisted and was re-applied on this visit.
    post({
      type: 'consent',
      action: GPC ? 'gpc_optout' : 'save_choices',
      necessary: true,
      functional: !!priorGrants.functional,
      analytics: !!priorGrants.analytics,
      advertising: !!priorGrants.advertising,
      enforcement: bootEnf
    });

    // Boot may run before the DOM is fully parsed, so gated tags placed below this
    // snippet won't exist yet when applyDecision first calls activateGatedTags. Re-run
    // activation once the DOM is ready; the data-dros-activated guard prevents doubles.
    var reactivate = function () { activateGatedTags(priorGrants); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', reactivate);
    } else {
      reactivate();
    }
  }

  var DEFAULT = { product_name: 'Privacy & Data Rights Center', logo_url: 'https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/b5c7df386_vault.png', primary_color: '#0d7d74',
    enabled_drawers: ['privacy_rights', 'cookies', 'accessibility'], honor_gpc: true,
    intro_video_url: '', accessibility_statement_url: '', privacy_policy_url: '', policy_version: '1.0' };

  // Report the script's OWN url so the server can record how this site installed.
  // The config host is hardcoded above, so the request itself cannot reveal whether
  // the snippet points at datarightsos.com or api.base44.app — only the script knows.
  var SRC = '';
  try { SRC = script.src || script.getAttribute('src') || ''; } catch (e) { SRC = ''; }

  fetch(API + '/widgetConfig?site=' + encodeURIComponent(SITE) + '&src=' + encodeURIComponent(SRC) + '&t=' + Date.now(), { cache: 'no-store' })
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
      rejectAll: 'Reject all', acceptAll: 'Accept all', saveChoices: 'Save choices',
      consentLine: 'We use cookies. Choose how this site can use them.',
      manageSettings: 'Manage settings',
      cookieStatusPrefix: 'Cookies:', cookieStatusCustom: 'customized', cookieStatusAccepted: 'all accepted', cookieStatusRejected: 'all rejected', cookieStatusChange: 'change',
      cookieStatusAcceptedSub: '✓ Accepted all · change', cookieStatusRejectedSub: '✕ Rejected all · change', cookieStatusCustomSub: 'Customized · change', cookieStatusGpc: 'GPC honored · review',
      a11yTitle: 'Accessibility',
      a11yNote: 'This is a feedback & preferences tool, not a substitute for an accessible site.',
      a11yStatement: 'Accessibility statement', reportBarrier: 'Report an accessibility barrier',
      pageUrl: 'Page URL', describeBarrier: 'Describe the barrier', yourEmail: 'Your email (optional)', sendReport: 'Send report',
      displayPrefs: 'Display preferences (this browser only)',
      largerText: 'Larger text', highContrast: 'High contrast', monochrome: 'Monochrome',
      reduceMotion: 'Reduce motion', oversizeCursor: 'Oversize cursor', screenReader: 'Screen reader optimized',
      aiTitle: 'AI Use Disclosure',
      aiNote: 'This site discloses when and how artificial intelligence is used to interact with you.',
      tPrefsSaved: 'Preferences saved', tRejected: 'All optional cookies rejected',
      tEmailReq: 'Email is required', tReqLogged: 'Request logged. Confirmation sent.', tReportSent: 'Report sent. Thank you.',
      effective: 'Effective',
      openFullPage: 'Open full page \\u2197',
      legalStatements: 'Legal statements'
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
      rejectAll: 'Rechazar todo', acceptAll: 'Aceptar todo', saveChoices: 'Guardar opciones',
      consentLine: 'Usamos cookies. Elija cómo este sitio puede usarlas.',
      manageSettings: 'Administrar ajustes',
      cookieStatusPrefix: 'Cookies:', cookieStatusCustom: 'personalizado', cookieStatusAccepted: 'todo aceptado', cookieStatusRejected: 'todo rechazado', cookieStatusChange: 'cambiar',
      cookieStatusAcceptedSub: '✓ Todo aceptado · cambiar', cookieStatusRejectedSub: '✕ Todo rechazado · cambiar', cookieStatusCustomSub: 'Personalizado · cambiar', cookieStatusGpc: 'GPC respetado · revisar',
      a11yTitle: 'Accesibilidad',
      a11yNote: 'Esta es una herramienta de comentarios y preferencias, no un sustituto de un sitio accesible.',
      a11yStatement: 'Declaración de accesibilidad', reportBarrier: 'Reportar una barrera de accesibilidad',
      pageUrl: 'URL de la página', describeBarrier: 'Describa la barrera', yourEmail: 'Su correo (opcional)', sendReport: 'Enviar reporte',
      displayPrefs: 'Preferencias de visualización (solo este navegador)',
      largerText: 'Texto más grande', highContrast: 'Alto contraste', monochrome: 'Monocromo',
      reduceMotion: 'Reducir movimiento', oversizeCursor: 'Cursor grande', screenReader: 'Optimizado para lector de pantalla',
      aiTitle: 'Divulgación de Uso de IA',
      aiNote: 'Este sitio divulga cuándo y cómo se utiliza la inteligencia artificial para interactuar con usted.',
      tPrefsSaved: 'Preferencias guardadas', tRejected: 'Todas las cookies opcionales rechazadas',
      tEmailReq: 'El correo electrónico es obligatorio', tReqLogged: 'Solicitud registrada. Confirmación enviada.', tReportSent: 'Reporte enviado. Gracias.',
      effective: 'Vigente',
      openFullPage: 'Abrir p\\u00e1gina completa \\u2197',
      legalStatements: 'Declaraciones legales'
    }
  };

  function render(cfg, keepOpen, forceOpen) {
    // ENTITLEMENT GATE — service_status, never install_status.
    // Gating on install_status would deadlock a genuine first install: rendering
    // would require "installed", and becoming "installed" would require rendering.
    // Entitlement is set by billing, install detection is one-way and gates nothing,
    // so the cycle cannot form. Absent value = render (fail open on availability).
    if (cfg.service_status && cfg.service_status !== 'active') { return; }
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

    // Minimized-launcher placement — explicit config, no host auto-detection.
    // Configurable bottom offset (to clear a host fixed bottom nav) + iOS PWA safe-area inset,
    // with an optional mobile-specific override. Horizontal position: bottom-right/left/center.
    var isMobileViewport = (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 640px)').matches) || window.innerWidth <= 640;
    var offDesktop = Number(cfg.launcher_offset_bottom) || 0;
    var offMobileRaw = cfg.launcher_offset_bottom_mobile;
    var offMobile = (offMobileRaw === null || offMobileRaw === undefined || offMobileRaw === '') ? offDesktop : (Number(offMobileRaw) || 0);
    var launcherOffset = isMobileViewport ? offMobile : offDesktop;
    // Always add the iOS home-indicator safe area so the launcher clears it in standalone PWA mode.
    var launcherBottomCSS = 'calc(' + launcherOffset + 'px + env(safe-area-inset-bottom, 0px) + 22px)';
    var lpos = cfg.launcher_position || 'bottom-right';

    // Custom launcher branding (Core+, plan-gated server-side in widgetConfig).
    // The text label is REQUIRED — the server guarantees a non-empty launcher_label,
    // and the image is decorative (alt="") since the adjacent label carries meaning.
    var isCustomLauncher = cfg.launcher_style === 'custom' && !!cfg.launcher_image_url;
    var launcherLabel = isCustomLauncher ? (cfg.launcher_label || t.launcher) : t.launcher;
    var launcherPosCSS = lpos === 'bottom-left' ? 'left:22px;right:auto;transform:none'
      : lpos === 'bottom-center' ? 'left:50%;right:auto;transform:translateX(-50%)'
      : 'right:22px;left:auto;transform:none';

    var posCSS = pos === 'bottom-left' ? 'left:22px;bottom:22px;right:auto;top:auto'
      : pos === 'bottom-center' ? 'left:50%;bottom:22px;right:auto;top:auto;transform:translateX(-50%)'
      : pos === 'top-right' ? 'right:22px;top:22px;bottom:auto;left:auto'
      : pos === 'top-left' ? 'left:22px;top:22px;bottom:auto;right:auto'
      : 'right:22px;bottom:22px;left:auto;top:auto';
    var panelCSS = pos === 'bottom-left' ? 'left:22px;bottom:22px;right:auto;top:auto'
      : pos === 'bottom-center' ? 'left:50%;bottom:22px;right:auto;top:auto;transform:translateX(-50%)'
      : pos === 'top-right' ? 'right:22px;top:22px;bottom:auto;left:auto'
      : pos === 'top-left' ? 'left:22px;top:22px;bottom:auto;right:auto'
      : 'right:22px;bottom:22px;left:auto;top:auto';

    // PERSISTENT bar mode: when widget_layout === 'bar', the bottom-anchored treatment
    // applies to ALL states (launcher + expanded panel), not just the first-visit consent
    // moment. floating behaves exactly as before. The panel is ONE component; barMode only
    // swaps its container/positioning class — content, state, and handlers are identical.
    var barMode = cfg.widget_layout === 'bar';
    // Launcher in bar mode sits flush against the bottom edge (honoring offset + safe area),
    // full-width-friendly rounded-square, not the floating pill.
    var barLauncherPosCSS = lpos === 'bottom-left' ? 'left:22px;right:auto;transform:none'
      : lpos === 'bottom-center' ? 'left:50%;right:auto;transform:translateX(-50%)'
      : 'right:22px;left:auto;transform:none';
    var barLauncherBottomCSS = 'calc(' + launcherOffset + 'px + env(safe-area-inset-bottom, 0px) + 12px)';

    var css = ''
      + ':host{all:initial}'
      + '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}'
      + '.launcher{position:fixed;bottom:' + launcherBottomCSS + ';' + launcherPosCSS + ';z-index:2147483000;display:flex;align-items:center;gap:8px;background:' + launcherBg + ';color:' + launcherColor + ';border:' + launcherBorder + ';cursor:pointer;padding:11px 15px;border-radius:999px;box-shadow:0 14px 40px -10px rgba(20,32,43,.45);font-size:13px;font-weight:600}'
      + '.launcher .dot{width:7px;height:7px;border-radius:50%;background:#16a34a;animation:drosPulse 2.4s ease-in-out infinite}'
      + '@keyframes drosPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(22,163,74,.55)}50%{opacity:.35;box-shadow:0 0 0 4px rgba(22,163,74,0)}}'
      // Custom launcher: fixed 44px-tall image, width auto capped at 120px, never distorted.
      + '.launcher.custom{padding:8px 14px;gap:10px}'
      + '.launcher.custom .limg{height:44px;width:auto;max-width:120px;object-fit:contain;display:block}'
      + '.panel{position:fixed;' + panelCSS + ';z-index:2147483001;width:380px;max-width:calc(100vw - 28px);max-height:86vh;background:' + panelBg + ';border-radius:16px;box-shadow:0 18px 50px -12px rgba(20,32,43,.4);display:flex;flex-direction:column;overflow:hidden;border:1px solid ' + panelBorder + '}'
      + '.hidden{display:none !important}'
      + '.phead{padding:15px 16px;border-bottom:1px solid ' + divider + ';display:flex;align-items:center;gap:10px;position:relative}'
      + '.crest{width:36px;height:36px;border-radius:8px;background:' + crestBg + ';border:1px solid ' + divider + ';display:flex;align-items:center;justify-content:center;color:' + crestColor + ';font-weight:700;overflow:hidden}'
      + '.crest img{width:100%;height:100%;object-fit:contain;padding:2px}'
      + '.phead h2{margin:0;font-size:14px;font-weight:700;color:' + panelText + '}'
      + '.phead .sub{margin:1px 0 0;font-size:11px;color:' + panelSubText + '}'
      + '.pill{display:inline-flex;align-items:center;gap:4px;margin-top:4px;background:#16a34a;color:#ffffff;border-radius:999px;padding:2px 8px;font-size:10px;font-weight:700}'
      + '.pill .pdot{width:6px;height:6px;border-radius:50%;background:#ffffff}'
      + '.cmdsearch{display:flex;align-items:center;gap:8px;margin:0 0 12px;background:' + itemBg + ';border:1px solid ' + divider + ';border-radius:10px;padding:10px 12px}'
      + '.cmdsearch input{flex:1;border:none;background:none;outline:none;font-size:12.5px;color:' + panelText + ';font-family:inherit}'
      + '.cmdsearch input::placeholder{color:' + panelSubText + '}'
      + '.cardgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:4px}'
      + '.cardgrid.threeup .ccard:first-child{grid-column:1 / -1}'
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
      + '.btn.t{background:none;color:' + panelSubText + ';border:none;font-weight:600;padding:8px;text-decoration:underline}'
      + '.consentblk{border:1px solid ' + divider + ';background:' + itemBg + ';border-radius:11px;padding:12px;margin-bottom:12px}'
      + '.consentblk .cl{font-size:12.5px;font-weight:600;color:' + panelText + ';margin:0 0 10px;line-height:1.4}'
      + '.consentblk .manage{display:block;width:100%;text-align:center;background:none;border:none;cursor:pointer;font-size:11.5px;font-weight:600;color:' + panelSubText + ';text-decoration:underline;padding:9px 0 0;font-family:inherit}'
      + '.ckstatus{font-size:10.5px;color:' + panelSubText + ';margin:8px 2px 0}.ckstatus button{background:none;border:none;cursor:pointer;color:' + accent + ';font-weight:650;text-decoration:underline;font-size:10.5px;padding:0;font-family:inherit}'
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
      + '.modal-body a{text-decoration:underline}'
      + '.modal-foot{flex-shrink:0;border-top:1px solid ' + divider + ';padding:10px 16px;background:' + footerBg + '}'
      + '.modal-foot a{font-size:11.5px;font-weight:650;color:' + accent + ';text-decoration:underline}'
      // --- Bar layout (first-visit consent moment) — presentation only ---
      + '.cbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483001;background:' + panelBg + ';color:' + panelText + ';border-top:1px solid ' + divider + ';box-shadow:0 -10px 40px -12px rgba(20,32,43,.35);padding:14px 18px;padding-bottom:calc(14px + env(safe-area-inset-bottom, 0px) + ' + launcherOffset + 'px);display:flex;align-items:center;gap:16px;flex-wrap:wrap;max-height:15vh;overflow:auto}'
      + '.cbar .cbmsg{flex:1 1 240px;min-width:200px;font-size:13px;font-weight:600;color:' + panelText + ';line-height:1.4}'
      + '.cbar .cbactions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
      + '.cbar .cbbtn{border:1px solid ' + divider + ';cursor:pointer;font-weight:650;font-size:12.5px;padding:10px 18px;border-radius:8px;background:' + itemBg + ';color:' + panelText + ';min-width:104px;text-align:center;font-family:inherit}'
      + '.cbar .cbbtn.p{background:' + accent + ';color:#fff;border-color:' + accent + '}'
      + '.cbar .cblink{background:none;border:none;cursor:pointer;font-size:12px;font-weight:600;color:' + accent + ';text-decoration:underline;padding:6px 2px;font-family:inherit}'
      + '.cbar:focus-visible,.cbar .cbbtn:focus-visible,.cbar .cblink:focus-visible,.launcher:focus-visible{outline:3px solid ' + accent + ';outline-offset:2px}'
      // Mobile first-visit consent bar: hard-capped at 30vh so it never covers page content.
      // One short message line, Reject/Accept side by side with EQUAL width and weight,
      // "Manage settings" and the Privacy Center as small text links beneath them.
      + '@media (max-width:767px){'
      + '.cbar{max-height:30vh;overflow:hidden;flex-direction:column;align-items:stretch;gap:8px;padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom, 0px) + ' + launcherOffset + 'px)}'
      + '.cbar .cbmsg{flex:0 0 auto;min-width:0;font-size:12.5px;line-height:1.3}'
      + '.cbar .cbactions{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center}'
      + '.cbar .cbbtn{width:100%;min-width:0;padding:9px 8px;font-size:12.5px}'
      + '.cbar .cbbtn#BM2{grid-column:1 / -1;background:none;border:none;padding:2px 0;font-size:11.5px;font-weight:600;color:' + accent + ';text-decoration:underline;min-width:0}'
      + '.cbar .cblink{grid-column:1 / -1;padding:0;font-size:11.5px}'
      + '}'
      // --- Persistent bar mode: launcher variant (bottom-anchored rounded-square) ---
      + '.launcher.barlauncher{bottom:' + barLauncherBottomCSS + ';' + barLauncherPosCSS + ';border-radius:12px;padding:12px 16px}'
      // --- Persistent bar mode: expanded panel as a full-width bottom bar (desktop/tablet) ---
      // Target ~30vh; 45vh is a ceiling, not a target. Reads as a bar, not a takeover.
      + '.panel.barpanel{left:0;right:0;bottom:0;top:auto;transform:none;width:100%;max-width:100%;max-height:45vh;border-radius:16px 16px 0 0;padding-bottom:env(safe-area-inset-bottom, 0px)}'
      + '.panel.barpanel .body{padding:12px 20px}'
      + '.panel.barpanel #HOME,.panel.barpanel #SECTIONS{width:100%}'
      // Four action cards in ONE row (4 equal columns, no wrap to a second row).
      + '.panel.barpanel .cardgrid,.panel.barpanel .cardgrid.threeup{grid-template-columns:repeat(4,1fr)}'
      + '.panel.barpanel .cardgrid.threeup .ccard:first-child{grid-column:auto}'
      // Halve the card image height; keep title + one-line subtitle.
      + '.panel.barpanel .ccard .chead{height:34px}'
      + '.panel.barpanel .ccard .cbody{padding:6px 10px 8px}'
      // Statement links in a single thin one-line row beneath the cards.
      + '.panel.barpanel .stmtlinks{flex-wrap:nowrap;overflow:hidden;justify-content:center;padding:7px 20px}'
      // --- Tablet: 2x2 grid. ---
      + '@media (min-width:641px) and (max-width:900px){.panel.barpanel .cardgrid,.panel.barpanel .cardgrid.threeup{grid-template-columns:1fr 1fr}}'
      // --- Persistent bar mode on mobile: expanded panel as a bottom sheet (single column, 85vh). ---
      + '@media (max-width:640px){.panel.barpanel{max-height:85vh}.panel.barpanel .body{padding:12px 16px}.panel.barpanel .ccard .chead{height:54px}.panel.barpanel .cardgrid,.panel.barpanel .cardgrid.threeup{grid-template-columns:1fr 1fr}.panel.barpanel .stmtlinks{flex-wrap:wrap}}'
      // Backdrop behind the expanded bar/sheet so it reads as a modal surface.
      + '.barbackdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,0.35)}'
      + '.barpanel:focus-visible{outline:3px solid ' + accent + ';outline-offset:-3px}';

    function ytEmbed(url) {
      var m = (url || '').match(/(?:youtu\\.be\\/|v=)([\\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] + '?rel=0' : '';
    }
    var yt = ytEmbed(cfg.intro_video_url);

    // State-aware first layer: a decision exists if grants are stored, or GPC has already been applied.
    var storedGrants = readGrants();
    var gpcApplied = cfg.honor_gpc && GPC;
    var hasDecision = !!storedGrants || gpcApplied;
    var showConsentBlock = showCookies && !hasDecision;

    // Status-aware subtitle for the Cookies tile once a decision exists.
    var cookieTileSub = t.cardCookiesSub;
    if (gpcApplied) {
      cookieTileSub = t.cookieStatusGpc;
    } else if (storedGrants) {
      if (storedGrants.analytics && storedGrants.advertising && storedGrants.functional) cookieTileSub = t.cookieStatusAcceptedSub;
      else if (!storedGrants.analytics && !storedGrants.advertising && !storedGrants.functional) cookieTileSub = t.cookieStatusRejectedSub;
      else cookieTileSub = t.cookieStatusCustomSub;
    }

    // Professional photographic header images for the action cards.
    // Self-hosted on our own media (identical images, previously served from
    // images.unsplash.com). The widget must never cause a subscriber's site to
    // make an undisclosed third-party request — our own scanner would flag it.
    var IMG = {
      rights: 'https://base44.app/api/apps/6a3735f4f27dcb14405892ae/files/mp/public/6a3735f4f27dcb14405892ae/70fb96ed6_dros-card-rights.jpg',
      cookies: 'https://base44.app/api/apps/6a3735f4f27dcb14405892ae/files/mp/public/6a3735f4f27dcb14405892ae/316a93d0c_dros-card-cookies.jpg',
      a11y: 'https://base44.app/api/apps/6a3735f4f27dcb14405892ae/files/mp/public/6a3735f4f27dcb14405892ae/95975ed1c_dros-card-a11y.jpg',
      ai: 'https://base44.app/api/apps/6a3735f4f27dcb14405892ae/files/mp/public/6a3735f4f27dcb14405892ae/1daa8bea2_dros-card-ai.jpg'
    };

    // Layout decision for the FIRST-VISIT consent moment (presentation only).
    // Desktop/tablet honors the subscriber's widget_layout; mobile always uses the bar
    // (a floating card on a phone is strictly worse). After a decision exists, neither
    // renders — both collapse to the same launcher pill.
    var useBar = showConsentBlock && (isMobileViewport || (cfg.widget_layout === 'bar'));

    var barHtml = useBar ? ''
      + '<div class="cbar" id="CBAR" role="dialog" aria-modal="false" aria-label="' + esc(t.cookieTitle) + '" tabindex="-1">'
      + '<div class="cbmsg">' + esc(t.consentLine) + '</div>'
      + '<div class="cbactions">'
      + '<button class="cbbtn" id="BR2">' + esc(t.rejectAll) + '</button>'
      + '<button class="cbbtn" id="BA2">' + esc(t.acceptAll) + '</button>'
      + '<button class="cbbtn" id="BM2">' + esc(t.manageSettings) + '</button>'
      + '<button class="cblink" id="BPC">' + esc(t.launcher) + '</button>'
      + '</div>'
      + '</div>' : '';

    var html = ''
      + '<style>' + css + '</style>'
      + '<button class="launcher' + (barMode ? ' barlauncher' : '') + (isCustomLauncher ? ' custom' : '') + (useBar ? ' hidden' : '') + '" id="L" aria-label="' + esc(launcherLabel) + '" title="' + esc(launcherLabel) + '">' + (isCustomLauncher ? '<img class="limg" src="' + esc(cfg.launcher_image_url) + '" alt="">' : '') + '<span class="dot"></span>' + esc(launcherLabel) + '</button>'
      + barHtml
      + (barMode ? '<div class="barbackdrop hidden" id="BD"></div>' : '')
      + '<div class="panel' + (barMode ? ' barpanel' : '') + ' hidden" id="P"' + (barMode ? ' role="dialog" aria-modal="true" aria-label="' + esc(t.launcher) + '" tabindex="-1"' : '') + '>'
      + '<div class="phead"><div class="crest">' + (cfg.logo_url ? '<img src="' + esc(cfg.logo_url) + '">' : 'D') + '</div>'
      + '<div><h2>' + esc(cfg.product_name) + '</h2><div class="pill"><span class="pdot"></span>' + esc(t.statusCompliant) + '</div></div>'
      + '<div class="langpick"><button data-lang="en" class="' + (lang === 'en' ? 'on' : '') + '">EN</button><button data-lang="es" class="' + (lang === 'es' ? 'on' : '') + '">ES</button></div>'
      + '<button class="x" id="X">&times;</button></div>'
      + '<div class="body">'
      + (yt ? '<div class="vid"><iframe src="' + yt + '" title="Intro" allowfullscreen></iframe></div>' : '')
      + ((cfg.honor_gpc && GPC) ? '<div class="gpc"><div><b>' + esc(t.gpcTitle) + '</b><p>' + esc(t.gpcBody) + '</p></div></div>' : '')
      + '<div id="HOME">'
      + (showConsentBlock ? '<div class="consentblk"><p class="cl">' + esc(t.consentLine) + '</p><div class="btnrow"><button class="btn g" id="HR">' + esc(t.rejectAll) + '</button><button class="btn g" id="HA">' + esc(t.acceptAll) + '</button></div><button class="manage" id="HM">' + esc(t.manageSettings) + '</button></div>' : '')
      + '<div class="cardgrid' + (showConsentBlock ? ' threeup' : '') + '">'
      + (showRights ? '<button class="ccard" data-card="rights" data-kw="' + esc(t.rightsTitle) + '"><div class="chead" style="background-image:url(' + IMG.rights + ')"><div class="ctitle">' + esc(t.cardRights) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardRightsSub) + '</div></div></button>' : '')
      + ((showCookies && !showConsentBlock) ? '<button class="ccard" data-card="cookies" data-kw="' + esc(t.cookieTitle) + '"><div class="chead" style="background-image:url(' + IMG.cookies + ')"><div class="ctitle">' + esc(t.cardCookies) + '</div></div><div class="cbody"><div class="csub">' + esc(cookieTileSub) + '</div></div></button>' : '')
      + (showA11y ? '<button class="ccard" data-card="a11y" data-kw="' + esc(t.a11yTitle) + '"><div class="chead" style="background-image:url(' + IMG.a11y + ')"><div class="ctitle">' + esc(t.cardA11y) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardA11ySub) + '</div></div></button>' : '')
      + (showAI ? '<button class="ccard" data-card="ai" data-kw="' + esc(t.aiTitle) + '"><div class="chead" style="background-image:url(' + IMG.ai + ')"><div class="ctitle">' + esc(t.cardAI) + '</div></div><div class="cbody"><div class="csub">' + esc(t.cardAISub) + '</div></div></button>' : '')
      + '</div>'
      + '</div>'
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
        + '<div class="btnrow"><button class="btn g" id="CR">' + esc(t.rejectAll) + '</button><button class="btn g" id="CA">' + esc(t.acceptAll) + '</button></div>'
        + '<button class="btn t" id="CS" style="width:100%;margin-top:8px">' + esc(t.saveChoices) + '</button>'
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
      + '<div class="modal-overlay hidden" id="MO"><div class="modal"><div class="modal-head"><div><h3 id="MT"></h3><div class="modal-meta" id="MM"></div></div><button class="x" id="MX">&times;</button></div><div class="modal-body" id="MB"></div><div class="modal-foot hidden" id="MF"><a id="MOPEN" target="_blank" rel="noopener"></a></div></div></div>'
      + '<div class="toast" id="T"></div>';

    root.innerHTML = html;
    var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + id); };
    var q = function (s) { return root.querySelectorAll(s); };

    var L = $('L'), P = $('P'), T = $('T'), CBAR = $('CBAR'), BD = $('BD'), tt;
    function toast(m) { T.textContent = m; T.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { T.classList.remove('show'); }, 2200); }
    // On mobile, never auto-open the panel — show only the launcher so it doesn't cover the page.
    // On desktop, only auto-open when the site is configured to open by default (default_open !== false).
    var isMobile = isMobileViewport;
    var openByDefault = cfg.default_open !== false;

    // Focus trap for the expanded panel (bar-mode modal): keep Tab within the panel while open.
    var trapHandler = null;
    function trapFocus(container) {
      trapHandler = function (e) {
        if (e.key !== 'Tab') return;
        var f = container.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        var vis = [];
        f.forEach(function (el) { if (el.offsetParent !== null || el === container) vis.push(el); });
        if (!vis.length) return;
        var first = vis[0], last = vis[vis.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      container.addEventListener('keydown', trapHandler);
    }

    function openPanel() {
      P.classList.remove('hidden');
      L.classList.add('hidden');
      if (barMode) {
        if (BD) BD.classList.remove('hidden');
        // Move focus into the panel, trap it, and support Escape-to-close.
        setTimeout(function () { try { P.focus(); } catch (e) {} }, 30);
        trapFocus(P);
      }
    }
    function closePanel() {
      P.classList.add('hidden');
      if (barMode && BD) BD.classList.add('hidden');
      if (trapHandler) { P.removeEventListener('keydown', trapHandler); trapHandler = null; }
      if (!useBar) { L.classList.remove('hidden'); try { L.focus(); } catch (e) {} }
    }

    // Auto-open only while no consent decision exists. After any decision, the launcher stays available.
    // When the bar is the first-visit consent moment, the floating/expanded panel does NOT auto-open.
    if (((keepOpen && openByDefault && !hasDecision && !useBar) || forceOpen) && !isMobile) { openPanel(); }
    L.onclick = openPanel;
    $('X').onclick = closePanel;
    if (BD) BD.onclick = closePanel;
    // Escape closes the expanded panel and returns focus to the launcher.
    if (barMode) {
      P.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); closePanel(); } });
    }

    // Accessibility: announce the bar on appear (focus it) and keep it keyboard-operable.
    // Escape must NOT dismiss it without a choice — the consent moment stays until a decision.
    if (CBAR) {
      setTimeout(function () { try { CBAR.focus(); } catch (e) {} }, 50);
      CBAR.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); } });
    }

    // Language picker — persist choice and re-render the panel in the new language (keeping it open).
    q('[data-lang]').forEach(function (b) {
      b.onclick = function () {
        var next = b.getAttribute('data-lang');
        if (next === lang) return;
        localStorage.setItem('dros_lang', next);
        var wasOpen = !P.classList.contains('hidden');
        host.remove();
        render(cfg, true, wasOpen);
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

    // Reflect any stored decision in the cookie toggles so the panel matches reality.
    (function () {
      var g = readGrants();
      if (!g) return;
      if ($('cf')) $('cf').checked = g.functional === true;
      if ($('ca')) $('ca').checked = g.analytics === true;
      if ($('cad')) $('cad').checked = GPC ? false : g.advertising === true;
    })();

    if (cfg.honor_gpc && GPC && !localStorage.getItem('dros_gpc_' + SITE)) {
      // First GPC visit with no prior decision recorded by boot: enforce + record explicitly.
      if (!readGrants()) {
        var gpcEnf = applyDecision({ functional: false, analytics: false, advertising: false }, { persisted: false });
        post({ type: 'consent', action: 'gpc_optout', necessary: true, functional: false, analytics: false, advertising: false, enforcement: gpcEnf });
      }
      localStorage.setItem('dros_gpc_' + SITE, '1');
    }

    if (showCookies) {
      $('CS').onclick = function () {
        var grants = { functional: $('cf').checked, analytics: $('ca').checked, advertising: GPC ? false : $('cad').checked };
        var enf = applyDecision(grants, { persisted: false });
        post({ type: 'consent', action: 'save_choices', necessary: true, functional: grants.functional, analytics: grants.analytics, advertising: grants.advertising, enforcement: enf });
        toast(t.tPrefsSaved);
      };
      $('CR').onclick = function () {
        var enf = applyDecision({ functional: false, analytics: false, advertising: false }, { persisted: false });
        if ($('cf')) $('cf').checked = false; if ($('ca')) $('ca').checked = false; if ($('cad')) $('cad').checked = false;
        post({ type: 'consent', action: 'reject_all', necessary: true, functional: false, analytics: false, advertising: false, enforcement: enf });
        toast(t.tRejected);
      };
      $('CA').onclick = function () {
        var grants = { functional: true, analytics: true, advertising: GPC ? false : true };
        var enf = applyDecision(grants, { persisted: false });
        if ($('cf')) $('cf').checked = true; if ($('ca')) $('ca').checked = true; if ($('cad')) $('cad').checked = grants.advertising;
        post({ type: 'consent', action: 'accept_all', necessary: true, functional: grants.functional, analytics: grants.analytics, advertising: grants.advertising, enforcement: enf });
        toast(t.tPrefsSaved);
      };

      // First-layer consent block: same enforcement path as the panel buttons, then
      // re-render so the block is replaced by the returning-visitor state (tiles + status).
      // In BAR mode a consent choice must COLLAPSE to the launcher, never auto-expand the panel
      // (forceOpen=false). In floating mode the panel stays open as before (forceOpen=true).
      function decideAndRerender(action, grants) {
        var enf = applyDecision(grants, { persisted: false });
        post({ type: 'consent', action: action, necessary: true, functional: grants.functional, analytics: grants.analytics, advertising: grants.advertising, enforcement: enf });
        host.remove();
        render(cfg, true, !barMode);
      }
      if ($('HA')) $('HA').onclick = function () { decideAndRerender('accept_all', { functional: true, analytics: true, advertising: GPC ? false : true }); };
      if ($('HR')) $('HR').onclick = function () { decideAndRerender('reject_all', { functional: false, analytics: false, advertising: false }); };
      if ($('HM')) $('HM').onclick = function () { showSection('cookies'); };

      // Bar-layout consent buttons — identical enforcement path as the card/panel.
      // Accept/Reject have equal prominence (same button size/weight; see .cbbtn CSS).
      if ($('BA2')) $('BA2').onclick = function () { decideAndRerender('accept_all', { functional: true, analytics: true, advertising: GPC ? false : true }); };
      if ($('BR2')) $('BR2').onclick = function () { decideAndRerender('reject_all', { functional: false, analytics: false, advertising: false }); };
      // Manage settings / Privacy Center — open the existing panel, one tap to statements & rights.
      if ($('BM2')) $('BM2').onclick = function () { openPanel(); showSection('cookies'); };
      if ($('BPC')) $('BPC').onclick = function () { openPanel(); showHome(); };
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

    // Plain anchor links to the public statement pages, injected into the HOST page
    // (deliberately outside the shadow DOM — a link inside a shadow root is not a
    // link any crawler or scanner will follow). Real <a href> elements, no click
    // handler, so they behave like any other footer link.
    //
    // HONEST LIMIT: these are injected by JavaScript, so a crawler that executes JS
    // sees them and one that doesn't never will. The static snippet in Widget Studio
    // exists for that second case.
    (function injectFooterLinks() {
      if (!cfg.inject_footer_links) return;
      var urls = cfg.statement_urls || {};
      if (document.getElementById('dros-footer-links')) return;
      var stmts = cfg.statements || {};
      var order = [
        ['privacy_policy', 'Privacy Policy'],
        ['cookie_policy', 'Cookie Policy'],
        ['accessibility_statement', 'Accessibility Statement'],
        ['ai_use_statement', 'AI Use Statement']
      ];
      var parts = [];
      order.forEach(function (pair) {
        var key = pair[0];
        var href = urls[key];
        if (!href) return;
        var s = stmts[key] || {};
        var label = (lang === 'es' && s.title_es) ? s.title_es : (s.title || pair[1]);
        if (lang === 'es' && s.body_es) href += '&lang=es';
        parts.push('<a href="' + esc(href) + '" style="color:inherit;text-decoration:underline;margin:0 8px">' + esc(label) + '</a>');
      });
      if (!parts.length) return;
      var nav = document.createElement('nav');
      nav.id = 'dros-footer-links';
      nav.setAttribute('aria-label', t.legalStatements);
      nav.style.cssText = 'padding:14px 16px;text-align:center;font-size:12px;line-height:1.8;color:inherit;opacity:.85';
      nav.innerHTML = parts.join('<span aria-hidden="true">&middot;</span>');
      document.body.appendChild(nav);
    })();

    // "Your Privacy Choices" — a real anchor to a real page, injected into the HOST
    // document alongside the statement links. Separate from injectFooterLinks on purpose:
    // this is the opt-out MECHANISM, so it ships whether or not the subscriber publishes
    // statements, and it defaults on for every plan (resolved server-side).
    //
    // The label is the only wording a visitor sees, and it says nothing about whether the
    // business sells or shares data — it names the visitor's choice, not the business's
    // behavior.
    (function injectPrivacyChoicesLink() {
      if (!cfg.inject_privacy_choices_link || !cfg.privacy_choices_url) return;
      if (document.getElementById('dros-privacy-choices')) return;
      var label = lang === 'es' ? 'Sus Opciones de Privacidad' : 'Your Privacy Choices';
      var nav = document.createElement('nav');
      nav.id = 'dros-privacy-choices';
      nav.setAttribute('aria-label', label);
      nav.style.cssText = 'padding:10px 16px;text-align:center;font-size:12px;line-height:1.8;color:inherit;opacity:.85';
      var a = document.createElement('a');
      a.href = cfg.privacy_choices_url + (lang === 'es' ? '&lang=es' : '');
      a.textContent = label;
      a.style.cssText = 'color:inherit;text-decoration:underline';
      nav.appendChild(a);
      document.body.appendChild(nav);
    })();

    // Statement modal
    var MO = $('MO'), MT = $('MT'), MM = $('MM'), MB = $('MB'), MF = $('MF'), MOPEN = $('MOPEN');
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
          // The modal stays the default reading experience; this makes the durable
          // public URL reachable rather than replacing the in-widget view.
          var pub = (cfg.statement_urls || {})[key];
          if (pub && MF && MOPEN) {
            MOPEN.href = pub + ((useEs && s.body_es) ? '&lang=es' : '');
            MOPEN.textContent = t.openFullPage;
            MF.classList.remove('hidden');
          } else if (MF) {
            MF.classList.add('hidden');
          }
          MO.classList.remove('hidden');
        };
      });
    }
  }
})();
/* ===== end widget.js ===== */`;

  return new Response(widgetCode, { status: 200, headers: CORS });
});