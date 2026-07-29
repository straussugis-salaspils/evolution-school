# ЗАДАЧА ДЛЯ НОВОГО ЧАТА

## Опубликовать SEO-кластер «Архетипы» на сайте Evolution House

> **Редакционная пауза от 29 июля 2026 года.** Этот handoff нельзя запускать
> повторно для публикации или считать разрешением сохранить нынешние тексты без
> переработки. Сначала калибровочная статья об Афине должна пройти
> `18-interesting-article-editorial-standard.md` и получить личное одобрение
> Светланы. Затем корпус перерабатывается по утверждённому образцу.

Это задача на полную реализацию, а не на дополнительное исследование или
редактуру статей.

Нужно собрать, проверить, разместить и опубликовать кластер «Архетипы» по тому
же производственному стандарту, по которому на сайте уже сделаны:

- статьи Рейки;
- статьи «Пересборка жизни и переходы»;
- их хабы, перелинковка, schema, адаптивность, генераторы и SEO-аудиты.

Работать автономно. Не спрашивать разрешение на обычные технические решения
внутри утверждённой архитектуры. Остановиться только при настоящем блокере:
противоречии источников правды, невозможности получить обязательный `200`,
неясном production-домене теста или риске потерять существующий индексируемый
контент.

---

## 1. Репозиторий и исходное состояние

Рабочий репозиторий:

`C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes`

Утверждённая ветка:

`codex/seo-archetypes-production`

Минимальный commit, который обязан присутствовать:

`6f880cb Re-audit archetype article system`

До начала:

1. проверить `git status`;
2. не затереть чужие изменения;
3. убедиться, что доступен commit `6f880cb`;
4. запустить редакционный аудит корпуса;
5. зафиксировать фактическое состояние live URL.

Команда исходного редакционного gate:

```powershell
.\scripts\audit-archetype-portfolio.ps1 -FailOnBlocker
```

Ожидается:

```text
Files: 26
IndexAssets: 24
ConsolidationHolds: 2
RouteCtaMarkers: 24
DirectArticleRoutes: 2
EvidenceItems: 42
EvidenceNeedsLocator: 0
Blockers: 0
```

---

## 2. Обязательные источники правды

Сначала полностью прочитать:

1. `docs/seo/archetypes/production/README.md`;
2. `docs/seo/archetypes/production/18-interesting-article-editorial-standard.md`;
3. `docs/seo/archetypes/production/portfolio-routes.json`;
4. `docs/seo/archetypes/production/portfolio-evidence.json`;
5. `docs/seo/archetypes/production/portfolio-audit/14-second-wave-integrated-matrix.md`;
6. `docs/seo/archetypes/production/portfolio-audit/15-second-wave-final-qa.md`;
7. `docs/seo/archetypes/production/portfolio-audit/16-second-wave-final-report.md`;
8. внешний нормативный документ:
   `C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\outputs\docs\seo\archetypes\editorial-architecture\16-unified-routing-matrix.md`;
9. `00-real-test-contract.md` из утверждённой архитектуры;
10. фактический код теста:
   `https://github.com/janisstrauss450-beep/archetype-code`.

Если старый документ, существующая landing page или прежний текст противоречат
manifest v2 и финальному QA, приоритет имеют перечисленные выше источники.

Не менять тексты статей по вкусу. Допустимы только:

- техническая адаптация Markdown в HTML;
- устранение обнаруженного доказанного P0/P1;
- две утверждённые консолидации;
- исправление ссылки, если её фактический URL изменился.

---

## 3. Использовать существующий стандарт сайта

Не создавать отдельный случайный шаблон.

Обязательные референсы реализации:

- `scripts/generate-reiki-articles.mjs`;
- `scripts/reiki-seo-audit.mjs`;
- `scripts/reiki-visual-audit.mjs`;
- `scripts/generate-transition-articles.mjs`;
- `scripts/transition-seo-audit.mjs`;
- `scripts/transition-visual-audit.mjs`;
- `scripts/verify-transition-pages.mjs`;
- `article-library.css`;
- `/biblioteka/reiki/`;
- `/biblioteka/perehody/`.

Новый кластер должен выглядеть членом той же библиотеки:

- тот же основной shell сайта;
- та же типографическая дисциплина;
- тот же уровень воздуха и читаемости;
- hero, содержание, основной текст и связанные материалы;
- нормальная мобильная версия;
- единый авторский блок;
- предсказуемые breadcrumbs;
- без визуального ощущения отдельного микросайта.

При этом у Архетипов может быть свой спокойный цветовой акцент и собственная
образная система. Не превращать страницы в каталог «богинь», эзотерические
открытки или набор одинаковых AI-портретов.

---

## 4. Что именно публиковать

### 4.1. Индексируемые статьи

Источник точного списка — только `portfolio-routes.json`.

Сгенерировать отдельные HTML-страницы для 24 assets с:

```text
index_state = index
publication_status != hold_consolidation
```

Использовать без изменений:

- `route_id`;
- `source`;
- `canonical`;
- `seo_title`;
- `meta_description`;
- `page_safety_class`;
- routing profile.

Не писать массив метаданных второй раз внутри генератора.

### 4.2. Два текста нельзя публиковать отдельными URL

`L02`:

```text
source:
docs/seo/archetypes/production/drafts/12-ne-znayu-chego-hochu.md

НЕ создавать:
/zhizn/ne-znayu-chego-hochu/

owner:
/biblioteka/perehody/kak-ponyat-chego-ya-hochu/
```

`L14`:

```text
source:
docs/seo/archetypes/production/drafts/27-vnutrenniy-vybor.md

НЕ создавать:
/zhizn/vnutrenniy-vybor/

owner:
/biblioteka/perehody/ne-mogu-prinyat-reshenie/
```

Для каждого:

1. открыть существующий Transition draft;
2. выделить уникальную архетипическую карту, практику и смысловую развилку;
3. органично встроить их в существующего владельца intent;
4. не вставлять второй полный текст внутрь первого;
5. сохранить исходное поисковое намерение owner page;
6. регенерировать Transition pages;
7. проверить, что новых URL L02/L14 нет в файловой системе и sitemap.

Не создавать redirect для никогда не публиковавшегося URL. Redirect нужен
только при доказанной публичной истории конкретного URL.

---

## 5. Обязательные системные страницы

До активации ссылок на статьи и тест должны быть готовы три узла.

### S01 — тест

Canonical:

`/test-arhetipov/`

Требования:

- финальный production URL отвечает `200`;
- тест не называется психологическим опросником;
- нужны имя, дата рождения, точное местное время и место рождения;
- программа строит натальную карту;
- генеративная модель применяет зафиксированный авторский промпт Светланы;
- результат — ровно три архетипа в трёх позициях;
- текущая жизненная тема выбирается отдельно;
- женская и мужская системы не смешиваются;
- выбор системы не интерпретируется как пол;
- при неизвестном точном времени не имитируется «менее точный» расчёт;
- сырые имя, дата, время и место рождения не попадают в URL, UTM, Telegram или
  analytics.

Если приложение живёт отдельно, обеспечить стабильный same-site entry
`/test-arhetipov/`: встроить или корректно проксировать production-приложение.
Не публиковать статью со ссылкой на временный preview URL.

### S02 — главный хаб направления

Canonical:

`/arhetipy/`

Существующая `/arhetipy.html` — индексируемая карта направления. Её нельзя
просто удалить.

Нужно:

1. сохранить полезное направление и продуктовую карту текущей страницы;
2. перенести/пересобрать её как `/arhetipy/index.html`;
3. добавить полноценную карту статей;
4. обновить внутренние ссылки сайта на `/arhetipy/`;
5. добавить в `vercel.json` постоянный redirect:
   `/arhetipy.html` → `/arhetipy/`;
6. обеспечить один redirect hop;
7. оставить в sitemap только `/arhetipy/`.

Хаб должен группировать материалы минимум так:

1. что такое архетипы и как читать карту;
2. женские архетипы;
3. мужские архетипы;
4. жизненные ситуации;
5. сочетания функций;
6. тест и метод;
7. подходящие форматы продолжения — только через routing gates.

Schema: `CollectionPage`, `ItemList`, `BreadcrumbList`.

### S03 — женская карта

Canonical:

`/zhenskie-arhetipy/`

Страница должна:

- кратко объяснять выбранную женскую систему;
- не утверждать, что она предназначена только «по полу»;
- вести ко всем восьми существующим женским страницам:
  Персефона, Афродита, Артемида, Афина, Гера, Гестия, Деметра, Геката;
- давать путь к S01 только при известном точном времени и неизвестном коде;
- давать выбор жизненной темы, если код уже известен или времени нет;
- быть доступной из S02 за один клик.

Schema: `CollectionPage`, `ItemList`, `BreadcrumbList`.

---

## 6. Новый воспроизводимый генератор

Создать:

`scripts/generate-archetype-articles.mjs`

Он должен:

1. читать `portfolio-routes.json`;
2. брать body из `docs/seo/archetypes/production/drafts`;
3. генерировать только 24 индексируемых article assets;
4. не генерировать L02/L14;
5. получать metadata и author только из manifest;
6. валидировать неизвестный Route ID, duplicate canonical и отсутствующий
   source;
7. преобразовывать Markdown без потери headings, списков, цитат и ссылок;
8. заменять `ROUTE_CTA` на единый state-based компонент;
9. сохранять две direct-article ссылки L04/L09;
10. создавать воспроизводимый HTML без ручных post-generation edits.

Добавить команды:

```json
"archetypes:generate": "node scripts/generate-archetype-articles.mjs",
"archetypes:seo-audit": "node scripts/archetype-seo-audit.mjs",
"archetypes:visual-audit": "node scripts/archetype-visual-audit.mjs",
"archetypes:responsive": "node scripts/verify-archetype-pages.mjs",
"archetypes:check": "npm run archetypes:seo-audit && npm run archetypes:visual-audit && npm run archetypes:responsive"
```

Встроить генерацию в production build до общего SEO-аудита.

Generated HTML не редактировать вручную. Если результат неверен — исправлять
generator, manifest, источник Markdown или visual config.

---

## 7. Шаблон каждой статьи

Каждая индексируемая статья должна иметь:

- один H1;
- уникальные `<title>` и meta description из manifest;
- absolute self-canonical;
- `index, follow`;
- Open Graph;
- author `Светлана Страусс`;
- ссылку автора на `/o-shkole.html`;
- дату публикации и дату изменения;
- `Article` schema;
- `BreadcrumbList`;
- абсолютное изображение в Article schema;
- видимый breadcrumb;
- ссылку назад на `/arhetipy/`;
- для женских role-pages дополнительный уровень `/zhenskie-arhetipy/`;
- содержание статьи;
- основной Markdown без сокращений;
- отсутствие стандартного блока с перенаправлением к специалистам;
- блок из 2–3 связанных бесплатных материалов;
- максимум один главный следующий шаг;
- нормальные focus states, клавиатурную навигацию и доступные подписи.

Breadcrumbs:

```text
Путь архетипов → статья
```

Для восьми женских role-pages:

```text
Путь архетипов → Женские архетипы → конкретный архетип
```

Не наследовать старое написание автора `Светлана Страус` из генераторов Рейки
или Переходов. Источник правды нового кластера — author entity manifest:
`Светлана Страусс`.

---

## 8. Визуальная система

Сначала создать один документ:

`docs/seo/archetypes/visual-system.md`

И один реестр:

`docs/seo/archetypes/visual-provenance.md`

Принципы:

- жизненные статьи показывают узнаваемую ситуацию, а не мифологическую богиню;
- role-pages используют символическую функцию, движение, среду и материальность,
  но не буквальный костюмированный портрет;
- никакого мистического тумана, свечей ради свечей, псевдоантичного kitsch и
  одинаковых женских лиц;
- серия визуально родственна, но hero не повторяются;
- юмор и лёгкость рождаются из подтверждённых бытовых деталей и самоиронии.

Минимальный производственный стандарт изображения:

- responsive WebP/JPG;
- hero: 480, 768, 1200, 1600;
- корректные `srcset` и `sizes`;
- явные `width`/`height`;
- содержательный `alt`;
- `fetchpriority="high"` только у hero;
- lazy loading у нижних изображений;
- отсутствие layout shift;
- проверенная лицензия или зафиксированное AI provenance.

Использовать общий `article-library.css`. Добавлять только минимальный
namespaced слой Архетипов, если его действительно не хватает.

---

## 9. Перелинковка

### Обязательный граф

`/arhetipy/` должен вести:

- на S01;
- на S03;
- на `/muzhskie-arhetipy/`;
- на `/arhetipy/chto-eto/`;
- на `/arhetipy/resurs-i-ten/`;
- на группы жизненных статей;
- на L15/L16 как отдельную группу сочетаний функций.

`/zhenskie-arhetipy/` ведёт на R01–R08.

Каждая статья:

- ведёт обратно на S02;
- имеет 2–3 связанных бесплатных материала;
- не содержит ссылку на L02/L14 proposed URL;
- не ведёт на 404;
- не получает массовый одинаковый footer из десятков ссылок.

Сохранить уже заложенные body-links между Архетипами и live Transition pages.

После консолидации добавить точечные обратные ссылки из Transition owners в
реально опубликованные страницы Архетипов. Анкор должен объяснять различие
намерений, а не быть «читайте ещё».

Критерий discovery:

- любой из 24 index assets доступен из S02 максимум за два клика;
- R01–R08 доступны из S03 за один клик;
- ни одной orphan page;
- один URL владеет одним primary intent.

---

## 10. State-based CTA вместо жёсткой продажи

В Markdown есть:

```html
<!-- ROUTE_CTA route_id="..." -->
```

Marker не должен попасть в live HTML.

Создать единый компонент, который принимает:

- `route_id`;
- `user_safety_state`;
- `code_known`;
- `birth_time_known`;
- `concern`;
- `audience_fit`;
- `readiness`;
- `product_active`.

Если данных нет, компонент задаёт один короткий явный вопрос или показывает
бесплатное продолжение. Не угадывать состояние по scroll depth, полу, URL,
архетипу или факту дочитывания статьи.

Минимальные ветви:

| Состояние | Следующий шаг |
|---|---|
| crisis / immediate risk | только safety/help; без продукта |
| код неизвестен, точное время есть | S01 |
| код известен | выбор текущей жизненной темы, не повторный тест |
| точного времени нет | выбор темы и статьи, без псевдорасчёта |
| product interest не подтверждён | related reading / самостоятельный шаг |
| короткий женский формат подходит | активный двухнедельный вход |
| мужской/смешанный короткий формат подходит | активный Strength route |
| повторяющаяся системная задача и подходит женская группа | менторинг |
| audience fit неизвестен или продукт неактивен | бесплатное продолжение |
| явный зрелый интерес к живому погружению | только тогда проверка ретрита |

Менторинг — главный глубокий продукт направления, но не универсальный CTA.

Нельзя:

- отправлять все статьи сразу в менторинг;
- отправлять известный код обратно в тест;
- считать выбор женской системы согласием на женскую группу;
- подменять неактивный продукт другим продуктом;
- вести холодного читателя сразу в ретрит;
- хранить скрытый product link в HTML при проваленном gate.

Добавить unit fixtures для каждой ветви.

---

## 11. Evidence и авторская прозрачность

`portfolio-evidence.json` — production ledger.

Генератор/аудит должен проверять:

- route coverage 26/26;
- 42 verified items;
- существование всех локальных source paths;
- наличие author entity;
- глобальный deny rule Маргариты.

Не обязательно публиковать внутренние абсолютные пути к VTT.

На странице достаточно:

- честного авторского byline;
- ссылки на метод;
- точного текста без диагнозов, гарантий и универсальных причинных обещаний;
- отсутствия стандартных отсылок к психологам, психотерапевтам, врачам,
  юристам и другим специалистам.

Запрещено упоминать Маргариту, пересказывать её кейс или делать узнаваемую
анонимизацию.

---

## 12. SEO и sitemap

Создать:

`scripts/archetype-seo-audit.mjs`

Он должен блокировать:

- не 24 generated article pages;
- отсутствие S01/S02/S03;
- duplicate canonical/title/meta;
- неправильный robots;
- H1 не равен source H1;
- отсутствие Article/Breadcrumb schema;
- неверного автора;
- отсутствие даты или image;
- route marker в live HTML;
- hard-coded dynamic product/test/Navigator links;
- ссылку на proposed L02/L14 URL;
- ссылку на 404;
- orphan page;
- отсутствие входящей ссылки от нужного хаба;
- L02/L14 в sitemap;
- два indexable owner одного intent;
- `/arhetipy.html` и `/arhetipy/` одновременно в sitemap;
- отсутствие redirect со старого hub URL.

Sitemap:

- добавить 24 article canonical;
- добавить S01/S02/S03 только после фактического `200`;
- не добавлять L02/L14;
- не добавлять result pages теста;
- не добавлять noindex или redirect aliases;
- оставить только final canonical URL.

---

## 13. Обновить точки входа сайта

После готовности страниц:

- добавить Архетипы как полноценную тему в `biblioteka.html`;
- направить карточку направления из `napravleniya.html` на `/arhetipy/`;
- обновить глобальные ссылки `arhetipy.html` → `/arhetipy/`;
- сохранить логическую связь с `/arhetipy-method.html`;
- не превращать верхнее меню в список из 24 статей;
- создать локальную навигацию направления по образцу Рейки.

Не удалять существующие продуктовые страницы и не менять их URL без отдельного
основания.

---

## 14. Аналитика и приватность

Допустимо отправлять:

- `route_id`;
- тип выбранного действия;
- выбранный concern;
- факт показа/клика CTA;
- обезличенный routing outcome.

Запрещено отправлять:

- имя;
- дату рождения;
- время рождения;
- место рождения;
- сырой натальный результат;
- эти данные в URL, UTM, Telegram payload или analytics event.

Не считать scroll, архетип или чтение статьи доказательством готовности купить.

---

## 15. Порядок реализации

Выполнять именно в такой последовательности:

1. baseline: git, portfolio audit, live HTTP;
2. консолидация L02/L14 в Transition owners;
3. визуальная система и provenance;
4. generator + visual config;
5. S02 и S03;
6. интеграция production S01;
7. state-based route-cta component и fixtures;
8. генерация 24 страниц;
9. связанные материалы и обратные Transition links;
10. обновление `biblioteka.html`, направления и внутренних ссылок;
11. redirect `/arhetipy.html` → `/arhetipy/`;
12. sitemap/schema/metadata;
13. SEO, visual, responsive и portfolio audits;
14. browser QA desktop/mobile;
15. staging crawl;
16. commit;
17. deploy;
18. дождаться terminal `READY`;
19. live crawl и проверка redirect/canonical/sitemap;
20. только после live PASS обновить manifest publication states и сделать
    финальный commit.

Не объявлять задачу законченной после локальной генерации или push.

---

## 16. Обязательные проверки до deploy

```powershell
.\scripts\audit-archetype-portfolio.ps1 -FailOnBlocker
npm run transitions:generate
npm run transitions:check
npm run archetypes:generate
npm run archetypes:check
npm test
git diff --check
```

Дополнительно:

- JSON parse manifest и evidence;
- 24 generated articles;
- 2 consolidation holds;
- 0 hard-coded dynamic links в Markdown;
- 0 route markers в HTML;
- 0 mentions Маргариты;
- 0 links на proposed L02/L14;
- 0 broken internal links;
- 0 duplicate canonical;
- 0 orphan pages.

Browser QA минимум:

- 390 px;
- 768 px;
- 1440 px;
- keyboard navigation;
- видимый focus;
- hero без layout shift;
- TOC не перекрывает текст;
- CTA понятен без контекста предыдущей статьи;
- длинные заголовки не ломают сетку.

---

## 17. Live acceptance

После deploy проверить production, а не preview:

1. `/arhetipy.html` — один постоянный redirect на `/arhetipy/`;
2. S01/S02/S03 — final `200`;
3. все 24 article canonical — final `200`;
4. L02/L14 proposed URL не индексируются и не находятся в sitemap;
5. два Transition owners — `200` и содержат согласованные вставки;
6. все внутренние ссылки — `200` или ожидаемый один redirect hop;
7. canonical абсолютный и self-referencing;
8. robots соответствует manifest;
9. sitemap содержит только final indexable canonical;
10. schema валидна;
11. marker/comment не попал в HTML;
12. CTA fixtures работают в production;
13. нет повторного test-loop;
14. raw birth data отсутствуют в URL и analytics;
15. визуальная геометрия проверена в реальном браузере.

Только после этого допустим итог:

```text
PASS EDITORIAL
PASS BUILD
PASS LIVE
```

---

## 18. Итоговый отчёт нового чата

Вернуть:

- какие 24 страницы опубликованы;
- какие два текста объединены и куда;
- что сделано с `/arhetipy.html`;
- production URL S01/S02/S03;
- какой генератор создан;
- какие package scripts добавлены;
- как реализован state-based CTA;
- какие страницы ведут на тест;
- какие состояния могут вести на менторинг, двухнедельный формат, Strength и
  ретрит;
- какие reciprocal links добавлены;
- сколько страниц в sitemap;
- результаты всех локальных проверок;
- результаты live HTTP/canonical/schema/link crawl;
- какие замечания остались;
- branch;
- commits;
- deployment URL и deployment status.

Не начинать новый SEO-кластер в рамках этой задачи.
