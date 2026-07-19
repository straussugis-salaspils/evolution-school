# UTM-разметка Evolution House

Использовать lowercase, латиницу, дефисы или подчёркивания. Не создавать параллельные варианты одного источника (`ig`, `Instagram`, `instagram`). Утверждённый вариант — `instagram`.

## Параметры

| Параметр | Назначение | Пример |
|---|---|---|
| `utm_source` | Площадка/отправитель | `instagram`, `facebook`, `tiktok`, `youtube`, `telegram`, `email` |
| `utm_medium` | Тип канала | `organic_social`, `paid_social`, `video`, `messenger`, `email` |
| `utm_campaign` | Кампания | `reels_july_2026`, `off_switch_launch_2026` |
| `utm_content` | Конкретный креатив | `reel_07`, `story_03`, `email_button_1` |
| `utm_term` | Ключ/аудитория, если применимо | `warm_audience`, `anxiety_interest` |

## Примеры

```text
https://evolution.yourbalancerestored.com/off-switch-samostoyatelno.html?utm_source=instagram&utm_medium=organic_social&utm_campaign=reels_july_2026&utm_content=reel_07
```

```text
https://evolution.yourbalancerestored.com/reiki/?utm_source=email&utm_medium=email&utm_campaign=reiki_1_august_2026&utm_content=main_cta
```

## Правила

- Не добавлять UTM к внутренним ссылкам сайта.
- Не включать имена, email, телефоны, Telegram usernames, ответы тестов или сведения о здоровье.
- Не использовать полный текст публикации как `utm_content`; использовать короткий стабильный ID.
- Не менять `utm_source` между публикациями одной площадки.
- Сначала проверять URL, затем сокращать его внешним сервисом при необходимости.

После согласия на аналитику общий модуль сохраняет первый источник входа в `localStorage` под ключом `eh_first_touch_v1`. До согласия данные существуют только в памяти текущей страницы. Прямой переход внутри сайта не перезаписывает уже сохранённый источник. Сохраняются только стандартные UTM, landing path и timestamp; query string целиком не сохраняется.
