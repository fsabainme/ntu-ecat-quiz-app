window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml, formatTime, pct } = NTU.util;
  const EXAM_SECONDS = 120 * 60;

  function renderLanding(params, container) {
    const paper = NTU.data.getPaper(params.group, params.paperNumber);
    if (!paper) {
      container.innerHTML = `<div class="empty-state"><h2>Paper not found</h2><a href="#/papers">Back</a></div>`;
      return;
    }
    const state = NTU.store.load();
    const attempts = state.examAttempts.filter(
      (a) => a.groupCode === paper.group_code && a.paperNumber === paper.paper_number
    );
    const inProgress = NTU.store.getInProgressExam();
    const hasInProgress = inProgress && inProgress.groupCode === paper.group_code && inProgress.paperNumber === paper.paper_number;
    const coverRows = (paper.cover_rows || []).map((row) => [...new Set(row)]);

    container.innerHTML = `
      <p><a href="#/papers">&larr; Model papers</a></p>
      <h1>${NTU.data.GROUP_LABELS[paper.group_code]} &mdash; Paper ${paper.paper_number}</h1>
      <div class="card">
        ${coverRows.map((row) => `<div class="cover-info-grid">${row.map((c) => `<div>${escapeHtml(c)}</div>`).join("")}</div>`).join("")}
      </div>
      <div class="info-box explanation">
        100 questions &middot; 5 options (A&ndash;E) &middot; 120 minutes &middot; no negative marking unless stated by the admission office.
        No feedback is shown during the exam &mdash; review and scoring happen after you submit.
      </div>
      <p style="margin-top:16px">
        ${hasInProgress
          ? `<a class="btn" href="#/papers/${paper.group_code}/${paper.paper_number}/exam">Resume in-progress attempt</a>`
          : `<button class="btn" id="start-exam">Start 2-hour timed exam</button>`}
      </p>
      ${attempts.length
        ? `<h2>Previous attempts</h2><div class="card">` +
          attempts
            .slice()
            .reverse()
            .map(
              (a) =>
                `<div class="activity-row"><a href="#/papers/${paper.group_code}/${paper.paper_number}/review/${a.attemptId}">${a.score}/${a.totalQuestions} (${pct(a.score, a.totalQuestions)}%)</a><span class="muted">${(a.completedAt || "").slice(0, 10)}</span></div>`
            )
            .join("") +
          `</div>`
        : ""}
    `;

    const startBtn = container.querySelector("#start-exam");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        if (hasInProgress) return;
        NTU.store.setInProgressExam({
          groupCode: paper.group_code,
          paperNumber: paper.paper_number,
          startedAt: new Date().toISOString(),
          answers: {},
        });
        NTU.router.navigate(`#/papers/${paper.group_code}/${paper.paper_number}/exam`);
      });
    }
  }

  function renderExam(params, container) {
    if (window.__ntuExamTimer) clearInterval(window.__ntuExamTimer);
    const paper = NTU.data.getPaper(params.group, params.paperNumber);
    if (!paper) {
      container.innerHTML = `<div class="empty-state"><h2>Paper not found</h2><a href="#/papers">Back</a></div>`;
      return;
    }
    let inProgress = NTU.store.getInProgressExam();
    if (!inProgress || inProgress.groupCode !== paper.group_code || inProgress.paperNumber !== paper.paper_number) {
      inProgress = { groupCode: paper.group_code, paperNumber: paper.paper_number, startedAt: new Date().toISOString(), answers: {} };
      NTU.store.setInProgressExam(inProgress);
    }
    const answers = inProgress.answers;
    const questions = paper.questions;
    const ctx = NTU.data.questionContext(paper);
    let idx = 0;
    let timerInterval = null;
    let submitted = false;

    function persist() {
      NTU.store.setInProgressExam(Object.assign({}, inProgress, { answers }));
    }

    function remainingSeconds() {
      const elapsed = Math.floor((Date.now() - new Date(inProgress.startedAt).getTime()) / 1000);
      return EXAM_SECONDS - elapsed;
    }

    function renderCurrent() {
      const q = questions[idx];
      const context = ctx[q.question_number] || {};
      const chosen = answers[q.id] || null;

      container.innerHTML = `
        <div class="exam-timer" id="exam-timer">--:--</div>
        <div class="exam-top-actions">
          <button class="btn btn-secondary" id="prev-q" ${idx === 0 ? "disabled" : ""}>&larr; Prev</button>
          <button class="btn" id="next-q" ${idx === questions.length - 1 ? "disabled" : ""}>Next &rarr;</button>
          <button class="btn btn-danger" id="submit-exam">Submit exam</button>
        </div>
        <h1>${NTU.data.GROUP_LABELS[paper.group_code]} &mdash; Paper ${paper.paper_number}</h1>
        ${context.sectionTitle ? `<div class="badge">${escapeHtml(context.sectionTitle)}</div>` : ""}
        ${context.scenarioText ? `<div class="info-box explanation"><div class="info-box-label">Scenario</div>${escapeHtml(context.scenarioText)}</div>` : ""}
        <div class="card">
          <div class="mcq-stem">${q.question_number}. ${escapeHtml(q.stem)}</div>
          <div class="mcq-options" id="options"></div>
        </div>
        <div class="qnav-grid" id="qnav"></div>
      `;

      const optionsEl = container.querySelector("#options");
      ["A", "B", "C", "D", "E"].forEach((letter) => {
        if (!(letter in q.options)) return;
        const btn = document.createElement("button");
        btn.className = "mcq-option" + (chosen === letter ? " is-answered" : "");
        btn.innerHTML = `<span class="opt-letter">${letter}</span><span>${escapeHtml(q.options[letter])}</span>`;
        btn.addEventListener("click", () => {
          answers[q.id] = letter;
          persist();
          renderCurrent();
        });
        optionsEl.appendChild(btn);
      });

      const qnav = container.querySelector("#qnav");
      questions.forEach((qq, i) => {
        const btn = document.createElement("button");
        btn.textContent = qq.question_number;
        if (answers[qq.id]) btn.classList.add("is-answered");
        if (i === idx) btn.classList.add("is-current");
        btn.addEventListener("click", () => { idx = i; renderCurrent(); });
        qnav.appendChild(btn);
      });

      container.querySelector("#prev-q").addEventListener("click", () => { idx--; renderCurrent(); });
      const nextBtn = container.querySelector("#next-q");
      if (nextBtn) nextBtn.addEventListener("click", () => { idx++; renderCurrent(); });
      container.querySelector("#submit-exam").addEventListener("click", () => {
        if (confirm("Submit the exam now? You cannot change answers after submitting.")) doSubmit("manual");
      });

      updateTimer();
    }

    function updateTimer() {
      const timerEl = container.querySelector("#exam-timer");
      if (!timerEl) return;
      const remaining = remainingSeconds();
      timerEl.textContent = formatTime(remaining) + " remaining";
      timerEl.classList.toggle("is-low", remaining <= 5 * 60);
      if (remaining <= 0 && !submitted) doSubmit("timeout");
    }

    function doSubmit(reason) {
      if (submitted) return;
      submitted = true;
      clearInterval(timerInterval);
      window.__ntuExamTimer = null;
      let score = 0;
      const sectionScores = {};
      questions.forEach((q) => {
        const correct = paper.answer_key[String(q.question_number)];
        const isRight = answers[q.id] === correct;
        if (isRight) score++;
        const section = (NTU.data.sectionForQuestionNumber(q.question_number) || {}).name || "Other";
        sectionScores[section] = sectionScores[section] || { score: 0, total: 0 };
        sectionScores[section].total++;
        if (isRight) sectionScores[section].score++;
      });
      const attempt = NTU.store.addExamAttempt({
        group: paper.group_label || paper.group,
        groupCode: paper.group_code,
        paperNumber: paper.paper_number,
        startedAt: inProgress.startedAt,
        completedAt: new Date().toISOString(),
        submittedReason: reason,
        answers,
        score,
        totalQuestions: questions.length,
        sectionScores,
      });
      NTU.router.navigate(`#/papers/${paper.group_code}/${paper.paper_number}/review/${attempt.attemptId}`);
    }

    renderCurrent();
    timerInterval = setInterval(updateTimer, 1000);
    window.__ntuExamTimer = timerInterval;
  }

  window.NTU.views.exam = { renderLanding, renderExam };
})();
