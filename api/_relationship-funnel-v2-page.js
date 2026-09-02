export const RELATIONSHIP_FUNNEL_V2_PAGE = String.raw`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Новая воронка отношений · Evolution House</title>
  <style>
    :root {
      color-scheme: light;
      --forest: #154c3c;
      --forest-deep: #0c352b;
      --sage-soft: #dfe8de;
      --gold: #bd9157;
      --gold-soft: #ead9bd;
      --ivory: #f7f3ec;
      --paper: #fffdf9;
      --ink: #25332e;
      --muted: #66736e;
      --line: rgba(21,76,60,.14);
      --danger: #9a4e3f;
      --shadow: 0 1.4rem 4rem rgba(30,54,45,.1);
      font-size: 16px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 20rem; color: var(--ink); background: var(--ivory); font-family: "Avenir Next",Avenir,"Segoe UI",sans-serif; line-height: 1.5; }
    button, input { font: inherit; }
    button { cursor: pointer; }
    .shell { width: min(100%,96rem); margin: 0 auto; padding: 1rem; }
    .masthead { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .5rem 0 1.2rem; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: .7rem; color: var(--forest-deep); }
    .brand-mark { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border: 1px solid rgba(189,145,87,.58); border-radius: 50%; background: var(--paper); color: var(--forest); font: 1.35rem Georgia,serif; }
    .brand-name { font-family: Georgia,"Times New Roman",serif; letter-spacing: .08em; }
    .back-link { color: var(--forest); text-underline-offset: .2em; font-size: .92rem; }
    .hero { padding: 2.2rem 0 1.4rem; }
    .eyebrow { margin: 0 0 .55rem; color: var(--gold); font-size: .76rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    h1, h2, h3 { font-family: Georgia,"Times New Roman",serif; font-weight: 500; }
    h1 { margin: 0; max-width: 19ch; color: var(--forest-deep); font-size: clamp(2.05rem,7vw,4.15rem); line-height: 1.03; letter-spacing: 0; }
    .hero-copy { max-width: 65ch; margin: 1rem 0 0; color: var(--muted); }
    .controls { z-index: 5; padding: 1rem; border: 1px solid rgba(189,145,87,.3); border-radius: .8rem; background: rgba(255,253,249,.96); box-shadow: 0 .7rem 2.2rem rgba(31,58,48,.08); }
    .quick-ranges { display: flex; gap: .45rem; overflow-x: auto; padding-bottom: .65rem; scrollbar-width: thin; }
    .quick-range, .action { min-height: 2.75rem; border: 1px solid var(--line); border-radius: .55rem; background: #fff; color: var(--forest-deep); padding: .65rem 1rem; white-space: nowrap; }
    .quick-range:hover, .quick-range[aria-pressed="true"] { border-color: var(--forest); background: var(--forest); color: #fff; }
    .date-row { display: grid; grid-template-columns: 1fr; gap: .75rem; }
    .date-field { display: grid; gap: .3rem; color: var(--muted); font-size: .82rem; font-weight: 700; }
    .date-field input { width: 100%; min-height: 3rem; border: 1px solid var(--line); border-radius: .55rem; background: #fff; color: var(--ink); padding: .65rem .8rem; }
    .action { border-color: var(--forest); background: var(--forest); color: #fff; font-weight: 700; }
    .action:hover { background: var(--forest-deep); }
    .action--secondary { border-color: var(--line); background: #fff; color: var(--forest); }
    .action--secondary:hover { background: var(--sage-soft); color: var(--forest-deep); }
    .status-line { display: flex; flex-wrap: wrap; gap: .45rem 1.2rem; margin: .8rem 0 0; color: var(--muted); font-size: .84rem; }
    .status-dot::before { content: ""; display: inline-block; width: .5rem; height: .5rem; margin-right: .4rem; border-radius: 50%; background: #55a479; box-shadow: 0 0 0 .24rem rgba(85,164,121,.13); }
    .status-dot--error::before { background: var(--danger); box-shadow: 0 0 0 .24rem rgba(154,78,63,.12); }
    .notice { margin: 1rem 0; padding: .9rem 1rem; border-left: .22rem solid var(--gold); border-radius: .2rem .55rem .55rem .2rem; background: rgba(234,217,189,.34); color: #685239; font-size: .9rem; }
    .summary { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1px; margin: 1.5rem 0; overflow: hidden; border: 1px solid var(--line); border-radius: .8rem; background: var(--line); }
    .metric { min-width: 0; padding: 1rem; background: var(--paper); }
    .metric strong { display: block; color: var(--forest-deep); font: 2rem/1 Georgia,serif; }
    .metric span { display: block; margin-top: .4rem; color: var(--muted); font-size: .75rem; line-height: 1.25; }
    .funnel { overflow: hidden; border: 1px solid var(--line); border-radius: .8rem; background: var(--paper); box-shadow: var(--shadow); }
    .funnel-head { padding: 1.25rem; color: #fff; background: var(--forest); }
    .funnel-head p { margin: 0 0 .3rem; opacity: .76; font-size: .73rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
    .funnel-head h2 { margin: 0; font-size: clamp(1.45rem,4vw,2rem); }
    .journey { padding: .55rem 1rem 1rem; }
    .step { position: relative; display: grid; grid-template-columns: 2.25rem minmax(0,1fr) auto; gap: .7rem; align-items: center; padding: .82rem 0; border-bottom: 1px solid var(--line); }
    .step:last-child { border-bottom: 0; }
    .step::before { content: ""; position: absolute; left: 1.08rem; top: 0; bottom: 0; width: 1px; background: var(--line); }
    .step:first-child::before { top: 50%; }
    .step:last-child::before { bottom: 50%; }
    .step-index { position: relative; z-index: 1; display: grid; place-items: center; width: 2.2rem; height: 2.2rem; border: 1px solid var(--line); border-radius: 50%; background: var(--paper); color: var(--forest); font: .88rem Georgia,serif; }
    .step--drop { background: rgba(154,78,63,.045); }
    .step--drop .step-index { border-color: rgba(154,78,63,.36); color: var(--danger); }
    .step--result .step-index { border-color: rgba(189,145,87,.55); background: #f7ead6; color: #76542c; }
    .step-label { display: block; font-weight: 700; line-height: 1.28; }
    .step-detail { display: block; margin-top: .16rem; color: var(--muted); font-size: .74rem; }
    .step-value { text-align: right; }
    .step-value strong { display: block; color: var(--forest-deep); font: 1.45rem/1 Georgia,serif; }
    .step-value span { display: block; margin-top: .28rem; color: var(--muted); font-size: .7rem; }
    .step-value .loss { color: var(--danger); font-weight: 700; }
    .breakdowns { margin-top: 1.8rem; }
    .breakdowns-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
    .breakdowns h2, .change-log h2 { margin: 0; color: var(--forest-deep); font-size: 1.35rem; }
    .breakdowns-head p, .change-log__head p { margin: 0 0 .2rem; color: var(--gold); font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .breakdown-tabs { display: flex; gap: .45rem; overflow-x: auto; margin-bottom: .8rem; padding-bottom: .2rem; }
    .tab-button { min-height: 2.5rem; border: 1px solid var(--line); border-radius: .55rem; background: #fff; color: var(--forest-deep); padding: .55rem .8rem; white-space: nowrap; }
    .tab-button[aria-selected="true"] { border-color: var(--forest); background: var(--forest); color: #fff; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: .65rem; background: var(--paper); }
    table { width: 100%; min-width: 54rem; border-collapse: collapse; }
    th, td { padding: .72rem .75rem; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; font-size: .78rem; }
    th { color: var(--muted); background: #f3f0e9; font-size: .68rem; }
    th:first-child, td:first-child { min-width: 14rem; text-align: left; white-space: normal; }
    tbody tr:last-child td { border-bottom: 0; }
    td strong { color: var(--forest-deep); }
    .empty { padding: 2rem 1rem; color: var(--muted); text-align: center; }
    .loading { min-height: 22rem; display: grid; place-items: center; color: var(--forest); }
    .loading::before { content: ""; width: 2rem; height: 2rem; border: .2rem solid var(--sage-soft); border-top-color: var(--forest); border-radius: 50%; animation: spin .8s linear infinite; }
    .error { padding: 1.2rem; border: 1px solid rgba(154,78,63,.25); border-radius: .65rem; background: #fff4f0; color: var(--danger); }
    .change-log { margin: 2rem 0 1.2rem; padding: 1.35rem 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .change-log__head { margin-bottom: 1rem; }
    .change-log ol { display: grid; gap: .9rem; margin: 0; padding: 0; list-style: none; }
    .change-log li { display: grid; grid-template-columns: minmax(7.5rem,.28fr) minmax(0,1fr); gap: 1rem; padding-top: .9rem; border-top: 1px solid var(--line); }
    .change-log time { color: var(--muted); font-size: .78rem; font-weight: 700; }
    .change-log strong { display: block; color: var(--forest-deep); font-size: .92rem; }
    .change-log li p { margin: .25rem 0 0; color: var(--muted); font-size: .8rem; }
    footer { padding: 2.5rem 0 1.5rem; color: var(--muted); font-size: .78rem; text-align: center; }
    [hidden] { display: none !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (min-width: 640px) { .shell { padding: 1.4rem; } .date-row { grid-template-columns: minmax(9rem,1fr) minmax(9rem,1fr) auto auto; align-items: end; } .summary { grid-template-columns: repeat(3,minmax(0,1fr)); } }
    @media (max-width: 639px) { .change-log li { grid-template-columns: 1fr; gap: .3rem; } .step { grid-template-columns: 2.1rem minmax(0,1fr) auto; gap: .55rem; } .step-value strong { font-size: 1.25rem; } }
    @media (min-width: 1024px) { .shell { padding: 1.8rem 2rem; } .hero { display: grid; grid-template-columns: 1.1fr .9fr; gap: 4rem; align-items: end; padding: 3rem 0 2rem; } .hero-copy { margin-bottom: .45rem; } .controls { position: sticky; top: .6rem; } .summary { grid-template-columns: repeat(6,minmax(0,1fr)); } .journey { padding-inline: 1.25rem; } }
    @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration: .01ms !important; } }
  </style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <div class="brand"><span class="brand-mark">E</span><span class="brand-name">EVOLUTION HOUSE</span></div>
      <a class="back-link" href="/18-18-18/">К ссылкам команды</a>
    </header>
    <main>
      <section class="hero">
        <div><p class="eyebrow">Внутренняя аналитика</p><h1>Воронка «Сначала канал»</h1></div>
        <p class="hero-copy">Meta и YouTube считаются отдельно: от посещения рекламного лендинга и вступления в Telegram-канал до теста, четырёх экранов результата и возврата в канал.</p>
      </section>
      <section class="controls" aria-label="Период отчёта">
        <div class="quick-ranges" id="quick-ranges">
          <button class="quick-range" type="button" data-range="today">Сегодня</button>
          <button class="quick-range" type="button" data-range="yesterday">Вчера</button>
          <button class="quick-range" type="button" data-range="7d">7 дней</button>
          <button class="quick-range" type="button" data-range="30d">30 дней</button>
          <button class="quick-range" type="button" data-range="month">Этот месяц</button>
          <button class="quick-range" type="button" data-range="all">Всё время</button>
        </div>
        <form class="date-row" id="date-form">
          <label class="date-field">С<input id="date-from" name="date_from" type="date" required></label>
          <label class="date-field">По<input id="date-to" name="date_to" type="date" required></label>
          <button class="action" type="submit">Показать</button>
          <button class="action action--secondary" id="export" type="button">Скачать CSV</button>
        </form>
        <div class="status-line"><span class="status-dot" id="updated">Загрузка данных...</span><span id="period-label"></span></div>
      </section>
      <div class="notice">Это когортная статистика новой воронки. Человек относится к тому источнику, лендингу, кампании и объявлению, с которых начался его путь в выбранном периоде.</div>
      <div id="dashboard"><div class="loading" aria-label="Загрузка"></div></div>
      <section class="change-log" aria-labelledby="change-log-title">
        <div class="change-log__head"><p>Контрольные точки</p><h2 id="change-log-title">Сделанные изменения</h2></div>
        <ol>
          <li><time datetime="2026-09-02">2 сентября 2026</time><div><strong>Пересобрали страницу новой статистики</strong><p>Добавлены быстрые периоды, полная конверсия каждого этапа, сводные показатели, разрезы по источникам, лендингам, кампаниям и объявлениям, а также выгрузка CSV.</p></div></li>
          <li><time datetime="2026-09-02">2 сентября 2026</time><div><strong>Уточнили переход с рекламных лендингов</strong><p>Основная кнопка говорит «Перейти в Telegram и ПРОЙТИ ТЕСТ», а подпись называет канал «Архетипы в Отношениях» и направляет к закреплённому посту.</p></div></li>
          <li><time datetime="2026-09-02">2 сентября 2026</time><div><strong>Добавили Google Ads и Meta Pixel</strong><p>Клик по основной кнопке отправляет Google Ads conversion и Meta CompleteRegistration, после чего открывает Telegram. Эти метрики означают переход, а фактическое вступление отдельно учитывается ботом.</p></div></li>
          <li><time datetime="2026-09-02">2 сентября 2026</time><div><strong>Запустили воронку «Сначала канал»</strong><p>Новый путь: рекламный лендинг → Telegram-канал → закреплённый тест → четыре экрана результата → возвращение в канал.</p></div></li>
        </ol>
      </section>
    </main>
    <footer>Внутренняя агрегированная статистика · без имён, Telegram ID и индивидуальных ответов</footer>
  </div>
  <script>
    (function () {
      "use strict";
      var data = null;
      var activeBreakdown = "by_source";
      var dashboard = document.getElementById("dashboard");
      var updated = document.getElementById("updated");
      var periodLabel = document.getElementById("period-label");
      var fromInput = document.getElementById("date-from");
      var toInput = document.getElementById("date-to");
      var labels = { by_source: "Источники", by_landing: "Лендинги", by_campaign: "Кампании", by_ad: "Объявления" };
      function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>\"']/g,function (char) { return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"})[char]; }); }
      function iso(date) { return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0"); }
      function formatDate(value) { return new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value+"T12:00:00")); }
      function fmt(value) { return new Intl.NumberFormat("ru-RU").format(Number(value)||0); }
      function stepMap(funnel) { var result={}; (funnel||[]).forEach(function (step) { result[step.key]=step; }); return result; }
      function setRange(kind) {
        var now=new Date(), start=new Date(now.getFullYear(),now.getMonth(),now.getDate()), end=new Date(start);
        if(kind==="yesterday"){start.setDate(start.getDate()-1);end=new Date(start);}
        if(kind==="7d")start.setDate(start.getDate()-6);
        if(kind==="30d")start.setDate(start.getDate()-29);
        if(kind==="month")start=new Date(now.getFullYear(),now.getMonth(),1);
        if(kind==="all")start=new Date(2026,8,1);
        fromInput.value=iso(start);toInput.value=iso(end);
        document.querySelectorAll("[data-range]").forEach(function(button){button.setAttribute("aria-pressed",String(button.dataset.range===kind));});
        load();
      }
      function summary(funnelRows) {
        var map=stepMap(funnelRows), items=[["landing","Посетили лендинг"],["cta","Перешли в Telegram"],["group_joined","Вступили в канал"],["test_started","Запустили тест"],["completed","Завершили тест"],["returned_to_channel","Вернулись в канал"]];
        return '<section class="summary" aria-label="Главные показатели">'+items.map(function(item){var step=map[item[0]]||{count:0,from_landing_percent:0};return '<div class="metric"><strong>'+fmt(step.count)+'</strong><span>'+item[1]+' · '+Number(step.from_landing_percent||0).toFixed(1)+'% от лендинга</span></div>';}).join('')+'</section>';
      }
      function funnel(funnelRows) {
        var resultStart=(funnelRows||[]).findIndex(function(step){return step.key==="completed";});
        return '<article class="funnel"><header class="funnel-head"><p>Полный путь клиента</p><h2>Конверсия каждого этапа</h2></header><div class="journey">'+(funnelRows||[]).map(function(step,index){var drop=index>0&&Number(step.from_previous_percent)<60;var loss=index>0?Math.max(0,Number(funnelRows[index-1].count)-Number(step.count)):0;return '<div class="step'+(drop?' step--drop':'')+(resultStart>=0&&index>=resultStart?' step--result':'')+'"><span class="step-index">'+(index+1)+'</span><span><span class="step-label">'+escapeHtml(step.label)+'</span><span class="step-detail">'+Number(step.from_landing_percent||0).toFixed(1)+'% от посетителей лендинга'+(loss?' · потеряно '+fmt(loss):'')+'</span></span><span class="step-value"><strong>'+fmt(step.count)+'</strong><span'+(drop?' class="loss"':'')+'>'+Number(step.from_previous_percent||0).toFixed(1)+'% от прошлого шага</span></span></div>';}).join('')+'</div></article>';
      }
      function breakdownTable(key) {
        var rows=data&&data[key]||[];
        if(!rows.length)return '<div class="empty">В выбранном периоде данных пока нет.</div>';
        var columns=[["landing","Лендинг"],["cta","Клик"],["group_joined","Вступили"],["test_started","Тест"],["completed","Завершили"],["returned_to_channel","Вернулись"]];
        return '<div class="table-wrap"><table><thead><tr><th>Сегмент</th>'+columns.map(function(column){return '<th>'+column[1]+'</th>';}).join('')+'<th>Лендинг → канал</th><th>Лендинг → тест</th></tr></thead><tbody>'+rows.map(function(row){var map=stepMap(row.funnel);var landing=map.landing||{count:0};var cta=map.cta||{count:0};var test=map.test_started||{count:0};var conversion=function(value){return landing.count?Math.round(value.count/landing.count*100)+'%':'—';};return '<tr><td>'+escapeHtml(row.label||'Без названия')+'</td>'+columns.map(function(column){var step=map[column[0]]||{count:0};return '<td><strong>'+fmt(step.count)+'</strong></td>';}).join('')+'<td>'+conversion(cta)+'</td><td>'+conversion(test)+'</td></tr>';}).join('')+'</tbody></table></div>';
      }
      function breakdowns() {
        return '<section class="breakdowns"><div class="breakdowns-head"><div><p>Атрибуция</p><h2>Разрезы воронки</h2></div></div><div class="breakdown-tabs" role="tablist">'+Object.keys(labels).map(function(key){return '<button class="tab-button" type="button" role="tab" data-breakdown="'+key+'" aria-selected="'+String(key===activeBreakdown)+'">'+labels[key]+'</button>';}).join('')+'</div><div id="breakdown-content">'+breakdownTable(activeBreakdown)+'</div></section>';
      }
      function render(payload) {
        data=payload;
        dashboard.innerHTML=summary(payload.funnel)+funnel(payload.funnel)+breakdowns();
        updated.classList.remove("status-dot--error");
        updated.textContent="Обновлено "+new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:payload.timezone}).format(new Date(payload.generated_at));
        periodLabel.textContent=formatDate(payload.date_from)+" — "+formatDate(payload.date_to)+" · "+payload.timezone;
      }
      function requestJson(url) {
        return new Promise(function(resolve,reject){var request=new XMLHttpRequest();request.open("GET",url,true);request.setRequestHeader("Accept","application/json");request.timeout=15000;request.onload=function(){if(request.status<200||request.status>=300){var message="HTTP "+request.status;try{message=JSON.parse(request.responseText).error||message;}catch(_error){}return reject(new Error(message));}try{resolve(JSON.parse(request.responseText));}catch(error){reject(error);}};request.onerror=function(){reject(new Error("Network error"));};request.ontimeout=function(){reject(new Error("Request timeout"));};request.send();});
      }
      async function load() {
        if(!fromInput.value||!toInput.value)return;
        dashboard.innerHTML='<div class="loading" aria-label="Загрузка"></div>';updated.classList.remove("status-dot--error");updated.textContent="Загрузка данных...";
        try { var params=new URLSearchParams({data:"1",date_from:fromInput.value,date_to:toInput.value});render(await requestJson(location.pathname+"?"+params.toString())); }
        catch(error){updated.classList.add("status-dot--error");updated.textContent="Ошибка обновления";periodLabel.textContent="";dashboard.innerHTML='<div class="error"><strong>Не удалось загрузить статистику.</strong><br>'+escapeHtml(error.message)+'. Обновите страницу через минуту; если ошибка повторяется, backend требует проверки.</div>';}
      }
      function exportCsv() {
        if(!data)return;
        var rows=[["Разрез","Сегмент","Этап","Количество","От прошлого шага","От лендинга"]];
        function add(group,label,funnelRows){(funnelRows||[]).forEach(function(step){rows.push([group,label,step.label,step.count,step.from_previous_percent+"%",step.from_landing_percent+"%"]);});}
        add("Общая воронка","Все",data.funnel);Object.keys(labels).forEach(function(key){(data[key]||[]).forEach(function(row){add(labels[key],row.label||"Без названия",row.funnel);});});
        var csv=rows.map(function(row){return row.map(function(cell){return '"'+String(cell).replace(/"/g,'""')+'"';}).join(',');}).join("\r\n");
        var link=document.createElement("a");link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));link.download="relationship-group-first-"+fromInput.value+"-"+toInput.value+".csv";link.click();URL.revokeObjectURL(link.href);
      }
      document.getElementById("date-form").addEventListener("submit",function(event){event.preventDefault();document.querySelectorAll("[data-range]").forEach(function(button){button.setAttribute("aria-pressed","false");});load();});
      document.getElementById("quick-ranges").addEventListener("click",function(event){var button=event.target.closest("[data-range]");if(button)setRange(button.dataset.range);});
      dashboard.addEventListener("click",function(event){var button=event.target.closest("[data-breakdown]");if(!button||!data)return;activeBreakdown=button.dataset.breakdown;document.querySelectorAll("[data-breakdown]").forEach(function(item){item.setAttribute("aria-selected",String(item.dataset.breakdown===activeBreakdown));});document.getElementById("breakdown-content").innerHTML=breakdownTable(activeBreakdown);});
      document.getElementById("export").addEventListener("click",exportCsv);
      setRange("7d");
    })();
  </script>
</body>
</html>`;
