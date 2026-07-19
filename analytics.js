(function () {
  "use strict";

  const CONFIG = window.EH_ANALYTICS_CONFIG || {};
  const GTM_ID = typeof CONFIG.gtmId === "string" ? CONFIG.gtmId.trim() : "";
  const VALID_GTM_ID = /^GTM-[A-Z0-9]+$/.test(GTM_ID);
  const CONSENT_KEY = "eh_consent_v1";
  const FIRST_TOUCH_KEY = "eh_first_touch_v1";
  const ALLOWED_EVENTS = new Set([
    "generate_lead",
    "navigator_start",
    "navigator_complete",
    "test_start",
    "test_complete",
    "telegram_click",
    "program_cta_click",
    "payment_click",
    "outbound_click",
  ]);
  const PARAMS = Object.freeze({
    generate_lead: ["lead_type", "program_name", "page_path"],
    navigator_start: ["entry_page", "navigator_type", "traffic_source"],
    navigator_complete: ["navigator_type", "result_type", "entry_page"],
    test_start: ["test_name", "entry_page"],
    test_complete: ["test_name", "result_type"],
    telegram_click: ["link_location", "link_label", "destination_type", "page_path"],
    program_cta_click: ["program_name", "cta_label", "cta_location", "page_path"],
    payment_click: ["program_name", "payment_provider", "currency", "value", "page_path"],
    outbound_click: ["destination_domain", "link_label", "page_path"],
  });
  const PAYMENT_PRODUCTS = Object.freeze({
    "off-switch-training": { program_name: "Off-Switch Training", currency: "EUR", value: 300 },
    "quantum-single": { program_name: "Квантовая активация", currency: "EUR", value: 700 },
    "quantum-100": { program_name: "Квантовая активация — 100 дней", currency: "EUR", value: 1500 },
    "navigator-svetlana": { program_name: "Навигатор со Светланой", currency: "EUR", value: 300 },
  });
  const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me", "telegram.dog"]);
  const PII_PATTERN = /(?:[\w.%+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d\s().-]{7,}\d))/i;

  window.dataLayer = window.dataLayer || [];
  const gtag = function () { window.dataLayer.push(arguments); };
  window.gtag = window.gtag || gtag;

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch { return false; }
    },
  };
  const consentState = () => safeStorage.get(CONSENT_KEY);
  const hasAnalyticsConsent = () => consentState() === "analytics_granted";

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });
  window.gtag("set", "ads_data_redaction", true);

  if (hasAnalyticsConsent()) {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  const pagePath = () => window.location.pathname || "/";
  const textLabel = (node) => {
    const value = node?.getAttribute?.("aria-label") || node?.textContent || "";
    return value.replace(/\s+/g, " ").trim().slice(0, 100);
  };
  const safeString = (value) => {
    if (typeof value !== "string") return "";
    const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    return PII_PATTERN.test(cleaned) ? "" : cleaned;
  };
  const sanitize = (eventName, rawParams) => {
    const allowed = PARAMS[eventName] || [];
    const result = {};
    for (const key of allowed) {
      const value = rawParams?.[key];
      if (key === "value") {
        if (Number.isFinite(value) && value >= 0) result.value = value;
        continue;
      }
      if (key === "currency") {
        const currency = safeString(value).toUpperCase();
        if (/^[A-Z]{3}$/.test(currency)) result.currency = currency;
        continue;
      }
      const cleaned = safeString(value);
      if (cleaned) result[key] = cleaned;
    }
    return result;
  };

  const track = (eventName, params = {}) => {
    if (!ALLOWED_EVENTS.has(eventName) || !hasAnalyticsConsent()) return false;
    window.dataLayer.push({ event: eventName, ...sanitize(eventName, params) });
    return true;
  };

  const readStoredFirstTouch = () => {
    const stored = safeStorage.get(FIRST_TOUCH_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  };
  const captureFirstTouch = () => {
    const query = new URLSearchParams(window.location.search);
    const referrer = document.referrer ? new URL(document.referrer, window.location.href) : null;
    const source = safeString(query.get("utm_source") || (referrer && referrer.origin !== window.location.origin ? referrer.hostname : "direct"));
    return {
      source: source || "direct",
      medium: safeString(query.get("utm_medium") || (source === "direct" ? "none" : "referral")),
      campaign: safeString(query.get("utm_campaign") || ""),
      content: safeString(query.get("utm_content") || ""),
      term: safeString(query.get("utm_term") || ""),
      landing_page: pagePath(),
      captured_at: new Date().toISOString(),
    };
  };
  const pendingFirstTouch = captureFirstTouch();
  const readFirstTouch = () => readStoredFirstTouch() || pendingFirstTouch;
  const storeFirstTouch = () => {
    if (!hasAnalyticsConsent() || readStoredFirstTouch()) return;
    safeStorage.set(FIRST_TOUCH_KEY, JSON.stringify(pendingFirstTouch));
  };
  storeFirstTouch();

  let gtmLoaded = false;
  const loadGtm = () => {
    if (!VALID_GTM_ID || gtmLoaded || !hasAnalyticsConsent()) return false;
    gtmLoaded = true;
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    script.dataset.ehAnalytics = "gtm";
    document.head.appendChild(script);
    return true;
  };

  const updateConsent = (choice) => {
    const granted = choice === "analytics_granted";
    safeStorage.set(CONSENT_KEY, granted ? "analytics_granted" : "essential_only");
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    if (granted) {
      storeFirstTouch();
      loadGtm();
    }
    document.dispatchEvent(new CustomEvent("eh:consent-change", { detail: { analytics: granted } }));
  };

  const programName = () => safeString(document.documentElement.dataset.programName || document.querySelector("h1")?.textContent || document.title.split(/[|—]/)[0]);
  const ctaLocation = (node) => safeString(node.closest("header") ? "header" : node.closest("footer") ? "footer" : node.closest("section")?.id || "content");
  const hrefUrl = (node) => {
    const href = node.getAttribute?.("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return null;
    try { return new URL(href, window.location.href); } catch { return null; }
  };
  const hasPaymentIntent = (node, productKey) => {
    if (productKey || node.hasAttribute("data-gc-payment-target")) return true;
    const handler = node.getAttribute("onclick") || "";
    if (/open(?:single|bundle)?modal\s*\(/i.test(handler)) return true;
    return /(?:оплатить|перейти к оплате|получить тренинг|купить|забронировать место|выбрать две недели)/i.test(textLabel(node));
  };

  document.addEventListener("click", (event) => {
    const node = event.target.closest?.("a,button,[role='button']");
    if (!node) return;
    const url = hrefUrl(node);
    const label = textLabel(node);
    const productKey = node.dataset.gcProduct || node.dataset.getcourseProduct || (node.hasAttribute("data-off-switch-checkout") ? "off-switch-training" : "");
    const payment = PAYMENT_PRODUCTS[productKey];
    const isGetCourse = hasPaymentIntent(node, productKey);
    if (isGetCourse) {
      track("payment_click", {
        program_name: payment?.program_name || programName(),
        payment_provider: "GetCourse",
        currency: payment?.currency,
        value: payment?.value,
        page_path: pagePath(),
      });
      return;
    }
    if (url && TELEGRAM_HOSTS.has(url.hostname)) {
      track("telegram_click", {
        link_location: ctaLocation(node),
        link_label: label,
        destination_type: "telegram",
        page_path: pagePath(),
      });
      return;
    }
    if (url && /^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
      track("outbound_click", {
        destination_domain: url.hostname,
        link_label: label,
        page_path: pagePath(),
      });
      return;
    }
    if (node.matches(".button,.btn,.fs-button,[class*='cta'],[data-analytics-program]")) {
      track("program_cta_click", {
        program_name: safeString(node.dataset.analyticsProgram) || programName(),
        cta_label: label,
        cta_location: ctaLocation(node),
        page_path: pagePath(),
      });
    }
  }, { capture: true });

  document.addEventListener("eh:lead-success", (event) => {
    track("generate_lead", { ...event.detail, page_path: pagePath() });
  });
  document.addEventListener("eh:test-start", (event) => {
    track("test_start", { ...event.detail, entry_page: pagePath() });
  });
  document.addEventListener("eh:test-complete", (event) => {
    track("test_complete", event.detail || {});
  });

  const renderConsentUi = () => {
    const localPreview = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
      && new URLSearchParams(window.location.search).get("consent-preview") === "1";
    if (!VALID_GTM_ID && !localPreview) return;

    const panel = document.createElement("section");
    panel.className = "eh-consent";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Настройки cookies");
    panel.innerHTML = `
      <div class="eh-consent__copy">
        <strong>Настройки cookies</strong>
        <p>Мы используем необязательные аналитические cookies, чтобы понимать, как работает сайт. Можно разрешить аналитику или оставить только необходимые cookies. <a href="/privacy-policy/">Подробнее</a>.</p>
      </div>
      <div class="eh-consent__actions">
        <button type="button" class="eh-consent__button eh-consent__button--secondary" data-eh-consent="essential_only">Только необходимые</button>
        <button type="button" class="eh-consent__button eh-consent__button--primary" data-eh-consent="analytics_granted">Разрешить аналитику</button>
        <button type="button" class="eh-consent__close" data-eh-consent-close aria-label="Закрыть настройки cookies">×</button>
      </div>`;
    document.body.appendChild(panel);

    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "eh-cookie-settings";
    settings.textContent = "Настройки cookies";
    const footerTarget = document.querySelector(".eh-global-footer__privacy, .eh-sales-landing-footer__inner, footer") || document.body;
    footerTarget.appendChild(settings);

    const show = (allowClose) => {
      panel.hidden = false;
      panel.classList.toggle("eh-consent--revisit", allowClose);
      document.body.classList.add("eh-consent-visible");
      panel.querySelector("[data-eh-consent-close]").hidden = !allowClose;
    };
    const hide = () => {
      panel.hidden = true;
      document.body.classList.remove("eh-consent-visible");
    };
    panel.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-eh-consent]")?.dataset.ehConsent;
      if (choice) { updateConsent(choice); hide(); }
      if (event.target.closest("[data-eh-consent-close]")) hide();
    });
    settings.addEventListener("click", () => show(true));
    if (!consentState()) show(false);
  };

  window.ehAnalytics = Object.freeze({
    available: VALID_GTM_ID,
    track,
    setConsent: updateConsent,
    getConsent: consentState,
    getFirstTouch: readFirstTouch,
    loadGtm,
  });

  if (VALID_GTM_ID && hasAnalyticsConsent()) loadGtm();
  if (!VALID_GTM_ID && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) && !window.__ehAnalyticsWarned) {
    window.__ehAnalyticsWarned = true;
    console.info("Evolution House analytics: GTM ID is not configured; no analytics vendor script was loaded.");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderConsentUi, { once: true });
  else renderConsentUi();
})();
