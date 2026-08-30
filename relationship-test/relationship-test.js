const variants = {
  a: {
    testId: "test_a_no_relationship",
    title: "Почему отношения до сих пор не складываются?",
    lead: "Этот тест поможет увидеть свой повторяющийся сценарий в знакомствах — и понять, какой следующий шаг поддержит развитие отношений.",
    insightContext: "Как он проявляется в знакомстве и выборе мужчины",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=no_relationship_landing_a"
  },
  b: {
    testId: "test_b_relationship_challenges",
    title: "Почему меня не устраивают отношения, в которых я нахожусь?",
    lead: "Этот тест поможет увидеть повторяющийся сценарий внутри текущих отношений — и понять, какой следующий шаг поддержит близость и живой контакт в паре.",
    insightContext: "Как он влияет на близость и живой контакт в паре",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=relationship_challenges_landing_b"
  }
};

function selectedVariant() {
  const requested = new URLSearchParams(window.location.search).get("test");
  return requested === "b" ? variants.b : variants.a;
}

function applyVariant() {
  const variant = selectedVariant();
  const variantId = variant === variants.b ? "b" : "a";
  const title = document.getElementById("hero-title");
  const lead = document.getElementById("hero-lead");
  const insightContext = document.getElementById("insight-context");
  const links = [
    document.getElementById("telegram-cta")
  ];

  title.textContent = variant.title;
  lead.textContent = variant.lead;
  insightContext.textContent = variant.insightContext;
  document.body.dataset.variant = variantId;
  document.title = `${variant.title} — тест Evolution House`;
  links.forEach((link) => {
    link.href = variant.telegramUrl;
  });
  const attribution = prepareAttribution(variant, links);
  links.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const result = await Promise.race([
        attribution,
        new Promise((resolve) => window.setTimeout(() => resolve(null), 1500))
      ]);
      if (result?.token) {
        await Promise.race([
          recordLandingCtaClick(variant, result.token),
          new Promise((resolve) => window.setTimeout(resolve, 600))
        ]);
      }
      window.location.assign(link.href);
    });
  });
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
    referrer_host: referrerHost()
  };
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
    });
    return result;
  } catch (error) {
    console.warn("Landing attribution unavailable; using the standard Telegram link.", error);
    return null;
  }
}

async function recordLandingCtaClick(variant, token) {
  try {
    await fetch("/api/relationship-attribution-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_id: variant.testId, token }),
      keepalive: true
    });
  } catch {
    // The Telegram transition must remain available even when tracking is down.
  }
}

function prepareVideo() {
  const video = document.getElementById("welcome-video");
  const playButton = document.getElementById("video-play");

  playButton.addEventListener("click", async () => {
    video.dataset.playing = "true";
    playButton.hidden = true;
    try {
      await video.play();
    } catch {
      playButton.hidden = false;
    }
  });

  video.addEventListener("play", () => {
    video.dataset.playing = "true";
    playButton.hidden = true;
  });
}

applyVariant();
prepareVideo();
