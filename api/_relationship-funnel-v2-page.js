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
    .status { display: flex; flex-wrap: wrap; gap: .35rem 1rem; margin-bottom: 1rem; color: var(--muted); font-size: .8rem; }
    .status strong { color: var(--ink); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); }
    table { width: 100%; min-width: 64rem; border-collapse: collapse; }
    th, td { padding: .9rem .8rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { background: #ecefe9; color: var(--muted); font-size: .72rem; line-height: 1.25; }
    th:first-child, td:first-child { width: 14rem; }
    tbody tr:last-child td { border-bottom: 0; }
    .idea { color: var(--forest-deep); font-weight: 800; }
    .metric strong { display: block; color: var(--forest-deep); font: 1.55rem/1 Georgia,"Times New Roman",serif; }
    .metric span { display: block; margin-top: .35rem; color: var(--muted); font-size: .72rem; }
    .metric .weak { color: var(--danger); font-weight: 700; }
    .error { padding: 1rem; border: 1px solid #e0b7af; border-radius: .5rem; background: #fff4f1; color: var(--danger); }
    .loading { min-height: 10rem; display: grid; place-items: center; color: var(--muted); }
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
      .table-wrap { overflow: visible; border: 0; background: transparent; }
      table, tbody, tr, td { display: block; min-width: 0; }
      thead { display: none; }
      tbody { display: grid; gap: .8rem; }
      tr { overflow: hidden; border: 1px solid var(--line); border-radius: .5rem; background: var(--paper); }
      td { display: grid; grid-template-columns: minmax(8rem,1fr) auto; gap: .8rem; align-items: center; padding: .72rem .8rem; }
      td::before { content: attr(data-label); color: var(--muted); font-size: .75rem; }
      td:first-child { display: block; width: auto; background: #ecefe9; }
      td:first-child::before { display: none; }
      .metric { text-align: right; }
      .metric strong { font-size: 1.3rem; }
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
          <p class="subtitle">Сегодня, две рекламные идеи и пять основных шагов.</p>
        </div>
        <button class="refresh" id="refresh" type="button">Обновить</button>
      </section>
      <div class="status"><span>Период: <strong id="period">сегодня</strong></span><span id="updated">Загрузка данных...</span></div>
      <div id="dashboard"><div class="loading">Загрузка...</div></div>
      <section class="change-log" aria-labelledby="change-log-title">
        <h2 id="change-log-title">Сделанные изменения</h2>
        <p>Краткая история изменений воронки и отчёта.</p>
        <ol>
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
      var updated = document.getElementById("updated");
      var period = document.getElementById("period");
      var refresh = document.getElementById("refresh");
      var steps = [
        ["landing", "Посетили лендинг"],
        ["cta", "Нажали кнопку"],
        ["group_joined", "Вступили в Telegram"],
        ["test_started", "Начали тест"],
        ["completed", "Завершили тест"]
      ];
      var ideas = [
        ["stay_or_leave", "Уйти или остаться"],
        ["relationship_challenges", "Почему мне плохо"]
      ];
      function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g,function (char) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]; }); }
      function todayInRiga() {
        var parts = new Intl.DateTimeFormat("en",{timeZone:"Europe/Riga",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
        var values = {};
        parts.forEach(function (part) { values[part.type] = part.value; });
        return values.year + "-" + values.month + "-" + values.day;
      }
      function formatTime(value) { return new Intl.DateTimeFormat("ru-RU",{timeZone:"Europe/Riga",hour:"2-digit",minute:"2-digit"}).format(new Date(value)); }
      function mapSteps(funnel) { var result = {}; (funnel || []).forEach(function (step) { result[step.key] = step; }); return result; }
      function metric(step, index) {
        var conversion = index ? Number(step.from_previous_percent || 0) : null;
        var conversionClass = conversion !== null && conversion < 60 ? "weak" : "";
        return '<td data-label="' + escapeHtml(steps[index][1]) + '"><div class="metric"><strong>' + Number(step.count || 0) + '</strong><span class="' + conversionClass + '">' + (conversion === null ? "точка входа" : conversion.toFixed(1) + "% от прошлого шага") + '</span></div></td>';
      }
      function render(data) {
        var rowsByLanding = {};
        (data.by_landing || []).forEach(function (row) { rowsByLanding[row.landing_id] = mapSteps(row.funnel); });
        var rows = ideas.map(function (idea) {
          var values = rowsByLanding[idea[0]] || {};
          return '<tr><td><span class="idea">' + escapeHtml(idea[1]) + '</span></td>' + steps.map(function (definition,index) { return metric(values[definition[0]] || {count:0,from_previous_percent:0},index); }).join("") + '</tr>';
        }).join("");
        dashboard.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Рекламная идея</th>' + steps.map(function (step) { return '<th>' + escapeHtml(step[1]) + '</th>'; }).join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
      }
      async function load() {
        var today = todayInRiga();
        refresh.disabled = true;
        updated.textContent = "Обновляем...";
        period.textContent = new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(new Date(today + "T12:00:00"));
        try {
          var response = await fetch(location.pathname + "?data=1&date_from=" + today + "&date_to=" + today,{headers:{Accept:"application/json"},cache:"no-store"});
          if (!response.ok) throw new Error("HTTP " + response.status);
          var data = await response.json();
          render(data);
          updated.textContent = "Обновлено в " + formatTime(data.generated_at || new Date().toISOString());
        } catch (error) {
          dashboard.innerHTML = '<div class="error">Не удалось загрузить статистику. Обновите страницу через минуту.</div>';
          updated.textContent = "Ошибка обновления";
        } finally {
          refresh.disabled = false;
        }
      }
      refresh.addEventListener("click",load);
      load();
    })();
  </script>
</body>
</html>`;
