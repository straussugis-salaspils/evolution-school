const familyForType = (type) =>
  type === "decision-map" || type === "route"
    ? "map"
    : type === "warning-poster"
      ? "warning"
      : type;

const toneForInsert = (id, type) => {
  if (id === "18-red-flags") return "default";
  if (type === "warning-poster") return "warning";
  if (type === "spectrum") return "dark";
  if (
    id === "09-medical-boundary" ||
    id === "12-professional-boundaries"
  ) {
    return "medical";
  }
  if (type === "route" || type === "decision-map") return "route";
  return "default";
};

const fragment = (id, type, afterTitle, source, description, provenance) => ({
  id,
  type,
  family: familyForType(type),
  tone: toneForInsert(id, type),
  afterTitle,
  source,
  description,
  provenance,
});

const editorial = (
  id,
  afterTitle,
  assetBase,
  alt,
  caption,
  description,
  provenance,
) => ({
  id,
  type: "editorial",
  family: "editorial",
  tone: "default",
  afterTitle,
  assetBase,
  alt,
  caption,
  description,
  provenance,
});

const visual = (number, alt, inserts) => ({
  number,
  basePath: `/assets/reiki-articles/${String(number).padStart(2, "0")}`,
  alt,
  ogAlt: alt,
  inserts,
});

const notesA = "/assets/reiki-articles/inserts/package-a-notes.md";
const notesB = "/assets/reiki-articles/inserts/package-b-notes.md";
const notesC = "/assets/reiki-articles/inserts/package-c-notes.md";

export const reikiVisuals = [
  visual(
    1,
    "Женщина делает короткую практику Рейки дома между обычными делами",
    [
      editorial(
        "01-three-relationships",
        "Сеанс, обучение и инициация",
        "/assets/reiki-articles/inserts/01/editorial",
        "Одна река связывает три ситуации: получить поддержку, учиться навигации с Мастером и самостоятельно продолжать путь",
        "Сеанс, обучение и самостоятельная практика — три разных отношения к одному методу.",
        "Редакционная метафора показывает переход от получаемой поддержки к собственной практике без телесных Reiki-поз.",
        "/assets/reiki-articles/inserts/01/provenance.md",
      ),
    ],
  ),
  visual(
    2,
    "Участница онлайн-инициации сидит перед ноутбуком, поставив ноги на пол",
    [
      fragment(
        "02-initiation-sequence",
        "sequence",
        "Как проходит сама инициация",
        "/assets/reiki-articles/inserts/02/initiation-sequence.html",
        "Подготовка спокойного места, онлайн-встреча с Мастером и начало собственной практики.",
        notesA,
      ),
    ],
  ),
  visual(
    3,
    "Женщина самостоятельно выполняет практику Рейки дома после обучения",
    [
      fragment(
        "03-skill-vs-promises",
        "comparison",
        "Чего первая ступень не обещает",
        "/assets/reiki-articles/inserts/03/skill-vs-promises.html",
        "Сравнение навыка, который получает человек, и результатов, которых первая ступень не обещает.",
        notesA,
      ),
    ],
  ),
  visual(
    4,
    "Спокойная ежедневная практика Рейки встроена в привычный ритм жизни",
    [
      fragment(
        "04-pause-line",
        "route",
        "А если я пропустил день",
        "/assets/reiki-articles/inserts/04/pause-line.html",
        "Непрерывная линия двадцати одного дня с одной паузой, после которой путь продолжается.",
        "/assets/reiki-articles/inserts/04/notes.md",
      ),
    ],
  ),
  visual(
    5,
    "Человек спокойно сравнивает возможности первой и второй ступени Рейки",
    [
      fragment(
        "05-reiki-i-vs-ii",
        "comparison",
        "Разница коротко",
        "/assets/reiki-articles/inserts/05/reiki-i-vs-ii.html",
        "Две полноценные возможности: самостоятельная практика Рейки I и дополнительные способы Рейки II.",
        notesA,
      ),
    ],
  ),
  visual(
    6,
    "Участница сравнивает самостоятельное чтение и живой разговор с Мастером по видеосвязи",
    [
      fragment(
        "06-information-vs-transmission",
        "comparison",
        "Информация и передача — разные вещи",
        "/assets/reiki-articles/inserts/06/information-vs-transmission.html",
        "Односторонний поток информации сопоставлен с живым циклом вопросов, наблюдения, коррекции и проверки.",
        notesA,
      ),
    ],
  ),
  visual(
    7,
    "Короткий самосеанс Рейки во время обычной домашней паузы",
    [
      fragment(
        "07-everyday-practice",
        "editorial",
        "Как встроить практику в обычный день",
        "/assets/reiki-articles/inserts/07/everyday-practice.html",
        "Обычный день с несколькими возможными, но не обязательными местами для короткой практики.",
        notesA,
      ),
    ],
  ),
  visual(
    8,
    "Люди спокойно наблюдают за разными ощущениями во время практики Рейки",
    [
      fragment(
        "08-sensation-spectrum",
        "spectrum",
        "Ощущение и объяснение — не одно и то же",
        "/assets/reiki-articles/inserts/08/sensation-spectrum.html",
        "Неиерархическое созвездие заметных ощущений, почти полного отсутствия ощущений и дискомфорта, требующего внимания.",
        notesA,
      ),
    ],
  ),
  visual(
    9,
    "Практик обсуждает согласие и границы перед сеансом Рейки",
    [
      fragment(
        "09-medical-boundary",
        "comparison",
        "Рядом с лечением — не вместо лечения",
        "/assets/reiki-articles/inserts/09/medical-boundary.html",
        "Медицинская помощь остаётся основной линией, а Рейки может находиться рядом только как дополнительная практика.",
        "/assets/reiki-articles/inserts/09/notes.md",
      ),
      fragment(
        "09-worsening-action-map",
        "decision-map",
        "Если после Рейки стало хуже",
        "/assets/reiki-articles/inserts/09/worsening-action-map.html",
        "Последовательность безопасных действий при ухудшении состояния после практики.",
        notesB,
      ),
    ],
  ),
  visual(
    10,
    "Будущая ученица задаёт Мастеру вопросы о программе во время видеовстречи",
    [
      fragment(
        "10-thirteen-questions",
        "decision-map",
        "Тринадцать вопросов перед обучением",
        "/assets/reiki-articles/inserts/10/thirteen-questions-navigator.html",
        "Навигатор вопросов о программе, квалификации, поддержке, согласии и полной стоимости.",
        notesB,
      ),
      fragment(
        "10-red-flags",
        "warning-poster",
        "Красные флаги",
        "/assets/reiki-articles/inserts/10/red-flags-poster.html",
        "Плакат с опасными обещаниями и поведением Мастера, которые стоит заметить до оплаты.",
        notesB,
      ),
    ],
  ),
  visual(
    11,
    "Человек возвращается к простой практике Рейки среди обычных домашних помех",
    [
      fragment(
        "11-seven-traps-map",
        "route",
        "Если вы узнали себя сразу в нескольких пунктах",
        "/assets/reiki-articles/inserts/11/seven-traps-map.html",
        "Карта семи ловушек начинающего и одной линии возвращения к простой изученной практике.",
        notesA,
      ),
    ],
  ),
  visual(
    12,
    "Мастер-Учитель слушает вопрос участницы небольшой онлайн-группы",
    [
      fragment(
        "12-responsibility-timeline",
        "sequence",
        "До, во время и после",
        "/assets/reiki-articles/inserts/12/master-responsibility-timeline.html",
        "Временная линия ответственности Мастера-Учителя до, во время и после обучения.",
        notesB,
      ),
      fragment(
        "12-professional-boundaries",
        "decision-map",
        "Уметь сказать: «Это не ко мне»",
        "/assets/reiki-articles/inserts/12/professional-boundaries-map.html",
        "Карта профессиональных границ между компетенцией Мастера, врачом, психологической и экстренной помощью.",
        notesB,
      ),
    ],
  ),
  visual(
    13,
    "Человек рассматривает несколько равноправных путей после второй ступени Рейки",
    [
      fragment(
        "13-three-routes",
        "route",
        "Как устроен путь дальше",
        "/assets/reiki-articles/inserts/13/three-routes.html",
        "Три равноправных маршрута после Рейки II без лестницы и обязательного продвижения.",
        "/assets/reiki-articles/inserts/13/notes.md",
      ),
      fragment(
        "13-decision-compass",
        "decision-map",
        "Как понять, что пора обсуждать следующий шаг",
        "/assets/reiki-articles/inserts/13/decision-compass.html",
        "Компас вопросов помогает назвать текущую задачу, но не выдаёт автоматический ответ.",
        "/assets/reiki-articles/inserts/13/notes.md",
      ),
    ],
  ),
  visual(
    14,
    "Участница сравнивает три программы мастерской ступени Рейки",
    [
      fragment(
        "14-third-degree-models",
        "comparison",
        "Три модели мастерской ступени, которые важно различать",
        "/assets/reiki-articles/inserts/14/third-degree-models.html",
        "Три разных значения одинакового номера третьей ступени.",
        "/assets/reiki-articles/inserts/14/notes.md",
      ),
      fragment(
        "14-evolution-house-route",
        "route",
        "Как устроена третья ступень в Evolution House",
        "/assets/reiki-articles/inserts/14/evolution-house-route.html",
        "Горизонтальная карта линии Evolution House без пьедесталов и искусственной иерархии.",
        notesC,
      ),
    ],
  ),
  visual(
    15,
    "Участница обсуждает продолжение обучения с новым Мастером, сохраняя материалы прежней школы",
    [
      fragment(
        "15-learning-history",
        "editorial",
        "Что подготовить к первому разговору",
        "/assets/reiki-articles/inserts/15/learning-history-collage.html",
        "Редакционный коллаж истории обучения: программа, сертификат, практика, вопросы и хронология.",
        notesC,
      ),
      fragment(
        "15-possible-decisions",
        "decision-map",
        "Какие решения могут появиться после разговора",
        "/assets/reiki-articles/inserts/15/possible-decisions.html",
        "Равноправные ветви возможных решений после разговора с новым Мастером.",
        notesC,
      ),
    ],
  ),
  visual(
    16,
    "Мастер и ученица спокойно обсуждают опыт и готовность к следующей ступени Рейки",
    [
      fragment(
        "16-readiness-constellation",
        "spectrum",
        "На что я смотрю перед Подмастерьем",
        "/assets/reiki-articles/inserts/16/readiness-constellation.html",
        "Шесть ориентиров вокруг разговора с Мастером; пауза показана как допустимая часть маршрута, а не отказ.",
        notesC,
      ),
      fragment(
        "16-pause-is-part-of-route",
        "route",
        "Что делать, если вы пока не уверены",
        "/assets/reiki-articles/inserts/16/pause-is-part-of-route.html",
        "Маршрут с отдельной остановкой показывает, что пауза меняет темп, но не превращается в отказ и не закрывает возвращение к разговору.",
        notesC,
      ),
    ],
  ),
  visual(
    17,
    "Мастерство Рейки проявляется в обычной жизни человека без преподавания группе",
    [
      fragment(
        "17-master-vs-teacher",
        "comparison",
        "Почему слово «Мастер» часто путают со словом «Учитель»",
        "/assets/reiki-articles/inserts/17/master-vs-teacher.html",
        "Ненумерованная развилка равных ролей: личное мастерство и дополнительная подготовка к преподаванию.",
        notesC,
      ),
    ],
  ),
  visual(
    18,
    "Участница и новый Мастер разбирают прежние материалы и причины возможной переинициации",
    [
      fragment(
        "18-four-situations",
        "decision-map",
        "Четыре ситуации, которые важно не смешивать",
        "/assets/reiki-articles/inserts/18/four-situations-matrix.html",
        "Матрица четырёх разных задач, для которых переинициация не является обязательным общим финалом.",
        "/assets/reiki-articles/inserts/18/notes.md",
      ),
      fragment(
        "18-red-flags",
        "warning-poster",
        "Какие обещания должны насторожить",
        "/assets/reiki-articles/inserts/18/red-flags-poster.html",
        "Плакат красных флагов без образа сломанного канала и без давления на человека.",
        notesC,
      ),
    ],
  ),
];

export function getReikiVisual(number) {
  const item = reikiVisuals.find((entry) => entry.number === number);
  if (!item) throw new Error(`Missing Reiki visual config for article ${number}.`);
  return item;
}

export function getReikiInsertCount() {
  return reikiVisuals.reduce(
    (total, article) => total + article.inserts.length,
    0,
  );
}
