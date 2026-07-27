(() => {
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
