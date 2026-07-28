(() => {
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

})();
