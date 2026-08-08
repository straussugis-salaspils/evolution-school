(() => {
  "use strict";

  const GA4_ID = "G-RSEE3PKS5V";
  const METRIKA_ID = 111024711;
  const CONSENT_KEY = "eh_consent_v2";
  const CONSENT_COOKIE = "eh_consent_v2";
  const FIRST_TOUCH_KEY = "eh_first_touch_v1";
  const ARTICLE_ATTRIBUTION_KEY = "eh_article_product_attribution_v1";
  const EVENTS = new Set([
    "generate_lead", "navigator_start", "navigator_complete", "test_start", "test_complete",
    "telegram_click", "program_cta_click", "payment_click", "outbound_click",
    "article_view", "related_article_click", "cta_impression", "product_click",
    "lead_start", "lead_submit",
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
    article_view: ["route_id", "product_id", "cta_variant", "placement"],
    related_article_click: ["route_id", "related_route_id", "product_id", "cta_variant", "placement"],
    cta_impression: ["route_id", "product_id", "cta_variant", "placement"],
    product_click: ["route_id", "product_id", "cta_variant", "placement"],
    lead_start: ["route_id", "product_id", "cta_variant", "placement"],
    lead_submit: ["route_id", "product_id", "cta_variant", "placement"],
  };
  const PRODUCTS = {
    "off-switch-training": ["Тренинг Off-Switch в записи", "EUR", 300],
    "quantum-single": ["Квантовая активация", "EUR", 700],
    "quantum-100": ["Квантовая активация — 100 дней", "EUR", 1500],
    "navigator-svetlana": ["Навигатор со Светланой", "EUR", 300],
    "wellness-zhizn-bez-nadryva": ["Wellness-день «Жизнь без надрыва»", "RUB", 8880],
    "love-tea-moscow": ["Живая встреча «Выпьем за любовь чаю»", "RUB", 8880],
  };
  const TELEGRAM_HOSTS = new Set(["t.me", "telegram.me", "telegram.dog"]);
  const PII = /(?:[\w.%+-]+@[\w.-]+\.[a-z]{2,}|@\w{5,}|(?:\+?\d[\d\s().-]{7,}\d))/i;
  const storage = {
    get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ } },
  };
  const session = {
    get: (key) => { try { return sessionStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Session storage may be disabled. */ } },
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
  let metrikaLoaded = false;
  const gtag = (...args) => { window.dataLayer.push(args); };
  const consentDefault = () => gtag("consent", "default", consentPayload(false));
  const consentUpdate = (analytics) => gtag("consent", "update", consentPayload(analytics));
  const loadGoogleTag = () => {
    if (ga4Loaded) return false;
    ga4Loaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
    script.dataset.ehGa4 = "true";
    document.head.append(script);
    gtag("js", new Date());
    gtag("config", GA4_ID, { send_page_view: true });
    return true;
  };
  const loadYandexMetrika = () => {
    if (metrikaLoaded) return false;
    metrikaLoaded = true;
    window.ym = window.ym || function (...args) {
      (window.ym.a = window.ym.a || []).push(args);
    };
    window.ym.l = Date.now();
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.dataset.ehMetrika = "true";
    document.head.append(script);
    window.ym(METRIKA_ID, "init", {
      clickmap: false,
      trackLinks: false,
      accurateTrackBounce: false,
      webvisor: false,
    });
    return true;
  };
  const loadAnalytics = () => {
    const googleLoaded = loadGoogleTag();
    const yandexLoaded = loadYandexMetrika();
    return googleLoaded || yandexLoaded;
  };
  const clearGoogleAnalyticsCookies = () => {
    try {
      const domainAttributes = [""];
      if (location.hostname === "yourbalancerestored.com" || location.hostname.endsWith(".yourbalancerestored.com")) {
        domainAttributes.push(`; Domain=.${location.hostname}`, "; Domain=.yourbalancerestored.com");
      }
      document.cookie.split(";").map((entry) => entry.trim().split("=")[0]).filter((name) => (
        /^_ga(?:_|$)|^_gid$/i.test(name)
      )).forEach((name) => {
        for (const domain of domainAttributes) {
          document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domain}`;
        }
      });
    } catch { /* Cookie storage may be disabled. */ }
  };
  const setConsent = (choice) => {
    const analytics = choice === "analytics_granted";
    const savedChoice = analytics ? "analytics_granted" : "essential_only";
    storage.set(CONSENT_KEY, savedChoice);
    cookie.set(CONSENT_COOKIE, savedChoice);
    loadGoogleTag();
    consentUpdate(analytics);
    if (analytics) {
      persistFirstTouch();
    }
    if (!analytics) {
      clearGoogleAnalyticsCookies();
    }
    document.dispatchEvent(new CustomEvent("eh:consent-change", { detail: { analytics } }));
  };

  // Advanced Consent Mode: Google loads on every visit after an all-denied
  // default. It sends cookieless pings and writes no GA cookies until opt-in.
  // By owner decision, standard Yandex Metrika loads on every visit and keeps
  // its browser identifiers regardless of the Google analytics choice.
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  consentDefault();
  if (allowed()) consentUpdate(true);
  loadGoogleTag();
  loadYandexMetrika();
  if (allowed()) persistFirstTouch();

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
    if (!EVENTS.has(eventName)) return false;
    const parameters = sanitize(eventName, values);
    let sent = false;
    if (allowed() && ga4Loaded && typeof window.gtag === "function") {
      window.gtag("event", eventName, parameters);
      sent = true;
    }
    if (metrikaLoaded && typeof window.ym === "function") {
      window.ym(METRIKA_ID, "reachGoal", eventName, parameters);
      sent = true;
    }
    return sent;
  };
  const text = (node) => clean(node?.getAttribute("aria-label") || node?.textContent || "");
  const urlFor = (node) => { try { return new URL(node.getAttribute("href"), location.href); } catch { return null; } };
  const locationFor = (node) => node.closest("header") ? "header" : node.closest("footer") ? "footer" : node.closest("section")?.id || "content";
  const productName = () => clean(document.documentElement.dataset.programName || document.querySelector("h1")?.textContent || document.title);

  const articleContext = (node = document.body) => ({
    route_id: clean(node?.dataset.routeId || document.body?.dataset.routeId),
    related_route_id: clean(node?.dataset.relatedRouteId),
    product_id: clean(node?.dataset.productId || document.body?.dataset.primaryProductId || "related_article"),
    cta_variant: clean(node?.dataset.ctaVariant || document.body?.dataset.ctaVariant || "editorial_graph"),
    placement: clean(node?.dataset.placement || "article"),
  });
  const attributionFromQuery = () => {
    const query = new URLSearchParams(location.search);
    if (!["archetype_article", "transition_article"].includes(query.get("source"))) return null;
    const values = {
      route_id: clean(query.get("route_id")),
      product_id: clean(query.get("product_id")),
      cta_variant: clean(query.get("cta_variant")),
      placement: clean(query.get("placement") || "article_end"),
    };
    return values.route_id && values.product_id && values.cta_variant ? values : null;
  };
  const readArticleAttribution = () => {
    try {
      const saved = JSON.parse(session.get(ARTICLE_ATTRIBUTION_KEY) || "") || null;
      const queried = attributionFromQuery();
      if (queried && !saved) session.set(ARTICLE_ATTRIBUTION_KEY, JSON.stringify(queried));
      return saved || queried;
    } catch { return attributionFromQuery(); }
  };
  const saveArticleAttribution = (node) => {
    const attribution = articleContext(node);
    if (!attribution.route_id || !attribution.product_id) return null;
    session.set(ARTICLE_ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  };
  let articleViewSent = false;
  const trackArticleView = () => {
    if (articleViewSent || !document.body?.dataset.routeId) return false;
    articleViewSent = track("article_view", articleContext(document.body));
    return articleViewSent;
  };
  const seenCtas = new WeakSet();
  const observeArticleCtas = () => {
    const nodes = [...document.querySelectorAll("[data-article-product-cta]")];
    if (!nodes.length || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seenCtas.has(entry.target)) continue;
        if (track("cta_impression", articleContext(entry.target))) {
          seenCtas.add(entry.target);
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.35 });
    nodes.forEach((node) => observer.observe(node));
  };
  const leadStartSent = new Set();
  const trackAttributedLead = (eventName, placement) => {
    const attribution = readArticleAttribution();
    if (!attribution) return false;
    const values = { ...attribution, placement: clean(placement) || attribution.placement || "product_page" };
    if (eventName === "lead_start") {
      const key = `${values.route_id}:${values.product_id}:${values.cta_variant}`;
      if (leadStartSent.has(key)) return false;
      if (track(eventName, values)) leadStartSent.add(key);
      return leadStartSent.has(key);
    }
    return track(eventName, values);
  };

  document.addEventListener("click", (event) => {
    const node = event.target.closest?.("a,button,[role='button']");
    if (!node) return;
    if (node.matches("[data-related-route-id]")) {
      track("related_article_click", articleContext(node));
    }
    if (node.matches("[data-product-id]:not([data-related-route-id])")) {
      const attribution = saveArticleAttribution(node);
      if (attribution) track("product_click", attribution);
    } else if (readArticleAttribution() && node.matches(".button,.btn,.fs-button,[class*='cta'],[data-analytics-program],[data-gc-payment-target],[data-off-switch-checkout]")) {
      trackAttributedLead("lead_start", locationFor(node));
    }
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
  document.addEventListener("eh:lead-success", () => trackAttributedLead("lead_submit", "lead_success"));
  document.addEventListener("submit", () => trackAttributedLead("lead_submit", "form_submit"), { capture: true });
  document.addEventListener("eh:test-start", (event) => track("test_start", { ...(event.detail || {}), entry_page: pagePath() }));
  document.addEventListener("eh:test-complete", (event) => track("test_complete", event.detail || {}));

  const renderBanner = () => {
    const panel = document.createElement("section");
    panel.className = "eh-consent";
    panel.hidden = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Настройки cookies");
    panel.innerHTML = '<div class="eh-consent__copy"><strong>Чтобы нужное находилось быстрее</strong><p>Google Analytics покажет, где на сайте сложно найти статью или следующий шаг. По этим данным мы упрощаем навигацию — без рекламного отслеживания. <a href="/privacy-policy/">Подробнее</a>.</p></div><div class="eh-consent__actions"><button type="button" class="eh-consent__button eh-consent__button--primary" data-eh-consent="analytics_granted">Разрешить</button><button type="button" class="eh-consent__button eh-consent__button--secondary" data-eh-consent="essential_only">Google без cookies</button><button type="button" class="eh-consent__close" data-eh-consent-close aria-label="Закрыть настройки cookies">×</button></div>';
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
  window.ehAnalytics = Object.freeze({
    track,
    setConsent,
    getConsent: consent,
    getFirstTouch,
    loadGoogleTag,
    loadYandexMetrika,
    ga4Id: GA4_ID,
    metrikaId: METRIKA_ID,
    consentPayload,
  });
  const initialisePageAnalytics = () => {
    renderBanner();
    trackArticleView();
    observeArticleCtas();
  };
  document.addEventListener("eh:consent-change", () => {
    trackArticleView();
    observeArticleCtas();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialisePageAnalytics, { once: true });
  else initialisePageAnalytics();
})();
