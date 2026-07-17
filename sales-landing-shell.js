(() => {
  const disableReikiMapLinks = () => {
    document.querySelectorAll("[data-path-navigator] a, .path-navigator a").forEach((link) => {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.classList.add("eh-landing-static-link");
    });
  };

  disableReikiMapLinks();
  document.addEventListener("DOMContentLoaded", disableReikiMapLinks);
  new MutationObserver(disableReikiMapLinks).observe(document.documentElement, { childList: true, subtree: true });

  const fallbackCopy = (text) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-link]");
    if (!button) return;
    const url = button.dataset.copyLink;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else fallbackCopy(url);
      button.textContent = "Скопировано";
      window.setTimeout(() => { button.textContent = "Копировать ссылку"; }, 1800);
    } catch {
      fallbackCopy(url);
      button.textContent = "Скопировано";
      window.setTimeout(() => { button.textContent = "Копировать ссылку"; }, 1800);
    }
  });
})();
