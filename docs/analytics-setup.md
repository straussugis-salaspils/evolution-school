# Direct GA4 and Yandex Metrika: Evolution House

## Architecture

Evolution House uses **direct Google Analytics 4** with the Google tag:

`G-RSEE3PKS5V`

The same analytics layer loads **Yandex Metrika** counter:

`111024711`

Google Tag Manager is not used. `GTM-WNV2B49K` is intentionally unused and must not be imported, published, embedded, or referenced by the site.

The site uses **Basic Consent Mode v2**:

- before a visitor chooses, neither GA4 nor Yandex Metrika is loaded; `gtag`, `dataLayer`, and `ym` are absent;
- “Only necessary” keeps both systems blocked across pages and refreshes;
- after “Allow analytics”, the site creates `dataLayer` and `gtag`, queues the Consent Mode default with all four keys denied, queues an update with only `analytics_storage: granted`, then loads one direct Google tag and one Yandex Metrika tag;
- `ad_storage`, `ad_user_data`, and `ad_personalization` always remain `denied`;
- revoking analytics queues an all-denied Google consent update, removes safe first-party analytics cookies, blocks new events for both systems, and reloads into the no-tag state.

The deterministic order after consent is:

1. `gtag('consent', 'default', { all four: 'denied' })`
2. `gtag('consent', 'update', { analytics_storage: 'granted', advertising keys: 'denied' })`
3. one `https://www.googletagmanager.com/gtag/js?id=G-RSEE3PKS5V` request
4. one `gtag('config', 'G-RSEE3PKS5V', { send_page_view: true })`
5. one `https://mc.yandex.ru/metrika/tag.js` request
6. one `ym(111024711, 'init', …)` command with Webvisor, Click Map, and automatic link tracking disabled

## Repository files

- `analytics.js` — consent banner, direct GA4 and Yandex Metrika loaders, Basic Consent Mode v2 ordering for Google, first-party choice storage, safe cookie removal, and centralized event API.
- `cookie-consent.css` — shared banner styles.
- `scripts/analytics-audit.mjs` — static production guardrails.
- `scripts/analytics-smoke.mjs` — clean-browser consent and event acceptance tests.

No Google Tag Manager artefacts are part of the production deliverable. Nothing needs to be imported or published in GTM.

## Events and privacy

Allowed events: `generate_lead`, `navigator_start`, `navigator_complete`, `test_start`, `test_complete`, `telegram_click`, `program_cta_click`, `payment_click`, and `outbound_click`.

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
