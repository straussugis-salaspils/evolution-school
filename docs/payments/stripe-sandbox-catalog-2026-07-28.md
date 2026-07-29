# Stripe Sandbox catalog — 2026-07-28

> These links belong to Stripe Sandbox. They must not be published as production payment links.

| Product | Amount | Product ID | Price ID | Sandbox Payment Link | Existing GetCourse widget |
|---|---:|---|---|---|---|
| Вкус лёгкости | €150 | `prod_Uy8qH3UkiGLMII` | `price_1TyCZH1Odj14isuiAMGpfvIC` | `https://buy.stripe.com/test_3cI4grh2d1s42nl42r9Zm00` | `1615024` |
| Вкус силы | €150 | `prod_UyBbRXwNFBJsB5` | `price_1TyFED1Odj14isuiBmbkK4ch` | `https://buy.stripe.com/test_aFa9AL8vH5Ikfa78iH9Zm01` | `1615030` |
| Пакет двух недель | €230 | `prod_UyByhJmUiCIRtR` | `price_1TyFaq1Odj14isuiZJXEaChw` | `https://buy.stripe.com/test_4gM00beU5b2Egeb2Yn9Zm02` | `1615058` |
| Рейки I | €150 | `prod_UyC39Y4BNIe4a2` | `price_1TyFfA1Odj14isui1IhYUHQO` | `https://buy.stripe.com/test_6oU8wH3bn9YA5zx6az9Zm03` | `1623511` |
| Рейки II | €500 | `prod_UyELDuMb5PGBmi` | `price_1TyHsh1Odj14isuif50VzrUN` | `https://buy.stripe.com/test_6oUaEP13f5Ik8LJ9mL9Zm08` | `1623514` |
| Тренинг Off-Switch в записи | €300 | `prod_UyC32UX9Dsb977` | `price_1TyFfr1Odj14isuiomwPBlEB` | `https://buy.stripe.com/test_00wbIT13f8Uw7HF1Uj9Zm04` | `1630846` |
| Квантовая активация — одна активация | €700 | `prod_UyC486Bkxclq6z` | `price_1TyFgl1Odj14isuiiEW1ZfJr` | `https://buy.stripe.com/test_5kQ7sD3bn3Acfa78iH9Zm05` | `1630435` |
| Квантовая активация — 100 дней | €1,500 | `prod_UyCEqREColzwM0` | `price_1TyFpo1Odj14isuiadwSQ99u` | `https://buy.stripe.com/test_dRmfZ927j1s44vtdD19Zm06` | `1630433` |
| Навигатор со Светланой | €300 | `prod_UyDqqf6nCM4AIt` | `price_1TyHP11Odj14isuiArg6ZY51` | `https://buy.stripe.com/test_6oUeV5bHT0o05zxcyX9Zm07` | `1630285` |

## Local website behaviour

- The primary action is **«Оплата картой»** and opens the matching Stripe Sandbox Payment Link.
- The secondary action is **«Оплата картой российского банка»** and reveals the existing GetCourse widget.
- GetCourse is not requested before the visitor chooses the secondary action.
- Existing product CTAs and GetCourse widget IDs are preserved.
- Public product pages and their standalone sales copies use the same payment choice.
- Product descriptions in Stripe use the exact current wording from the Evolution House homepage where that product appears there. The two-week package is not listed on the homepage, so its description was not invented or overwritten.

## Live-mode cleanup

The accidentally created live Payment Link for «Вкус силы» was deactivated and the corresponding live product `prod_UyBUMn2QfCTegd` was archived. The pre-existing live «Вкус лёгкости» product was not changed.
