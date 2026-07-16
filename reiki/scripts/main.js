(function () {
  const config = window.siteConfig || {};
  const devMessage = document.querySelector("[data-dev-message]");
  let toastTimer = null;

  function showPreviewMessage() {
    if (!devMessage) return;
    devMessage.textContent = config.previewMode
      ? "Ссылка будет подключена перед запуском."
      : "Ссылка пока не подключена.";
    devMessage.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      devMessage.classList.remove("is-visible");
    }, 3600);
  }

  function resolveUrlKey(action) {
    if (!action) return "";
    if (config.ctaAliases && config.ctaAliases[action]) return config.ctaAliases[action];
    return action;
  }

  function bindCta(button, urlKey) {
    const url = config[urlKey];
    if (url) {
      button.setAttribute("href", url);
    }

    button.addEventListener("click", (event) => {
      if (!config[urlKey]) {
        event.preventDefault();
        showPreviewMessage();
      }
    });
  }

  let lastPaymentTrigger = null;

  function loadGetCourseWidget(modal) {
    const frame = modal.querySelector("[data-gc-widget-url]");
    if (!frame || frame.dataset.gcWidgetLoaded === "true") return;
    frame.dataset.gcWidgetLoaded = "true";
    const script = document.createElement("script");
    script.id = frame.dataset.gcWidgetScriptId;
    script.src = frame.dataset.gcWidgetUrl;
    script.addEventListener("load", () => {
      document.dispatchEvent(new Event(`StartWidget${script.id}`));
    });
    frame.appendChild(script);
  }

  function openGetCoursePaymentModal(modal, trigger) {
    lastPaymentTrigger = trigger || null;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("gc-payment-modal-is-open");
    loadGetCourseWidget(modal);
    const closeButton = modal.querySelector("[data-gc-payment-close]");
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeGetCoursePaymentModal(modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gc-payment-modal-is-open");
    if (lastPaymentTrigger) lastPaymentTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll("[data-gc-payment-target]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const modal = document.getElementById(button.dataset.gcPaymentTarget);
      if (!modal) return;
      event.preventDefault();
      openGetCoursePaymentModal(modal, button);
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const closeControl = event.target.closest("[data-gc-payment-close]");
    if (!closeControl) return;
    const modal = closeControl.closest(".gc-payment-modal");
    if (modal) closeGetCoursePaymentModal(modal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openModal = document.querySelector(".gc-payment-modal:not([hidden])");
    if (openModal) closeGetCoursePaymentModal(openModal);
  });

  document.querySelectorAll("[data-cta]").forEach((button) => {
    if (button.dataset.gcPaymentTarget) return;
    bindCta(button, resolveUrlKey(button.dataset.cta));
  });

  document.querySelectorAll("[data-video-src]").forEach((frame) => {
    const playButton = frame.querySelector(".video-play");

    function loadVideo() {
      if (frame.classList.contains("is-loaded")) return;
      const iframe = document.createElement("iframe");
      iframe.src = frame.dataset.videoSrc;
      iframe.title = frame.dataset.videoTitle || "Видео";
      iframe.loading = "lazy";
      iframe.allow = "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share";
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      frame.classList.add("is-loaded");
      frame.querySelectorAll("button, a").forEach((control) => {
        control.setAttribute("tabindex", "-1");
        control.setAttribute("aria-hidden", "true");
      });
    }

    if (playButton) {
      playButton.addEventListener("click", loadVideo);
    }
  });

  document.querySelectorAll("[data-faq-button]").forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);

    function toggleFaq() {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      if (panel) {
        panel.classList.toggle("is-open", !isOpen);
        panel.hidden = isOpen;
      }
    }

    button.addEventListener("click", toggleFaq);
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleFaq();
    });
  });

  const testimonialsSection = document.querySelector("[data-testimonials]");
  const testimonialsList = document.querySelector("[data-testimonials-list]");
  if (testimonialsSection && testimonialsList && Array.isArray(config.testimonials) && config.testimonials.length >= 3) {
    testimonialsList.innerHTML = config.testimonials.map((item) => `
      <article class="testimonial-card">
        <blockquote>${item.text || ""}</blockquote>
        <p>${item.author || ""}</p>
      </article>
    `).join("");
    testimonialsSection.hidden = false;
  }

  const pathNavigator = document.querySelector("[data-path-navigator]");
  const pageLevel = document.documentElement.dataset.level || "";
  const pathItems = config.pathNavigatorByLevel && Array.isArray(config.pathNavigatorByLevel[pageLevel])
    ? config.pathNavigatorByLevel[pageLevel]
    : config.pathNavigator;

  if (pathNavigator && Array.isArray(pathItems)) {
    pathNavigator.innerHTML = pathItems.map((item) => {
      const tagName = item.href ? "a" : "article";
      const href = item.href ? ` href="${item.href}"` : "";
      const ariaCurrent = item.status === "current" ? ' aria-current="step"' : "";

      return `
        <${tagName} class="path-step path-step--${item.status || "future"}"${href}${ariaCurrent}>
          <span class="path-step__marker">${item.number || ""}</span>
          <span class="path-step__body">
            <strong>${item.title || ""}</strong>
            ${item.subtitle ? `<span>${item.subtitle}</span>` : ""}
            ${item.description ? `<em>${item.description}</em>` : ""}
          </span>
        </${tagName}>
      `;
    }).join("");
  }

  const siteNav = document.querySelector("[data-site-nav]");
  const siteNavToggle = document.querySelector("[data-site-nav-toggle]");
  const siteNavPanel = document.querySelector("[data-site-nav-panel]");
  const siteNavList = document.querySelector("[data-site-nav-list]");

  function closeSiteNav() {
    if (!siteNav || !siteNavToggle || !siteNavPanel) return;
    siteNav.classList.remove("is-open");
    siteNavToggle.setAttribute("aria-expanded", "false");
    siteNavPanel.hidden = true;
  }

  if (siteNav && siteNavToggle && siteNavPanel && siteNavList && Array.isArray(pathItems)) {
    siteNavList.innerHTML = pathItems.map((item) => {
      const href = item.href || "#";
      const isCurrent = item.status === "current";
      const ariaCurrent = isCurrent ? ' aria-current="page"' : "";
      return `
        <a class="site-nav__item" href="${href}"${ariaCurrent}>
          <span class="site-nav__number">${item.number || ""}</span>
          <span class="site-nav__copy">
            <strong>${item.title || ""}</strong>
            <span>${item.subtitle || ""}</span>
          </span>
          ${isCurrent ? '<span class="site-nav__current">Вы здесь</span>' : ""}
        </a>
      `;
    }).join("");

    siteNavToggle.addEventListener("click", () => {
      const isOpen = siteNavToggle.getAttribute("aria-expanded") === "true";
      siteNav.classList.toggle("is-open", !isOpen);
      siteNavToggle.setAttribute("aria-expanded", String(!isOpen));
      siteNavPanel.hidden = isOpen;
    });

    siteNavPanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeSiteNav);
    });

    document.addEventListener("click", (event) => {
      if (!siteNav.contains(event.target)) closeSiteNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSiteNav();
    });
  }
})();
