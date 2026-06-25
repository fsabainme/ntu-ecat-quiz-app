window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml, pct, formatDate } = NTU.util;

  function renderExamReview(params, container) {
    const paper = NTU.data.getPaper(params.group, params.paperNumber);
    const attempt = NTU.store.getExamAttempt(params.attemptId);
    if (!paper || !attempt) {
      container.innerHTML = `<div class="empty-state"><h2>Review not found</h2><a href="#/papers">Back</a></div>`;
      return;
    }
    const scorePct = pct(attempt.score, attempt.totalQuestions);

    const bySection = {};
    paper.questions.forEach((q) => {
      const section = (NTU.data.sectionForQuestionNumber(q.question_number) || {}).name || "Other";
      bySection[section] = bySection[section] || [];
      bySection[section].push(q);
    });

    container.innerHTML = `
      <p><a href="#/papers/${paper.group_code}/${paper.paper_number}">&larr; Paper ${paper.paper_number}</a></p>
      <h1>${NTU.data.GROUP_LABELS[paper.group_code]} &mdash; Paper ${paper.paper_number} Review</h1>
      <div class="card" style="text-align:center">
        <div class="stat-value" style="font-size:2.4rem">${attempt.score}/${attempt.totalQuestions}</div>
        <div class="muted">${scorePct}% &middot; submitted ${attempt.submittedReason === "timeout" ? "(time expired)" : ""} on ${formatDate(attempt.completedAt)}</div>
      </div>

      <h2>Section scores</h2>
      <div class="card-grid cols-3">
        ${Object.entries(attempt.sectionScores || {})
          .map(([name, s]) => `<div class="stat-tile"><div class="stat-value">${s.score}/${s.total}</div><div class="stat-label">${escapeHtml(name)}</div></div>`)
          .join("")}
      </div>

      ${Object.entries(bySection)
        .map(([section, qs]) => `
          <div class="review-section-heading">${escapeHtml(section)}</div>
          <div class="card">
            ${qs
              .map((q) => {
                const chosen = attempt.answers[q.id] || null;
                const right = chosen === q.correct;
                return `<div class="review-item">
                  <div class="review-stem">${q.question_number}. ${escapeHtml(q.stem)}</div>
                  <div class="review-answers">
                    ${chosen ? `<span class="${right ? "right" : "wrong"}">Your answer: ${chosen}</span>` : `<span class="wrong">Not answered</span>`}
                    &middot; <span class="right">Correct: ${q.correct}</span>
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        `)
        .join("")}

      <p style="margin-top:16px">
        <a class="btn" href="#/papers/${paper.group_code}/${paper.paper_number}">Back to paper</a>
        <a class="btn btn-secondary" href="#/papers">All papers</a>
      </p>
    `;
  }

  window.NTU.views.review = { renderExamReview };
})();
