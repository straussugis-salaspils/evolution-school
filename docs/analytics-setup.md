# Direct GA4 and Yandex Metrika: Evolution House

## Architecture

Evolution House uses **direct Google Analytics 4** with the Google tag:

`G-RSEE3PKS5V`

The same analytics layer loads **Yandex Metrika** counter:

`111024711`

Google Tag Manager is not used. `GTM-WNV2B49K` is intentionally unused and must not be imported, published, embedded, or referenced by the site.

The site uses **Advanced Consent Mode v2 for Google** and explicit opt-in for Yandex Metrika:

- before a visitor chooses, the site queues an all-denied Google consent default and loads GA4 in cookieless mode; `analytics_storage` remains denied and Google analytics cookies are not created;
- “Only necessary” keeps Google in cookieless mode across pages and refreshes while Yandex Metrika remains fully blocked;
- after “Allow analytics”, the site updates Google with only `analytics_storage: granted` and loads one Yandex Metrika tag;
- `ad_storage`, `ad_user_data`, and `ad_personalization` always remain `denied`;
- revoking analytics queues an all-denied Google consent update, removes safe first-party analytics cookies, blocks custom events, and reloads Google in cookieless mode with Yandex absent.

Yandex Metrika has no supported counterpart to Google Advanced Consent Mode that both avoids browser identifiers and still records useful visits. Its standard tag stores anonymous identifiers in cookies or `localStorage`; therefore Yandex remains behind explicit analytics consent.

The deterministic order is:

1. `gtag('consent', 'default', { all four: 'denied' })`
2. one `https://www.googletagmanager.com/gtag/js?id=G-RSEE3PKS5V` request
3. one `gtag('config', 'G-RSEE3PKS5V', { send_page_view: true })` command while analytics storage is denied
4. after opt-in, `gtag('consent', 'update', { analytics_storage: 'granted', advertising keys: 'denied' })`
5. one `https://mc.yandex.ru/metrika/tag.js` request
6. one `ym(111024711, 'init', …)` command with Webvisor, Click Map, and automatic link tracking disabled

## Repository files

- `analytics.js` — consent banner, direct GA4 and Yandex Metrika loaders, Advanced Consent Mode v2 ordering for Google, first-party choice storage, safe cookie removal, and centralized event API.
- `cookie-consent.css` — shared banner styles.
- `scripts/analytics-audit.mjs` — static production guardrails.
- `scripts/analytics-smoke.mjs` — clean-browser consent and event acceptance tests.

No Google Tag Manager artefacts are part of the production deliverable. Nothing needs to be imported or published in GTM.

## Events and privacy

Allowed events: `generate_lead`, `navigator_start`, `navigator_complete`, `test_start`, `test_complete`, `telegram_click`, `program_cta_click`, `payment_click`, and `outbound_click`.

Custom events are dispatched only after analytics consent is granted. GA4 receives the existing event name through `gtag`; Yandex Metrika receives the same sanitized event through `ym(111024711, 'reachGoal', …)`. Parameters are allowlisted and values that look like email addresses, phones, Telegram usernames, or other personal data are removed. `payment_click` is an interaction event, not a purchase event.

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
