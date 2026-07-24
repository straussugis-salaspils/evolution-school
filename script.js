const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}
const dropdownItems = [...document.querySelectorAll('.has-dropdown')];
function closeDropdowns(except) {
  dropdownItems.forEach((item) => {
    if (item === except) return;
    item.classList.remove('is-open');
    item.querySelector('.dropdown-trigger')?.setAttribute('aria-expanded', 'false');
  });
}
dropdownItems.forEach((item) => {
  const trigger = item.querySelector('.dropdown-trigger');
  if (!trigger) return;
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    const open = !item.classList.contains('is-open');
    closeDropdowns(item);
    item.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
  });
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.has-dropdown')) closeDropdowns();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDropdowns();
});

const activeLocalLink = document.querySelector('.eh-local-strip a[aria-current="page"]');
const keepReikiPathStartVisible =
  activeLocalLink?.classList.contains('eh-local-strip__articles') &&
  document.body.classList.contains('eh-context--reiki');
if (activeLocalLink && !keepReikiPathStartVisible) {
  requestAnimationFrame(() => {
    activeLocalLink.scrollIntoView({ block: 'nearest', inline: 'center' });
  });
}

document.querySelectorAll('[data-life-faq-button]').forEach((button) => {
  const panelId = button.getAttribute('aria-controls');
  const panel = panelId ? document.getElementById(panelId) : null;
  if (!panel) return;

  const toggleLifeFaq = () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    panel.classList.toggle('is-open', !isOpen);
  };

  button.addEventListener('click', toggleLifeFaq);
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleLifeFaq();
  });
});

document.querySelectorAll('.off-switch-video-loader[data-vimeo-src]').forEach((button) => {
  button.addEventListener('click', () => {
    const rawSrc = button.dataset.vimeoSrc;
    if (!rawSrc) return;
    let src = rawSrc;
    try {
      const url = new URL(rawSrc, window.location.href);
      url.searchParams.set('autoplay', '1');
      src = url.toString();
    } catch {
      src = rawSrc + (rawSrc.includes('?') ? '&' : '?') + 'autoplay=1';
    }
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = button.dataset.vimeoTitle || button.getAttribute('aria-label') || 'Видеоотзыв';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.tabIndex = 0;
    button.replaceWith(iframe);
    iframe.focus({ preventScroll: true });
  }, { once: true });
});

const startNavigator = document.querySelector('[data-start-navigator]');
if (startNavigator && window.EVOLUTION_START_NAVIGATOR) {
  const data = window.EVOLUTION_START_NAVIGATOR;
  const steps = Object.fromEntries([...startNavigator.querySelectorAll('[data-start-step]')].map((step) => [step.dataset.startStep, step]));
  const resultPanel = startNavigator.querySelector('[data-start-result-panel]');
  const resultTitle = startNavigator.querySelector('[data-start-result-title]');
  const resultRecommendationTitle = startNavigator.querySelector('[data-start-result-recommendation-title]');
  const resultContext = startNavigator.querySelector('[data-start-result-context]');
  const resultReason = startNavigator.querySelector('[data-start-result-reason]');
  const resultImage = startNavigator.querySelector('[data-start-result-image]');
  const resultRecommendations = startNavigator.querySelector('[data-start-recommendations]');
  const conditionHeading = startNavigator.querySelector('[data-start-condition-heading]');
  const diagnosticEyebrow = startNavigator.querySelector('[data-start-diagnostic-eyebrow]');
  const diagnosticHeading = startNavigator.querySelector('[data-start-diagnostic-heading]');
  const state = {};
  let currentView = 'territory';
  let navigatorAnalyticsStarted = false;
  let navigatorAnalyticsCompleted = false;
  const trackNavigator = (eventName, params) => window.ehAnalytics?.track(eventName, params);

  const html = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
  const byId = (items) => Object.fromEntries((items || []).map((item) => [item.id, item]));
  const territories = byId(data.territories);
  const conditions = byId(data.conditions);
  const genders = byId(data.genders);

  const renderChoices = (name, items, kind) => {
    const container = startNavigator.querySelector('[data-start-options="' + name + '"]');
    if (!container) return;
    container.innerHTML = (items || []).map((item) => '<div class="start-choice-item">' +
      '<button class="start-choice start-choice--compact" type="button" role="radio" aria-checked="false" data-start-' + html(kind) + '="' + html(item.id) + '">' +
        (item.eyebrow ? '<span class="start-choice__eyebrow">' + html(item.eyebrow) + '</span>' : '') +
        '<span class="start-choice__title">' + html(item.title) + '</span>' +
        (item.text ? '<span class="start-choice__text">' + html(item.text) + '</span>' : '') +
      '</button>' +
    '</div>').join('');
  };

  const conditionsFor = (territoryId) => (data.conditions || []).map((condition) => {
    const contextual = data.conditionCopy?.[territoryId]?.[condition.id] || {};
    return {
      ...condition,
      ...contextual,
      title: data.conditionTitles?.[territoryId]?.[condition.id] || contextual.title || condition.title,
    };
  });
  const conditionFor = (conditionId, territoryId = state.territory) => {
    const contextual = data.conditionCopy?.[territoryId]?.[conditionId] || {};
    return {
      ...(conditions[conditionId] || {}),
      ...contextual,
      title: data.conditionTitles?.[territoryId]?.[conditionId] || contextual.title || conditions[conditionId]?.title,
    };
  };
  const renderConditions = (territoryId) => {
    renderChoices('conditions', conditionsFor(territoryId), 'condition');
    if (conditionHeading) conditionHeading.textContent = territories[territoryId]?.question || 'Что сейчас происходит в этой теме?';
  };

  const fillTemplate = (value, context) => String(value || '').replace(/\{(outside|moment|momentOutside|action|area)\}/g, (_, key) => context?.[key] || 'этой темы');
  const diagnosticFor = (conditionId, territoryId = state.territory) => {
    const source = data.diagnostics?.[conditionId];
    const context = data.diagnosticContexts?.[territoryId] || {};
    if (!source) return null;
    return {
      ...source,
      question: fillTemplate(source.question, context),
      options: (source.options || []).map((option) => ({
        ...option,
        title: fillTemplate(option.title, context),
        text: fillTemplate(option.text, context),
      })),
    };
  };
  const renderDiagnostics = (territoryId, conditionId) => {
    const diagnostic = diagnosticFor(conditionId, territoryId);
    if (!diagnostic) return false;
    renderChoices('diagnostics', diagnostic.options, 'diagnostic');
    if (diagnosticEyebrow) diagnosticEyebrow.textContent = diagnostic.eyebrow || 'Уточняем ситуацию';
    if (diagnosticHeading) diagnosticHeading.textContent = diagnostic.question;
    const container = startNavigator.querySelector('[data-start-options="diagnostics"]');
    if (container) container.setAttribute('aria-label', diagnostic.ariaLabel || 'Уточнение ситуации');
    return true;
  };

  const territoryOrder = ['relationship', 'partner', 'parenthood', 'realization', 'body', 'patterns', 'transition', 'luck', 'income'];
  renderChoices('territories', territoryOrder.map((id) => territories[id]).filter(Boolean), 'territory');
  renderChoices('genders', data.genders, 'gender');

  const scrollTo = (element) => {
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const focusHeading = (container) => {
    const heading = container?.querySelector('h2, h3, h4');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    window.requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  };
  const showStep = (name, options = {}) => {
    Object.entries(steps).forEach(([key, step]) => { step.hidden = key !== name; });
    if (resultPanel) resultPanel.hidden = true;
    startNavigator.classList.remove('has-choice');
    document.body.classList.remove('is-showing-navigator-result');
    currentView = name;
    scrollTo(steps[name]);
    if (options.focus !== false) focusHeading(steps[name]);
  };
  const setSelected = (kind, value) => {
    startNavigator.querySelectorAll('[data-start-' + kind + ']').forEach((button) => {
      button.setAttribute('aria-checked', String(button.dataset['start' + kind[0].toUpperCase() + kind.slice(1)] === value));
    });
  };

  const outcomeFor = () => {
    const territory = territories[state.territory];
    const condition = conditionFor(state.condition);
    const diagnostic = diagnosticFor(state.condition)?.options?.find((option) => option.id === state.diagnostic);
    const context = [condition?.title, diagnostic?.title].filter(Boolean).join('. ') + '.';

    if (territory?.direct === 'income') {
      const incomeCopy = {
        depleted: {
          title: 'Сначала восстановить опору для возвращения к работе',
          reason: 'Сейчас важнее вернуть рабочий ритм и найти практическую поддержку по доходу. Евгения поможет подобрать профильного специалиста или подходящую программу.',
        },
        triggered: {
          title: 'Разделить тревогу и практическую задачу',
          reason: 'Тревога мешает искать работу и говорить о деньгах, но сама задача остаётся практической. Евгения поможет подобрать поддержку по возвращению к работе и устойчивому доходу.',
        },
        blocked: {
          title: 'Собрать движение от плана к результату',
          reason: 'Направление уже примерно понятно, но шаги не складываются в регулярное действие. Евгения поможет найти специалиста, который соединит план заработка с движением к результату.',
        },
        unclear: {
          title: 'Определить реалистичное направление работы',
          reason: 'Сначала нужен практический разбор навыков, возможных ролей и ближайших шагов. Евгения поможет подобрать профильного специалиста или программу.',
        },
        next: {
          title: 'Собрать устойчивую систему дохода',
          reason: 'Запрос уже не только про отдельную вакансию, а про возвращение к устойчивой работе и собственному доходу. Евгения поможет подобрать точный практический маршрут.',
        },
        final: {
          title: 'Довести до результата один конкретный шаг',
          reason: 'Основной путь уже понятен, и сейчас нужна помощь с одной практической точкой в работе или монетизации. Евгения поможет подобрать профильного специалиста.',
        },
      }[state.condition] || {};
      return {
        title: incomeCopy.title || 'Сначала восстановить устойчивый доход',
        context,
        reason: incomeCopy.reason || 'Сейчас нужен практический маршрут возвращения к работе и устойчивому доходу. Евгения поможет подобрать профильного специалиста или подходящую программу.',
        primary: 'coordinator',
        singleOnly: true,
        navigatorPrimary: true,
        navigatorVariant: 'income',
      };
    }

    const routePair = () => {
      if (state.territory === 'body') return ['reiki', 'offswitch'];
      if (state.territory === 'patterns') return ['offswitch', 'activation'];
      if (state.gender === 'woman') return ['mentoring', 'weekWomen'];
      if (state.gender === 'man') return ['weekMen', 'offswitch'];
      return ['offswitch', 'reiki'];
    };

    if (state.diagnostic === 'noDecision' || state.diagnostic === 'multipleSystems') {
      return {
        title: 'Сначала собрать точную карту ситуации',
        context,
        reason: state.diagnostic === 'multipleSystems'
          ? 'Решение затрагивает несколько сфер жизни. Поэтому сначала важно увидеть их связь и определить один приоритет.'
          : 'В выбранной теме пока не определено главное решение. Поэтому сначала важно уточнить приоритет и только после этого выбирать формат.',
        primary: 'navigator',
        singleOnly: true,
        navigatorPrimary: true,
      };
    }

    if (territory?.direct === 'retreat') {
      if (state.diagnostic === 'globalResource') {
        return {
          title: 'Сначала вернуть силы и затем менять траекторию',
          context,
          reason: 'Череда проблем уже влияет на общий ресурс. Рейки поможет восстановить ежедневную устойчивость, а ретрит остаётся возможным форматом смены накопившейся траектории.',
          primary: 'reiki',
          secondary: 'retreat',
        };
      }
      if (state.diagnostic === 'localizedTrigger') {
        return {
          title: 'Остановить повторяющийся срыв',
          context,
          reason: 'В полосе проблем выделяется один повторяющийся механизм, поэтому первым шагом подходит точечная работа. Если выяснится, что проблема затрагивает общую траекторию жизни, можно рассмотреть ретрит.',
          primary: 'offswitch',
          secondary: 'retreat',
        };
      }
      if (state.diagnostic === 'finalPoint') {
        return {
          title: 'Завершить последний повторяющийся срыв',
          context,
          reason: 'Общее направление уже меняется, и осталась одна конкретная точка. Здесь уместна точечная активация, а ретрит остаётся вторым возможным форматом.',
          primary: 'activation',
          secondary: 'retreat',
        };
      }
      return {
        title: 'Сменить накопившуюся траекторию',
        context,
        reason: 'Проблемы идут одна за другой и затрагивают не один эпизод. Ретрит можно рассмотреть как основной формат смены направления; тренинг Off-Switch в записи остаётся точечной альтернативой для повторяющегося механизма.',
        primary: 'retreat',
        secondary: 'offswitch',
      };
    }

    if (state.diagnostic === 'globalResource') {
      return {
        title: 'Сначала вернуть ресурс',
        context,
        reason: 'Нехватка сил проявляется не только в выбранной теме, но и в обычной жизни. Поэтому первым шагом становится практика восстановления; тренинг Off-Switch в записи остаётся вторым вариантом, если внутри темы есть конкретная реакция.',
        primary: 'reiki',
        secondary: 'offswitch',
      };
    }

    if (state.diagnostic === 'localizedTrigger') {
      const isFinal = state.condition === 'final';
      const widerOption = state.territory === 'body' ? 'reiki' : state.territory === 'patterns' ? 'activation' : null;
      return {
        title: isFinal ? 'Завершить одну оставшуюся точку' : 'Вернуть выбор в конкретный момент',
        context,
        reason: isFinal
          ? 'Цель и действие уже ясны, а проблема остаётся в одном конкретном моменте. Квантовая активация подходит как завершающий сдвиг; тренинг Off-Switch в записи — практический формат для повторяющейся реакции.'
          : widerOption
            ? 'В остальных сферах силы и ясность сохраняются, а остановка возникает в одном повторяющемся моменте. Поэтому первым шагом становится точечная работа с автоматической реакцией; второй формат поддерживает более широкий слой выбранной темы.'
            : 'В остальных сферах силы и ясность сохраняются, а остановка возникает в одном повторяющемся моменте. Поэтому здесь честно рекомендовать один точечный формат, а более широкий следующий шаг при необходимости уточнить с Евгенией.',
        primary: isFinal ? 'activation' : 'offswitch',
        secondary: isFinal ? 'offswitch' : widerOption,
        oneProduct: !isFinal && !widerOption,
      };
    }

    if (state.diagnostic === 'finalPoint') {
      return {
        title: 'Завершить уже созревший переход',
        context,
        reason: 'Главные решения уже приняты, и осталась одна конкретная точка. Квантовая активация становится основным форматом, а тренинг Off-Switch в записи — альтернативой, если точку удерживает повторяющаяся реакция.',
        primary: 'activation',
        secondary: 'offswitch',
      };
    }

    if (state.diagnostic === 'structuredRoute') {
      const [primary, secondary] = routePair();
      const structuredCopy = {
        relationship: {
          title: 'Собрать изменения в отношениях в последовательный маршрут',
          reason: 'Вы уже видите, что хотите изменить в отношениях, но отдельные решения пока не складываются в устойчивый результат. Сейчас нужен формат, который соединит понимание, новые действия и обратную связь.',
        },
        partner: {
          title: 'Собрать новый сценарий отношений в последовательный маршрут',
          reason: 'Прежний способ выбирать партнёра больше не приводит к тем отношениям, которые вам нужны. Сейчас важно соединить внутренние изменения с конкретными решениями и действиями.',
        },
        parenthood: {
          title: 'Собрать путь к рождению ребёнка в последовательный маршрут',
          reason: 'Отдельные ответы уже не дают нужной ясности. Сейчас важно увидеть связанную последовательность решений, опор и действий для следующего этапа.',
        },
        realization: {
          title: 'Собрать профессиональный переход в последовательный маршрут',
          reason: 'Направление перемен уже чувствуется, но отдельные решения пока не образуют устойчивого движения. Нужен формат, который соединит потенциал, выбор и действия.',
        },
        body: {
          title: 'Собрать восстановление тела и энергии в устойчивый ритм',
          reason: 'Отдельные способы восстановления помогают лишь частично. Сейчас важно соединить поддержку тела, ежедневный ритм и последовательные действия.',
        },
        patterns: {
          title: 'Последовательно изменить повторяющийся сценарий',
          reason: 'Вы уже замечаете повторяющуюся реакцию, но одного понимания недостаточно. Сейчас нужен формат, который поможет изменить выбор и закрепить его в реальных действиях.',
        },
        transition: {
          title: 'Собрать изменения нескольких сфер в один маршрут',
          reason: 'Перемены уже затрагивают несколько частей жизни. Сейчас важно связать решения между собой и выстроить последовательность, которая удерживает общий переход.',
        },
      }[state.territory] || {};
      return {
        title: structuredCopy.title || 'Собрать последовательное движение в одной теме',
        context,
        reason: structuredCopy.reason || 'Отдельные шаги уже возможны, но им не хватает связанной последовательности и нового ритма. Первый формат ниже точнее соответствует ответам, второй даёт другую глубину входа.',
        primary,
        secondary,
      };
    }

    return {
      title: 'Сначала уточнить точку перехода',
      context,
      reason: 'Ответы пока не дают честно различить продукты. Сначала стоит коротко уточнить направление с Евгенией. Если нужна глубокая персональная карта, следующим шагом станет стратегическая сессия со Светланой.',
      primary: 'offswitch',
      secondary: 'reiki',
      navigatorPrimary: true,
    };
  };

  const renderRecommendations = (outcome) => {
    const productIds = (outcome.singleOnly ? [] : [outcome.primary, outcome.secondary])
      .filter((productId, index, list) => productId && list.indexOf(productId) === index);
    const productCards = productIds.map((productId, index) => {
      const product = data.products[productId];
      if (!product) return '';
      const external = product.external ? ' target="_blank" rel="noopener"' : '';
      const primaryProduct = index === 0 && !outcome.navigatorPrimary;
      const label = index === 0 ? 'Основная рекомендация' : 'Ещё один подходящий вариант';
      return '<article class="start-result-product-card ' + (primaryProduct ? 'is-primary' : 'is-secondary') + '">' +
        '<span>' + label + '</span>' +
        '<h4>' + html(product.title) + '</h4>' +
        '<p>' + html(product.text) + '</p>' +
        '<a class="button ' + (primaryProduct ? 'button--primary' : 'button--secondary') + '" href="' + html(product.href) + '"' + external + '>' + html(product.cta) + (product.external ? '<span class="sr-only"> (откроется в новой вкладке)</span>' : '') + '</a>' +
      '</article>';
    }).join('');

    const navigatorIsPrimary = Boolean(outcome.navigatorPrimary || outcome.singleOnly);
    const navigatorCard = '<article class="start-result-navigator-card ' + (navigatorIsPrimary ? 'is-primary' : '') + '">' +
      '<div class="start-result-navigator-card__head">' +
        '<span>' + html(data.navigator.cardLabel) + '</span>' +
        '<h4>' + html(data.navigator.cardTitle) + '</h4>' +
        '<p>' + html(data.navigator.cardText) + '</p>' +
        '<p>' + html(data.navigator.cardTextSecondary) + '</p>' +
      '</div>' +
      '<div class="start-result-navigator-card__options">' +
        '<section class="start-result-navigator-option is-recommended">' +
          '<span>' + html(data.navigator.freeLabel) + '</span>' +
          '<h5>' + html(data.navigator.freeTitle) + '</h5>' +
          '<p class="start-result-navigator-option__price">' + html(data.navigator.freePrice) + '</p>' +
          '<p>' + html(data.navigator.freeText) + '</p>' +
          '<div class="start-result-navigator-option__actions">' +
            '<a class="button button--primary" href="' + html(data.navigator.freeHref) + '" target="_blank" rel="noopener">' + html(data.navigator.freeCta) + '</a>' +
            '<small class="start-result-navigator-option__note">' + html(data.navigator.freeNote) + '</small>' +
          '</div>' +
        '</section>' +
        '<section class="start-result-navigator-option">' +
          '<span>' + html(data.navigator.paidLabel) + '</span>' +
          '<h5>' + html(data.navigator.paidTitle) + '</h5>' +
          '<p class="start-result-navigator-option__price">' + html(data.navigator.paidPrice) + '</p>' +
          '<p>' + html(data.navigator.paidText) + '</p>' +
          '<div class="start-result-navigator-option__actions">' +
            '<a class="button button--secondary" href="' + html(data.navigator.paidHref) + '" data-getcourse-product="navigator-svetlana">' + html(data.navigator.paidCta) + '</a>' +
          '</div>' +
        '</section>' +
      '</div>' +
    '</article>';

    resultRecommendations.innerHTML = (productCards ? '<div class="start-result-products">' + productCards + '</div>' : '') + navigatorCard;
  };

  const showResult = () => {
    const outcome = outcomeFor();
    if (!outcome || !resultPanel) return;
    const primary = data.products[outcome.navigatorPrimary ? 'navigator' : outcome.primary];
    if (!primary || !resultTitle || !resultRecommendationTitle || !resultContext || !resultReason || !resultImage || !resultRecommendations) return;
    Object.values(steps).forEach((step) => { step.hidden = true; });
    startNavigator.classList.add('has-choice');
    resultTitle.textContent = territories[state.territory]?.title || 'Ваша ситуация';
    resultContext.textContent = outcome.context;
    resultRecommendationTitle.textContent = outcome.title;
    resultReason.textContent = outcome.reason;
    resultImage.src = primary.image || '';
    resultImage.alt = primary.imageAlt || '';
    resultImage.closest('figure').hidden = !primary.image;
    renderRecommendations(outcome);
    resultPanel.hidden = false;
    document.body.classList.add('is-showing-navigator-result');
    currentView = 'result';
    if (!navigatorAnalyticsCompleted) {
      navigatorAnalyticsCompleted = true;
      trackNavigator('navigator_complete', {
        navigator_type: 'start_navigator',
        result_type: outcome.navigatorPrimary ? 'navigator' : outcome.primary,
        entry_page: window.location.pathname || '/',
      });
    }
    scrollTo(resultPanel);
    focusHeading(resultPanel);
  };

  const genderedTerritories = new Set(['relationship', 'partner', 'parenthood', 'realization', 'transition']);
  const needsGender = () => ['structuredRoute', 'noDecision', 'multipleSystems'].includes(state.diagnostic)
    && genderedTerritories.has(state.territory)
    && !territories[state.territory]?.direct;

  const chooseTerritory = (territoryId, options = {}) => {
    if (!territories[territoryId]) return;
    if (!navigatorAnalyticsStarted) {
      navigatorAnalyticsStarted = true;
      trackNavigator('navigator_start', {
        entry_page: window.location.pathname || '/',
        navigator_type: 'start_navigator',
        traffic_source: window.ehAnalytics?.getFirstTouch?.().source || 'direct',
      });
    }
    state.territory = territoryId;
    delete state.condition;
    delete state.diagnostic;
    delete state.gender;
    setSelected('territory', territoryId);
    renderConditions(territoryId);
    showStep('condition');
    if (!options.fromUrl) scrollTo(steps.condition);
  };

  const resetNavigator = () => {
    Object.keys(state).forEach((key) => { delete state[key]; });
    navigatorAnalyticsStarted = false;
    navigatorAnalyticsCompleted = false;
    startNavigator.querySelectorAll('[role="radio"][aria-checked]').forEach((button) => button.setAttribute('aria-checked', 'false'));
    showStep('territory', { focus: false });
    startNavigator.querySelector('[data-start-territory]')?.focus();
  };

  const previousStep = () => {
    let target = 'territory';
    if (currentView === 'condition') target = 'territory';
    if (currentView === 'diagnostic') target = 'condition';
    if (currentView === 'gender') target = 'diagnostic';
    if (currentView === 'result') {
      target = needsGender() ? 'gender' : (territories[state.territory]?.direct === 'income' ? 'condition' : 'diagnostic');
    }
    showStep(target, { focus: false });
    const kindByStep = { territory: 'territory', condition: 'condition', diagnostic: 'diagnostic', gender: 'gender' };
    const kind = kindByStep[target];
    const value = kind ? state[kind] : null;
    const selected = value ? startNavigator.querySelector('[data-start-' + kind + '="' + CSS.escape(value) + '"]') : null;
    window.requestAnimationFrame(() => (selected || steps[target]?.querySelector('h3'))?.focus({ preventScroll: true }));
  };

  startNavigator.addEventListener('click', (event) => {
    const resetButton = event.target.closest('[data-start-reset]');
    if (resetButton) {
      resetNavigator();
      return;
    }
    const backButton = event.target.closest('[data-start-back]');
    if (backButton) {
      previousStep();
      return;
    }
    const territoryButton = event.target.closest('[data-start-territory]');
    if (territoryButton) {
      chooseTerritory(territoryButton.dataset.startTerritory);
      return;
    }
    const conditionButton = event.target.closest('[data-start-condition]');
    if (conditionButton) {
      state.condition = conditionButton.dataset.startCondition;
      delete state.diagnostic;
      delete state.gender;
      setSelected('condition', state.condition);
      if (territories[state.territory]?.direct === 'income') {
        showResult();
      } else if (renderDiagnostics(state.territory, state.condition)) {
        showStep('diagnostic');
      }
      return;
    }
    const diagnosticButton = event.target.closest('[data-start-diagnostic]');
    if (diagnosticButton) {
      state.diagnostic = diagnosticButton.dataset.startDiagnostic;
      delete state.gender;
      setSelected('diagnostic', state.diagnostic);
      if (needsGender()) showStep('gender');
      else showResult();
      return;
    }
    const genderButton = event.target.closest('[data-start-gender]');
    if (genderButton) {
      state.gender = genderButton.dataset.startGender;
      setSelected('gender', state.gender);
      showResult();
    }
  });

  const areaAliases = {
    relationships: 'relationship',
    relationship: 'relationship',
    partner: 'partner',
    family: 'parenthood',
    parenthood: 'parenthood',
    work: 'realization',
    realization: 'realization',
    income: 'income',
    body: 'body',
    resource: 'body',
    reactions: 'patterns',
    patterns: 'patterns',
    transition: 'transition',
    change: 'transition',
    luck: 'luck',
  };
  const initialArea = new URLSearchParams(window.location.search).get('area') || new URLSearchParams(window.location.search).get('territory');
  if (initialArea) {
    chooseTerritory(areaAliases[initialArea] || initialArea, { fromUrl: true });
  }
}
const aboutPeople = document.querySelector('[data-about-people]');
if (aboutPeople) {
  const peopleButtons = [...aboutPeople.querySelectorAll('[data-about-person]')];
  const peopleProfiles = [...aboutPeople.querySelectorAll('[data-about-profile]')];
  const peopleCloseButtons = [...aboutPeople.querySelectorAll('[data-about-close]')];
  const peopleEmpty = aboutPeople.querySelector('[data-about-empty]');
  const closePeople = () => {
    if (peopleEmpty) peopleEmpty.hidden = false;
    peopleButtons.forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    peopleProfiles.forEach((profile) => {
      profile.hidden = true;
      profile.classList.remove('is-active');
    });
  };
  const showPerson = (id, shouldScroll = false) => {
    if (peopleEmpty) peopleEmpty.hidden = true;
    peopleButtons.forEach((button) => {
      const active = button.dataset.aboutPerson === id;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    peopleProfiles.forEach((profile) => {
      const active = profile.dataset.aboutProfile === id;
      profile.hidden = !active;
      profile.classList.toggle('is-active', active);
      if (active && shouldScroll && window.matchMedia('(max-width: 860px)').matches) {
        profile.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };
  peopleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isActive = button.getAttribute('aria-pressed') === 'true';
      if (isActive) closePeople();
      else showPerson(button.dataset.aboutPerson, true);
    });
  });
  peopleCloseButtons.forEach((button) => button.addEventListener('click', closePeople));
}

const levelsModal = document.querySelector('[data-levels-modal]');
if (levelsModal) {
  let modalReturnFocus = null;
  const dialog = levelsModal.querySelector('[role="dialog"]');
  const modalTitle = levelsModal.querySelector('#levels-modal-title');
  const modalIntro = levelsModal.querySelector('.levels-modal__intro');
  const modalForm = levelsModal.querySelector('.levels-modal__form');
  const defaultModalTitle = modalTitle ? modalTitle.textContent : '';
  const defaultModalIntro = modalIntro ? modalIntro.textContent : '';
  const defaultModalAction = modalForm ? modalForm.getAttribute('action') : '';
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const closeLevelsModal = () => {
    levelsModal.hidden = true;
    document.body.classList.remove('is-modal-open');
    if (modalReturnFocus) modalReturnFocus.focus();
  };
  const openLevelsModal = (trigger) => {
    modalReturnFocus = trigger;
    if (modalTitle) modalTitle.textContent = trigger.dataset.levelsModalTitle || defaultModalTitle;
    if (modalIntro) modalIntro.textContent = trigger.dataset.levelsModalIntro || defaultModalIntro;
    if (modalForm) {
      const subject = trigger.dataset.levelsModalSubject;
      const recipient = (defaultModalAction.match(/^mailto:([^?]+)/) || [])[1];
      modalForm.setAttribute('action', subject && recipient
        ? `mailto:${recipient}?subject=${encodeURIComponent(subject)}`
        : defaultModalAction);
    }
    levelsModal.hidden = false;
    document.body.classList.add('is-modal-open');
    const firstFocusable = levelsModal.querySelector(focusableSelector);
    (firstFocusable || dialog || levelsModal).focus();
  };
  document.querySelectorAll('[data-levels-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openLevelsModal(trigger);
    });
  });
  levelsModal.querySelectorAll('[data-levels-modal-close]').forEach((trigger) => {
    trigger.addEventListener('click', closeLevelsModal);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !levelsModal.hidden) closeLevelsModal();
  });
}

/* GetCourse purchase widgets. A widget is created only after a visitor
   chooses a paid CTA; no checkout iframe or external widget is loaded on
   initial page render. The component is shared by the activation, Training
   and Navigator pages through product data attributes. */
(() => {
  const products = {
    'off-switch-training': {
      title: 'Тренинг Off-Switch в записи',
      scriptId: '8c4baf5aa37859ad854bd548ca519f4e66eb9a7a',
      url: 'https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1630846',
    },
    'quantum-single': {
      title: 'Одна Квантовая активация',
      scriptId: '23909eee5aae73ba498e9104141020281bf448bf',
      url: 'https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1630435',
    },
    'quantum-100': {
      title: 'Квантовые активации на 100 дней',
      scriptId: '70440d18a05458ace468506e96a04935e679135b',
      url: 'https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1630433',
    },
    'navigator-svetlana': {
      title: 'Сессия «Навигатор»',
      scriptId: '9f4bf0c8c8c28f8c5d6b3bdf17fa7a5058aea8cd',
      url: 'https://smarttraining.getcourse.ru/pl/lite/widget/script?id=1630285',
    },
  };

  let lastTrigger = null;

  const productKeyFor = (trigger) => {
    if (trigger.hasAttribute('data-off-switch-checkout')) return 'off-switch-training';
    return trigger.dataset.gcProduct || trigger.dataset.getcourseProduct || '';
  };

  const close = (modal) => {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gc-payment-modal-is-open');
    lastTrigger?.focus({ preventScroll: true });
  };

  const closeOpen = () => {
    document.querySelectorAll('.gc-payment-modal:not([hidden])').forEach(close);
  };

  const startWidget = (scriptId) => {
    const start = window[`startWidget${scriptId}`];
    if (typeof start === 'function') start();
    else document.dispatchEvent(new Event(`StartWidget${scriptId}`));
  };

  const createModal = (key) => {
    const product = products[key];
    if (!product) return null;
    const modalId = `gc-payment-${key}`;
    const existing = document.getElementById(modalId);
    if (existing) return existing;

    const modal = document.createElement('div');
    modal.className = 'gc-payment-modal';
    modal.id = modalId;
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-labelledby', `${modalId}-title`);
    modal.innerHTML = `
      <div class="gc-payment-modal__backdrop" data-gc-payment-close></div>
      <div class="gc-payment-modal__panel" role="document">
        <button class="gc-payment-modal__close" type="button" aria-label="Закрыть оплату" data-gc-payment-close>&times;</button>
        <p class="gc-payment-modal__eyebrow">Оплата</p>
        <h2 class="gc-payment-modal__title" id="${modalId}-title"></h2>
        <div class="gc-payment-widget" aria-label="Оплата">
          <div class="gc-payment-widget__frame"></div>
        </div>
      </div>`;
    modal.querySelector('.gc-payment-modal__title').textContent = product.title;
    document.body.appendChild(modal);
    return modal;
  };

  const loadWidget = (modal, key) => {
    const product = products[key];
    const frame = modal?.querySelector('.gc-payment-widget__frame');
    if (!product || !frame || frame.dataset.gcWidgetLoaded === 'true') return;
    frame.dataset.gcWidgetLoaded = 'true';
    const script = document.createElement('script');
    script.id = product.scriptId;
    script.src = product.url;
    script.async = true;
    script.addEventListener('load', () => startWidget(product.scriptId));
    frame.appendChild(script);
  };

  const open = (key, trigger) => {
    const modal = createModal(key);
    if (!modal) return;
    closeOpen();
    lastTrigger = trigger;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gc-payment-modal-is-open');
    requestAnimationFrame(() => loadWidget(modal, key));
    modal.querySelector('[data-gc-payment-close]')?.focus({ preventScroll: true });
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const closeControl = event.target.closest('[data-gc-payment-close]');
    if (closeControl) {
      close(closeControl.closest('.gc-payment-modal'));
      return;
    }
    const trigger = event.target.closest('[data-gc-product], [data-getcourse-product], [data-off-switch-checkout]');
    const key = trigger ? productKeyFor(trigger) : '';
    if (!trigger || !products[key]) return;
    event.preventDefault();
    open(key, trigger);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeOpen();
  });
})();
