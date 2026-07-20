# GTM и GA4: Evolution House

Сайт использует Basic Consent Mode. До выбора пользователя GTM и GA4 не загружаются; при согласии разрешается только `analytics_storage`. Рекламные параметры остаются `denied`.

## Код сайта

- GTM container: `GTM-WNV2B49K`.
- GA4 Measurement ID: `G-RSEE3PKS5V` — используется только внутри GTM, не подключается напрямую на сайт.
- Общий `analytics.js` создаёт `window.dataLayer`, хранит согласие и блокирует отправку событий без согласия.
- Стандартный GTM `noscript` iframe намеренно не установлен: при Basic Consent Mode он обошёл бы запрет на загрузку Google до выбора.

## GTM container

`gtm/evolution-house-container.json` — JSON-шаблон для импорта в web-container. GTM при импорте назначает свои числовые account/container IDs; после импорта обязательно проверить результат в Preview до Publish.

В контейнере должны остаться только:

1. Google tag `G-RSEE3PKS5V`, trigger All Pages, Additional Consent = `analytics_storage`.
2. Один GA4 Event tag для девяти событий, trigger `Evolution House — permitted custom events`, Additional Consent = `analytics_storage`.

Не создавать ручной второй `page_view`, не подключать `gtag.js` напрямую и не включать Google Ads/Signals без отдельного согласия.

## Реальные события

- `telegram_click`, `program_cta_click`, `payment_click`, `outbound_click` — делегированный клик после согласия.
- `navigator_start`, `navigator_complete` — Навигатор «С чего начать».
- `generate_lead` — только через подтверждённый callback `eh:lead-success`; открытие формы не считается заявкой.

`test_start` и `test_complete` подготовлены как hooks для будущих тестов. `purchase` не отправляется.

## Проверка в GTM

1. GTM → Admin → Import Container → выбрать `gtm/evolution-house-container.json`, New workspace, Merge.
2. Preview на `https://evolution.yourbalancerestored.com/`: до выбора cookies нет GTM/GA4; после «Разрешить аналитику» GTM появляется один раз.
3. Проверить ровно один `page_view`, один клик Telegram и один CTA; затем Publish.

Текст cookie banner и политика cookies требуют юридического утверждения владельцем.
