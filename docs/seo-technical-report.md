# Технический SEO-отчёт Evolution House

Дата аудита: 2026-07-19  
Production URL: `https://evolution.yourbalancerestored.com/`

## Итог

Локальная SEO-версия технически готова к публикации: автоматический аудит проходит без ошибок, 43 канонические индексируемые страницы синхронизированы с sitemap, скрытые лендинги исключены из sitemap и имеют `noindex`, все локальные routes и assets существуют.

Изменения в production в рамках этой задачи не публиковались.

## Проверки

| Проверка | Статус | Результат |
|---|---|---|
| Инвентаризация | ✅ | 56 HTML-файлов: 43 публичных индексируемых, 10 скрытых/noindex, 3 redirect alias |
| Title / description | ✅ | Есть на всех содержательных страницах; дубли среди индексируемых страниц устранены |
| Canonical | ✅ | Абсолютные HTTPS URL; self-canonical у индексируемых страниц, публичный canonical у standalone-дубликатов |
| Robots meta | ✅ | `index, follow` для публичных страниц; `noindex, nofollow` для скрытых страниц |
| robots.txt | ✅ | Абсолютная ссылка на sitemap; закрыты только технические каталоги, noindex-страницы доступны роботу для чтения meta |
| sitemap.xml | ✅ | Автоматически формируется из фактических canonical; 43 URL; без hidden, redirect и технических routes |
| H1 | ✅ | Ровно один H1 на каждой содержательной странице; redirect alias исключены из этого правила |
| Open Graph / Twitter | ✅ | OG title/description/image/url и Twitter card присутствуют; URL и изображения абсолютные |
| Social image MIME | ✅ | Добавлен корректный JPEG `assets/evolution-house-social.jpg`; пиксели исходного утверждённого изображения не менялись |
| Structured data | ✅ | На главной добавлены валидные `Organization` и `WebSite`; без фиктивных рейтингов и отзывов |
| Внутренние ссылки | ⚠️ | Битых ссылок нет; три индексируемые страницы не имеют статических входящих ссылок |
| Images / alt | ✅ | 492 изображения, 0 без атрибута `alt`; отсутствующие локальные assets не найдены |
| Image dimensions | ⚠️ | У 295 изображений нет одновременно `width` и `height`; массово не изменялись из-за риска повлиять на утверждённые crop/layout |
| Hero/LCP | ✅ | На пяти ключевых страницах добавлены безопасные priority/loading/decoding hints; где проверены размеры, добавлены intrinsic dimensions |
| Local routes | ✅ | 56/56 открываются с HTTP 200 на локальном сервере |
| Production routes | ✅ | 55/55 текущих публичных и скрытых production URL, robots и sitemap отвечают HTTP 200 |
| Mobile smoke | ✅ | 5 страниц × 390/360 px: нет horizontal scroll, broken images или runtime errors |
| Desktop smoke | ✅ | 5 страниц × 1440 px: нет horizontal scroll, broken images или runtime errors |
| Lighthouse | ⚠️ | PageSpeed API вернул HTTP 429; локальный Lighthouse CLI отсутствует. Тяжёлая зависимость в проект не добавлялась |

## Исправлено

1. Все относительные Open Graph image URL заменены абсолютными production URL.
2. Для скрытых standalone-лендингов добавлены canonical и social metadata без изменения видимого контента.
3. Устранены повторяющиеся meta descriptions на 16 индексируемых страницах.
4. Слишком длинные/короткие технические title и descriptions приведены к безопасной длине на главной, в блоге, менторинге, Off-Switch 1:1, тренинге в записи и ретритах.
5. Для старых адресов индивидуального ретрита добавлены постоянные redirects в `vercel.json`; client-side alias сохранён как fallback.
6. `robots.txt` исправлен так, чтобы crawlers могли увидеть `noindex` скрытых страниц.
7. `sitemap.xml` пересобран из canonical indexable routes.
8. На главной добавлена фактическая JSON-LD схема `Organization` + `WebSite`.
9. Для пяти ключевых hero-изображений добавлены безопасные LCP hints.
10. Добавлены воспроизводимые команды `seo:audit`, `seo:write`, `seo:smoke`, `seo:production-smoke` без внешних npm-зависимостей.

## Не изменено автоматически

### Три страницы без статической входящей ссылки

- `/blog.html`
- `/prodolzhit-put.html`
- `/s-chem-priyti.html`

Они сохранены индексируемыми и в sitemap, потому что решение о добавлении ссылки в навигацию/footer либо о `noindex` меняет информационную архитектуру. Это требует отдельного решения владельца сайта.

### Изображения без intrinsic dimensions

295 изображений не имеют полной пары `width`/`height`. Добавление размеров ко всем изображениям может затронуть существующие object-fit/crop-композиции, поэтому в рамках технического SEO без редизайна это оставлено рекомендацией после запуска. У всех изображений есть `alt`.

### Полный Lighthouse

Внешний PageSpeed Insights API ответил `429 Too Many Requests`; локального Lighthouse CLI в окружении нет. В проект не устанавливалась тяжёлая зависимость только ради одноразового отчёта. После публикации рекомендуется запустить Lighthouse в Chrome DevTools на пяти страницах из smoke-набора.

## Команды проверки

```powershell
npm run seo:write
npm run seo:audit
npm run seo:smoke
npm run seo:production-smoke
git diff --check
```

У статического HTML-проекта нет отдельных framework-команд build, lint и typecheck. Их роль в SEO-контуре выполняют `node --check`, `seo:audit`, HTTP route/assets checks и browser smoke.

## Ручные действия после публикации

1. Подключить Google Search Console и Bing Webmaster Tools по инструкции `docs/search-engine-setup.md`.
2. Отправить `https://evolution.yourbalancerestored.com/sitemap.xml`.
3. Проверить главную и четыре страницы направлений через URL Inspection.
4. Запустить Lighthouse Mobile после публикации и сохранить результаты.
5. Отдельно решить судьбу трёх страниц без входящих ссылок.

## Гарантии безопасности изменений

- Видимый дизайн не менялся.
- Тексты страниц и CTA не менялись.
- Порядок секций и карточная система не менялись.
- Существующие изображения не перегенерировались и не ретушировались.
- Добавленный social JPEG — точная копия байтов утверждённого квадратного изображения с корректным расширением.
- Публикация/deployment не выполнялись.
