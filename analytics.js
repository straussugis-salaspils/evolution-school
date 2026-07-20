(() => {
  "use strict";

  const GA4_ID = "G-RSEE3PKS5V";
  const CONSENT_KEY = "eh_consent_v2";
  const CONSENT_COOKIE = "eh_consent_v2";
  const FIRST_TOUCH_KEY = "eh_first_touch_v1";
  const EVENTS = new Set([
    "generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete",
    "telegram_click", "program_cta_click", "payment_click", "outbound_click",
  ]);
  const PARAMS = {
    generate_lead: ["lead_type", "program_name", "page_path"],
    navigator_start: ["entry_page", "navigator_type", "traffic_source"],
    navigator_complete: ["navigator_type", "result_type", "entry_page"],
    test_start: ["test_name", "entry_page"],
    test_complete: ["test_name", "result_type"],
    telegram_click: ["link_location", "link_label", "destination_type", "page_path"],
    program_cta_click: ["program_name", "cta_label", "cta_location", "page_path"],
    payment_click: ["program_name", "payment_provider", "currency", "value", "page_path"],
    outbound_click: ["destination_domain", "link_label", "page_path"],
  };
  const PRODUCTS = {
    "off-switch-training": ["Тренинг Off-Switch в записи", "EUR", 300],
    "quantum-single": ["Квантовая активация", "EUR", 700],
    "quantum-100": ["Квантовая активация — 100 дней", "EUR", 1500],
    "navigator-svetlana": ["Навигатор со Светланой", "EUR", 300],
  };
  const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me", "telegram.dog"]);
  const PII = /(?:[\w.%+-]+@[\w.-]+\.[a-z]{2,}|@\w{5,}|(?:\+?\d[\d\s().-]{7,}\d))/i;
  const storage = {
    get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ } },
  };
  const cookie = {
    get: (key) => {
      try {
        return document.cookie.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${encodeURIComponent(key)}=`))?.split("=").slice(1).join("=") || null;
      } catch { return null; }
    },
    set: (key, value) => {
      try {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
      } catch { /* Cookies may be unavailable. */ }
    },
  };
  const pagePath = () => location.pathname || "/";
  const normaliseConsent = (value) => value === "analytics_granted" || value === "essential_only" ? value : null;
  const consent = () => {
    const saved = normaliseConsent(storage.get(CONSENT_KEY)) || normaliseConsent(cookie.get(CONSENT_COOKIE));
    if (saved && storage.get(CONSENT_KEY) !== saved) storage.set(CONSENT_KEY, saved);
    return saved;
  };
  const allowed = () => consent() === "analytics_granted";
  const clean = (value) => {
    if (typeof value !== "string") return "";
    const result = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    return PII.test(result) ? "" : result;
  };
  const consentPayload = (analytics) => ({
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  const firstTouch = () => {
    const query = new URLSearchParams(location.search);
    let referrer = null;
    try { referrer = document.referrer ? new URL(document.referrer) : null; } catch { /* no-op */ }
    const source = clean(query.get("utm_source") || (referrer?.origin !== location.origin ? referrer?.hostname : "direct")) || "direct";
    return {
      source,
      medium: clean(query.get("utm_medium") || (source === "direct" ? "none" : "referral")),
      campaign: clean(query.get("utm_campaign")), content: clean(query.get("utm_content")), term: clean(query.get("utm_term")),
      landing_page: pagePath(), captured_at: new Date().toISOString(),
    };
  };
  const pendingFirstTouch = firstTouch();
  const getFirstTouch = () => { try { return JSON.parse(storage.get(FIRST_TOUCH_KEY) || "") || pendingFirstTouch; } catch { return pendingFirstTouch; } };
  const persistFirstTouch = () => { if (allowed() && !storage.get(FIRST_TOUCH_KEY)) storage.set(FIRST_TOUCH_KEY, JSON.stringify(pendingFirstTouch)); };

  let ga4Loaded = false;
  const gtag = (...args) => { window.dataLayer.push(args); };
  const consentDefault = () => gtag("consent", "default", consentPayload(false));
  const consentUpdate = (analytics) => gtag("consent", "update", consentPayload(analytics));
  const loadGoogleTag = () => {
    if (ga4Loaded || !allowed()) return false;
    ga4Loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    // Keep this sequence together: Consent Mode defaults, the visitor's update,
    // and only then the Google tag and its single GA4 configuration command.
    consentDefault();
    consentUpdate(true);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
    script.dataset.ehGa4 = "true";
    document.head.append(script);
    gtag("js", new Date());
    gtag("config", GA4_ID, { send_page_view: true });
    return true;
  };
  const clearAnalyticsCookies = () => {
    try {
      document.cookie.split(";").map((entry) => entry.trim().split("=")[0]).filter((name) => /^_ga(?:_|$)|^_gid$/i.test(name)).forEach((name) => {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      });
    } catch { /* Cookie storage may be disabled. */ }
  };
  const setConsent = (choice) => {
    const analytics = choice === "analytics_granted";
    const savedChoice = analytics ? "analytics_granted" : "essential_only";
    const wasLoaded = ga4Loaded;
    storage.set(CONSENT_KEY, savedChoice);
    cookie.set(CONSENT_COOKIE, savedChoice);
    if (analytics) { persistFirstTouch(); loadGoogleTag(); }
    if (!analytics && wasLoaded) {
      consentUpdate(false);
      clearAnalyticsCookies();
      // Basic Consent Mode removes the loaded Google script on the next page load.
      window.setTimeout(() => location.reload(), 0);
    }
    document.dispatchEvent(new CustomEvent("eh:consent-change", { detail: { analytics } }));
  };
  if (allowed()) { persistFirstTouch(); loadGoogleTag(); }

  const sanitize = (eventName, values = {}) => {
    const result = {};
    for (const key of PARAMS[eventName] || []) {
      if (key === "value" && Number.isFinite(values[key]) && values[key] >= 0) result.value = values[key];
      else if (key === "currency" && /^[A-Z]{3}$/.test(clean(values[key]).toUpperCase())) result.currency = clean(values[key]).toUpperCase();
      else { const value = clean(values[key]); if (value) result[key] = value; }
    }
    return result;
  };
  const track = (eventName, values) => {
    if (!allowed() || !EVENTS.has(eventName)) return false;
    if (!ga4Loaded || typeof window.gtag !== "function") return false;
    window.gtag("event", eventName, sanitize(eventName, values));
    return true;
  };
  const text = (node) => clean(node?.getAttribute("aria-label") || node?.textContent || "");
  const urlFor = (node) => { try { return new URL(node.getAttribute("href"), location.href); } catch { return null; } };
  const locationFor = (node) => node.closest("header") ? "header" : node.closest("footer") ? "footer" : node.closest("section")?.id || "content";
  const productName = () => clean(document.documentElement.dataset.programName || document.querySelector("h1")?.textContent || document.title);

  document.addEventListener("click", (event) => {
    const node = event.target.closest?.("a,button,[role='button']");
    if (!node) return;
    const label = text(node);
    const productKey = node.dataset.gcProduct || (node.hasAttribute("data-off-switch-checkout") ? "off-switch-training" : "");
    const payment = PRODUCTS[productKey];
    if (payment || node.hasAttribute("data-gc-payment-target") || /\b(оплатить|забронировать)\b/i.test(label)) {
      track("payment_click", { program_name: payment?.[0] || productName(), payment_provider: "GetCourse", currency: payment?.[1], value: payment?.[2], page_path: pagePath() });
      return;
    }
    const url = urlFor(node);
    if (url && TELEGRAM_HOSTS.has(url.hostname)) {
      track("telegram_click", { link_location: locationFor(node), link_label: label, destination_type: "telegram", page_path: pagePath() });
    } else if (url && /^https?:$/.test(url.protocol) && url.origin !== location.origin) {
      track("outbound_click", { destination_domain: url.hostname, link_label: label, page_path: pagePath() });
    } else if (node.matches(".button,.btn,.fs-button,[class*='cta'],[data-analytics-program]")) {
      track("program_cta_click", { program_name: clean(node.dataset.analyticsProgram) || productName(), cta_label: label, cta_location: locationFor(node), page_path: pagePath() });
    }
  }, { capture: true });

  document.addEventListener("eh:lead-success", (event) => track("generate_lead", { ...(event.detail || {}), page_path: pagePath() }));
  document.addEventListener("eh:test-start", (event) => track("test_start", { ...(event.detail || {}), entry_page: pagePath() }));
  document.addEventListener("eh:test-complete", (event) => track("test_complete", event.detail || {}));

  const renderBanner = () => {
    const panel = document.createElement("section");
    panel.className = "eh-consent";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Настройки cookies");
    panel.innerHTML = '<div class="eh-consent__copy"><strong>Настройки cookies</strong><p>Мы используем необязательные аналитические cookies, чтобы понимать, как работает сайт. Можно разрешить аналитику или оставить только необходимые cookies. <a href="/privacy-policy/">Подробнее</a>.</p></div><div class="eh-consent__actions"><button type="button" class="eh-consent__button eh-consent__button--secondary" data-eh-consent="essential_only">Только необходимые</button><button type="button" class="eh-consent__button eh-consent__button--primary" data-eh-consent="analytics_granted">Разрешить аналитику</button><button type="button" class="eh-consent__close" data-eh-consent-close aria-label="Закрыть настройки cookies">×</button></div>';
    document.body.append(panel);
    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "eh-cookie-settings";
    settings.textContent = "Настройки cookies";
    (document.querySelector(".eh-global-footer__privacy, .eh-sales-landing-footer__inner, footer") || document.body).append(settings);
    const show = (canClose) => { panel.hidden = false; panel.querySelector("[data-eh-consent-close]").hidden = !canClose; };
    panel.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-eh-consent]")?.dataset.ehConsent;
      if (choice) { setConsent(choice); panel.hidden = true; }
      if (event.target.closest("[data-eh-consent-close]")) panel.hidden = true;
    });
    settings.addEventListener("click", () => show(true));
    if (!consent()) show(false);
  };
  window.ehAnalytics = Object.freeze({ track, setConsent, getConsent: consent, getFirstTouch, loadGoogleTag, ga4Id: GA4_ID, consentPayload });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderBanner, { once: true });
  else renderBanner();
})();
