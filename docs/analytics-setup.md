# Настройка GTM и GA4 для Evolution House

Production URL: `https://evolution.yourbalancerestored.com/`

## Реализованная архитектура

Сайт подготовлен к схеме **Google Tag Manager → Google Analytics 4**. Общий модуль `analytics.js`:

- устанавливает Consent Mode v2 со значениями `denied` до выбора;
- использует Basic Consent Mode: GTM не загружается до согласия на аналитику;
- при согласии разрешает только `analytics_storage`;
- оставляет `ad_storage`, `ad_user_data` и `ad_personalization` в состоянии `denied`;
- сохраняет выбор и позволяет изменить его через «Настройки cookies»;
- отправляет обезличенные события в `dataLayer`;
- не загружает Google-скрипты, если GTM ID отсутствует.

GA4 Measurement ID не подключается напрямую в коде сайта. Он используется внутри GTM, чтобы не получить двойной GA4 и двойные `page_view`.

## Административная настройка Google

1. Открыть [Google Analytics](https://analytics.google.com/) и создать либо выбрать аккаунт.
2. Создать отдельный GA4 property `Evolution House`.
3. Создать Web Data Stream для `https://evolution.yourbalancerestored.com/`.
4. Скопировать Measurement ID вида `G-…`.
5. Открыть [Google Tag Manager](https://tagmanager.google.com/) и создать Web container для Evolution House.
6. Скопировать Container ID вида `GTM-…`.
7. Передать оба ID Codex или добавить в production environment variables:
   - `EVOLUTION_HOUSE_GTM_ID`
   - `EVOLUTION_HOUSE_GA_MEASUREMENT_ID`
8. В GTM создать **Google tag** с GA4 Measurement ID. Использовать один Google tag на сайт.
9. Для Google tag включить стандартный автоматический `page_view` на All Pages. Не создавать второй ручной `page_view`.
10. Создать один GA4 Event tag, который получает имя из `{{Event}}`, либо отдельные event tags для контрактов ниже. Trigger: Custom Event с точным именем события.
11. В Consent settings каждого аналитического тега требовать `analytics_storage`.
12. Опубликовать container.
13. Проверить через Tag Assistant, GA4 Realtime и DebugView.
14. В GA4 отметить `generate_lead` как key event. `navigator_complete`, `test_complete` и `payment_click` отмечать только если они действительно нужны как бизнес-конверсии.
15. Связать GA4 с Google Search Console.
16. После запуска настроить исключение внутреннего трафика команды.
17. Выбрать срок хранения данных согласно политике компании.
18. До включения Google Signals и рекламных функций отдельно проверить юридические основания и consent-настройки.

## Контракт dataLayer

| Событие | Когда отправляется | Параметры |
|---|---|---|
| `generate_lead` | Только подтверждённая успешная передача контакта | `lead_type`, `program_name`, `page_path` |
| `navigator_start` | Первый выбор в Навигаторе | `entry_page`, `navigator_type`, `traffic_source` |
| `navigator_complete` | Показ результата Навигатора | `navigator_type`, `result_type`, `entry_page` |
| `test_start` | Старт подключённого теста | `test_name`, `entry_page` |
| `test_complete` | Получен обезличенный результат теста | `test_name`, `result_type` |
| `telegram_click` | Переход в Telegram | `link_location`, `link_label`, `destination_type`, `page_path` |
| `program_cta_click` | Клик по внутреннему CTA программы | `program_name`, `cta_label`, `cta_location`, `page_path` |
| `payment_click` | Открытие GetCourse/переход к оплате | `program_name`, `payment_provider`, `currency`, `value`, `page_path` |
| `outbound_click` | Значимый внешний переход, не Telegram и не оплата | `destination_domain`, `link_label`, `page_path` |

`purchase` в браузере не отправляется. Он допустим только после серверного подтверждения оплаты.

## Интеграционные hooks

GetCourse-виджеты работают в стороннем контексте и сейчас не дают проекту надёжного общего callback успешной отправки. Поэтому `generate_lead` намеренно не привязан к открытию формы или клику.

Когда появится достоверный success callback, интерфейс отправляет:

```js
document.dispatchEvent(new CustomEvent("eh:lead-success", {
  detail: { lead_type: "consultation", program_name: "Название программы" }
}));
```

Для будущих тестов используются события `eh:test-start` и `eh:test-complete`; в `detail` разрешены только заранее определённые категории, без ответов пользователя.

## Проверка

```powershell
npm run analytics:audit
npm run analytics:smoke
npm run build
```

После добавления реального GTM ID дополнительно:

1. Очистить cookies/localStorage тестового браузера.
2. Открыть Tag Assistant и production URL.
3. До согласия убедиться, что GTM/GA4 не загружены.
4. Нажать «Только необходимые» и убедиться, что Google-запросов нет.
5. Через «Настройки cookies» разрешить аналитику.
6. Убедиться, что GTM загружен один раз, а `page_view` один.
7. Проверить Telegram, CTA, payment и Навигатор по одному разу.
8. Проверить Realtime и DebugView.

## Юридическое ограничение

Текст баннера нейтральный технический. Перед включением реального GTM ID его и разделы политики privacy/cookies должен утвердить владелец или юридический консультант. До появления валидного GTM ID баннер не показывается, а Google-скрипты не загружаются.
