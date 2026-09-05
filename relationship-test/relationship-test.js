const META_PIXEL_ID = "944041014863402";

const variants = {
  a: {
    testId: "test_a_no_relationship",
    title: "Знакомства начинаются. Но до отношений снова не доходит?",
    titleHtml: "Знакомства начинаются.<br>Но до отношений <span class=\"title-accent title-accent--a\">снова не доходит?</span>",
    lead: "Ответьте на 7 вопросов — и за 3 минуты поймёте, в какой момент всё останавливается и что можно изменить.",
    ctaLabel: "Начать тест и понять, что мешает",
    nextStepHtml: "В Telegram нажмите <strong>«Запустить» (Start)</strong> — и тест начнётся.",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=no_relationship_landing_a"
  },
  b: {
    testId: "test_b_relationship_challenges",
    landingId: "relationship_challenges",
    funnelVersion: "group_first_v1",
    title: "В отношениях всё нормально. Почему мне в них плохо?",
    titleHtml: "В отношениях всё нормально.<br>Почему мне в них <span class=\"title-accent\">плохо?</span>",
    lead: "Пройдите бесплатный тест из 7 вопросов и поймите, что именно создаёт дистанцию между вами и что можно изменить.",
    ctaLabel: "Перейти в Telegram и ПРОЙТИ ТЕСТ",
    nextStepHtml: "Откроется Telegram-канал <strong>«Архетипы в Отношениях»</strong>. Тест находится в закреплённом посте.",
    telegramUrl: "https://t.me/RelationshipArchetypes"
  },
  c: {
    testId: "test_b_relationship_challenges",
    landingId: "stay_or_leave",
    funnelVersion: "group_first_v1",
    eyebrowHtml: "Бесплатный тест об отношениях <span aria-hidden=\"true\">·</span> 7 вопросов",
    title: "Уйти или остаться в этих отношениях?",
    titleHtml: "Уйти или остаться<br><span class=\"title-accent\">в этих отношениях?</span>",
    lead: "Когда в отношениях всё чаще больно, холодно или одиноко, трудно понять: это кризис, который можно пройти, или связь уже исчерпана. Ответьте на 7 вопросов и увидьте ситуацию яснее.",
    ctaLabel: "Перейти в Telegram и ПРОЙТИ ТЕСТ",
    nextStepHtml: "Откроется Telegram-канал <strong>«Архетипы в Отношениях»</strong>. Тест находится в закреплённом посте.",
    telegramUrl: "https://t.me/RelationshipArchetypes"
  },
  d: {
    testId: "test_b_relationship_challenges",
    landingId: "youtube_tired_function",
    funnelVersion: "group_first_v1",
    eyebrowHtml: "Бесплатный тест <span aria-hidden=\"true\">·</span> 7 вопросов <span aria-hidden=\"true\">·</span> 3 минуты",
    title: "Рядом с мужем чувствуете себя уставшей функцией?",
    titleHtml: "Рядом с мужем чувствуете себя <span class=\"title-accent\">уставшей функцией?</span>",
    lead: "Тест поможет понять, что истощает вас в отношениях и мешает чувствовать близость.",
    author: "Светлана Страус · 26 лет в отношениях",
    ctaLabel: "Перейти в Telegram и ПРОЙТИ ТЕСТ",
    nextStepHtml: "Откроется Telegram-канал <strong>«Архетипы в Отношениях»</strong>. Тест находится в закреплённом посте.",
    telegramUrl: "https://t.me/RelationshipArchetypes"
  }
};

function initializeMetaPixel() {
  if (typeof window.fbq === "function") return;
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  window.fbq = fbq;
  window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.append(script);

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

function selectedVariant() {
  const requested = new URLSearchParams(window.location.search).get("test");
  const relationshipChallengesPath = window.location.pathname.includes("/relationship-challenges/");
  const stayOrLeavePath = window.location.pathname.includes("/stay-or-leave/");
  const tiredFunctionPath = window.location.pathname.includes("/tired-function/");
  if (requested === "d" || tiredFunctionPath) return variants.d;
  if (requested === "c" || stayOrLeavePath) return variants.c;
  return requested === "b" || relationshipChallengesPath ? variants.b : variants.a;
}

function applyVariant() {
  const variant = selectedVariant();
  const variantId = variant === variants.d ? "d" : variant === variants.c ? "c" : variant === variants.b ? "b" : "a";
  const title = document.getElementById("hero-title");
  const eyebrow = document.getElementById("hero-eyebrow");
  const lead = document.getElementById("hero-lead");
  const author = document.getElementById("hero-author");
  const ctaLabel = document.getElementById("telegram-cta-label");
  const nextStep = document.getElementById("telegram-next-step");
  const links = [
    document.getElementById("telegram-cta")
  ];

  title.innerHTML = variant.titleHtml;
  if (variant.eyebrowHtml && eyebrow) eyebrow.innerHTML = variant.eyebrowHtml;
  if (variant.leadHtml) lead.innerHTML = variant.leadHtml;
  else lead.textContent = variant.lead;
  if (author) {
    author.textContent = variant.author || "";
    author.hidden = !variant.author;
  }
  ctaLabel.textContent = variant.ctaLabel;
  nextStep.innerHTML = variant.nextStepHtml;
  document.body.dataset.variant = variantId;
  document.title = `${variant.title} — тест Evolution House`;
  links.forEach((link) => {
    link.href = variant.telegramUrl;
  });
  const groupFirst = variant.funnelVersion === "group_first_v1";
  const attribution = prepareAttribution(variant, links);
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (groupFirst) {
        trackMetaGroupJoinClick(variant);
      }
      const token = link.dataset.attributionToken;
      ctaLabel.textContent = "Открываем Telegram…";
      if (token) {
        recordLandingCtaClick(variant, token);
        navigateWithGoogleConversion(link.href);
        return;
      }
      if (groupFirst) {
        void Promise.race([
          attribution,
          new Promise((resolve) => window.setTimeout(() => resolve(null), 800))
        ]).then((result) => {
          if (result?.token) recordLandingCtaClick(variant, result.token);
          navigateWithGoogleConversion(result?.telegram_url || link.href);
        });
        return;
      }
      navigateWithGoogleConversion(link.href);
    });
  });
}

function navigateWithGoogleConversion(url) {
  if (typeof window.gtag_report_conversion === "function") {
    window.gtag_report_conversion(url);
    return;
  }
  window.location.assign(url);
}

function trackMetaGroupJoinClick(variant) {
  if (typeof window.fbq !== "function") return false;
  const sessionId = landingSessionId(variant.testId, variant.landingId);
  const eventId = `group_join_click_${variant.landingId}_${sessionId || Date.now()}`;
  window.fbq(
    "track",
    "CompleteRegistration",
    {
      content_name: "Telegram channel join click",
      content_category: "relationship_test",
      landing_id: variant.landingId,
      funnel_version: variant.funnelVersion,
      status: true
    },
    { eventID: eventId }
  );
  return true;
}

function metaAttributionPayload(variant) {
  const params = new URLSearchParams(window.location.search);
  const defaultSource = params.has("gclid") || params.has("wbraid") || params.has("gbraid") ? "google" : null;
  return {
    test_id: variant.testId,
    page_url: window.location.href,
    fbclid: params.get("fbclid"),
    fbc: params.get("fbc"),
    utm_source: params.get("utm_source") || defaultSource,
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    campaign_id: params.get("campaign_id"),
    adset_id: params.get("adset_id"),
    ad_id: params.get("ad_id"),
    campaign_name: params.get("campaign_name"),
    adset_name: params.get("adset_name"),
    ad_name: params.get("ad_name"),
    placement: params.get("placement"),
    landing_session_id: landingSessionId(variant.testId, variant.landingId),
    landing_id: variant.landingId || "no_relationship",
    funnel_version: variant.funnelVersion || "bot_first_v1",
    referrer_host: referrerHost()
  };
}

function landingSessionId(testId, landingId) {
  const key = `eh_relationship_landing:${testId}:${landingId || "default"}`;
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const generated = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, generated);
    return generated;
  } catch {
    return null;
  }
}

function referrerHost() {
  try {
    return document.referrer ? new URL(document.referrer).hostname : null;
  } catch {
    return null;
  }
}

async function prepareAttribution(variant, links) {
  try {
    await pageVisible();
    const response = await fetch("/api/relationship-attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaAttributionPayload(variant))
    });
    if (!response.ok) {
      throw new Error(`Attribution request failed: ${response.status}`);
    }
    const result = await response.json();
    if (typeof result.telegram_url !== "string" || !result.telegram_url.startsWith("https://t.me/")) {
      throw new Error("Attribution response did not contain a Telegram URL");
    }
    links.forEach((link) => {
      link.href = result.telegram_url;
      link.dataset.attributionReady = "true";
      link.dataset.attributionToken = result.token;
    });
    return result;
  } catch (error) {
    console.warn("Landing attribution unavailable; using the standard Telegram link.", error);
    return null;
  }
}

function pageVisible() {
  if (document.visibilityState === "visible") return Promise.resolve();
  return new Promise((resolve) => {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") resolve();
    }, { once: true });
  });
}

function recordLandingCtaClick(variant, token) {
  void fetch("/api/relationship-attribution-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test_id: variant.testId, token }),
    keepalive: true
  }).catch(() => {});
}

initializeMetaPixel();
applyVariant();
