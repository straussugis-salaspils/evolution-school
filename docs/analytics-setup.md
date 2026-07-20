# Direct GA4: Evolution House

## Architecture

Evolution House uses **direct Google Analytics 4** with the Google tag:

`G-RSEE3PKS5V`

Google Tag Manager is not used. `GTM-WNV2B49K` is intentionally unused and must not be imported, published, embedded, or referenced by the site.

The site uses **Basic Consent Mode v2**:

- before a visitor chooses, neither `gtag.js` nor `window.dataLayer` is created;
- “Only necessary” keeps GA4 blocked across pages and refreshes;
- after “Allow analytics”, the site creates `dataLayer` and `gtag`, queues the Consent Mode default with all four keys denied, queues an update with only `analytics_storage: granted`, then loads the single direct Google tag and queues one GA4 `config` command;
- `ad_storage`, `ad_user_data`, and `ad_personalization` always remain `denied`;
- revoking analytics queues an all-denied consent update, removes safe first-party GA cookies, blocks new custom events, and reloads into the no-tag state.

The deterministic order after consent is:

1. `gtag('consent', 'default', { all four: 'denied' })`
2. `gtag('consent', 'update', { analytics_storage: 'granted', advertising keys: 'denied' })`
3. one `https://www.googletagmanager.com/gtag/js?id=G-RSEE3PKS5V` request
4. one `gtag('config', 'G-RSEE3PKS5V', { send_page_view: true })`

## Repository files

- `analytics.js` — consent banner, direct GA4 loader, Basic Consent Mode v2 ordering, first-party choice storage, safe cookie removal, and centralized event API.
- `cookie-consent.css` — shared banner styles.
- `scripts/analytics-audit.mjs` — static production guardrails.
- `scripts/analytics-smoke.mjs` — clean-browser consent and event acceptance tests.

No Google Tag Manager artefacts are part of the production deliverable. Nothing needs to be imported or published in GTM.

## Events and privacy

Allowed events: `generate_lead`, `navigator_start`, `navigator_complete`, `test_start`, `test_complete`, `telegram_click`, `program_cta_click`, `payment_click`, and `outbound_click`.

Events are dispatched only after GA4 is initialized and analytics consent is granted. Parameters are allowlisted and values that look like email addresses, phones, Telegram usernames, or other personal data are removed. `payment_click` is an interaction event, not a purchase event.

## Local checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run analytics:smoke
npm run seo:smoke
```

No Google Tag Manager publication, import, Custom Template, Tag Assistant workspace, or additional consent configuration is required.
