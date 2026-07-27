PASS EDITORIAL / HOLD PUBLICATION

# Финальный горизонтальный QA второй волны

Дата финальной повторной проверки: 27 июля 2026.

## Вердикт

Редакционный корпус получает `PASS`: после централизованных исправлений
незакрытых P0/P1 в Markdown, manifest, evidence ledger, README, отчётах 11–14
и машинном аудите не найдено.

Публикация остаётся на `HOLD`. Это отдельное состояние: три обязательных
системных узла возвращают `404`, а render/runtime ещё не реализован.

Предыдущие `STOP`, `REOPEN` и агрегаты не принимались на доверии. Повторно
проверены изменённые P1/evidence-зоны и заново запущен полный машинный аудит по
26 Markdown с абсолютными путями.

## Повторно проверенные исправления

### Метод, output и терминология

- `drafts/04-artemida.md:152` теперь говорит о сочетании трёх **архетипов**, а
  не ролей.
- `drafts/19-resurs-i-ten.md:134` и
  `drafts/21-muzhskie-arhetipy.md:108,132` фиксируют единую механику:
  программа строит натальную карту → генеративная модель применяет
  зафиксированный авторский промпт Светланы → возвращает три сутевых архетипа
  в порядке значимости с персональной интерпретацией.
- `drafts/19-resurs-i-ten.md:130` и
  `drafts/21-muzhskie-arhetipy.md:138–144` по-прежнему отдельно выбирают
  текущую жизненную тему; код не назначает тему или продукт.
- Корпусный поиск не находит `сочетание трёх ролей`, `роль в коде` или
  `генеративная модель применяет зафиксированную методику`.

Это согласуется с `drafts/11-chto-takoe-arhetip.md:64,66–72,112`,
`16-unified-routing-matrix.md` и нормативным решением отчёта 14.

### Машинные blocker rules

`scripts/audit-archetype-portfolio.ps1:30–38` теперь содержит узкие правила:

- `three_roles_in_code`;
- `role_in_code`;
- `model_method_not_prompt`.

Глобального запрета слова `роль` нет, поэтому жизненные роли и явно
обозначенные карты функций не дают ложных срабатываний.

`scripts/audit-archetype-portfolio.ps1:377–393` дополнительно проверяет
существование каждого локального `source_path` со статусом `verified` и
разрешает relative paths от корня репозитория.

### Evidence trace

Фактическое состояние `portfolio-evidence.json`:

```text
routes: 26
evidence items: 42
verified: 42
needs_locator: 0
gaps: 0
```

Повторно проверены девять ранее незакрытых записей R01, R02, R03, R04×2, R05,
R07, R08 и L16:

- восемь VTT имеют точные line ranges;
- L16 имеет допустимый locator `255-255` в полной спикер-размеченной
  Markdown-расшифровке интервью; отсутствие VTT/аудио честно зафиксировано как
  ограничение источника;
- все девять `source_path` существуют;
- line ranges не выходят за границы файлов;
- `primary_source_candidate` удалён;
- R02 и две R04 scene summaries сужены до буквально подтверждаемого источником:
  без выдуманного открытия жалюзи/ощущения кожей, без действия «оставила задачу
  в папке» и без неподтверждённого прослушивания записи;
- четыре изменённые сцены в Markdown также не выходят за фактические пределы
  первичного фрагмента.

Независимый просмотр первичных диапазонов подтвердил фактическое ядро
опубликованных сцен. Редакционные выводы не выданы за дословную реплику или
гарантированный результат.

### Имя автора и запрет Маргариты

- manifest задаёт автора `Светлана Страусс`;
- в 26 drafts нет `Маргарита / Margarita`;
- в локальных первичных источниках 42 evidence items нет совпадений;
- `portfolio-evidence.json` содержит ровно один
  `DENY-MARGARITA-001`;
- упоминания имени в ledger относятся только к deny rule и consent state.

### Согласованность документов

`portfolio-audit/14-second-wave-integrated-matrix.md:83,111` теперь использует
фактический `portfolio-evidence.json` и его реальные поля
`draft_locator`, `scene_summary`, `source_path`, `locator`.

README, manifest и audit script называют один ledger и одинаково отделяют:

```text
редакционная готовность
≠
реализованный runtime
≠
живая публикационная готовность
```

## Редакционные проверки, оставшиеся зелёными

- 26 Markdown начинаются с одного H1.
- Manifest schema v2 содержит 26 уникальных assets и 26 уникальных canonical.
- 24 dynamic routes имеют ровно один `ROUTE_CTA`; L04 и L09 являются двумя
  согласованными `direct_article` routes.
- В Markdown нет hard-coded ссылок на test, Lightness, Strength, mentoring,
  retreat или Navigator.
- `code_known` ведёт к `CONCERN_PICKER`, а не обратно в тест.
- Без точного времени рождения предлагается тема, а не псевдорасчёт.
- `audience_fit` является отдельным state dimension; выбор female/male system
  не используется как пол или пригодность продукта.
- Failed/unknown product gate ведёт в бесплатное чтение, а не в другой продукт.
- L02 и L14 остаются `noindex_follow + hold_consolidation` с
  `render_separate_url: false`; их опубликованные Transition owners отвечают
  `200`.
- L13 удерживает узкий intent пустоты после достижения и разводит его с
  соседними Transition owners.
- Диагностические, гарантированные и жёсткие коммерческие обещания не найдены.

Повторяющиеся safety-параграфы и H2 не открывают новый цикл: это стабильные
guardrails и оправданная навигационная грамматика, а не P0/P1.

## Полный машинный аудит

Обе команды запускались с абсолютными путями.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\scripts\audit-archetype-portfolio.ps1" `
  -DraftsPath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\drafts" `
  -ManifestPath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\portfolio-routes.json" `
  -EvidencePath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\portfolio-evidence.json" `
  -FailOnBlocker
```

Фактический результат:

```text
exit: 0
Files: 26
Words: 38302
ManifestAssets: 26
IndexAssets: 24
ConsolidationHolds: 2
RouteCtaMarkers: 24
DirectArticleRoutes: 2
EvidenceItems: 42
EvidenceNeedsLocator: 0
Blockers: 0
PublicationBlockers: 4
```

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\scripts\audit-archetype-portfolio.ps1" `
  -DraftsPath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\drafts" `
  -ManifestPath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\portfolio-routes.json" `
  -EvidencePath "C:\Users\Ugis\Documents\Codex\2026-07-24\files-mentioned-by-the-user-codex\production\evolution-school-archetypes\docs\seo\archetypes\production\portfolio-evidence.json" `
  -FailOnPublicationBlocker
```

Ожидаемый и фактический результат: exit `2`.

## Актуальные publication blockers

### PUB-01. S01 `/test-arhetipov/`

- `portfolio-routes.json:69` — recorded `live_http_status: 404`;
- свежий HTTP: `404`.

Минимальное закрытие: реализовать узел и подтвердить final `200`, canonical,
schema, breadcrumbs и отсутствие test-loop для `code_known`.

### PUB-02. S02 `/arhetipy/`

- `portfolio-routes.json:79` — recorded `live_http_status: 404`;
- свежий HTTP: `404`;
- legacy `/arhetipy.html` отвечает `200`.

Минимальное закрытие: собрать S02, выполнить утверждённую миграцию
`/arhetipy.html` → `/arhetipy/`, проверить один 301 hop, self-canonical и одну
sitemap entry.

### PUB-03. S03 `/zhenskie-arhetipy/`

- `portfolio-routes.json:87` — recorded `live_http_status: 404`;
- свежий HTTP: `404`.

Минимальное закрытие: собрать карту женской восьмёрки и подтвердить final `200`,
ссылки R01–R08, canonical, schema и breadcrumbs.

### PUB-04. Render/runtime не реализован

- `portfolio-routes.json:44` —
  `render_contract.publication_state: not_implemented`;
- `portfolio-routes.json:45–51` — обязательные generator, state-based CTA,
  system nodes, schema/breadcrumbs и staging link crawl.

Минимальное закрытие: реализовать воспроизводимую Markdown → HTML сборку и
`route-cta`, покрыть state fixtures и staging crawl, затем менять
`publication_status` поштучно после live проверки.

Evidence больше не является publication blocker.

## JSON и diff

```text
portfolio-routes.json: VALID JSON, schema_version=2
portfolio-evidence.json: VALID JSON
custom invariants: 0 issues
local verified sources missing: 0
Margarita draft/source hits: 0
DENY-MARGARITA-001: 1
git diff --check: exit 0
```

`git diff --check` сообщил только предупреждения о будущем LF → CRLF при
записи. Whitespace errors отсутствуют.

## Следующий допустимый статус

Текущий корректный статус — `PASS EDITORIAL / HOLD PUBLICATION`.

`PASS PUBLICATION` возможен только после закрытия PUB-01–04, успешного
`-FailOnPublicationBlocker`, staging/live crawl и поштучной проверки
активируемых canonical.
