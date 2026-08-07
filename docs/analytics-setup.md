# Direct GA4 and Yandex Metrika: Evolution House

## Architecture

Evolution House uses **direct Google Analytics 4** with the Google tag:

`G-RSEE3PKS5V`

The same analytics layer loads **Yandex Metrika** counter:

`111024711`

Google Tag Manager is not used. `GTM-WNV2B49K` is intentionally unused and must not be imported, published, embedded, or referenced by the site.

The site uses **Advanced Consent Mode v2 for Google** and explicit opt-in for Yandex:

- before a visitor chooses, GA4 loads after an all-denied Consent Mode default and sends cookieless pings without GA cookies; Yandex Metrika remains absent;
- “Only necessary” keeps Google in denied cookieless mode and Yandex blocked across pages and refreshes;
- after “Allow analytics”, the site updates only `analytics_storage` to granted and loads one Yandex Metrika tag; the already loaded Google tag begins full analytics collection;
- `ad_storage`, `ad_user_data`, and `ad_personalization` always remain `denied`;
- revoking analytics queues an all-denied Google consent update, removes safe first-party analytics cookies, blocks custom events, and reloads into Google cookieless mode with Yandex absent.

The deterministic order on every page is:

1. `gtag('consent', 'default', { all four: 'denied' })`
2. one `https://www.googletagmanager.com/gtag/js?id=G-RSEE3PKS5V` request
3. one `gtag('config', 'G-RSEE3PKS5V', { send_page_view: true })`
4. after opt-in, `gtag('consent', 'update', { analytics_storage: 'granted', advertising keys: 'denied' })`
5. after opt-in, one `https://mc.yandex.ru/metrika/tag.js` request
6. after opt-in, one `ym(111024711, 'init', …)` command with Webvisor, Click Map, and automatic link tracking disabled

## Repository files

- `analytics.js` — consent banner, direct GA4 and Yandex Metrika loaders, Basic Consent Mode v2 ordering for Google, first-party choice storage, safe cookie removal, and centralized event API.
- `cookie-consent.css` — shared banner styles.
- `scripts/analytics-audit.mjs` — static production guardrails.
- `scripts/analytics-smoke.mjs` — clean-browser consent and event acceptance tests.

No Google Tag Manager artefacts are part of the production deliverable. Nothing needs to be imported or published in GTM.

## Events and privacy

Allowed events also include the article funnel: `article_view`, `related_article_click`, `cta_impression`, `product_click`, `lead_start`, and `lead_submit`. Existing navigation, Telegram, payment, and compatibility events remain supported.

Events are dispatched only after analytics consent is granted. GA4 receives the existing event name through `gtag`; Yandex Metrika receives the same sanitized event through `ym(111024711, 'reachGoal', …)`. Parameters are allowlisted and values that look like email addresses, phones, Telegram usernames, or other personal data are removed. `payment_click` is an interaction event, not a purchase event.

Yandex Metrika does not use Webvisor, Click Map, ecommerce, or a Metrika `dataLayer`.

## Local checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run analytics:smoke
npm run seo:smoke
```

No Google Tag Manager publication, import, Custom Template, Tag Assistant workspace, or additional consent configuration is required.
