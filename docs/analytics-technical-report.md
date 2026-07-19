# Технический отчёт: GA4, GTM и consent

Дата: 2026-07-19  
Production: `https://evolution.yourbalancerestored.com/`

## Состояние до изменений

В исходниках и на production не обнаружены:

- Google Analytics 4;
- Google Tag Manager;
- Universal Analytics;
- Meta Pixel;
- TikTok Pixel;
- другие общие analytics tags;
- cookie banner;
- Consent Mode.

Headless Chrome проверил главную, Навигатор и скрытый продающий лендинг: 40 сетевых запросов, 0 запросов к Google Analytics/GTM, Meta Pixel или TikTok Pixel.

## Реализовано

- Общая архитектура GTM → GA4 без прямого второго GA4.
- Basic Consent Mode v2: GTM физически не загружается до согласия.
- До выбора: `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = `denied`.
- После разрешения аналитики: только `analytics_storage` = `granted`; рекламные параметры остаются `denied`.
- Сохранение и изменение выбора пользователя.
- Нейтральный адаптивный consent UI; он появляется только при валидном GTM ID.
- Единый `dataLayer`-контракт и whitelist параметров.
- Защита от email/телефона в строковых параметрах событий.
- First-touch UTM: до согласия только в памяти страницы, после согласия — в `localStorage`; внутренний прямой переход не перезаписывает источник.
- Автоматические клики Telegram, внутренних CTA, оплаты GetCourse и внешних ссылок.
- Реальные `navigator_start` и `navigator_complete` в существующем Навигаторе.
- Hooks для подтверждённого lead и будущих тестов.

## События

| Событие | Статус |
|---|---|
| `telegram_click` | Реализовано и проверено |
| `program_cta_click` | Реализовано и проверено |
| `payment_click` | Реализовано и проверено; известные продукты получают точную цену, остальные — без выдуманного `value` |
| `outbound_click` | Реализовано и проверено |
| `navigator_start` | Реализовано в Навигаторе и проверено |
| `navigator_complete` | Реализовано в Навигаторе и проверено |
| `generate_lead` | Безопасный hook готов; автоматическая отправка невозможна без достоверного success callback стороннего GetCourse widget |
| `test_start` | Hook готов; на текущем сайте не найден интерактивный тест с явным моментом старта |
| `test_complete` | Hook готов; на текущем сайте не найден интерактивный тест с обезличенным программным результатом |
| `purchase` | Намеренно не реализовано: браузерный клик не подтверждает оплату |

## Персональные данные

События используют whitelist. Не передаются имя, email, телефон, Telegram username посетителя, текст формы, ответы теста, сведения о здоровье/травме, CRM ID или платёжные данные. `page_path` не содержит query string.

## Проверки

| Проверка | Результат |
|---|---|
| `npm run lint` | 19 JS/MJS файлов, 0 синтаксических ошибок |
| `npm run typecheck` | TypeScript-исходников нет; schema-аудит событий пройден |
| `npm run build` | Пройден; SEO 0 errors, analytics 0 errors |
| `npm test` | Пройден |
| `npm run analytics:audit` | 56 HTML-файлов, общий слой ровно по одному разу, 0 дублей |
| `npm run analytics:smoke` | accept/reject/revisit, UTM, PII, 4 click events, Navigator, mobile, no-ID blocking — пройдено |
| `npm run seo:smoke` | 15 route/viewport проверок, 0 failures |
| `npm run seo:production-smoke` | 55 production URLs, 0 failures |
| `npm run analytics:production-smoke` | 3 routes, 40 requests, 0 analytics/pixel vendor requests |

## Ограничения до включения

1. Нет реального GTM Container ID.
2. Нет GA4 Measurement ID и GA4 property/data stream.
3. Нельзя проверить Tag Assistant, Realtime и DebugView без этих ресурсов.
4. Нейтральный технический текст consent UI требует юридического утверждения до показа пользователям.
5. `generate_lead` нельзя честно отправлять из GetCourse до появления надёжного success callback или server-side интеграции.

До появления валидного GTM ID `analytics-config.js` содержит пустое значение, UI не показывается и Google-скрипты не загружаются. Vercel запускает `npm run build`; build читает `EVOLUTION_HOUSE_GTM_ID`, валидирует его и генерирует общий config.
