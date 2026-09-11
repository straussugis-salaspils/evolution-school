/* Deliberately no advertising scripts or result data in URLs. Review-only API. */
const endpoint = "/api/relationship-web-quiz";
const storageKey = "eh.web-quiz.preview.v1";
const el = (id) => document.getElementById(id);
let key;
try { key = sessionStorage.getItem(storageKey); } catch { /* Ephemeral browser mode. */ }
if (!key) key = crypto.randomUUID();
try { sessionStorage.setItem(storageKey, key); } catch { /* Continue without persistence. */ }
let state = null;
let questionIndex = 0;
let resultScreen = 0;
let busy = false;
let retryAction = null;

async function api(action, extra = {}) {
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, session_key: key, ...extra }),
    signal: AbortSignal.timeout(15000), cache: "no-store"
  });
  if (!response.ok) {
    if (response.status === 409) throw new Error("Тест обновился. Нажмите «Начать заново», чтобы открыть актуальную версию.");
    throw new Error("Не удалось сохранить шаг. Проверьте интернет и попробуйте ещё раз — ваши сохранённые ответы не потеряются.");
  }
  return response.json();
}

async function run(task) {
  if (busy) return;
  busy = true;
  el("error-box").hidden = true;
  document.querySelectorAll("button, input").forEach((node) => { node.disabled = true; });
  el("main").setAttribute("aria-busy", "true");
  try { await task(); retryAction = null; }
  catch (error) {
    retryAction = task;
    el("error-text").textContent = error.message || "Не удалось загрузить тест. Попробуйте ещё раз.";
    el("error-box").hidden = false;
  } finally {
    busy = false;
    el("main").removeAttribute("aria-busy");
    document.querySelectorAll("button, input").forEach((node) => { node.disabled = false; });
  }
}

function node(tag, text, className) {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
}

// Canonical Markdown is rendered with DOM text nodes, never executable HTML.
function inline(parent, text) {
  text.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    parent.append(part.startsWith("**") && part.endsWith("**")
      ? node("strong", part.slice(2, -2)) : document.createTextNode(part));
  });
}
function richText(text) {
  const container = node("div", undefined, "result-copy");
  text.split(/\n\n+/).forEach((paragraph) => {
    if (paragraph.split("\n").every((line) => line.startsWith("• "))) {
      const list = node("ul");
      paragraph.split("\n").forEach((line) => { const li = node("li"); inline(li, line.slice(2)); list.append(li); });
      container.append(list);
    } else {
      const p = node("p", undefined, paragraph.includes("↓") ? "cycle" : "");
      inline(p, paragraph); container.append(p);
    }
  });
  return container;
}

function beginPanel(label, count, value, max) {
  document.body.classList.add("quiz-active");
  el("landing").hidden = true;
  el("quiz").hidden = false;
  el("progress-label").textContent = label;
  el("progress-count").textContent = count;
  el("progress").max = max;
  el("progress").value = value;
  el("quiz-content").replaceChildren();
}
function focusHeading() {
  const heading = document.querySelector(".quiz-heading");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}
function button(text, task, primary = true) {
  const b = node("button", text, primary ? "button button--primary" : "text-button");
  b.type = "button";
  b.addEventListener("click", () => run(task));
  return b;
}

function choiceForm(prompt, options, selected, onSubmit, backTask) {
  const root = el("quiz-content");
  const h = node("h2", prompt, "quiz-heading"); h.id = "question-title"; root.append(h);
  const form = node("form");
  const fields = node("fieldset", undefined, "options");
  fields.setAttribute("aria-labelledby", "question-title");
  fields.append(node("legend", "Выберите один ответ", "sr-only"));
  options.forEach((option) => {
    const label = node("label", undefined, "option");
    const input = document.createElement("input");
    input.type = "radio"; input.name = "answer"; input.value = option.id;
    input.required = true; input.checked = option.id === selected;
    label.append(input, node("span", option.label)); fields.append(label);
  });
  const actions = node("div", undefined, "quiz-actions");
  if (backTask) actions.append(button("← Назад", backTask, false));
  const next = node("button", "Далее →", "button button--primary");
  next.type = "submit"; actions.append(next);
  form.append(fields, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedValue = new FormData(form).get("answer");
    if (typeof selectedValue === "string") run(() => onSubmit(selectedValue));
  });
  root.append(form); focusHeading();
}

function showQuestion() {
  const index = questionIndex;
  const q = state.questions[index];
  beginPanel("Ваши отношения", `${questionIndex + 1} / 7`, questionIndex, 7);
  el("quiz-content").append(node("p", "Выберите один ответ — тот, который ближе к вашим отношениям в последние месяцы.", "quiz-intro"));
  choiceForm(q.prompt, q.options, state.answers[questionIndex], async (id) => {
    state = await api("answer", { answers: [...state.answers.slice(0, index), id] });
    questionIndex = index + 1;
    await showCurrent();
  }, questionIndex > 0 ? async () => { questionIndex -= 1; showQuestion(); } : null);
}

async function showResult(screen) {
  resultScreen = screen;
  const outcome = state.outcome;
  beginPanel(screen === 3 ? "Ваш следующий шаг" : "Ваш персональный разбор", `${screen + 1} / 4`, screen + 1, 4);
  const root = el("quiz-content");
  root.append(node("h2", screen === 0 ? outcome.title : outcome.headings[screen].split(" · ")[0], "quiz-heading result-heading"));
  root.append(richText(outcome.messages[screen]));
  const actions = node("div", undefined, "quiz-actions");
  if (screen > 0) actions.append(button("← Назад", () => showResult(screen - 1), false));
  if (screen < 3) actions.append(button(outcome.continue_labels[screen] + " →", async () => {
    await api("view", { screen }); await showResult(screen + 1);
  }));
  else {
    actions.append(button("ПРИСОЕДИНИТЬСЯ К НЕДЕЛЕ ЛЁГКОСТИ", async () => {
      // Record the rendered offer before requesting the attributed invite, even after a retry.
      await api("view", { screen: 3 });
      const result = await api("telegram");
      const destination = new URL(result.telegram_url);
      if (destination.protocol !== "https:" || destination.hostname !== "t.me") throw new Error("Не удалось открыть канал. Попробуйте ещё раз.");
      window.location.assign(destination.href);
    }));
  }
  root.append(actions);
  if (screen === 3) root.append(node("p", "Бесплатно. Откроется Telegram-канал с программой и практиками. Результат останется на этой странице.", "offer-note"));
  focusHeading();
  // Each rendered screen has a first-view timestamp; retries never duplicate it.
  await api("view", { screen });
}

async function showCurrent() {
  if (!state.outcome) { showQuestion(); return; }
  if (state.outcome.kind === "selection") {
    beginPanel("Ещё одно уточнение", "7 / 7", 7, 7);
    el("quiz-content").append(node("p", state.outcome.intro, "quiz-intro"));
    choiceForm(state.outcome.situation, state.outcome.options, null, async (profile) => {
      state = await api("select", { profile }); await showResult(0);
    }, async () => { questionIndex = 6; showQuestion(); });
  } else await showResult(resultScreen);
}

el("start").addEventListener("click", () => run(async () => {
  if (!state) state = await api("visit");
  state = await api("start"); questionIndex = Math.min(state.answers.length, 6); await showCurrent();
}));
el("retry").addEventListener("click", () => { if (retryAction) run(retryAction); });
function restartAttempt() {
  if (!window.confirm("Начать тест заново? Текущий результат будет заменён новым прохождением.")) return;
  key = crypto.randomUUID();
  try { sessionStorage.setItem(storageKey, key); } catch { /* Ephemeral session. */ }
  state = null; questionIndex = 0; resultScreen = 0;
  run(async () => { state = await api("visit"); state = await api("start"); showQuestion(); });
}
el("new-attempt").addEventListener("click", restartAttempt);
el("error-new-attempt").addEventListener("click", restartAttempt);
run(async () => {
  state = await api("visit");
  if (state.started) {
    questionIndex = Math.min(state.answers.length, 6);
    // Resume at the first result page; no unseen screens are counted on reload.
    await showCurrent();
  }
});
