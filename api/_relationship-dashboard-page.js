export const RELATIONSHIP_DASHBOARD_PAGE = String.raw`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Воронка отношений · Evolution House</title>
  <style>
    :root {
      color-scheme: light;
      --forest: #154c3c;
      --forest-deep: #0c352b;
      --sage: #8ea990;
      --sage-soft: #dfe8de;
      --gold: #bd9157;
      --gold-soft: #ead9bd;
      --ivory: #f7f3ec;
      --paper: #fffdf9;
      --ink: #25332e;
      --muted: #66736e;
      --line: rgba(21, 76, 60, .14);
      --danger: #9a4e3f;
      --shadow: 0 1.4rem 4rem rgba(30, 54, 45, .1);
      font-size: 16px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 20rem;
      color: var(--ink);
      background:
        radial-gradient(circle at 8% 6%, rgba(189,145,87,.14), transparent 28rem),
        radial-gradient(circle at 92% 24%, rgba(92,139,112,.13), transparent 32rem),
        var(--ivory);
      font-family: "Avenir Next", Avenir, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    button, input { font: inherit; }
    button { cursor: pointer; }
    .shell { width: min(100%, 96rem); margin: 0 auto; padding: 1rem; }
    .masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: .5rem 0 1.2rem;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: .7rem; color: var(--forest-deep); }
    .brand-mark {
      display: grid;
      place-items: center;
      width: 2.6rem;
      height: 2.6rem;
      border: 1px solid rgba(189,145,87,.58);
      border-radius: 50% 50% 44% 56%;
      background: linear-gradient(145deg, #fff, #e6eee4);
      color: var(--forest);
      font-family: Georgia, serif;
      font-size: 1.35rem;
    }
    .brand-name { font-family: Georgia, "Times New Roman", serif; letter-spacing: .08em; }
    .back-link { color: var(--forest); text-underline-offset: .2em; font-size: .92rem; }
    .hero { padding: 2.2rem 0 1.4rem; }
    .eyebrow {
      margin: 0 0 .55rem;
      color: var(--forest);
      font-size: .76rem;
      font-weight: 700;
      letter-spacing: .19em;
      text-transform: uppercase;
    }
    h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; }
    h1 { margin: 0; max-width: 18ch; font-size: clamp(2.1rem, 8vw, 4.4rem); line-height: 1.01; color: var(--forest-deep); }
    .hero-copy { max-width: 62ch; margin: 1rem 0 0; color: var(--muted); }
    .controls {
      z-index: 5;
      padding: 1rem;
      border: 1px solid rgba(189,145,87,.26);
      border-radius: 1.15rem;
      background: rgba(255,253,249,.92);
      box-shadow: 0 .7rem 2.2rem rgba(31,58,48,.08);
      backdrop-filter: blur(14px);
    }
    .quick-ranges { display: flex; gap: .45rem; overflow-x: auto; padding-bottom: .6rem; scrollbar-width: thin; }
    .quick-range, .tab-button, .action {
      min-height: 2.75rem;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--forest-deep);
      padding: .65rem 1rem;
      white-space: nowrap;
      transition: transform .18s ease, background .18s ease, border-color .18s ease;
    }
    .quick-range:hover, .quick-range[aria-pressed="true"], .tab-button[aria-selected="true"] {
      border-color: var(--forest);
      background: var(--forest);
      color: #fff;
    }
    .date-row { display: grid; grid-template-columns: 1fr; gap: .75rem; }
    .date-field { display: grid; gap: .3rem; color: var(--muted); font-size: .82rem; font-weight: 700; }
    .date-field input {
      width: 100%;
      min-height: 3rem;
      border: 1px solid var(--line);
      border-radius: .8rem;
      background: #fff;
      color: var(--ink);
      padding: .65rem .8rem;
    }
    .action { border: 0; border-radius: .8rem; background: var(--forest); color: #fff; font-weight: 700; }
    .action:hover { background: var(--forest-deep); transform: translateY(-1px); }
    .action--secondary { border: 1px solid var(--line); background: #fff; color: var(--forest); }
    .action--secondary:hover { background: var(--sage-soft); color: var(--forest-deep); }
    .status-line { display: flex; flex-wrap: wrap; gap: .45rem 1.2rem; margin: .8rem 0 0; color: var(--muted); font-size: .84rem; }
    .status-dot::before { content: ""; display: inline-block; width: .5rem; height: .5rem; margin-right: .4rem; border-radius: 50%; background: #55a479; box-shadow: 0 0 0 .24rem rgba(85,164,121,.13); }
    .notice {
      margin: 1rem 0;
      padding: .9rem 1rem;
      border-left: .22rem solid var(--gold);
      border-radius: .2rem .8rem .8rem .2rem;
      background: rgba(234,217,189,.34);
      color: #685239;
      font-size: .9rem;
    }
    .change-log { margin: 1.5rem 0 1.2rem; padding: 1.35rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .change-log__head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .change-log__head p { margin: 0 0 .2rem; color: var(--gold); font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .change-log h2 { margin: 0; color: var(--forest-deep); font-size: 1.35rem; }
    .change-log ol { display: grid; gap: .9rem; margin: 0; padding: 0; list-style: none; }
    .change-log li { display: grid; grid-template-columns: minmax(7.5rem,.28fr) minmax(0,1fr); gap: 1rem; padding-top: .9rem; border-top: 1px solid var(--line); }
    .change-log time { color: var(--muted); font-size: .78rem; font-weight: 700; }
    .change-log strong { display: block; color: var(--forest-deep); font-size: .92rem; }
    .change-log li p { margin: .25rem 0 0; color: var(--muted); font-size: .8rem; line-height: 1.5; }
    .test-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin: 1rem 0; }
    .tab-button { border-radius: .85rem; white-space: normal; line-height: 1.25; }
    .funnels { display: grid; grid-template-columns: 1fr; gap: 1rem; align-items: start; }
    .funnel-card {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 1.4rem;
      background: rgba(255,253,249,.94);
      box-shadow: var(--shadow);
    }
    .funnel-card[hidden] { display: none; }
    .funnel-head { position: relative; padding: 1.35rem 1.2rem 1.1rem; color: #fff; background: var(--forest); }
    .funnel-card--b .funnel-head { background: #6f5b45; }
    .funnel-head::after { content: ""; position: absolute; right: -2rem; bottom: -4rem; width: 10rem; height: 10rem; border: 1px solid rgba(255,255,255,.22); border-radius: 52% 48% 62% 38%; }
    .funnel-kicker { margin: 0 0 .3rem; opacity: .75; font-size: .73rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
    .funnel-head h2 { position: relative; z-index: 1; margin: 0; font-size: clamp(1.55rem, 5vw, 2.25rem); line-height: 1.12; }
    .headline-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; margin-top: 1rem; }
    .headline-metric { position: relative; z-index: 1; padding-top: .7rem; border-top: 1px solid rgba(255,255,255,.25); }
    .headline-metric strong { display: block; font-family: Georgia, serif; font-size: 1.45rem; }
    .headline-metric span { display: block; opacity: .78; font-size: .69rem; line-height: 1.25; }
    .journey { padding: .65rem 1rem 1.2rem; }
    .step { position: relative; display: grid; grid-template-columns: 2.25rem 1fr auto; gap: .7rem; align-items: center; padding: .85rem 0; border-bottom: 1px solid var(--line); }
    .step:last-child { border-bottom: 0; }
    .step::before { content: ""; position: absolute; left: 1.08rem; top: 0; bottom: 0; width: 1px; background: var(--line); }
    .step:first-child::before { top: 50%; }
    .step:last-child::before { bottom: 50%; }
    .step-index { position: relative; z-index: 1; display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border: 1px solid var(--line); border-radius: 50%; background: var(--paper); color: var(--forest); font-family: Georgia, serif; font-size: .88rem; }
    .step--attention { background: rgba(234,217,189,.18); }
    .step--attention .step-index { border-color: rgba(189,145,87,.55); }
    .step--result .step-index { border-color: rgba(189,145,87,.55); background: #f7ead6; color: #76542c; }
    .step-copy { min-width: 0; }
    .step-label { display: block; font-weight: 700; line-height: 1.28; }
    .step-detail { display: block; margin-top: .16rem; color: var(--muted); font-size: .76rem; }
    .step-value { text-align: right; }
    .step-value strong { display: block; color: var(--forest-deep); font-family: Georgia, serif; font-size: 1.5rem; line-height: 1; }
    .step-value span { display: block; margin-top: .28rem; color: var(--muted); font-size: .72rem; }
    .loss { color: var(--danger) !important; }
    .breakdowns { display: grid; grid-template-columns: 1fr; gap: .8rem; padding: 0 1rem 1rem; }
    .breakdown { padding: 1rem; border-radius: 1rem; background: #f3f0e9; }
    .breakdown h3 { margin: 0 0 .65rem; color: var(--forest-deep); font-size: 1.1rem; }
    .breakdown-row { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: .55rem; padding: .5rem 0; border-top: 1px solid rgba(21,76,60,.1); font-size: .78rem; }
    .breakdown-row span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty { padding: 2rem 1rem; color: var(--muted); text-align: center; }
    .loading { min-height: 24rem; display: grid; place-items: center; color: var(--forest); }
    .loading::before { content: ""; width: 2rem; height: 2rem; border: .2rem solid var(--sage-soft); border-top-color: var(--forest); border-radius: 50%; animation: spin .8s linear infinite; }
    .error { padding: 1.2rem; border: 1px solid rgba(154,78,63,.25); border-radius: 1rem; background: #fff4f0; color: var(--danger); }
    footer { padding: 2.5rem 0 1.5rem; color: var(--muted); font-size: .78rem; text-align: center; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (min-width: 640px) {
      .shell { padding: 1.4rem; }
      .date-row { grid-template-columns: minmax(9rem,1fr) minmax(9rem,1fr) auto auto; align-items: end; }
      .breakdowns { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 639px) {
      .change-log__head { display: block; }
      .change-log li { grid-template-columns: 1fr; gap: .3rem; }
    }
    @media (min-width: 1024px) {
      .shell { padding: 1.8rem 2rem; }
      .hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 4rem; align-items: end; padding: 3rem 0 2rem; }
      .hero-copy { margin-bottom: .45rem; }
      .controls { position: sticky; top: .6rem; }
      .test-tabs { display: none; }
      .funnels { grid-template-columns: 1fr 1fr; gap: 1.2rem; margin-top: 1.2rem; }
      .funnel-card[hidden] { display: block; }
      .journey { padding-inline: 1.2rem; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition: none !important; } }
  </style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <div class="brand"><span class="brand-mark">E</span><span class="brand-name">EVOLUTION HOUSE</span></div>
      <a class="back-link" href="/18-18-18/">← К ссылкам команды</a>
    </header>
    <main>
      <section class="hero">
        <div><p class="eyebrow">Внутренняя аналитика</p><h1>Путь от лендинга до регистрации</h1></div>
        <p class="hero-copy">Две воронки считаются отдельно. Выберите даты — и увидите, сколько людей дошло до каждого вопроса, результата и Telegram-группы.</p>
      </section>
      <section class="controls" aria-label="Период отчёта">
        <div class="quick-ranges" id="quick-ranges">
          <button class="quick-range" type="button" data-range="today">Сегодня</button>
          <button class="quick-range" type="button" data-range="yesterday">Вчера</button>
          <button class="quick-range" type="button" data-range="7d">7 дней</button>
          <button class="quick-range" type="button" data-range="30d">30 дней</button>
          <button class="quick-range" type="button" data-range="month">Этот месяц</button>
          <button class="quick-range" type="button" data-range="last-month">Прошлый месяц</button>
          <button class="quick-range" type="button" data-range="all">Всё время</button>
        </div>
        <form class="date-row" id="date-form">
          <label class="date-field">С<input id="date-from" name="date_from" type="date" required></label>
          <label class="date-field">По<input id="date-to" name="date_to" type="date" required></label>
          <button class="action" type="submit">Показать</button>
          <button class="action action--secondary" id="export" type="button">Скачать CSV</button>
        </form>
        <div class="status-line"><span class="status-dot" id="updated">Загрузка данных…</span><span id="period-label"></span></div>
      </section>
      <div class="notice">В основную воронку входят размеченные рекламные сессии и посетители, которые действительно взаимодействовали со страницей. Повторные, служебные и неразмеченные загрузки показаны отдельно. Уникальные люди начинаются с Telegram, где одна женщина определяется по внутреннему <code>lead_id</code>.</div>
      <section class="change-log" aria-labelledby="change-log-title">
        <div class="change-log__head"><div><p>Контрольные точки</p><h2 id="change-log-title">Сделанные изменения</h2></div></div>
        <ol>
          <li><time datetime="2026-08-31">31 августа 2026</time><div><strong>Упростили путь с лендинга в Telegram</strong><p>CTA перенесён в первый экран, описание сокращено, видео удалено, переход больше не ждёт tracking API, а страница «Отношения не устраивают» открывается без дополнительного редиректа.</p></div></li>
          <li><time datetime="2026-08-31">31 августа 2026</time><div><strong>Очистили внутреннюю статистику</strong><p>Добавлена дедупликация сессий; служебные, повторные и неразмеченные загрузки вынесены из основной воронки. Переход TelegramStart → ответ на вопрос 1 выделен как отдельная контрольная точка.</p></div></li>
          <li><time datetime="2026-08-30">30 августа 2026</time><div><strong>Восстановили серверные конверсии Meta</strong><p>Исправлены отправка TelegramStart и подтверждение CompleteRegistration через CAPI, добавлена повторная сверка пропущенных регистраций.</p></div></li>
        </ol>
      </section>
      <div class="test-tabs" role="tablist" aria-label="Выбор воронки">
        <button class="tab-button" id="tab-a" type="button" role="tab" aria-selected="true" data-test="a">Почему нет отношений?</button>
        <button class="tab-button" id="tab-b" type="button" role="tab" aria-selected="false" data-test="b">Почему отношения не устраивают?</button>
      </div>
      <section class="funnels" id="funnels" aria-live="polite"><div class="loading" aria-label="Загрузка"></div></section>
    </main>
    <footer>Внутренняя агрегированная статистика · без имён, Telegram ID и индивидуальных ответов</footer>
  </div>
  <script>
    (function () {
      "use strict";
      var currentData = null;
      var activeTest = "a";
      var form = document.getElementById("date-form");
      var fromInput = document.getElementById("date-from");
      var toInput = document.getElementById("date-to");
      var funnels = document.getElementById("funnels");
      var updated = document.getElementById("updated");
      var periodLabel = document.getElementById("period-label");

      function iso(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, "0");
        var day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }
      function localDate(value) { return new Date(value + "T12:00:00"); }
      function formatDate(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(localDate(value)); }
      function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>\"']/g, function (char) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]; }); }
      function percent(value, total) { return total > 0 ? Math.round(value / total * 100) + "%" : "—"; }
      function setRange(kind) {
        var now = new Date();
        var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var end = new Date(start);
        if (kind === "yesterday") { start.setDate(start.getDate() - 1); end = new Date(start); }
        if (kind === "7d") start.setDate(start.getDate() - 6);
        if (kind === "30d") start.setDate(start.getDate() - 29);
        if (kind === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
        if (kind === "last-month") { start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); }
        if (kind === "all") start = new Date(2026, 7, 1);
        fromInput.value = iso(start);
        toInput.value = iso(end);
        document.querySelectorAll("[data-range]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.range === kind)); });
        load();
      }
      function stepsFor(test) {
        var steps = [
          { label: "Посещения лендинга", count: test.landing_visits, detail: "Загрузки страницы" },
          { label: "Нажали «Начать тест»", count: test.landing_cta_clicks, detail: "Переход в Telegram" },
          { label: "Запустили бот", count: test.telegram_started, detail: "Уникальные люди" }
        ];
        test.questions.forEach(function (question, index) {
          var detail = "Дошли " + question.reached;
          if (question.dropped) detail += " · отпали ≥24ч " + question.dropped;
          if (question.active) detail += " · ещё активны " + question.active;
          steps.push({ label: "Ответили на вопрос " + (index + 1), count: question.answered, detail: detail });
        });
        steps.push(
          { label: "Завершили тест", count: test.completed, detail: "Получили персональный результат", result: true },
          { label: "Открыли результат", count: test.result_viewed, detail: "Просмотрели первый экран", result: true },
          { label: "Увидели «Пройти бесплатно»", count: test.registration_cta_shown, detail: "Дошли до предложения", result: true },
          { label: "Нажали «Пройти бесплатно»", count: test.registration_cta_clicked, detail: "Начали следующий шаг", result: true },
          { label: "Начали регистрацию", count: test.registration_started, detail: "Получили вход в группу", result: true },
          { label: "Регистрация завершена", count: test.registered, detail: "Membership подтверждён", result: true }
        );
        return steps;
      }
      function renderBreakdown(title, rows) {
        if (!rows || !rows.length) return '<div class="breakdown"><h3>' + title + '</h3><p class="empty">Пока нет данных</p></div>';
        return '<div class="breakdown"><h3>' + title + '</h3>' + rows.slice(0, 8).map(function (row) {
          return '<div class="breakdown-row"><span title="' + escapeHtml(row.label) + '">' + escapeHtml(row.label) + '</span><span>' + row.visits + ' виз.</span><strong>' + row.telegram_started + ' старт.</strong></div>';
        }).join("") + '</div>';
      }
      function renderFunnel(test, index) {
        var code = index === 0 ? "a" : "b";
        var steps = stepsFor(test);
        var previous = null;
        var stepHtml = steps.map(function (step, stepIndex) {
          var conversion = previous == null ? "100% входов" : percent(step.count, previous);
          var loss = previous == null ? 0 : Math.max(0, previous - step.count);
          var anomaly = previous != null && step.count > previous;
          var meta = anomaly ? "есть входы вне предыдущего шага" : (loss ? "−" + loss + " · " + conversion : conversion);
          previous = step.count;
          return '<div class="step' + (step.result ? ' step--result' : '') + (stepIndex === 3 ? ' step--attention' : '') + '"><span class="step-index">' + (stepIndex + 1) + '</span><span class="step-copy"><span class="step-label">' + escapeHtml(step.label) + '</span><span class="step-detail">' + escapeHtml(step.detail) + '</span></span><span class="step-value"><strong>' + step.count + '</strong><span' + (loss ? ' class="loss"' : '') + '>' + escapeHtml(meta) + '</span></span></div>';
        }).join("");
        var excluded = Number(test.excluded_landing_loads || 0);
        var rawLoads = Number(test.raw_landing_loads || test.landing_visits || 0);
        var filterNote = excluded ? '<div class="notice">Сырых загрузок: <strong>' + rawLoads + '</strong>. Служебных, повторных или неразмеченных вне основной воронки: <strong>' + excluded + '</strong>.</div>' : '';
        var note = test.unattributed_telegram_started ? '<div class="notice">Дополнительно запусков бота без связанного посещения лендинга: <strong>' + test.unattributed_telegram_started + '</strong>.</div>' : '';
        return '<article class="funnel-card funnel-card--' + code + '" data-card="' + code + '"' + (code !== activeTest ? ' hidden' : '') + '><header class="funnel-head"><p class="funnel-kicker">Воронка ' + code.toUpperCase() + '</p><h2>' + escapeHtml(test.label) + '</h2><div class="headline-metrics"><div class="headline-metric"><strong>' + test.landing_visits + '</strong><span>сессий</span></div><div class="headline-metric"><strong>' + test.completed + '</strong><span>завершили тест</span></div><div class="headline-metric"><strong>' + test.registered + '</strong><span>регистраций</span></div></div></header><div class="journey">' + stepHtml + filterNote + note + '</div><div class="breakdowns">' + renderBreakdown("Источники", test.sources) + renderBreakdown("Кампании", test.campaigns) + '</div></article>';
      }
      function applyMobileTabs() {
        document.querySelectorAll("[data-card]").forEach(function (card) { card.hidden = card.dataset.card !== activeTest; });
        document.querySelectorAll("[data-test]").forEach(function (button) { button.setAttribute("aria-selected", String(button.dataset.test === activeTest)); });
      }
      function render(data) {
        currentData = data;
        funnels.innerHTML = data.tests.map(renderFunnel).join("");
        if (window.innerWidth < 1024) applyMobileTabs();
        updated.textContent = "Обновлено " + new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: data.timezone }).format(new Date(data.generated_at));
        periodLabel.textContent = formatDate(data.date_from) + " — " + formatDate(data.date_to) + " · Europe/Riga";
      }
      function requestJson(url) {
        return new Promise(function (resolve, reject) {
          var request = new XMLHttpRequest();
          request.open("GET", url, true);
          request.setRequestHeader("Accept", "application/json");
          request.timeout = 15000;
          request.onload = function () {
            if (request.status < 200 || request.status >= 300) return reject(new Error("HTTP " + request.status));
            try { resolve(JSON.parse(request.responseText)); } catch (error) { reject(error); }
          };
          request.onerror = function () { reject(new Error("Network error")); };
          request.ontimeout = function () { reject(new Error("Request timeout")); };
          request.send();
        });
      }
      async function load() {
        if (!fromInput.value || !toInput.value) return;
        funnels.innerHTML = '<div class="loading" aria-label="Загрузка"></div>';
        try {
          var params = new URLSearchParams({ data: "1", date_from: fromInput.value, date_to: toInput.value });
          render(await requestJson(location.pathname + "?" + params.toString()));
        } catch (error) {
          funnels.innerHTML = '<div class="error"><strong>Не удалось загрузить статистику.</strong><br>Обновите страницу. Если ошибка повторяется, проверьте health backend и deployment.</div>';
          updated.textContent = "Ошибка обновления";
        }
      }
      function exportCsv() {
        if (!currentData) return;
        var rows = [["Воронка","Этап","Количество"]];
        currentData.tests.forEach(function (test) { stepsFor(test).forEach(function (step) { rows.push([test.label, step.label, step.count]); }); });
        var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
        var link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
        link.download = "relationship-funnel-" + fromInput.value + "-" + toInput.value + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);
      }
      form.addEventListener("submit", function (event) { event.preventDefault(); document.querySelectorAll("[data-range]").forEach(function (button) { button.setAttribute("aria-pressed", "false"); }); load(); });
      document.getElementById("quick-ranges").addEventListener("click", function (event) { var button = event.target.closest("[data-range]"); if (button) setRange(button.dataset.range); });
      document.querySelectorAll("[data-test]").forEach(function (button) { button.addEventListener("click", function () { activeTest = button.dataset.test; applyMobileTabs(); }); });
      document.getElementById("export").addEventListener("click", exportCsv);
      window.addEventListener("resize", function () { if (window.innerWidth < 1024) applyMobileTabs(); else document.querySelectorAll("[data-card]").forEach(function (card) { card.hidden = false; }); });
      setRange("7d");
    })();
  </script>
</body>
</html>`;
