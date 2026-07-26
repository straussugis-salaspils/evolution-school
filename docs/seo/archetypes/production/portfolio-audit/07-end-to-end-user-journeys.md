# E2E-аудит: сквозные пользовательские маршруты

Дата проверки: 27 июля 2026.

Статус: read-only. Черновики и runtime-файлы не изменялись.

## Объём проверки

Проверены:

- 26 реальных черновиков;
- портфельные аудиты 02–05;
- `00-real-test-contract.md`;
- `12-test-funnel-architecture.md`;
- `14-result-pages-map.md`;
- `16-unified-routing-matrix.md`;
- локальные `/lightness/`, `/strength/`, `/mentoring/`, `/retreats/`, `/pervyi-shag.html`, `/arhetipy-method.html`;
- текущая логика Навигатора в `start-navigator-data.js` и `script.js`;
- текущий whitelist событий в `analytics.js`;
- наличие Telegram/test integration code в рабочем репозитории.

Это аудит не отдельных текстов, а передачи контекста между экранами.

## Итог

Смысловая архитектура существует, но исполняемой сквозной системы пока нет.

Главные P0-блокеры:

1. S01 `/test-arhetipov/`, S02 `/arhetipy/` и S03 `/zhenskie-arhetipy/` локально отсутствуют.
2. Текущий внешний тест не имеет постоянного результата, concern selector, статических рекомендаций, Telegram handoff и возврата в основной сайт.
3. В репозитории нет Telegram-бота, token service или обработчика `start=<opaque_token>`.
4. Нет единого machine-readable route manifest для сайта, теста и Telegram.
5. Existing Navigator использует другую таксономию (`territory`, `condition`, `diagnostic`, `gender`) и не получает Route ID статьи или `concern` из матрицы 16.
6. Existing Navigator может одновременно показать primary product, secondary product, бесплатный подбор и платный Навигатор. Это конфликтует с правилом «максимум один продукт после явного `product_interest`».
7. Стабильного evergreen destination двухнедельного входа нет. Один и тот же bundle спрятан в модальных окнах `/lightness/` и `/strength/`.
8. Текущая аналитика не принимает Route ID, concern, readiness, eligibility, recommendation и assisted conversion events.

Следствие: массовое изменение CTA в 26 статьях до появления routing runtime создаст красивые, но неисполняемые обещания следующего шага.

## Единое состояние маршрута

Минимальный исполняемый объект:

```yaml
source: seo | test | telegram | direct | navigator
origin_route_id: S01 | S02 | S03 | S04 | S05 | S06 | R01..R08 | L01..L16
system: feminine | masculine | unknown
code: [role_1, role_2, role_3] | null
birth_data: complete | time_unknown | absent
concern: explore | desire | action | overload | rest | boundaries |
         choice | relationships | care | meaning_transition
readiness: information | self_observation | product_interest
next_intent: keep_reading | personal_map | short_experience |
             guided_work | live_immersion | null
safety: normal | sensitive | crisis
product_status: active | waitlist | inactive | unknown
```

Правила:

- `code` появляется только после завершённого натального расчёта.
- `concern` всегда выбирается отдельно.
- `readiness` не выводится из scroll depth, результата теста или архетипа.
- `product_interest` появляется только после явного выбора пользователя.
- в URL и UTM нельзя помещать code, имя или данные рождения;
- между тестом и Telegram передаётся только короткоживущий непрозрачный token;
- после выбора `next_intent` показывается один destination, а не витрина продуктов.

## Как совместить один CTA и выбор readiness

«Один следующий шаг» не означает одинаковую кнопку под всеми статьями.

Рабочая механика:

1. Статья даёт законченный ответ.
2. Один главный CTA открывает `next-intent`:
   - продолжить читать;
   - увидеть персональную карту;
   - попробовать короткий формат;
   - взять повторяющуюся тему в сопровождение.
3. Для зрелых transition-страниц может появиться пятый выбор — обсудить живое погружение.
4. После выбора система проверяет concern, system/gender, safety и product availability.
5. Пользователь видит один следующий destination.

Карточки продуктов до выбора `product_interest` не показываются.

## Сценарий 1. Cold search → статья → статья

Пример:

```text
поиск «всё делаю сама»
→ L12
→ самостоятельная практика
→ L03, если реальная проблема — отсутствие опоры и истощение
```

Ожидаемое состояние:

```yaml
source: seo
origin_route_id: L12
concern: overload
readiness: information
safety: normal | sensitive
```

Что работает:

- L03 и L12 имеют доказанную смысловую границу;
- аудит 02 даёт точные взаимные ссылки.

Тупики:

- статьи пока существуют только как Markdown;
- L12 не имеет входящих ссылок;
- L03 частично забирает how-to владельца L12;
- все текущие финалы всё равно отправляют в тест.

Acceptance:

- обе страницы отдают 200 и self-canonical;
- L12 → L03 и L03 → L12 используют разные условия перехода;
- при `readiness=information` продукт не рендерится;
- `article_click` сохраняет `origin_route_id` и destination ID;
- L03 не дублирует алгоритм передачи ответственности L12.

## Сценарий 2. Role query → test → concern → materials

Пример:

```text
поиск «архетип Персефоны»
→ R01
→ S01
→ feminine natal calculation
→ 3 роли
→ concern=desire или action
→ 1 life article + 1 фактическая role-page
```

Что работает:

- R01 корректно отделяет узнавание от расчётного кода;
- result contract и порядок трёх ролей определены.

Тупики:

- S01 отсутствует;
- временный внешний runtime не сохраняет результат и не возвращает route context;
- после результата нет concern selector;
- нет статического recommendation engine;
- role query может привести к другой тройке, но путь назад к исходной статье не определён.

Acceptance:

- S01 объясняет входные данные, систему и privacy до запуска;
- `test_start` получает только безопасный `origin_route_id`;
- результат содержит ровно три role ID и остаётся `noindex`;
- результат не обещает Персефону;
- concern выбирается отдельно;
- S01 не показывается повторно завершившему тест человеку;
- рекомендация — максимум три материала и один продукт только после отдельного readiness-choice.

## Сценарий 3. Точного времени рождения нет

Пример:

```text
статья / Telegram
→ «хочу увидеть код»
→ birth_data=time_unknown
→ расчёт не запускается
→ concern selector
→ 1–2 тематические статьи
```

Что работает:

- контракт честно запрещает эквивалентный расчёт без времени;
- во всех статьях это ограничение названо.

Тупики:

- на S01 нет реализованной ветки `time_unknown`;
- Telegram-ветка существует только в документации;
- повторение ограничения в статье не даёт человеку реального следующего экрана.

Acceptance:

- рядом с формой есть действие `Не знаю точного времени`;
- оно не ведёт в форму с «пониженной точностью»;
- system/code остаются unknown/null;
- пользователь выбирает concern человеческой формулировкой;
- выдаются максимум две статьи и необязательный следующий шаг;
- событие `route_branch` фиксирует `time_unknown`, но не данные рождения.

## Сценарий 4. Desire → двухнедельный вход → mentoring

Пример:

```text
L01 / L05 / L02 / L16
→ самостоятельная польза
→ next_intent=short_experience
→ 2W-L
→ фактическое участие
→ next_intent=guided_work
→ mentoring
```

Что работает:

- `/lightness/` и `/strength/` используют один GetCourse bundle widget;
- обе страницы показывают «две недели вместе»;
- `/lightness/` уже содержит переход к менторингу и зачёт стоимости недели.

Тупики:

- нет отдельного стабильного 2W route ID и evergreen landing;
- bundle доступен как секция/модальное окно двух разных страниц;
- даты и цены зашиты в product pages;
- `/lightness/` — женский формат, но origin traffic не квалифицирован;
- нет события bundle start/completion и cross-domain continuity;
- после оплаты/участия origin Route ID теряется.

Acceptance:

- утверждён один `product_id=archetypes_2w`;
- утверждён стабильный URL или стабильный anchor;
- availability управляется данными, а не текстом статьи;
- inactive bundle скрывается, а не заменяется случайным продуктом;
- `/lightness/` показывается только релевантной аудитории;
- `two_week_start` содержит только `origin_route_id` и `entry_side`;
- переход в mentoring является новым явным выбором, а не автоматическим upsell;
- измеряется `mentoring_interest_after_entry`.

## Сценарий 5. Системная женская тема → mentoring

Пример:

```text
L08 или L12
→ самостоятельная практика
→ вопрос «это один эпизод или схема в нескольких сферах?»
→ recurring=yes
→ next_intent=guided_work
→ system/audience=feminine
→ mentoring
```

Что работает:

- L08 и L12 — сильнейшие смысловые входы в главный продукт;
- mentoring page описывает одну ключевую тему и двухмесячное сопровождение.

Тупики:

- матрица 16 ещё не содержит новый портфельный приоритет mentoring из аудита 03;
- нет qualification component;
- существующие статьи по-прежнему отправляют в тест;
- мужской или unknown traffic может попасть в женский продукт;
- mentoring page местами описывает тест как более позднее подтверждение «природных» ролей, что может конфликтовать с опытом пользователя, уже пришедшего с натальным результатом.

Acceptance:

- правило сначала утверждено в матрице 16;
- mentoring показывается только после `recurring=yes`, `product_interest`, `safety=normal` и женской релевантности;
- CTA не обещает изменить партнёра, семью или всю жизнь;
- landing узнаёт безопасный origin Route ID;
- человек с готовым кодом не обязан проходить тест повторно;
- GetCourse lead сохраняет безопасный campaign/origin без birth data.

## Сценарий 6. Мужской читатель

Пример:

```text
S04
→ S01 masculine
→ 3 мужские роли
→ concern=action
→ S04 + L10
→ при product_interest — 2W-S
```

Что работает:

- мужская восьмёрка реализована в тесте;
- `/strength/` явно предназначен мужчинам и женщинам.

Тупики:

- S04 существует только как черновик;
- S01 отсутствует;
- отдельных мужских role-pages быть не должно, но fallback ещё не реализован;
- existing Navigator использует `gender`, а натальный тест — выбранную `system`; эти состояния нельзя молча считать одним и тем же;
- глубокого мужского продукта нет;
- mentoring page — женский продукт.

Acceptance:

- male result всегда ведёт в S04 и нейтральную life-page;
- женские role-pages не подмешиваются;
- product engine не предлагает mentoring мужчине;
- Strength предлагается только по concern и `product_interest`, не по Зевсу/Аресу;
- отсутствие мужского глубокого продукта даёт честный `no_matching_product`, а не fallback на каталог;
- system и gender/audience хранятся раздельно.

## Сценарий 7. Зрелый переход → retreat qualification

Пример:

```text
L13 / L14 / R07
→ самостоятельный ответ или Navigator
→ next_intent=live_immersion
→ safety=normal
→ готовность обсуждать формат и логистику
→ /retreats/
→ короткий разговор
```

Что работает:

- retreat landing уже не предлагает оплату в один клик;
- вход ведёт в разговор с координатором;
- страница признаёт, что не всем нужно начинать с острова.

Тупики:

- статьи пока не имеют qualification layer;
- retreat landing содержит датированную цепочку «недели → mentoring → острова»;
- Telegram-ссылка ведёт в личный аккаунт без route token;
- origin concern/readiness теряются;
- landing показывает несколько соседних продуктов и может снова размыть один выбранный маршрут.

Acceptance:

- RETREAT появляется только после `live_immersion`, `safety=normal`, зрелого перехода и active retreat;
- бюджет и логистика не пишутся в аналитику;
- в Telegram/CRM передаётся только безопасный origin/destination token;
- координатор не получает данные рождения;
- inactive retreat даёт waitlist/no-offer state;
- CTA не обещает решить пустоту, кризис или всю жизнь.

## Сценарий 8. Sensitive/crisis stop

Пример:

```text
L04 / L06 / L13 / Telegram concern
→ safety=sensitive | crisis
→ профильная помощь / безопасный материал
→ product layer suppressed
```

Что работает:

- чувствительные статьи имеют отдельные STOP-блоки;
- матрица требует остановки коммерческого маршрута.

Тупики:

- нет общего safety-state component;
- нет safety routing implementation в Navigator;
- текущий Navigator всегда строит продуктовый result screen;
- нет события безопасного выхода;
- глобальная навигация остаётся коммерческой, даже если локальный recommendation layer остановлен.

Acceptance:

- `crisis` полностью скрывает next-intent/product cards;
- `sensitive` сначала даёт безопасный материал или профильный маршрут;
- Navigator не показывает продукт, если выбран ответ о непосредственной опасности или тяжёлом нарушении функционирования;
- `safety_route_exit` не содержит свободный текст;
- коммерческая аналитика не считает safety stop потерянной конверсией;
- профильная помощь определяется отдельным безопасным компонентом, а не архетипом.

## Сценарий 9. Test → Telegram continuation

Пример:

```text
result_shown
→ concern selected
→ «продолжить в Telegram»
→ short-lived opaque token
→ bot resolves {system, roles, expires_at}
→ 1 primary article + 1 factual role article
→ one optional next step
```

Что работает:

- payload и privacy-границы нормативно определены.

Тупики:

- нет token issuer, resolver, expiry/replay policy;
- нет bot implementation;
- нет bot username/deep link;
- результат теста сейчас живёт только в браузере;
- нет обработки истёкшего token;
- нет подтверждения concern после handoff;
- нет общей машинной матрицы рекомендаций.

Acceptance:

- token содержит только opaque ID;
- resolver возвращает system, три нормализованные роли и expiry;
- token одноразовый или имеет строго ограниченный TTL;
- бот при истёкшем token предлагает безопасный restart без повторной передачи birth data;
- concern подтверждается в Telegram и не выводится из кода;
- бот выдаёт максимум три материала и один продукт после `product_interest`;
- `telegram_continue` связывается с route journey без PII;
- Telegram не становится хранилищем полного портрета.

## Несогласованные идентификаторы

### Routing matrix

Использует:

- Route ID `S01..S07`, `R01..R08`, `L01..L16`;
- `concern`;
- `readiness`;
- `safety`;
- `system`.

### Existing Navigator

Использует:

- `territory`;
- `condition`;
- `diagnostic`;
- `gender`;
- product keys `weekWomen`, `weekMen`, `mentoring`, `retreat` и другие.

### Analytics

Сейчас сохраняет только:

- `navigator_start`;
- `navigator_complete`;
- `test_start`;
- `test_complete`;
- общие CTA/payment/Telegram/outbound events.

Route ID, concern, readiness, recommendation и eligibility не поддерживаются whitelist.

Решение:

1. Не заменять concern selector существующим Navigator автоматически.
2. Создать mapping layer только там, где соответствие однозначно.
3. Передавать в Navigator `origin_route_id` и уже выбранный concern.
4. Навигатор отвечает за выбор формата; матрица 16 — за материалы и product gate.
5. После результата Navigator показывает максимум один product destination.

## Analytics gaps

Обязательные новые события:

| Event | Зачем |
|---|---|
| `route_entry` | начало пути с Route ID |
| `article_view` | чтение конкретного актива |
| `reading_success` | самостоятельная польза до продажи |
| `next_intent_shown` | показ выбора следующего намерения |
| `next_intent_selected` | явный readiness-сигнал |
| `concern_selected` | отдельная текущая тема |
| `recommendation_shown` | фактически показанный destination |
| `product_eligibility_checked` | причина показа или скрытия продукта |
| `cta_impression` | знаменатель для CTR |
| `article_click` | переход между материалами |
| `product_click` | переход к одному продукту |
| `safety_route_exit` | корректная остановка |
| `telegram_continue` | handoff без PII |
| `two_week_start` | начало 2W |
| `mentoring_interest_after_entry` | роль 2W в продаже mentoring |

Текущий `analytics.js` эти события отбросит, потому что их нет в `EVENTS` и `PARAMS`.

Нельзя передавать:

- имя;
- дату, время, место и координаты рождения;
- свободный текст чувствительной темы;
- медицинские предположения;
- бюджет пользователя;
- полный result portrait.

## Рекомендуемый порядок запуска

### Этап 0. Governance

1. Обновить матрицу 16: mentoring priority, 2W product ID, readiness-choice.
2. Создать machine-readable route manifest.
3. Зафиксировать canonical product URLs и active/waitlist/inactive state.
4. Разделить `system` и product audience/gender.

### Этап 1. Контентная инфраструктура

1. Собрать S02, S03 и все разрешённые article routes.
2. Внедрить матрицу перелинковки из аудита 02.
3. Оставить product layer выключенным.
4. Пройти HTTP/canonical/sitemap crawl.

### Этап 2. Test core

1. Собрать S01 как canonical wrapper.
2. Интегрировать внешний runtime.
3. Добавить `time_unknown`, ошибки и retry.
4. Добавить concern selector и deterministic recommendations.
5. Проверить noindex/PII.

### Этап 3. Next-intent pilot

Запустить шесть маршрутов:

- R01 → TEST;
- L03 → ARTICLE;
- L01 → 2W-L;
- L10 → 2W-S;
- L08 → MENTORING;
- L14 → NAV.

Сначала без Telegram и retreat.

### Этап 4. Product runtime

1. Утвердить стабильный 2W destination.
2. Подключить availability.
3. Ограничить Navigator одним product destination.
4. Протянуть safe origin attribution в GetCourse.
5. Проверить male/female и safety cases.

### Этап 5. Telegram continuation

1. Token issuer/resolver.
2. Bot first screen и concern flow.
3. Expired-token recovery.
4. Рекомендации из того же manifest.
5. Privacy и analytics regression.

### Этап 6. Retreat

1. Добавить `live_immersion`.
2. Проверять актуальный формат.
3. Передавать координатору только безопасный origin token.
4. Не смешивать retreat qualification с массовым product chooser.

### Этап 7. Распространение

После успешного пилота распространить механику на остальные статьи. Не копировать CTA-текст; переиспользовать route rules и компонент.

## Общие acceptance checks

### Routing

- один Route ID одинаков на сайте, в результате теста, Telegram и аналитике;
- current concern никогда не выводится из кода;
- максимум три материала;
- максимум один продукт;
- readiness возникает только из явного выбора;
- inactive product не заменяется случайным каталогом;
- conditional URL не публикуется без index gate.

### Test

- только точные дата, местное время и место;
- без времени нет псевдорасчёта;
- ровно три роли одной системы;
- result noindex;
- birth data не попадает в URL/UTM/Telegram/analytics;
- ошибки времени и генерации восстанавливаемы;
- результат не назначает продукт.

### Articles

- каждый текст сначала полностью отвечает на запрос;
- один главный следующий шаг;
- нет одинакового universal test CTA;
- contextual article links работают без JavaScript;
- safety block находится до product choice;
- отсутствующие destinations не рендерятся.

### Products

- 2W имеет один ID и стабильное назначение;
- mentoring показывается только подходящей женской аудитории и системной теме;
- Strength не показывается при истощении, симптомах, насилии;
- retreat требует зрелого intent и разговора;
- evergreen article не содержит дату, цену или статус набора;
- product page является источником актуальности.

### Telegram

- token opaque, short-lived и без birth data;
- concern подтверждается отдельно;
- expired/replayed token имеет безопасный fallback;
- полные статьи остаются на сайте;
- продукт не показывается без readiness и safety gate.

### Analytics

- все события проходят whitelist и sanitization;
- есть impression denominators;
- origin Route ID сохраняется через test, Navigator и product handoff;
- 2W → mentoring измеряется как assisted path;
- safety exits не считаются потерянной продажей;
- PII regression test проходит.

## Release decision

Текущий статус: **NO-GO для массового внедрения продуктовых CTA и Telegram continuation**.

Допустимо уже сейчас:

- редактировать статьи;
- строить article routes и перелинковку;
- собирать S01/S02/S03;
- создавать manifest и события;
- пилотировать next-intent без активных продуктов.

GO возможен после:

1. появления всех destinations;
2. единого manifest;
3. working concern/readiness/safety gates;
4. стабильного 2W route;
5. test return flow;
6. Telegram token service для Telegram-релиза;
7. полного E2E regression набора.
