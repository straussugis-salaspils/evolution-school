const variants = {
  a: {
    title: "Почему отношения до сих пор не складываются?",
    lead: "Этот тест поможет увидеть свой повторяющийся сценарий в знакомствах — и понять, какой следующий шаг поддержит развитие отношений.",
    insightContext: "Как он проявляется в знакомстве и выборе мужчины",
    telegramUrl: "https://t.me/RelationshipScenarioBot?start=no_relationship_landing_a"
  },
  b: {
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
