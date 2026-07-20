# Подключение Evolution House к поисковым системам

Production URL: `https://evolution.yourbalancerestored.com/`

Sitemap: `https://evolution.yourbalancerestored.com/sitemap.xml`

Robots: `https://evolution.yourbalancerestored.com/robots.txt`

Эти действия выполняются после публикации текущей SEO-версии. Не добавляйте verification-коды в проект заранее: Google и Bing выдают их для конкретного аккаунта и способа подтверждения.

## Google Search Console

1. Откройте [Google Search Console](https://search.google.com/search-console/).
2. Добавьте Domain property `evolution.yourbalancerestored.com`. Для Domain property Google требует DNS-подтверждение. Если нет доступа к DNS, добавьте URL-prefix property `https://evolution.yourbalancerestored.com/` и используйте один из предложенных Google способов подтверждения.
3. Не удаляйте DNS TXT-record или verification-файл после подтверждения: доступ к property зависит от сохранения verification token.
4. Откройте раздел Sitemaps и отправьте `https://evolution.yourbalancerestored.com/sitemap.xml`.
5. Убедитесь, что sitemap имеет статус Success и содержит только канонические индексируемые URL.
6. Через URL Inspection проверьте и при необходимости запросите индексацию ключевых страниц:
   - `https://evolution.yourbalancerestored.com/`
   - `https://evolution.yourbalancerestored.com/napravleniya.html`
   - `https://evolution.yourbalancerestored.com/arhetipy.html`
   - `https://evolution.yourbalancerestored.com/urovni-zhizni/`
   - `https://evolution.yourbalancerestored.com/vnutrennyaya-svoboda.html`
   - `https://evolution.yourbalancerestored.com/reiki-napravlenie.html`
7. После первого обхода проверьте Page indexing, HTTPS и Core Web Vitals. Не отправляйте вручную все 43 URL: sitemap и внутренняя навигация предназначены для массового обнаружения.

Официальные инструкции: [добавление property](https://support.google.com/webmasters/answer/34592), [подтверждение владения](https://support.google.com/webmasters/answer/9008080), [sitemap report](https://support.google.com/webmasters/answer/7451001), [URL Inspection](https://support.google.com/webmasters/answer/9012289).

## Bing Webmaster Tools

1. Откройте [Bing Webmaster Tools](https://www.bing.com/webmasters/).
2. Самый простой путь после настройки Google — импортировать подтверждённый сайт из Google Search Console. Bing импортирует property и известные sitemap.
3. Альтернатива: добавьте `https://evolution.yourbalancerestored.com/` вручную и подтвердите владение предложенным Bing способом.
4. В разделе Sitemaps проверьте или отправьте `https://evolution.yourbalancerestored.com/sitemap.xml`.
5. Проверьте отсутствие crawl errors для главной страницы и четырёх страниц направлений.

Официальные инструкции: [добавление и подтверждение сайта](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b), [sitemap в Bing](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed).

## Что проверить после каждого релиза

В корне проекта выполните:

```powershell
npm run seo:write
npm run seo:audit
```

`seo:write` пересобирает `sitemap.xml` и `docs/seo-page-inventory.md` из фактических HTML-файлов. `seo:audit` проверяет metadata, canonical, robots, H1, JSON-LD, локальные ссылки и изображения.

После публикации дополнительно проверьте:

```powershell
Invoke-WebRequest https://evolution.yourbalancerestored.com/robots.txt
Invoke-WebRequest https://evolution.yourbalancerestored.com/sitemap.xml
```

## Правила поддержки

- Новая публичная индексируемая страница должна иметь `index, follow`, абсолютный self-canonical, уникальные title/description, Open Graph и один H1.
- Скрытый продающий лендинг остаётся `noindex, nofollow`, не входит в sitemap и получает canonical на публичную версию продукта.
- Служебная страница `/18-18-18/` остаётся `noindex, nofollow` и не входит в sitemap.
- Redirect alias не должен входить в sitemap; основной redirect хранится в `vercel.json`.
- Не добавляйте в sitemap URL с `noindex`, redirect, тестовые routes или standalone-дубликаты.
