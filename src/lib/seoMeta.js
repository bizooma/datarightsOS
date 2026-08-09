import { useEffect } from 'react';

const BRAND = 'DataRightsOS';

// Per-route client-side SEO meta. Applied on top of whatever the platform's
// prerenderer injects into the raw HTML — this layer gives JS-executing
// crawlers and browser tabs the correct title/description regardless of the
// server-side default. To fix the raw-HTML (curl-visible) title/description,
// set overrides in Dashboard → Marketing → SEO & GEO → Meta tags.
export const ROUTE_META = {
  '/': {
    title: 'DataRightsOS — Cookie Consent, AI Disclosure, Accessibility & Privacy Requests',
    description:
      'One widget covering cookie consent, AI disclosure, accessibility, and data-rights requests — with a timestamped record of how every request was handled.',
  },
  '/cookie-consent': {
    title: 'Cookie Consent with GPC Enforcement — DataRightsOS',
    description:
      'A cookie banner that actually enforces the choice: scripts stay inert until consent, and Global Privacy Control signals are honored automatically.',
  },
  '/web-accessibility': {
    title: 'Accessibility Statement & Barrier Reporting — DataRightsOS',
    description:
      'Publish an accessibility statement referencing WCAG 2.1 AA and give visitors a real way to report barriers — tracked and answered from your dashboard. Not an overlay.',
  },
  '/ai-disclosure': {
    title: 'AI Use Statement for Your Website — DataRightsOS',
    description:
      'Tell visitors when and how you use AI, in English and Spanish, served inside the same widget — versioned with effective dates.',
  },
  '/data-privacy': {
    title: 'Data-Rights Request Handling — DataRightsOS',
    description:
      'Verify the requester, start the 45-day clock, work a per-system fulfillment checklist, and keep a timestamped record of exactly how you responded.',
  },
  '/about': {
    title: 'About — DataRightsOS',
    description:
      'DataRightsOS is privacy infrastructure for law firms, agencies, and the sites they protect — cookie consent, data-rights requests, and an audit trail in one place. A Bizooma product.',
  },
  '/contact': {
    title: 'Contact — DataRightsOS',
    description:
      'Questions about DataRightsOS, your account, or pricing? Reach our support and sales teams and we will get back to you.',
  },
};

function setMetaTag(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets document.title and meta description for the current page (client-side).
 * Pass an explicit key, or it falls back to the current pathname.
 */
export function useDocumentMeta(routeKey) {
  useEffect(() => {
    const key = routeKey || window.location.pathname;
    const meta = ROUTE_META[key];
    if (!meta) return;
    const prevTitle = document.title;
    document.title = meta.title;
    setMetaTag('description', meta.description);
    return () => {
      document.title = prevTitle;
    };
  }, [routeKey]);
}