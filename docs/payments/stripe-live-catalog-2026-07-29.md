# Stripe Live catalog — 2026-07-29

> Production payment links for Resulta Consulting FZ-LLC. All prices are one-off charges in EUR. Customer email is collected by Stripe Checkout; customer name collection is enabled. Shipping address collection is disabled.

| Product | Amount | Product ID | Price ID | Live Payment Link | Existing GetCourse widget |
|---|---:|---|---|---|---|
| Вкус лёгкости | €150 | `prod_Uy9YKnsMjnXTMx` | `price_1TyDFR1Odj14isuiTVXaCLm6` | `https://buy.stripe.com/3cI4grh2d1s42nl42r9Zm00` | `1615024` |
| Вкус силы | €150 | `prod_UyOrrmBlKfTWv8` | `price_1TyS4G1Odj14isuiZq3SB4CK` | `https://buy.stripe.com/4gM00beU5b2Egeb2Yn9Zm02` | `1615030` |
| Пакет двух недель | €230 | `prod_UyOu3tJKs0O4PF` | `price_1TyS6i1Odj14isuiao2lSKqt` | `https://buy.stripe.com/6oU8wH3bn9YA5zx6az9Zm03` | `1615058` |
| Рейки I | €150 | `prod_UyOxyFT3qQyYw0` | `price_1TyS9A1Odj14isuigA1kR3IS` | `https://buy.stripe.com/00wbIT13f8Uw7HF1Uj9Zm04` | `1623511` |
| Рейки II | €500 | `prod_UyOyjpuVcS3U8w` | `price_1TySL11Odj14isuiQRIpewaK` | `https://buy.stripe.com/5kQ7sD3bn3Acfa78iH9Zm05` | `1623514` |
| Тренинг Off-Switch в записи | €300 | `prod_UyOy5IiArH41Mv` | `price_1TySAj1Odj14isuieQ0yyXK1` | `https://buy.stripe.com/6oUeV5bHT0o05zxcyX9Zm07` | `1630846` |
| Квантовая активация — одна активация | €700 | `prod_UyOzebvCSrX1Ar` | `price_1TySBS1Odj14isuiuyCRJ5MI` | `https://buy.stripe.com/6oUaEP13f5Ik8LJ9mL9Zm08` | `1630435` |
| Квантовая активация — 100 дней | €1,500 | `prod_UyP0b4c6AH3Ss6` | `price_1TySRk1Odj14isuiYRfNGAvg` | `https://buy.stripe.com/8x2fZ9cLXfiU1jh9mL9Zm09` | `1630433` |
| Навигатор со Светланой | €300 | `prod_UyP0fiCeVx5aP4` | `price_1TySCW1Odj14isuiNi2PDO6V` | `https://buy.stripe.com/4gM14ffY9daMfa7buT9Zm0a` | `1630285` |

## Production website behaviour

- The primary action is **«Оплата картой»** and opens the matching Stripe Live Payment Link.
- The secondary action is **«Оплата картой российского банка»** and reveals the existing GetCourse widget.
- GetCourse is not requested before the visitor chooses the secondary action.
- Existing product CTA text and GetCourse widget IDs are preserved.
- Public product pages and their standalone sales copies use the same payment choice.
- Product descriptions in Stripe use the current wording from the Evolution House homepage. The two-week package uses only the two exact homepage schedule lines and does not add an invented offer.

## Currency corrections

- Рейки II uses `€500 EUR` as its default active price. The accidentally created AED price was archived.
- Квантовая активация — 100 дней uses `€1,500 EUR` as its default active price. The accidentally created AED price was archived.
- An extra Off-Switch Payment Link created during catalog setup (`plink_1TySXK1Odj14isuiCyxJyB1g`) was deactivated. The website uses the single active link listed in the table.

## Sandbox

The Sandbox catalog remains documented separately for test history. No Sandbox Payment Link is referenced by production HTML or JavaScript.
