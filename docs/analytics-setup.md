# Direct GA4 and Yandex Metrika: Evolution House

## Architecture

Evolution House uses **direct Google Analytics 4** with the Google tag:

`G-RSEE3PKS5V`

The same analytics layer loads **Yandex Metrika** counter:

`111024711`

Google Tag Manager is not used. `GTM-WNV2B49K` is intentionally unused and must not be imported, published, embedded, or referenced by the site.

The site uses **Advanced Consent Mode v2 for Google** and an owner-approved always-on standard Yandex Metrika tag:

- before a visitor chooses, the site queues an all-denied Google consent default and loads GA4 in cookieless mode; `analytics_storage` remains denied and Google analytics cookies are not created;
- “Google without cookies” keeps Google in cookieless mode across pages and refreshes;
- Yandex Metrika loads on every visit, independently of the Google choice, and may use its standard cookies or `localStorage` identifiers;
- after “Allow Google cookies”, the site updates Google with only `analytics_storage: granted`;
- `ad_storage`, `ad_user_data`, and `ad_personalization` always remain `denied`;
- revoking Google analytics queues an all-denied Google consent update and removes safe first-party Google Analytics cookies; Yandex remains active.

Yandex Metrika has no supported counterpart to Google Advanced Consent Mode that both avoids browser identifiers and still records useful visits. By the owner's explicit decision, its standard tag runs before and after the Google choice and uses its normal anonymous identifiers in cookies or `localStorage`.

The deterministic order is:

1. `gtag('consent', 'default', { all four: 'denied' })`
2. one `https://www.googletagmanager.com/gtag/js?id=G-RSEE3PKS5V` request
3. one `gtag('config', 'G-RSEE3PKS5V', { send_page_view: true })` command while analytics storage is denied
4. one `https://mc.yandex.ru/metrika/tag.js` request on every visit
5. one `ym(111024711, 'init', …)` command with Webvisor, Click Map, and automatic link tracking disabled
6. after Google opt-in, `gtag('consent', 'update', { analytics_storage: 'granted', advertising keys: 'denied' })`

## Repository files

- `analytics.js` — consent banner, direct GA4 and Yandex Metrika loaders, Advanced Consent Mode v2 ordering for Google, first-party choice storage, safe cookie removal, and centralized event API.
- `cookie-consent.css` — shared banner styles.
- `scripts/analytics-audit.mjs` — static production guardrails.
- `scripts/analytics-smoke.mjs` — clean-browser consent and event acceptance tests.

No Google Tag Manager artefacts are part of the production deliverable. Nothing needs to be imported or published in GTM.

## Events and privacy

Allowed events: `generate_lead`, `navigator_start`, `navigator_complete`, `test_start`, `test_complete`, `telegram_click`, `program_cta_click`, `payment_click`, `outbound_click`, `article_view`, `related_article_click`, `cta_impression`, `product_click`, `lead_start`, and `lead_submit`.

Yandex Metrika receives sanitized custom events on every visit through `ym(111024711, 'reachGoal', …)`. GA4 receives those custom events through `gtag` only after Google analytics cookies are allowed; before that, Google receives only its Advanced Consent Mode cookieless measurement. Parameters are allowlisted and values that look like email addresses, phones, Telegram usernames, or other personal data are removed. `payment_click` is an interaction event, not a purchase event.

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
