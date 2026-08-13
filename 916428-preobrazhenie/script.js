(function () {
  "use strict";

  // Supported modes: a direct HTTPS URL or a GetCourse widget script.
  const PAYMENT_CONFIG = Object.freeze({
    reserve12200: Object.freeze({
      amount: "12 200 ₽",
      directUrl: "",
      widgetScriptId: "a3074d7ab071154456c99b32d5b6a7fbea144525",
      widgetUrl: "https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1642546",
    }),
    choose18800: Object.freeze({
      amount: "18 800 ₽",
      directUrl: "",
      widgetScriptId: "766c10570d7ee0cbbd80e85b9692d87641b68761",
      widgetUrl: "https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1642555",
    }),
  });

  const dialog = document.getElementById("transformation-payment");
  const content = dialog?.querySelector("[data-payment-content]");
  const meta = dialog?.querySelector("[data-payment-meta]");
  const closeButton = dialog?.querySelector(".payment-dialog__close");
  const triggers = Array.from(document.querySelectorAll("[data-payment-choice]"));
  const closeControls = Array.from(document.querySelectorAll("[data-payment-close]"));
  let returnFocus = null;
  let activeWidgetScript = null;

  const paymentIsConfigured = (config) =>
    Boolean(config && (config.directUrl || (config.widgetScriptId && config.widgetUrl)));

  const clearActiveWidget = () => {
    if (activeWidgetScript) {
      activeWidgetScript.remove();
      activeWidgetScript = null;
    }
  };

  const showUnavailableState = (config) => {
    content.replaceChildren();
    const message = document.createElement("p");
    message.className = "payment-dialog__notice";
    message.setAttribute("role", "status");
    message.textContent =
      "Форма оплаты для выбранной суммы подготовлена к подключению перед публикацией.";
    content.append(message);
    meta.textContent = `19 августа 2026 · Москва · ${config.amount}`;
  };

  const loadWidget = (config) => {
    clearActiveWidget();
    content.replaceChildren();
    meta.textContent = `19 августа 2026 · Москва · ${config.amount}`;

    const loading = document.createElement("p");
    loading.className = "payment-dialog__notice";
    loading.setAttribute("role", "status");
    loading.textContent = "Форма оплаты загружается…";
    content.append(loading);

    const script = document.createElement("script");
    script.id = config.widgetScriptId;
    script.src = config.widgetUrl;
    script.async = true;
    script.addEventListener("load", () => {
      loading.remove();
      document.dispatchEvent(new Event(`StartWidget${config.widgetScriptId}`));
    });
    script.addEventListener("error", () => {
      loading.textContent =
        "Форма оплаты не загрузилась. Пожалуйста, обновите страницу и попробуйте ещё раз.";
    });
    content.append(script);
    activeWidgetScript = script;
  };

  const getFocusableElements = () =>
    Array.from(
      dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);

  const closeDialog = () => {
    if (!dialog || dialog.hidden) return;
    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("payment-dialog-open");
    clearActiveWidget();

    window.setTimeout(() => {
      dialog.hidden = true;
      returnFocus?.focus();
      returnFocus = null;
    }, 180);
  };

  const openDialog = (choice, trigger) => {
    const config = PAYMENT_CONFIG[choice];
    if (!dialog || !content || !meta || !config) return;

    returnFocus = trigger;

    if (config.directUrl) {
      window.location.assign(config.directUrl);
      return;
    }

    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("payment-dialog-open");

    if (paymentIsConfigured(config)) {
      loadWidget(config);
    } else {
      showUnavailableState(config);
    }

    window.requestAnimationFrame(() => {
      dialog.classList.add("is-open");
      closeButton?.focus();
    });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openDialog(trigger.dataset.paymentChoice, trigger);
    });
  });

  closeControls.forEach((control) => control.addEventListener("click", closeDialog));

  document.addEventListener("keydown", (event) => {
    if (!dialog || dialog.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    revealItems.forEach((item) => observer.observe(item));
  }
})();
