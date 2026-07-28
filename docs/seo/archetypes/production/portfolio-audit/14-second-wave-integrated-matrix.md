# Вторая волна: интегрированная матрица решений

Дата: 27 июля 2026.

Роль документа: независимый арбитраж между:

- `00-second-wave-horizontal-audit-system.md`;
- `11-corpus-logic-and-terminology.md`;
- `12-seo-publication-graph-red-team.md`;
- `13-reader-journey-and-evidence-red-team.md`;
- нормативными `00-real-test-contract.md` и
  `16-unified-routing-matrix.md`;
- текущим `portfolio-routes.json` и 26 Markdown-черновиками.

Этот документ не складывает замечания трёх аудиторов механически. Ниже
зафиксировано, какие предложения принимаются, какие отклоняются и какие
обязательны, но относятся не к текстовому корпусу.

## Арбитражный вердикт

```text
REOPEN
```

Тексты можно исправлять сейчас, но корпус ещё нельзя называть готовым к
публичной индексации или к работающей продуктовой маршрутизации.

Причина — четыре разных слоя готовности:

1. Markdown и manifest можно привести к единой логике внутри текущего
   production worktree.
2. Два поисковых intent нужно объединить с уже существующими владельцами
   кластера «Переходы», а не выпускать вторыми SEO-страницами.
3. State-based CTA, хабы и публикационный generator пока не реализованы.
4. Product landing и живые URL должны пройти отдельные safety, evidence и
   HTTP-проверки.

`DEFER` ниже не означает «не делать». Оно означает: не выдавать документацию,
Markdown-ссылку или manifest-поле за уже работающий публичный механизм.

## Нормативные corpus-wide rules

1. Выход теста — ровно три **архетипа** в порядке значимости. В публичном
   языке `роль` не является названием output.
2. Последовательность метода одна:
   программный расчёт натальной карты → генеративная модель применяет
   зафиксированный prompt → первая рабочая связка трёх архетипов → последующая
   сверка с жизнью.
3. Текущая жизненная тема, пол, readiness, safety и product fit не вычисляются
   из кода.
4. Выбранная `feminine` или `masculine` система не устанавливает пол и не
   подтверждает пригодность группового продукта.
5. Один CTA на экране не означает один hard-coded URL для всех состояний.
6. При неизвестном или проваленном product gate продукт скрывается. Нельзя
   автоматически подставлять mentoring, retreat, bundle, Strength, Навигатор
   или каталог как fallback.
7. Role-page владеет определением архетипа; life-page — самостоятельным ответом
   на жизненную ситуацию; опубликованный Transition owner не дублируется новым
   index URL.
8. Manifest — источник route/meta/state-решений. Markdown — источник текста.
   Runtime и HTML-сборка не считаются реализованными, пока их нет в коде и
   тестах.
9. `page_safety_class` описывает риск темы страницы. `user_safety_state`
   подтверждается отдельно и управляет показом CTA.
10. Реальный кейс имеет evidence record; иллюстративная сцена не называется
    клиентским результатом. Маргарита запрещена во всех публичных слоях.

## A. Markdown и manifest: внедрить сейчас

| ID | Решение | Priority | Точные файлы | Единое действие | Проверка |
|---|---|---:|---|---|---|
| A01 | **ACCEPT** | P0 | `drafts/11-chto-takoe-arhetip.md`, `drafts/19-resurs-i-ten.md`, `drafts/21-muzhskie-arhetipy.md` | Развести программный натальный расчёт, генеративный выбор/интерпретацию и последующую сверку с жизнью. Убрать `формируется программно`, `программа формирует`, а в `21` не выводить код из повторяющихся жизненных проблем. | Корпусный поиск не находит конфликтующие формулы; три файла одинаково отвечают, что является входом расчёта. |
| A02 | **ACCEPT** | P0 | `drafts/02-persefona.md`, `03-afrodita.md`, `04-artemida.md`, `05-afina.md`, `06-gera.md`, `10-teryayu-sebya.md`, `12-ne-znayu-chego-hochu.md`, `13-gestiya.md`, `14-demetra.md`, `15-gekata.md`, `16-ne-umeyu-govorit-net.md`, `17-zhivu-radi-drugih.md`, `18-zabochus-o-vseh.md`, `21-muzhskie-arhetipy.md` | В описании персонального результата заменить «три роли / расчёт трёх ролей / рядом с двумя ролями» на «три архетипа / три позиции». Сохранить жизненные роли и явно обозначенные карты функций ситуации. | Поиск `результат.*три роли`, `расч[её]т.*тр[её]х ролей`, `код.*три роли`, `рядом с двумя.*рол` даёт 0 ложных output-формул; ручная проверка сохраняет роль жены, роль в команде и другие жизненные значения. |
| A03 | **ACCEPT** | P1 | `drafts/02-persefona.md`, `03-afrodita.md`, `04-artemida.md`, `05-afina.md`, `06-gera.md`, `13-gestiya.md`, `14-demetra.md`, `15-gekata.md`, `21-muzhskie-arhetipy.md` | Восемь женских role-pages прямо говорят: конкретная богиня может появиться только в результате с выбранной женской системой. Мужской обзор получает симметричную формулу. Не связывать выбор системы с полом. | В каждом из девяти файлов присутствует system-aware disclosure; нет формул «женщины выбирают женскую систему». |
| A04 | **ACCEPT** | P1 | `portfolio-routes.json`, `drafts/06-gera.md` | Утвердить author entity `Светлана Страусс`; исправить шесть meta; удалить единственный YAML front matter из `06`. Manifest остаётся единственным metadata source. | Поиск по drafts и manifest не находит `Светлана Страус` без второй `с`; все 26 Markdown начинаются с H1; JSON валиден. |
| A05 | **ACCEPT** | P1 | `portfolio-routes.json` | Поднять schema version. Переименовать `safety_state` в `page_safety_class`; добавить declarative state branches: `code_known`, `birth_time_known`, `concern`, `audience_fit`, `readiness`, `product_active`, `user_safety_state`. Ветви хранят logical action/destination, но не объявляют runtime реализованным. | Schema validation требует поля для всех 26 routes; ни одно page-level поле не используется как доказательство user safety; `publication_status` остаётся `draft`/`hold`. |
| A06 | **ACCEPT** | P0 | десять продуктовых финалов: `drafts/01-zhizn-cherez-nado.md`, `07-ustala-byt-silnoy.md`, `08-khoroshaya-devochka.md`, `12-ne-znayu-chego-hochu.md`, `16-ne-umeyu-govorit-net.md`, `17-zhivu-radi-drugih.md`, `22-sila-bez-kontrolya.md`, `23-vse-delayu-sama.md`, `25-hochyu-no-ne-deystvuyu.md`, `26-strategiya-bez-vkusa.md`; три финала Навигатора: `10-teryayu-sebya.md`, `24-dostigla-no-ne-zhivu.md`, `27-vnutrenniy-vybor.md`; `portfolio-routes.json` | Убрать из финального Markdown безусловные продуктовые anchors и безусловный Navigator-as-commercial-route. Сохранить самостоятельную пользу и нейтральное приглашение выбрать следующий шаг. Route-кандидаты остаются только в manifest и не рендерятся без слоя C. | В Markdown нет финальных anchors на `/lightness/#bundle`, `/mentoring/`, `/retreats/` и нет финального hard-coded Navigator там, где он должен проходить state gate; бесплатные body-links и практика сохранены. |
| A07 | **ACCEPT** | P1 | `portfolio-routes.json`; `drafts/02-persefona.md`, `03-afrodita.md`, `04-artemida.md`, `05-afina.md`, `06-gera.md`, `11-chto-takoe-arhetip.md`, `13-gestiya.md`, `14-demetra.md`, `15-gekata.md`, `19-resurs-i-ten.md`, `21-muzhskie-arhetipy.md` | Для cold entry сохранить logical action `TEST` только при полном времени. Для `code_known` — `CONCERN_PICKER` с сохранением system и трёх role ID; для неизвестного времени — `CONCERN_PICKER`, без псевдорасчёта. Не придумывать несуществующий URL вместо logical action. | У всех 11 routes есть три state branch; ни одна ветвь `code_known` не возвращает в TEST; нет `reduced_accuracy` или угадывания времени. |
| A08 | **ACCEPT** | P1 | `portfolio-routes.json`; neutral routes `L01`, `L02`, `L07`, `L10`, `L15`, `L16` | Убрать женский bundle как единственный статический исход. Кандидаты выбираются только по независимым `audience_fit + readiness + concern + product_active + user_safety_state`: короткий женский формат, подходящий активный Strength-format или mentoring при системной задаче. При отсутствии fit — только бесплатное продолжение, не продуктовый fallback. | Табличные fixture-сценарии woman/man/unknown для каждого route не подменяют пол выбранной системой и не показывают продукт при неизвестном fit. |
| A09 | **ACCEPT** | P1 | `drafts/24-dostigla-no-ne-zhivu.md`, запись `L13` в `portfolio-routes.json` | Сузить ownership до «пустота после достижения цели»: заменить H1/title, убрать общий запрос «цель достигнута — что дальше» и добавить две смысловые развилки на live Transition pages `cel-dostignuta-chto-dalshe` и `vse-est-no-nichego-ne-raduet`. | H1/title/meta удерживают узкий intent; обе ссылки присутствуют с разными условиями; safety-развилка не выглядит рекомендацией архетипического продукта. |
| A10 | **ACCEPT** | P1 | `drafts/01-zhizn-cherez-nado.md`, `09-ne-mogu-rasslabitsya.md`, `10-teryayu-sebya.md`, `22-sila-bez-kontrolya.md`, `25-hochyu-no-ne-deystvuyu.md`, `26-strategiya-bez-vkusa.md`, `27-vnutrenniy-vybor.md` | Добавить только различающие intent ссылки: L01/L06 → `zhivu-ne-svoyu-zhizn`; L04 → L10; L15 → `vse-ponimayu-no-nichego-ne-menyaetsya`; L16 → `vse-est-no-nichego-ne-raduet`; в 22/25/26/27 симметрично связать все уже существующие женские role-pages, упомянутые в одном перечислении. | Каждый новый anchor объясняет различие вопросов; не больше одной ссылки на destination в статье; отсутствующие мужские role-pages не изобретаются. |
| A11 | **ACCEPT** | P1 | `portfolio-routes.json` | Обновить title R06/R07/R08: «внутренний центр и тишина», «забота без самоутраты», «границы и завершение». После SERP-preview сократить слишком длинные title/meta без изменения owner intent. | Title уникальны; S06 остаётся единственным owner общего «ресурс и тень»; preview не обрезает differentiator. |
| A12 | **ACCEPT** | P1 | новый `docs/seo/archetypes/production/portfolio-evidence.json`; `portfolio-routes.json`; `drafts/02-persefona.md`, `03-afrodita.md`, `04-artemida.md`, `05-afina.md`, `06-gera.md`, `07-ustala-byt-silnoy.md`, `24-dostigla-no-ne-zhivu.md`, `25-hochyu-no-ne-deystvuyu.md`, `26-strategiya-bez-vkusa.md` и другие найденные абзацы от первого лица | Ввести `author_id` и evidence ledger: каждый route содержит `evidence_items` с полями `evidence_id`, `draft_locator`, `scene_summary`, `status`, `source_path`, `locator`, `source_type`, `speaker`, `consent_state`, `allowed_claim`, `forbidden_extension`, `verified_at`. Иллюстративные сцены помечать `editorial_illustration`, реальные — `author_first_person` или обезличенный `participant_case`. Глобальный deny rule: Маргарита. | Каждый реальный кейс разрешается до первичного источника; каждое публичное «я» принадлежит author ID либо маркированной цитате; deny-поиск проходит по drafts, ledger, manifest. |
| A13 | **ACCEPT** | P2 | все 26 drafts, особенно серии `02–06` и `13–15` | После P0/P1 сделать один горизонтальный ритмический pass: разнообразить начала рекомендаций и финальные конструкции, не меняя факты и не варьируя safety-текст ради оригинальности. Причинную грамматику «архетип возвращает/создаёт/заставляет» заменить языком функции или вопроса. | Слепой corpus-read не находит серий из одинаковых финальных конструкций; safety-модули остаются дословно стабильными; повторный fact diff не меняет контракт. |
| A14 | **REJECT** | — | все drafts | Не выполнять глобальную синонимическую автозамену слова `роль`, не удалять reciprocal links ради процента и не делать 26 механически разных версий contract capsule. | Ручной diff подтверждает, что жизненные роли сохранены, оправданные intent-развилки не удалены, а фактическое ядро метода одинаково. |

## B. Consolidation с существующими Transition owners

| ID | Решение | Priority | Точные файлы / owners | Единое действие | Проверка |
|---|---|---:|---|---|---|
| B01 | **ACCEPT** finding; **DEFER** physical merge до owner-pass | P0 release gate | `drafts/12-ne-znayu-chego-hochu.md` (L02), `portfolio-routes.json`; live owner `/biblioteka/perehody/kak-ponyat-chego-ya-hochu/`; нормативный `16-unified-routing-matrix.md` | Немедленно пометить L02 `noindex,follow` + `hold_consolidation`. Не публиковать вторым SEO owner. Уникальную развилку «пространство уже есть, а желание не вернулось» и архетипическую карту перенести в существующий Transition owner; затем обновить нормативную матрицу. L02 можно сохранить как Telegram/post-test материал, но не в sitemap. | Существует один indexable owner запроса; L02 отсутствует в sitemap; уникальные фрагменты не потеряны; canonical/noindex не создают две конкурирующие страницы. |
| B02 | **ACCEPT** finding; **DEFER** physical merge до owner-pass | P0 release gate | `drafts/27-vnutrenniy-vybor.md` (L14), `portfolio-routes.json`; live owner `/biblioteka/perehody/ne-mogu-prinyat-reshenie/`; `16-unified-routing-matrix.md` | Пометить L14 `noindex,follow` + `hold_consolidation`. Перенести уникальную практику и три архетипических ракурса в live owner. Если старый L14 URL когда-либо становился публичным — только тогда 301 на owner; не создавать ненужный redirect для никогда не опубликованного URL. | Один indexable owner; L14 не в sitemap; owner содержит сохранённую уникальную пользу; redirect создаётся только при наличии публичной истории URL. |
| B03 | **ACCEPT**, частично сейчас / частично deferred | P1 | A-side: L01, L06, L13, L15, L16; Transition-side: `zhivu-ne-svoyu-zhizn`, `cel-dostignuta-chto-dalshe`, `vse-est-no-nichego-ne-raduet`, `vse-ponimayu-no-nichego-ne-menyaetsya` | Ссылки из Архетипов в live owners внедрить в слое A. Обратные ссылки добавить только в отдельном owner-pass после consolidation, в точных смысловых развилках, не как массовый footer. | Граф связывает два кластера в обе стороны; анкоры описывают различие intent; L02/L14 не получают обратных ссылок как новые SEO owners. |
| B04 | **REJECT** | — | L02, L14 и Transition owners | Не оставлять обе версии `index,follow`, не использовать cross-canonical как замену consolidation и не создавать новый URL только ради сохранения номера статьи. | Live crawl и sitemap показывают одного владельца каждого primary intent. |

## C. Build/runtime: обязательный компонент и state-based CTA

Эти решения приняты, но не могут считаться выполненными правкой Markdown или
JSON. До их реализации соответствующие routes остаются `draft`/`hold`.

| ID | Решение | Priority | Точные файлы / будущие компоненты | Единое действие | Проверка |
|---|---|---:|---|---|---|
| C01 | **DEFER, mandatory before publication** | P0 | `package.json`, будущий generator, `portfolio-routes.json`, шаблон статьи | Создать воспроизводимый Markdown → HTML generator. H1/body берутся из Markdown; route ID, title, description, canonical, robots, author и state rules — из manifest. Добавить CI-команды generation/check. | Чистая сборка воспроизводима; 26 источников не имеют ручных metadata-дублей; CI падает при неизвестном route, duplicate canonical или invalid schema. |
| C02 | **DEFER, mandatory before any routed CTA** | P0 | единый `route-cta` component + manifest state rules | Компонент принимает только `route_id` и session state. Порядок: `user_safety_state → code_known/birth_time_known → concern → audience_fit → readiness → product_active`. Результат — максимум один action/destination. При неизвестном/проваленном product gate продукт не рендерится. | Unit fixtures покрывают crisis, sensitive, product_interest=no, inactive product, audience mismatch, unknown state; HTML не содержит скрытого product anchor; ни один failure не получает другой продукт. |
| C03 | **DEFER, mandatory before TEST routes** | P1 | `route-cta`, post-result integration, concern picker | Для cold + complete birth time показывать S01; для `code_known` сохранять system + три role ID и спрашивать concern; без точного времени предлагать concern picker и 1–2 статьи. Не передавать сырые данные рождения. | E2E для всех 11 TEST-final routes: cold, post-result и no-time. Нет цикла test → article → test; нет reduced-accuracy path. |
| C04 | **DEFER, mandatory before product routes** | P1 | `route-cta`, session/state contract | Реализовать независимые `audience_fit`, `readiness`, `concern`. `feminine/masculine` code system не участвует как пол. Strength может быть выбран только как подходящий активный маршрут, а не fallback после отказа bundle. | Одна neutral article даёт честные результаты для woman/man/unknown и short/guided/not-ready; unknown не получает продукт. |
| C05 | **DEFER, mandatory before full cluster release** | P0 | S01 `/test-arhetipov/`, S02 `/arhetipy/`, S03 `/zhenskie-arhetipy/`, старый `/arhetipy.html` | Собрать S01, S02, S03. Для S02 принять финальную миграцию: единый `/arhetipy/`, 301 со старого `/arhetipy.html`, self-canonical и одна sitemap entry. До готовности не заменять S03/TEST ссылку нерелевантным продуктом и не активировать ссылки на 404. | S01–S03 возвращают final 200; `/arhetipy.html` имеет один 301 hop; S02/S03 имеют реальные карты контента; нет двух indexable hubs. |
| C06 | **DEFER, mandatory before indexation** | P0 | article/hub templates, sitemap generator, manifest | Добавить absolute self-canonical, robots, `Article` + `BreadcrumbList`, author/date/OG; для S02/S03 — `CollectionPage` + breadcrumbs. Sitemap получает только 200 indexable canonical. | Staging crawler проверяет один H1, title/meta, canonical, robots, JSON-LD, breadcrumbs, link HTTP и sitemap membership. |
| C07 | **DEFER, mandatory before hub acceptance** | P1 | S02/S03 templates, all article templates | S02 ведёт к S01/S03/S04/S05/S06 и группам жизненных тем; S03 — к R01–R08. L15/L16 находятся в отдельной группе «сочетания функций», не среди 8 архетипов. Breadcrumbs ведут к S02, role-pages также к S03. | Любой сохранённый index asset доступен из S02 максимум за 2 клика; R01–R08 доступны из S03 за 1 клик. |
| C08 | **DEFER, after route rules are stable** | P2 | `portfolio-routes.json`, related-reading component | Добавить `related_reading`: 2–3 бесплатных ссылки, включая parent hub и узкую соседнюю тему. Для `code_known` не предлагать повторный TEST. Блок визуально вторичен к одному главному CTA. | У product-not-ready и no-fit читателя есть бесплатное продолжение; related block не содержит продукт и не создаёт новый hard-coded fallback. |
| C09 | **DEFER, before E-E-A-T acceptance** | P1 | author component, evidence/source disclosure, `portfolio-evidence.json` | Рендерить единый byline, author page/method link, published/modified dates и компактные source/method/medical disclosures из ledger. | Видимое имя и JSON-LD author совпадают; от article route можно дойти до evidence record; научная валидность натальному методу не приписывается. |
| C10 | **REJECT** | — | runtime | Не хранить один `destination` как безусловный публичный CTA; не определять product interest по scroll depth, URL, role ID или факту чтения; не передавать имя/дату/время/место рождения в URL, UTM, Telegram или analytics. | Privacy tests и event payload audit; запрещённых полей нет, route fixtures не используют proxy-signals. |

## D. Product landing и живые publication gates

| ID | Решение | Priority | Точные файлы / URL | Единое действие | Проверка |
|---|---|---:|---|---|---|
| D01 | **DEFER, blocks direct product activation** | P0 | `mentoring/index.html`, `lightness/index.html`, `strength/index.html`; нормативный `00-real-test-contract.md` | Привести landing к тому же epistemic contract: расчёт кода отделён от наблюдения/практики и выбранной текущей задачи; убрать причинные и гарантированные формулы «архетип управляет/блокирует/возвращает» и обещания изменить отношения, деньги, тело, сексуальность, здоровье или всю жизнь. | Отдельный safety/evidence audit трёх landing даёт PASS; ни одна статья не ведёт на страницу с более сильным обещанием метода. |
| D02 | **DEFER, blocks Navigator activation from sensitive routes** | P1 | `pervyi-shag.html`, его data/runtime | Навигатор обязан сохранить crisis stop, readiness и context; он не считается уже квалифицированным коммерческим маршрутом только потому, что ссылка была в статье. | E2E crisis/sensitive/normal: в crisis нет коммерческого маршрута; провал не подменяется другим продуктом или каталогом. |
| D03 | **DEFER, blocks publication of linked routes** | P0 | S01 `/test-arhetipov/`, S02 `/arhetipy/`, S03 `/zhenskie-arhetipy/`, 26 canonical, sitemap | После deploy проверить final HTTP, anchors, redirects, canonical, robots, schema, breadcrumbs и sitemap. Ни одна ссылка на 404 не активируется. Publication status меняется поштучно. | Live crawler PASS; только 200 indexable canonical в sitemap; noindex/hold/result URL отсутствуют; redirect chains отсутствуют. |
| D04 | **DEFER, post-launch governance** | P1 | Search Console, analytics events, route manifest | Через 8–12 недель проверить query/page ownership, особенно L02/L14/L13 и соседние Transition owners; reciprocal links оценивать по реальным query/page и click paths, а не по проценту. | Нет двух owners одного primary query; при конфликте сначала меняется ownership/content, не механически удаляются ссылки. |
| D05 | **REJECT** | — | all product/public routes | Не активировать retreat из холодной статьи; не показывать mentoring, bundle, Strength, Навигатор или каталог как автоматический fallback; не копировать в evergreen статьи цены, даты, набор и места. | Live route fixtures и body scan: 0 hard-coded fallback, 0 direct cold retreat, 0 stale commercial facts. |

## Конфликты между аудитами и их разрешение

| Конфликт | Решение арбитра |
|---|---|
| `13`, Rule D снова называет output «тремя ролями», хотя `11` доказывает неточность термина | **REJECT** эту формулировку из `13`; нормативно — три архетипа и три позиции. |
| `12` допускает временно заменить `/arhetipy/` на live `/arhetipy.html` | **REJECT** как целевую архитектуру. `16` утверждает S02 `/arhetipy/`; принять миграцию с 301. До неё ссылки/публикация остаются gated, а не получают временную смысловую подмену. |
| `12` предлагает L02/L14 consolidation, а `16` пока помечает L02 index, L14 conditional | **ACCEPT** новый live-SEO факт как основание HOLD; физический merge и изменение нормативной матрицы выполняются вместе с существующим Transition owner, не локальной правкой одного canonical. |
| `13` предлагает `/strength/` мужчинам после женского bundle | **ACCEPT** только как независимый кандидат при подтверждённом audience fit, concern, readiness и active status. **REJECT** Strength как fallback. |
| Первая волна считает обычные Markdown product links будущими gated CTA | **REJECT**: anchor уже является публичным маршрутом. До компонента он удаляется из Markdown и route остаётся hold. |
| `12` фиксирует высокий процент reciprocal links | **REJECT** механическое удаление. Сохранять только различающие intent переходы и измерять каннибализацию после публикации. |
| Единый contract capsule против требования человеческой вариативности | **ACCEPT** единое фактическое ядро; **REJECT** 26 дословных копий. Полная механика живёт в S05/S06/S04 и disclosure-компоненте, life-pages используют короткий контекстный вариант. |

## Один последовательный порядок внедрения

1. Зафиксировать glossary: `архетип / функция / позиция / жизненная роль /
   текущая тема`; исправить метод в `11`, `19`, `21`.
2. Нормализовать output-терминологию во всех затронутых drafts и добавить
   system-aware disclosure role-pages.
3. Утвердить author entity, удалить YAML `06`, исправить manifest metadata.
4. Поставить L02/L14 на `noindex,follow + hold_consolidation`; сузить L13.
5. Добавить archetype → Transition differentiating links и локальные
   недостающие role-links.
6. Создать evidence ledger и привязать живые сцены; затем выполнить ритмический
   pass без изменения safety.
7. Расширить manifest declarative state rules и убрать hard-coded финальные
   product/Navigator anchors из Markdown.
8. Выполнить consolidation внутри существующих Transition owners и только
   после этого добавить обратные cross-cluster links.
9. Реализовать generator, S01/S02/S03, templates, schema, breadcrumbs, sitemap
   и related-reading.
10. Реализовать `route-cta` и E2E-ветви cold/post-test/no-time/
    woman/man/unknown/sensitive/crisis.
11. Привести product landing и Навигатор к общему evidence/safety contract.
12. Провести staging crawl, deploy, live crawl и независимый red-team. Менять
    `publication_status` только для прошедших URL.

## Финальное acceptance

Вторая волна получает `PASS` только при одновременном выполнении:

- все решения слоя A внедрены и corpus-wide audit отвечает одинаково на
  базовые вопросы о методе;
- L02 и L14 имеют одного опубликованного Transition owner, а L13 владеет только
  узким intent пустоты после достижения;
- ни один product/Navigator anchor не обходит runtime gates;
- TEST не зацикливает `code_known`, а неизвестное время ведёт к concern picker;
- выбранная система не используется как пол или product fit;
- при неизвестном/проваленном gate продукт скрывается без hard-coded fallback;
- S01/S02/S03 и каждый активный canonical отвечают final `200`;
- generator реально создаёт metadata/schema/breadcrumbs/sitemap, а не только
  описан в документации;
- author entity и evidence ledger разрешают источник каждого реального кейса;
- product landing сохраняют тот же уровень доказательности и безопасности, что
  статьи;
- staging и live crawler, E2E по восьми персонам и независимая red-team дают
  `PASS`.

До этого корректный статус:

```text
текстовый актив улучшается
≠
публичная SEO-система готова
≠
state-based продажи реализованы
```
