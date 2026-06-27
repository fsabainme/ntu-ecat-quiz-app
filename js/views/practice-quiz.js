window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml, pct } = NTU.util;

  function renderQuiz(params, container) {
    const subject = NTU.data.getSubject(params.slug);
    const ps = NTU.data.getPracticeSet(params.slug, params.setNumber);
    if (!subject || !ps) {
      container.innerHTML = `<div class="empty-state"><h2>Practice set not found</h2><a href="#/subjects">Back</a></div>`;
      return;
    }
    const color = NTU.data.subjectColor(subject.slug);
    const questions = ps.questions;
    let idx = 0;
    const answers = {}; // questionId -> chosen letter

    function questionState(i) {
      const q = questions[i];
      return { q, chosen: answers[q.id] || null };
    }

    function renderCurrent() {
      const { q, chosen } = questionState(idx);
      const answered = chosen != null;
      container.innerHTML = `
        <p><a href="#/subjects/${subject.slug}">&larr; ${escapeHtml(subject.name)}</a></p>
        <h1 style="color:${color}">Set ${ps.set_number} &mdash; Practice</h1>
        <div class="quiz-progress">
          <span>Question ${idx + 1} of ${questions.length}</span>
          <span>${Object.keys(answers).length}/${questions.length} answered</span>
        </div>
        <div class="card">
          <div class="mcq-stem">${q.question_number}. ${escapeHtml(q.stem)}</div>
          <div class="mcq-options" id="options"></div>
          <div id="feedback"></div>
        </div>
        <div class="quiz-nav-row">
          <button class="btn btn-secondary" id="prev-q" ${idx === 0 ? "disabled" : ""}>&larr; Prev</button>
          ${idx === questions.length - 1
            ? `<button class="btn btn-primary-lg" id="finish-q" ${answered ? "" : "disabled"}>Finish set &check;</button>`
            : `<button class="btn btn-primary-lg" id="next-q" ${answered ? "" : "disabled"}>Next question &rarr;</button>`}
        </div>
        <p style="margin-top:14px"><button class="btn btn-secondary" id="end-early">End set now (score so far)</button></p>
      `;

      const optionsEl = container.querySelector("#options");
      ["A", "B", "C", "D", "E"].forEach((letter) => {
        if (!(letter in q.options)) return;
        const btn = document.createElement("button");
        btn.className = "mcq-option";
        btn.dataset.letter = letter;
        if (answered) {
          btn.disabled = true;
          btn.classList.add("is-answered");
          if (letter === q.correct) btn.classList.add("is-correct");
          else if (letter === chosen) btn.classList.add("is-incorrect");
        }
        const resultIcon = !answered ? "" : letter === q.correct ? "&check;" : letter === chosen ? "&cross;" : "";
        btn.innerHTML = `<span class="opt-letter">${letter}</span><span>${escapeHtml(q.options[letter])}</span><span class="opt-result-icon">${resultIcon}</span>`;
        btn.addEventListener("click", () => selectAnswer(letter));
        optionsEl.appendChild(btn);
      });

      if (answered) renderFeedback(q, chosen);

      const prevBtn = container.querySelector("#prev-q");
      const nextBtn = container.querySelector("#next-q");
      const finishBtn = container.querySelector("#finish-q");
      const endBtn = container.querySelector("#end-early");
      if (prevBtn) prevBtn.addEventListener("click", () => { idx--; renderCurrent(); });
      if (nextBtn) nextBtn.addEventListener("click", () => { idx++; renderCurrent(); });
      if (finishBtn) finishBtn.addEventListener("click", finishSet);
      if (endBtn) endBtn.addEventListener("click", () => { if (confirm("End this set now and record your score so far?")) finishSet(); });
    }

    function selectAnswer(letter) {
      const { q, chosen } = questionState(idx);
      if (chosen != null) return;
      answers[q.id] = letter;
      renderCurrent();
    }

    function renderFeedback(q, chosen) {
      const feedback = container.querySelector("#feedback");
      const correct = chosen === q.correct;
      let html = `<div class="info-box ${correct ? "explanation" : "trap"}">
        <div class="info-box-label">${correct ? "Correct" : "Correct answer: " + q.correct}</div>
        ${escapeHtml(q.explanation || q.answer_text || "")}
      </div>`;
      if (q.quick_tactic) {
        html += `<div class="info-box tactic"><div class="info-box-label">Quick Tactic</div>${escapeHtml(q.quick_tactic)}</div>`;
      }
      feedback.innerHTML = html;
    }

    function finishSet() {
      const score = questions.reduce((s, q) => s + (answers[q.id] === q.correct ? 1 : 0), 0);
      const attempt = NTU.store.addPracticeAttempt({
        subjectSlug: subject.slug,
        setNumber: ps.set_number,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers,
        score,
        totalQuestions: questions.length,
      });
      NTU.router.navigate(`#/subjects/${subject.slug}/practice/${ps.set_number}/result/${attempt.attemptId}`);
    }

    renderCurrent();
  }

  function renderResult(params, container) {
    const subject = NTU.data.getSubject(params.slug);
    const ps = NTU.data.getPracticeSet(params.slug, params.setNumber);
    const attempt = NTU.store.getPracticeAttempt(params.attemptId);
    if (!subject || !ps || !attempt) {
      container.innerHTML = `<div class="empty-state"><h2>Result not found</h2><a href="#/subjects">Back</a></div>`;
      return;
    }
    const color = NTU.data.subjectColor(subject.slug);
    const scorePct = pct(attempt.score, attempt.totalQuestions);
    const missed = ps.questions.filter((q) => attempt.answers[q.id] && attempt.answers[q.id] !== q.correct);

    container.innerHTML = `
      <p><a href="#/subjects/${subject.slug}">&larr; ${escapeHtml(subject.name)}</a></p>
      <h1 style="color:${color}">Set ${ps.set_number} &mdash; Result</h1>
      <div class="card" style="text-align:center">
        <div class="stat-value" style="font-size:2.4rem;color:${color}">${attempt.score}/${attempt.totalQuestions}</div>
        <div class="muted">${scorePct}%</div>
      </div>
      ${missed.length
        ? `<h2>Missed questions (${missed.length})</h2><div class="card">` +
          missed
            .map(
              (q) =>
                `<div class="review-item"><div class="review-stem">${q.question_number}. ${escapeHtml(q.stem)}</div>
                 <div class="review-answers"><span class="wrong">Your answer: ${attempt.answers[q.id]}</span> &middot; <span class="right">Correct: ${q.correct}</span></div></div>`
            )
            .join("") +
          `</div>`
        : `<div class="info-box explanation">Perfect score on this set.</div>`}
      <p style="margin-top:16px">
        <a class="btn" href="#/subjects/${subject.slug}/practice/${ps.set_number}">Retake this set</a>
        <a class="btn btn-secondary" href="#/subjects/${subject.slug}">Back to subject</a>
      </p>
    `;
  }

  window.NTU.views.practiceQuiz = { renderQuiz, renderResult };
})();
