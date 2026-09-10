export const RELATIONSHIP_FUNNEL_V2_PAGE = String.raw`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Воронка отношений · Evolution House</title>
  <style>
    :root {
      color-scheme: light;
      --forest: #174c3d;
      --forest-deep: #10372d;
      --paper: #ffffff;
      --background: #f5f3ee;
      --ink: #26322e;
      --muted: #69746f;
      --line: #d9ded9;
      --danger: #a54f43;
      font-size: 16px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 20rem; color: var(--ink); background: var(--background); font-family: Inter,"Segoe UI",sans-serif; line-height: 1.45; }
    button { font: inherit; }
    .shell { width: min(100%,78rem); margin: 0 auto; padding: 1rem; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .4rem 0 1rem; border-bottom: 1px solid var(--line); }
    .brand { color: var(--forest-deep); font-family: Georgia,"Times New Roman",serif; font-size: .95rem; }
    .back { color: var(--forest); font-size: .88rem; text-underline-offset: .2em; }
    .heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding: 1.8rem 0 1rem; }
    h1, h2 { margin: 0; color: var(--forest-deep); font-family: Georgia,"Times New Roman",serif; font-weight: 500; letter-spacing: 0; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.25rem; }
    .subtitle { margin: .35rem 0 0; color: var(--muted); font-size: .9rem; }
    .refresh { min-height: 2.6rem; border: 1px solid var(--forest); border-radius: .45rem; background: var(--forest); color: #fff; padding: .55rem .9rem; cursor: pointer; font-weight: 700; }
    .refresh:hover { background: var(--forest-deep); }
    .refresh:disabled { cursor: wait; opacity: .65; }
    .filters { display: flex; flex-wrap: wrap; gap: .55rem; align-items: end; margin-bottom: .8rem; padding: .75rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); }
    .ranges { display: flex; flex-wrap: wrap; gap: .4rem; }
    .range { min-height: 2.5rem; border: 1px solid var(--line); border-radius: .4rem; background: #fff; color: var(--forest-deep); padding: .5rem .75rem; cursor: pointer; }
    .range[aria-pressed="true"] { border-color: var(--forest); background: var(--forest); color: #fff; }
    .date-form { display: flex; flex-wrap: wrap; gap: .4rem; align-items: end; margin-left: auto; }
    .date-field { display: grid; gap: .18rem; color: var(--muted); font-size: .7rem; font-weight: 700; }
    .date-field input { min-height: 2.5rem; border: 1px solid var(--line); border-radius: .4rem; background: #fff; color: var(--ink); padding: .45rem .55rem; font: inherit; }
    .date-submit { min-height: 2.5rem; border: 1px solid var(--forest); border-radius: .4rem; background: #fff; color: var(--forest); padding: .5rem .75rem; cursor: pointer; font-weight: 700; }
    .status { display: flex; flex-wrap: wrap; gap: .35rem 1rem; margin-bottom: 1rem; color: var(--muted); font-size: .8rem; }
    .status strong { color: var(--ink); }
    .channel-facts { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); margin-top: .8rem; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .channel-fact { padding: 1rem 0; }
    .channel-fact + .channel-fact { padding-left: 1.5rem; border-left: 1px solid var(--line); }
    .channel-fact span { display: block; color: var(--muted); font-size: .76rem; font-weight: 700; }
    .channel-fact strong { display: block; margin-top: .3rem; color: var(--forest-deep); font: 1.8rem/1 Georgia,"Times New Roman",serif; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); }
    table { width: 100%; min-width: 64rem; border-collapse: collapse; }
    th, td { padding: .9rem .8rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { background: #ecefe9; color: var(--muted); font-size: .72rem; line-height: 1.25; }
    th:first-child, td:first-child { width: 14rem; }
    tbody tr:last-child td { border-bottom: 0; }
    .total-row { background: #fbfcfa; }
    .total-row:not(:first-child) td { border-top: 2px solid var(--forest); }
    .source-row td { padding-top: .68rem; padding-bottom: .68rem; }
    .idea { color: var(--forest-deep); font-weight: 800; }
    .source { display: inline-block; padding-left: 1rem; color: var(--muted); font-size: .82rem; font-weight: 700; }
    .metric strong { display: block; color: var(--forest-deep); font: 1.55rem/1 Georgia,"Times New Roman",serif; }
    .metric span { display: block; margin-top: .35rem; color: var(--muted); font-size: .72rem; }
    .metric .weak { color: var(--danger); font-weight: 700; }
    .error { padding: 1rem; border: 1px solid #e0b7af; border-radius: .5rem; background: #fff4f1; color: var(--danger); }
    .loading { min-height: 10rem; display: grid; place-items: center; color: var(--muted); }
    .activity { margin-top: 2rem; }
    .activity > p { margin: .3rem 0 .8rem; color: var(--muted); font-size: .82rem; }
    .activity table { min-width: 82rem; }
    .report-section { margin-bottom: 2rem; }
    .report-section > p { margin: .3rem 0 .8rem; color: var(--muted); font-size: .82rem; }
    .meta-table { min-width: 68rem; }
    .change-log { margin-top: 2.5rem; padding: 1.3rem 0; border-top: 1px solid var(--line); }
    .change-log p { margin: .25rem 0 1rem; color: var(--muted); font-size: .82rem; }
    .change-log ol { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
    .change-log li { display: grid; grid-template-columns: 8.5rem minmax(0,1fr); gap: 1rem; padding-top: .75rem; border-top: 1px solid var(--line); }
    .change-log time { color: var(--muted); font-size: .76rem; font-weight: 700; }
    .change-log strong { display: block; font-size: .86rem; }
    .change-log li p { margin: .15rem 0 0; font-size: .78rem; }
    footer { padding: 2rem 0 1rem; color: var(--muted); font-size: .75rem; text-align: center; }
    @media (max-width: 720px) {
      .shell { padding: .8rem; }
      .heading { align-items: start; padding-top: 1.35rem; }
      h1 { font-size: 1.65rem; }
      .date-form { width: 100%; margin-left: 0; }
      .date-field { flex: 1 1 8rem; }
      .date-field input { width: 100%; }
      .table-wrap { overflow: visible; border: 0; background: transparent; }
      table, tbody, tr, td { display: block; min-width: 0; }
      thead { display: none; }
      tbody { display: grid; gap: .8rem; }
      tr { overflow: hidden; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); }
      .total-row:not(:first-child) td { border-top: 0; }
      .source-row { margin-left: 1rem; }
      td { display: grid; grid-template-columns: minmax(8rem,1fr) auto; gap: .8rem; align-items: center; padding: .72rem .8rem; }
      td::before { content: attr(data-label); color: var(--muted); font-size: .75rem; }
      td:first-child { display: block; width: auto; background: #ecefe9; }
      td:first-child::before { display: none; }
      .metric { text-align: right; }
      .metric strong { font-size: 1.3rem; }
      .channel-facts { grid-template-columns: 1fr; }
      .channel-fact + .channel-fact { padding-left: 0; border-top: 1px solid var(--line); border-left: 0; }
      .change-log li { grid-template-columns: 1fr; gap: .2rem; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <span class="brand">EVOLUTION HOUSE</span>
      <a class="back" href="/18-18-18/">К ссылкам команды</a>
    </header>
    <main>
      <section class="heading">
        <div>
          <h1>Воронка отношений</h1>
          <p class="subtitle">Три лендинга: общий результат и разбивка по Facebook / Instagram и YouTube.</p>
        </div>
        <button class="refresh" id="refresh" type="button">Обновить</button>
      </section>
      <section class="filters" aria-label="Выбор периода">
        <div class="ranges" id="ranges">
          <button class="range" type="button" data-range="today">Сегодня</button>
          <button class="range" type="button" data-range="yesterday">Вчера</button>
          <button class="range" type="button" data-range="7d">7 дней</button>
        </div>
        <form class="date-form" id="date-form">
          <label class="date-field">С<input id="date-from" type="date" required></label>
          <label class="date-field">По<input id="date-to" type="date" required></label>
          <label class="date-field">Часовой пояс<select id="timezone" style="min-height:2.75rem;font:inherit"><option value="Europe/Riga">Рига — как в отчёте бота</option><option value="Asia/Dubai">Дубай — как в Meta</option></select></label>
          <button class="date-submit" type="submit">Показать</button>
        </form>
      </section>
      <div class="status"><span>Период: <strong id="period">сегодня</strong></span><span id="updated">Загрузка данных...</span></div>
      <section class="report-section" aria-labelledby="channel-title">
        <h2 id="channel-title">Telegram-канал</h2>
        <p>Общие вступления считаются независимо от рекламы. Разбивка по источникам ниже показывает только вступления, связанные с индивидуальной ссылкой.</p>
        <div class="channel-facts">
          <div class="channel-fact"><span>Вступили за выбранный период</span><strong id="channel-joined">—</strong></div>
          <div class="channel-fact"><span>Подписчиков сейчас</span><strong id="channel-subscribers">—</strong></div>
        </div>
      </section>
      <section class="report-section" id="meta-snapshot" hidden></section>
      <section class="report-section"><h2>Проверка данных и передачи в Meta</h2><div id="data-health">Загрузка...</div></section>
      <section class="report-section"><h2>Фактические события по дням</h2><p>Дата самого действия в выбранном часовом поясе. Все источники. Вступления — уникальные люди за день, включая повторные вступления; это не прирост подписчиков. Завершения здесь могут относиться к тестам, начатым раньше.</p><div id="daily-facts">Загрузка...</div></section>
      <section class="report-section">
        <h2>Воронка посетителей лендингов</h2>
        <p>Период выбирает дату посещения лендинга в выбранном часовом поясе. Дальнейшие шаги — результат этих посещений на момент обновления. Посещения и нажатия — сессии, последующие шаги — уникальные люди внутри строки. Без персональной ссылки: <strong id="untracked-visits">—</strong> посещений, <strong id="untracked-clicks">—</strong> нажатий. Первый связанный переход за период: <strong id="invite-tracking">—</strong>.</p>
        <p>Главный результат привлечения — подтверждённое вступление в канал; качество — завершённый тест. CompleteRegistration в действующей рекламе означает только нажатие кнопки Telegram, не подписку. TelegramStart — начало теста, Lead — завершение теста. Meta использует окно 7 дней после клика / 1 день после просмотра; её атрибутированные результаты не обязаны совпадать с нашими событиями день в день. Для сравнения календарных суток выберите Дубай.</p>
        <div id="dashboard"><div class="loading">Загрузка...</div></div>
      </section>
      <section class="activity" aria-labelledby="activity-title">
        <h2 id="activity-title">Весь Telegram-бот</h2>
        <p>Люди, начавшие прохождение в выбранные даты, включая старых подписчиков и прямые ссылки. Каждый человек учитывается один раз по наиболее полному прохождению. Дальнейшие шаги могут быть пройдены позднее. Последняя колонка показывает нажатие кнопки программы недели.</p>
        <div id="test-activity"><div class="loading">Загрузка...</div></div>
      </section>
      <section class="change-log" aria-labelledby="change-log-title">
        <h2 id="change-log-title">Сделанные изменения</h2>
        <p>Краткая история изменений воронки и отчёта.</p>
        <ol>
          <li><time datetime="2026-09-06T10:54:00+03:00">6 сентября 2026 · исправление опубликовано в 10:54, Рига</time><div><strong>Нашли двойной подсчёт Meta-регистраций</strong><p>Срез в 10:46: Meta показывала 27 CompleteRegistration, внутренняя статистика — 21 уникальное нажатие по всем источникам и 6 фактических вступлений; в канале было 169 подписчиков. Events Manager подтвердил одновременную отправку Browser и Server. Серверный CompleteRegistration отключён, браузерный пиксель ограничен одним событием на сессию. Исторические 27 остаются завышенными; корректно сравнивать прирост Meta с внутренними кликами после 10:54.</p></div></li>
          <li><time datetime="2026-09-06T00:03:32+03:00">6 сентября 2026 · 00:03, Рига</time><div><strong>Усилили контраст YouTube-лендинга</strong><p>Выделили «уставшей функцией?» тёмно-малиновым, увеличили мобильный заголовок и основной текст. Убрали абстрактный абзац после кнопки и сократили подпись автора. Ссылка и аналитика не менялись.</p></div></li>
          <li><time datetime="2026-09-05T23:39:26+03:00">5 сентября 2026 · 23:39, Рига</time><div><strong>Опубликовали короткий YouTube-лендинг</strong><p>До кнопки оставили 27 слов вместо 92. Сократили заголовок и обещание теста, перенесли пояснение ниже кнопки, подняли портрет Светланы в первый мобильный экран. Ссылка, счётчики и накопленные данные сохранены. Данные за 5 сентября включают обе версии; первый полный день новой версии — 6 сентября.</p></div></li>
          <li><time datetime="2026-09-05">5 сентября 2026</time><div><strong>Перепроверили подсчёт и источники</strong><p>Вернули сохранённые посещения и нажатия без персональной Telegram-ссылки. Выделили прямые и прочие источники, убрали автоматическое присвоение YouTube по названию лендинга. Исправили смену дат и пояснили периоды и единицы подсчёта.</p></div></li>
          <li><time datetime="2026-09-05">5 сентября 2026</time><div><strong>Добавили третий лендинг отдельной строкой</strong><p>Лендинг «Уставшая функция · YouTube» получил собственную воронку и больше не смешивается с лендингом «Почему мне плохо».</p></div></li>
          <li><time datetime="2026-09-05">5 сентября 2026</time><div><strong>Восстановили статистику YouTube</strong><p>Объединили источники Google и YouTube без перезаписи данных и подключили новый YouTube-лендинг «Уставшая функция» к отчёту.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Разделили рекламную когорту и весь Telegram-бот</strong><p>Связанная воронка теперь включает только персональные приглашения; старые несвязанные посещения показаны отдельно.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Исправили подсчёт Telegram</strong><p>Добавили фактические вступления в канал, текущее число подписчиков и полную активность тестов без рекламной привязки.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Добавили полный снимок Meta Ads за сегодня</strong><p>Показы, охват, клики, просмотры лендинга, конверсии, расходы и стоимость результата взяты из выгрузки Ads Manager.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Добавили всю активность тестов</strong><p>Отдельно показаны запуски, вопросы и результаты, даже если рекламная привязка посетителя не сохранилась.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Добавили выбор периода</strong><p>Доступны сегодня, вчера, последние 7 дней и произвольный диапазон дат.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Разделили результаты по источникам</strong><p>Под итогом каждой рекламной идеи отдельно показаны Facebook / Instagram и YouTube.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Упростили статистику до пяти шагов</strong><p>На одном экране показаны две рекламные идеи: лендинг, переход в Telegram, вступление, начало и завершение теста.</p></div></li>
          <li><time datetime="2026-09-03">3 сентября 2026</time><div><strong>Разделили рекламу по двум идеям</strong><p>«Уйти или остаться» и «Почему мне плохо» получили отдельные тексты и отдельные лендинги.</p></div></li>
          <li><time datetime="2026-09-02">2 сентября 2026</time><div><strong>Запустили воронку «Сначала канал»</strong><p>Путь: рекламный лендинг → Telegram-канал → закреплённый тест → результат.</p></div></li>
        </ol>
      </section>
    </main>
    <footer>Внутренняя агрегированная статистика · без персональных данных</footer>
  </div>
  <script>
    (function () {
      "use strict";
      var dashboard = document.getElementById("dashboard");
      var testActivity = document.getElementById("test-activity");
      var metaSnapshot = document.getElementById("meta-snapshot");
      var updated = document.getElementById("updated");
      var period = document.getElementById("period");
      var refresh = document.getElementById("refresh");
      var channelJoined = document.getElementById("channel-joined");
      var channelSubscribers = document.getElementById("channel-subscribers");
      var inviteTracking = document.getElementById("invite-tracking");
      var untrackedVisits = document.getElementById("untracked-visits");
      var untrackedClicks = document.getElementById("untracked-clicks");
      var fromInput = document.getElementById("date-from");
      var toInput = document.getElementById("date-to");
      var timezoneInput = document.getElementById("timezone");
      var dataHealth = document.getElementById("data-health");
      var dailyFacts = document.getElementById("daily-facts");
      var currentFrom = "";
      var currentTo = "";
      var requestId = 0;
      var steps = [
        ["landing", "Посетили лендинг"],
        ["cta", "Нажали кнопку"],
        ["group_joined", "Вступили (атрибутировано)"],
        ["test_started", "Начали тест"],
        ["completed", "Завершили тест"]
      ];
      var ideas = [
        [["stay_or_leave"], "Уйти или остаться"],
        [["relationship_challenges"], "Почему мне плохо"],
        [["youtube_tired_function"], "Уставшая функция · YouTube"]
      ];
      function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g,function (char) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]; }); }
      function todayInRiga() {
        var parts = new Intl.DateTimeFormat("en",{timeZone:timezoneInput.value,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
        var values = {};
        parts.forEach(function (part) { values[part.type] = part.value; });
        return values.year + "-" + values.month + "-" + values.day;
      }
      function shiftDate(value, days) {
        var date = new Date(value + "T12:00:00Z");
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0,10);
      }
      function formatDate(value) { return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(new Date(value + "T12:00:00")); }
      function formatPeriod(dateFrom, dateTo) { return dateFrom === dateTo ? formatDate(dateFrom) : formatDate(dateFrom) + " — " + formatDate(dateTo); }
      function formatTime(value) { return new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Riga",hour:"2-digit",minute:"2-digit"}).format(new Date(value)); }
      function formatTimestamp(value) { return new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Riga",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}).format(new Date(value)); }
      function mapSteps(funnel) { var result = {}; (funnel || []).forEach(function (step) { result[step.key] = step; }); return result; }
      function mergeStepMaps(target, source) {
        Object.keys(source || {}).forEach(function (key) {
          if (!target[key]) target[key] = {key:key,count:0};
          target[key].count += Number(source[key].count || 0);
        });
        return target;
      }
      function combineRows(rows, keys) {
        return keys.reduce(function (result,key) { return mergeStepMaps(result,rows[key] || {}); },{});
      }
      function normalizeSource(value) {
        var source = String(value || "").trim().toLowerCase();
        if (["meta","facebook","instagram","fb","ig","paid_social"].indexOf(source) >= 0) return "meta";
        if (source.indexOf("youtube") >= 0 || source === "google" || source === "google_ads") return "youtube";
        if (!source || ["direct","unknown","none","(none)"].indexOf(source) >= 0) return "direct";
        return "other";
      }
      function metric(values, key, index) {
        var count = Number((values[key] || {}).count || 0);
        var previousCount = index ? Number((values[steps[index - 1][0]] || {}).count || 0) : 0;
        var conversion = index && previousCount ? count / previousCount * 100 : null;
        var conversionClass = "";
        return '<td data-label="' + escapeHtml(steps[index][1]) + '"><div class="metric"><strong>' + count + '</strong><span class="' + conversionClass + '">' + (!index ? "сессии" : conversion === null ? "нет базы для %" : conversion.toFixed(1) + "% от прошлого шага") + '</span></div></td>';
      }
      function render(data) {
        if (!Array.isArray(data.by_landing) || !Array.isArray(data.by_landing_source)) throw new Error("Incomplete statistics");
        var rowsByLanding = {};
        (data.by_landing || []).forEach(function (row) {
          rowsByLanding[row.landing_id] = mergeStepMaps(rowsByLanding[row.landing_id] || {},mapSteps(row.funnel));
        });
        var rowsByLandingSource = {};
        (data.by_landing_source || []).forEach(function (row) {
          var source = normalizeSource(row.source);
          var key = row.landing_id + ":" + source;
          rowsByLandingSource[key] = mergeStepMaps(rowsByLandingSource[key] || {},mapSteps(row.funnel));
        });
        Object.keys(rowsByLanding).forEach(function (id) {
          var sourceTotal = combineRows(rowsByLandingSource,["meta","youtube","direct","other"].map(function (source) { return id + ":" + source; }));
          steps.forEach(function (step) {
            var total = Number((rowsByLanding[id][step[0]] || {}).count || 0);
            var sourceCount=Number((sourceTotal[step[0]] || {}).count || 0);
            if (!Number.isInteger(total) || total < 0 || (['landing','cta'].indexOf(step[0])>=0 ? total !== sourceCount : total > sourceCount)) throw new Error("Source totals do not match");
          });
        });
        function row(label, values, className, isIdea) {
          return '<tr class="' + className + '"><td><span class="' + (isIdea ? "idea" : "source") + '">' + escapeHtml(label) + '</span></td>' + steps.map(function (definition,index) { return metric(values,definition[0],index); }).join("") + '</tr>';
        }
        var displayedIdeas = ideas.slice();
        Object.keys(rowsByLanding).forEach(function (id) {
          if (!ideas.some(function (idea) { return idea[0].indexOf(id) >= 0; })) displayedIdeas.push([[id], "Другой лендинг: " + id]);
        });
        var rows = displayedIdeas.map(function (idea) {
          return row(idea[1], combineRows(rowsByLanding,idea[0]), "total-row", true)
            + row("Facebook / Instagram", combineRows(rowsByLandingSource,idea[0].map(function (landingId) { return landingId + ":meta"; })), "source-row", false)
            + row("YouTube / Google", combineRows(rowsByLandingSource,idea[0].map(function (landingId) { return landingId + ":youtube"; })), "source-row", false)
            + row("Прямой / не определён", combineRows(rowsByLandingSource,idea[0].map(function (landingId) { return landingId + ":direct"; })), "source-row", false)
            + row("Другие источники", combineRows(rowsByLandingSource,idea[0].map(function (landingId) { return landingId + ":other"; })), "source-row", false);
        }).join("");
        dashboard.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Лендинг / рекламная идея</th>' + steps.map(function (step) { return '<th>' + escapeHtml(step[1]) + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      }
      function renderTestActivity(tests) {
        var activitySteps = ["Начали прохождение","Подтверждены в канале","Вопрос 1","Вопрос 2","Вопрос 3","Вопрос 4","Вопрос 5","Вопрос 6","Вопрос 7","Завершили тест","Результат 1","Результат 2","Результат 3","Результат 4","Нажали программу недели"];
        var rows = (tests || []).map(function (test) {
          var questions = {};
          (test.questions || []).forEach(function (question) { questions[question.question_id] = Number(question.answered || 0); });
          var screens = {};
          (test.result_versions || []).forEach(function (version) {
            (version.screens || []).forEach(function (screen) { screens[screen.screen_index] = Number(screens[screen.screen_index] || 0) + Number(screen.viewed || 0); });
          });
          var values = [Number(test.telegram_started || 0)];
          values.push(Number(test.group_joined || 0) + Number(test.group_member_observed || 0));
          for (var index = 1; index <= 7; index += 1) values.push(Number(questions["q" + index] || 0));
          values.push(Number(test.completed || 0));
          for (var screenIndex = 0; screenIndex < 4; screenIndex += 1) values.push(Number(screens[screenIndex] || 0));
          values.push(Number(test.registration_cta_clicked || 0));
          return '<tr><td><span class="idea">' + escapeHtml(test.label || test.test_id) + '</span></td>' + values.map(function (value, valueIndex) { return '<td data-label="' + escapeHtml(activitySteps[valueIndex]) + '"><div class="metric"><strong>' + value + '</strong></div></td>'; }).join("") + '</tr>';
        }).join("");
        if (!rows) {
          testActivity.innerHTML = '<div class="error">Данные тестов за этот период отсутствуют.</div>';
          return;
        }
        testActivity.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Тест</th>' + activitySteps.map(function (label) { return '<th>' + escapeHtml(label) + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      }
      function markRange(kind) {
        document.querySelectorAll("[data-range]").forEach(function (button) { button.setAttribute("aria-pressed",String(button.dataset.range === kind)); });
      }
      function simpleTable(headers, rows) {
        return '<div class="table-wrap"><table><thead><tr>'+headers.map(function(h){return '<th>'+escapeHtml(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(row){return '<tr>'+row.map(function(v,i){return '<td data-label="'+escapeHtml(headers[i])+'">'+escapeHtml(v)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
      }
      function renderOperational(data) {
        var op = data.operational;
        if (!op) { dataHealth.textContent='Диагностика передачи пока недоступна. Это не означает отсутствие ошибок.'; dailyFacts.textContent='Нет данных'; return; }
        var notes=[];
        if (currentFrom <= '2026-09-03') notes.push('3 сентября учёт персональных посещений начался только вечером: этот день неполный, более ранние посещения восстановить нельзя.');
        if (currentFrom <= '2026-09-06' && currentTo >= '2026-09-03') notes.push('До 6 сентября 10:54 по Риге CompleteRegistration смешивал браузерный и серверный учёт. Исторические результаты Meta не исправлены задним числом; не используйте их как число подписчиков.');
        if (data.untracked_landing_visits) notes.push('Есть '+data.untracked_landing_visits+' посещений без персонального приглашения: следующие шаги для них не восстановлены.');
        var statusRows=Object.keys(op.capi).map(function(name){var c=op.capi[name];return [name,c.eligible,c.sent,c.pending,c.retry,c.unqueued,c.discarded];});
        dataHealth.innerHTML='<p>'+notes.map(escapeHtml).join('<br>')+'</p>'+simpleTable(['Событие бота за период','Подходит для CAPI','Meta приняла','В очереди','Ошибка/повтор','Не поставлено','Не отправлено: срок истёк'],statusRows)+'<p>«Meta приняла» — ответ API, не доказательство рекламной атрибуции. Подписка учитывается отдельно и не отправляется повторно как CompleteRegistration. Последняя успешная отправка: '+escapeHtml(op.last_capi_sent_at ? formatTimestamp(op.last_capi_sent_at)+' (Рига)' : 'нет')+'.</p>';
        dailyFacts.innerHTML=simpleTable(['Дата','Вступили всего','Из Meta','Из Google','Без источника / прочие','Начали тест','Завершили тест','Нажали программу'],op.daily.map(function(d){return [d.date,d.channel_joined,d.joined_meta,d.joined_google,d.channel_joined-d.joined_meta-d.joined_google,d.test_started,d.test_completed,d.cta_clicked];}));
        // Verified Ads Manager export, fetched 10 September. Never present this as a live API feed.
        var metaRows=[
          ['2026-09-03','stay_or_leave',9,53,19,18.46],['2026-09-03','relationship_challenges',2,25,7,20.29],
          ['2026-09-04','stay_or_leave',8,67,13,19.47],['2026-09-04','relationship_challenges',5,41,10,17.74],
          ['2026-09-05','stay_or_leave',4,17,8,6.43],['2026-09-05','relationship_challenges',9,22,15,6.25],
          ['2026-09-06','stay_or_leave',18,60,51,14.35],['2026-09-06','relationship_challenges',17,71,52,18.66],
          ['2026-09-07','stay_or_leave',0,0,0,0],['2026-09-07','relationship_challenges',0,0,0,0],
          ['2026-09-08','stay_or_leave',12,39,32,13.12],['2026-09-08','relationship_challenges',5,39,25,15.40],
          ['2026-09-09','stay_or_leave',31,122,67,25.13],['2026-09-09','relationship_challenges',11,53,38,25.93]
        ].filter(function(r){return r[0]>=currentFrom && r[0]<=currentTo;});
        metaSnapshot.hidden=false;
        var metaNote='<h2>Сверка с Meta по дням</h2><p>Сохранённая выгрузка Ads Manager, получена 10 сентября 2026. Это не автоматическое обновление Meta. Период выгрузки: 3–9 сентября, Дубай; за другие даты данных Meta в этом отчёте нет. CR — нажатие Telegram, не вступление.</p>';
        if (timezoneInput.value !== 'Asia/Dubai') { metaSnapshot.innerHTML=metaNote+'<p>Выберите часовой пояс «Дубай — как в Meta», чтобы сопоставить одинаковые календарные сутки.</p>'; return; }
        var linked={}; op.meta_landing_daily.forEach(function(r){linked[r.date+':'+r.landing_id]=r;});
        metaSnapshot.innerHTML=metaNote+simpleTable(['Дата','Идея','Клики Meta','LPV Meta','CR Meta','Наша кнопка Telegram','Наши посещения','Расход USD'],metaRows.map(function(r){var ours=linked[r[0]+':'+r[1]] || {cta:0,visits:0};return [r[0],r[1]==='stay_or_leave'?'Уйти или остаться':'Почему мне плохо',r[3],r[4],r[2],ours.cta,ours.visits,r[5].toFixed(2)];}));
      }
      function setRange(kind) {
        var today = todayInRiga();
        var dateFrom = today;
        var dateTo = today;
        if (kind === "yesterday") dateFrom = dateTo = shiftDate(today,-1);
        if (kind === "7d") dateFrom = shiftDate(today,-6);
        fromInput.value = dateFrom;
        toInput.value = dateTo;
        markRange(kind);
        load(dateFrom,dateTo);
      }
      async function load(dateFrom, dateTo) {
        var thisRequest = ++requestId;
        currentFrom = dateFrom;
        currentTo = dateTo;
        metaSnapshot.hidden = true;
        refresh.disabled = true;
        updated.textContent = "Обновляем...";
        period.textContent = formatPeriod(dateFrom,dateTo);
        dashboard.innerHTML = '<div class="loading">Загрузка...</div>';
        testActivity.innerHTML = '<div class="loading">Загрузка...</div>';
        dataHealth.textContent = dailyFacts.textContent = 'Загрузка...';
        channelJoined.textContent = channelSubscribers.textContent = inviteTracking.textContent = untrackedVisits.textContent = untrackedClicks.textContent = "—";
        try {
          var requestedTimezone = timezoneInput.value;
          var response = await fetch(location.pathname + "?data=1&date_from=" + dateFrom + "&date_to=" + dateTo + "&timezone=" + encodeURIComponent(requestedTimezone),{headers:{Accept:"application/json"},cache:"no-store"});
          if (!response.ok) throw new Error("HTTP " + response.status);
          var data = await response.json();
          if (thisRequest !== requestId) return;
          if ((data.date_from && data.date_from !== dateFrom) || (data.date_to && data.date_to !== dateTo)) throw new Error("Statistics period mismatch");
          if (data.timezone !== requestedTimezone) throw new Error('Statistics timezone mismatch');
          render(data);
          renderTestActivity(data.test_activity);
          renderOperational(data);
          channelJoined.textContent = Number(data.channel_joined_total || 0);
          channelSubscribers.textContent = data.channel_subscribers_current == null ? "—" : Number(data.channel_subscribers_current);
          inviteTracking.textContent = data.individual_invites_started_at ? formatTimestamp(data.individual_invites_started_at) : "ещё не было";
          untrackedVisits.textContent = Number(data.untracked_landing_visits || 0);
          untrackedClicks.textContent = data.untracked_cta_clicks == null ? "—" : Number(data.untracked_cta_clicks);
          updated.textContent = "Обновлено в " + formatTime(data.generated_at || new Date().toISOString());
        } catch (error) {
          if (thisRequest !== requestId) return;
          dashboard.innerHTML = '<div class="error">Не удалось загрузить статистику. Обновите страницу через минуту.</div>';
          testActivity.innerHTML = '<div class="error">Не удалось загрузить активность тестов.</div>';
          updated.textContent = "Ошибка обновления";
          dataHealth.textContent = dailyFacts.textContent = 'Данные недоступны. Нули не подставлены.';
        } finally {
          if (thisRequest === requestId) refresh.disabled = false;
        }
      }
      document.getElementById("ranges").addEventListener("click",function (event) { var button = event.target.closest("[data-range]"); if (button) setRange(button.dataset.range); });
      document.getElementById("date-form").addEventListener("submit",function (event) { event.preventDefault(); if (!fromInput.value || !toInput.value || fromInput.value > toInput.value) return; markRange(""); load(fromInput.value,toInput.value); });
      refresh.addEventListener("click",function () { load(currentFrom,currentTo); });
      timezoneInput.addEventListener('change',function(){load(currentFrom,currentTo);});
      setRange("today");
    })();
  </script>
</body>
</html>`;
