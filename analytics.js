(function () {
  'use strict';
  const measurementId = 'G-LDN2SHKGWP';
  const consentKey = 'novpets.analytics.consent.v1';
  const forms = new Set(['home-form', 'modal-form']);
  let enabled = false;
  let loaded = false;
  let choice = null;
  try { choice = localStorage.getItem(consentKey); } catch (_) {}

  // Allow campaign attribution without sending arbitrary query values to Google.
  function cleanUrl(value, campaign) {
    try {
      const url = new URL(value);
      const result = new URL(url.origin + url.pathname);
      if (campaign) {
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content'].forEach(key => {
          const value = url.searchParams.get(key);
          if (value && /^[a-zA-Z0-9 _.-]{1,120}$/.test(value) && !/@|\d{7}/.test(value)) result.searchParams.set(key, value);
        });
      }
      return result.href;
    } catch (_) { return ''; }
  }

  function enable() {
    if (!/^G-[A-Z0-9]+$/.test(measurementId) || !['novpets.com', 'www.novpets.com'].includes(location.hostname)) return;
    enabled = true;
    window['ga-disable-' + measurementId] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      page_location: cleanUrl(location.href, true),
      page_referrer: cleanUrl(document.referrer, false),
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
  }

  function choose(value) {
    choice = value;
    try { localStorage.setItem(consentKey, value); } catch (_) {}
    if (value === 'granted') enable();
    else {
      enabled = false;
      window['ga-disable-' + measurementId] = true;
      // Remove this site's Analytics identifiers when a visitor withdraws consent.
      document.cookie.split(';').forEach(part => {
        const name = part.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        ['', '; domain=novpets.com', '; domain=.novpets.com'].forEach(domain => {
          document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax; Secure';
        });
      });
    }
    banner.hidden = true;
  }

  function event(name, params, wait) {
    if (!enabled || typeof window.gtag !== 'function') return Promise.resolve();
    if (!wait) {
      window.gtag('event', name, { ...params, send_to: measurementId });
      return Promise.resolve();
    }
    // Analytics must never keep a successful buyer enquiry on the form page.
    return new Promise(resolve => {
      const timer = setTimeout(resolve, 1200);
      window.gtag('event', name, {
        ...params, send_to: measurementId,
        event_callback: () => { clearTimeout(timer); resolve(); }, event_timeout: 1000
      });
    });
  }

  window.NOVPetsAnalytics = Object.freeze({
    enquirySent: formId => event('generate_lead', {
      form_id: forms.has(formId) ? formId : 'quote-form', lead_method: 'quote_form'
    }, true)
  });

  const banner = document.createElement('aside');
  banner.className = 'analytics-notice';
  banner.setAttribute('aria-label', 'Analytics preferences');
  banner.hidden = true;
  banner.innerHTML = '<b>Help us improve your visit.</b><p>With your permission, we use Google Analytics to understand visits and enquiries. Your form details are not sent to Analytics.</p><div><button type="button" data-analytics-allow>Allow analytics</button><button type="button" data-analytics-decline>Decline</button></div>';
  banner.querySelector('[data-analytics-allow]').addEventListener('click', () => choose('granted'));
  banner.querySelector('[data-analytics-decline]').addEventListener('click', () => choose('denied'));
  document.body.appendChild(banner);
  document.querySelectorAll('[data-analytics-settings]').forEach(button => button.addEventListener('click', () => { banner.hidden = false; }));
  document.addEventListener('click', e => {
    if (e.target.closest?.('.whatsapp-float')) event('whatsapp_click', { contact_method: 'whatsapp', link_placement: 'floating_button' }, false);
  }, true);
  if (choice === 'granted') enable();
  else if (choice !== 'denied') banner.hidden = false;
})();
