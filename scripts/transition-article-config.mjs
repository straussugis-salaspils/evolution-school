export const transitionVisuals = [
  {
    number: 1,
    source: "/assets/method-evolution-series/03-transition-map.png",
    position: "50% 50%",
    alt: "Карта жизненного перехода с несколькими возможными направлениями движения",
  },
  {
    number: 2,
    source: "/assets/method-evolution-series/02-transition-room.png",
    position: "50% 50%",
    alt: "Комната перехода между завершившимся этапом и ещё не собранным следующим",
  },
  {
    number: 3,
    source: "/assets/method-evolution-series/06-awareness-to-talent.png",
    position: "50% 50%",
    alt: "Развилка выбора, где решение проверяется через факты и небольшой обратимый шаг",
  },
  {
    number: 4,
    source: "/assets/method-evolution-series/01-life-reassembly-hero.png",
    position: "50% 50%",
    alt: "Пересборка жизненной системы после завершения прежнего этапа",
  },
  {
    number: 5,
    source: "/assets/method-evolution-series/05-four-spheres-house.png",
    position: "50% 50%",
    alt: "Сферы жизни, в которых человек возвращает себе авторство и собственный выбор",
  },
  {
    number: 6,
    source: "/assets/method-evolution-series/04-eight-levels-tower.png",
    position: "50% 48%",
    alt: "Опыт разных этапов жизни, собранный в новое направление после сорока лет",
  },
  {
    number: 7,
    source: "/assets/method-evolution-series/07-integration-daily-life.png",
    position: "50% 50%",
    alt: "Обычная повседневная жизнь, в которой важно различить усталость, переход и необходимость помощи",
  },
  {
    number: 8,
    source: "/assets/method-evolution-series/08-final-assembled-system.png",
    position: "50% 50%",
    alt: "Мост между прежней жизнью и новым этапом, который можно проверить без резкого шага",
  },
  {
    number: 9,
    source: "/assets/svetlana-path-transition.jpg",
    position: "50% 38%",
    alt: "Женщина в начале нового жизненного этапа после завершения отношений",
  },
  {
    number: 10,
    source: "/assets/method-evolution-series/09-author-method.png",
    position: "50% 45%",
    alt: "Свободное пространство жизни после того, как дети выросли и прежний режим семьи изменился",
  },
  {
    number: 11,
    source: "/assets/method-evolution-series/10-final-assembled-system.png",
    position: "50% 50%",
    alt: "Завершённая цель и несколько равноправных направлений следующего этапа",
  },
  {
    number: 12,
    source: "/assets/personal-route-method-levels-map.png",
    position: "50% 50%",
    alt: "Карта перехода от понимания к одному конкретному действию в реальной жизни",
  },
];

export function getTransitionVisual(number) {
  const visual = transitionVisuals.find((item) => item.number === number);
  if (!visual) throw new Error(`Missing transition visual for article ${number}.`);
  const slug = String(number).padStart(2, "0");
  return {
    ...visual,
    basePath: `/assets/transition-articles/${slug}`,
  };
}
