# GTM and GA4: Evolution House

## Architecture

The site uses **Basic Consent Mode**. Before a visitor chooses analytics, GTM and GA4 are not loaded at all. Choosing “Only necessary” keeps them blocked, including after refresh. Choosing “Allow analytics” loads GTM once.

The consent state is deliberately configured **inside GTM**, rather than with page-level `gtag('consent', ...)` calls:

- default: `analytics_storage`, `ad_storage`, `ad_user_data`, and `ad_personalization` are all `denied`;
- saved analytics permission: only `analytics_storage` is updated to `granted`;
- the three advertising consent types remain `denied`.

This preserves Basic Consent Mode while giving Tag Assistant a real Consent Mode v2 state.

## Repository files

- `analytics.js` — banner, Basic Mode GTM loading gate, first-party preference cookie `eh_consent_v2`, and the update callback bridge. It does **not** issue `gtag('consent')` commands.
- `gtm/evolution-house-container.json` — Google tag `G-RSEE3PKS5V` and allowed GA4 custom-event tag. Neither tag has Additional Consent Checks.
- `gtm/evolution-house-consent-mode-v2.tpl` — importable GTM custom tag template. It uses the supported `setDefaultConsentState` and `updateConsentState` APIs.

The normal GTM `noscript` iframe is intentionally absent: in Basic Mode it would bypass the on-page loading gate.

## Replace the unpublished GTM workspace

Do this in the **existing GTM container `GTM-WNV2B49K` only**. Do not publish while preview testing.

1. In GTM, open **Admin → Import Container** and import `gtm/evolution-house-container.json` into a **new workspace**. Choose **Merge**. This replaces the two earlier GA4 tag definitions without their obsolete “Require additional consent” setting.
2. Open **Templates → Tag Templates → New → Import**, select `gtm/evolution-house-consent-mode-v2.tpl`, and save it as **Evolution House — Consent Mode v2**. Confirm its only requested permissions:
   - write consent for `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`;
   - read cookie `eh_consent_v2`;
   - execute global callback `ehAddConsentListener`.
3. Create one new tag from that template, name it **Evolution House — Consent Mode v2**, and attach the built-in trigger **Consent Initialization — All Pages**. Do not use All Pages for this tag.
4. Open the Google tag and the GA4 custom-events tag. In **Consent Settings**, set **Additional Consent Checks** to **Not set / No additional consent required**. Google Analytics tags perform their own consent checks.
5. Confirm Google tag settings: `G-RSEE3PKS5V`, trigger **All Pages**, one automatic `page_view`. Do not create a second page-view tag and do not add direct `gtag.js`.

## Required Preview acceptance test

Use GTM Preview/Tag Assistant against the analytics branch preview or a locally reachable build:

1. **Fresh visitor:** clear `eh_consent_v2` cookie and local storage. There must be no `gtm.js`, no GA4 request, and no Google request.
2. **Only necessary:** click it and refresh. GTM/GA4 remain absent and no Google request is made.
3. **Allow analytics:** Tag Assistant → Consent first shows all four keys as `denied`, then shows `analytics_storage: granted`; `ad_storage`, `ad_user_data`, and `ad_personalization` remain `denied`. The Google tag fires once and one `page_view` is sent.
4. **Revoke:** open cookie settings, choose Only necessary, then refresh. No new GA4 event is sent; GTM/GA4 are absent after refresh.

Do not publish the GTM workspace or deploy the branch until all four pass.

## Events

Allowed events: `generate_lead`, `navigator_start`, `navigator_complete`, `test_start`, `test_complete`, `telegram_click`, `program_cta_click`, `payment_click`, and `outbound_click`.

`generate_lead` fires only after `eh:lead-success`. No purchase event is sent. Event values are allowlisted and values resembling email addresses, phones, or Telegram usernames are stripped before they enter `dataLayer`.

## Local checks

```powershell
npm run lint
npm run typecheck
npm run build
npm run analytics:smoke
npm run seo:smoke
```

The automated smoke test validates the Basic Mode gate, saved reject state, one GTM script after acceptance, consent-update callback behavior on revocation, PII stripping, navigation events, and mobile overflow. GTM Preview remains the final check for the container-side consent ordering.
