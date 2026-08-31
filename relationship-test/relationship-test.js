const variants = {
  a: {
    testId: "test_a_no_relationship",
    title: "Мужчины меняются. До отношений снова не доходит.",
    titleHtml: "Мужчины меняются.<br>До отношений снова не доходит.",
    lead: "За 3 минуты узнайте, где всё останавливается и какой сценарий повторяется в ваших знакомствах.",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=no_relationship_landing_a"
  },
  b: {
    testId: "test_b_relationship_challenges",
    title: "В отношениях всё нормально. Почему мне в них плохо?",
    titleHtml: "В отношениях всё нормально.<br>Почему мне в них плохо?",
    lead: "За 3 минуты узнайте, что происходит между вами и какой сценарий создаёт дистанцию.",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=relationship_challenges_landing_b"
  }
};

function selectedVariant() {
  const requested = new URLSearchParams(window.location.search).get("test");
  const relationshipChallengesPath = window.location.pathname.includes("/relationship-challenges/");
  return requested === "b" || relationshipChallengesPath ? variants.b : variants.a;
}

function applyVariant() {
  const variant = selectedVariant();
  const variantId = variant === variants.b ? "b" : "a";
  const title = document.getElementById("hero-title");
  const lead = document.getElementById("hero-lead");
  const links = [
    document.getElementById("telegram-cta")
  ];

  title.innerHTML = variant.titleHtml;
  lead.textContent = variant.lead;
  document.body.dataset.variant = variantId;
  document.title = `${variant.title} — тест Evolution House`;
  links.forEach((link) => {
    link.href = variant.telegramUrl;
  });
  const attribution = prepareAttribution(variant, links);
  links.forEach((link) => {
    link.addEventListener("click", () => {
      const token = link.dataset.attributionToken;
      if (token) recordLandingCtaClick(variant, token);
    });
  });
  void attribution;
}

function metaAttributionPayload(variant) {
  const params = new URLSearchParams(window.location.search);
  return {
    test_id: variant.testId,
    page_url: window.location.href,
    fbclid: params.get("fbclid"),
    fbc: params.get("fbc"),
    utm_source: params.get("utm_source"),
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
    landing_session_id: landingSessionId(variant.testId),
    referrer_host: referrerHost()
  };
}

function landingSessionId(testId) {
  const key = `eh_relationship_landing:${testId}`;
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

applyVariant();
