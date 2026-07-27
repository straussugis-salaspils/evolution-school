(() => {
  const localStrip = document.querySelector(
    ".eh-local-strip .eh-shell-container",
  );
  const currentLocalLink = localStrip?.querySelector("[aria-current]");

  if (
    localStrip &&
    currentLocalLink &&
    window.matchMedia("(max-width: 980px)").matches
  ) {
    requestAnimationFrame(() => {
      localStrip.scrollTo({
        left: Math.max(0, currentLocalLink.offsetLeft - 10),
        behavior: "instant",
      });
    });
  }

  const tocLinks = [
    ...document.querySelectorAll('.article-toc a[href^="#section-"]'),
  ];
  const tocSections = tocLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      return id ? { link, section: document.getElementById(id) } : null;
    })
    .filter((item) => item?.section);

  if (tocSections.length) {
    let updateQueued = false;

    const updateCurrentSection = () => {
      const readingLine = Math.min(240, window.innerHeight * 0.3);
      let current = tocSections[0];

      tocSections.forEach((item) => {
        if (item.section.getBoundingClientRect().top <= readingLine) {
          current = item;
        }
      });

      tocSections.forEach((item) => {
        if (item === current) {
          item.link.setAttribute("aria-current", "location");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });
      updateQueued = false;
    };

    const queueCurrentSectionUpdate = () => {
      if (updateQueued) return;
      updateQueued = true;
      requestAnimationFrame(updateCurrentSection);
    };

    window.addEventListener("scroll", queueCurrentSectionUpdate, {
      passive: true,
    });
    window.addEventListener("resize", queueCurrentSectionUpdate);
    window.addEventListener("hashchange", queueCurrentSectionUpdate);
    updateCurrentSection();
  }

  const destinations = {
    test: {
      href: "/test-arhetipov/",
      label: "Рассчитать код архетипов",
      note: "Подойдёт, если точное время рождения известно и код ещё не рассчитан.",
    },
    reading: {
      href: "/arhetipy/#temy",
      label: "Выбрать материал по своей теме",
      note: "Подойдёт, если код уже есть или точное время рождения неизвестно.",
    },
  };

  document.querySelectorAll("[data-archetype-route]").forEach((component) => {
    const result = component.querySelector("[data-route-result]");
    const link = component.querySelector("[data-route-link]");
    const note = component.querySelector("[data-route-note]");
    component.querySelectorAll("[data-route-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const destination = destinations[button.dataset.routeChoice];
        if (!destination || !result || !link || !note) return;
        component
          .querySelectorAll("[data-route-choice]")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
        link.href = destination.href;
        link.textContent = destination.label;
        note.textContent = destination.note;
        result.hidden = false;
        link.focus();
      });
    });
  });
})();
