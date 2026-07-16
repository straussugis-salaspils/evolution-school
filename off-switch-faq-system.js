document.querySelectorAll('[data-off-switch-faq]').forEach((section, sectionIndex) => {
  section.querySelectorAll('details').forEach((details, itemIndex) => {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;

    const suffix = `${sectionIndex + 1}-${itemIndex + 1}`;
    const questionId = summary.id || `off-switch-faq-question-${suffix}`;
    const answerId = `off-switch-faq-answer-${suffix}`;
    summary.id = questionId;
    summary.setAttribute('aria-controls', answerId);
    summary.setAttribute('aria-expanded', String(details.open));

    let answer = details.querySelector(':scope > .off-switch-faq__answer');
    if (!answer) {
      answer = document.createElement('div');
      answer.className = 'off-switch-faq__answer';
      const inner = document.createElement('div');
      inner.className = 'off-switch-faq__answer-inner';
      [...details.children]
        .filter(child => child !== summary)
        .forEach(child => inner.appendChild(child));
      answer.appendChild(inner);
      details.appendChild(answer);
    }

    answer.id = answerId;
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', questionId);
    answer.setAttribute('aria-hidden', String(!details.open));

    details.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', String(details.open));
      answer.setAttribute('aria-hidden', String(!details.open));
    });
  });
});
