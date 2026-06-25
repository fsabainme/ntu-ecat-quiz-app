window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml, formatDate, pct } = NTU.util;

  function render(params, container) {
    const state = NTU.store.load();
    const data = NTU.data;

    const totalSets = 27;
    const totalPapers = 40;
    const setsAttempted = new Set(state.practiceAttempts.map((a) => a.subjectSlug + ":" + a.setNumber)).size;
    const papersAttempted = new Set(state.examAttempts.map((a) => a.groupCode + ":" + a.paperNumber)).size;
    const avgPracticeScore = average(state.practiceAttempts.map((a) => pct(a.score, a.totalQuestions)));
    const avgExamScore = average(state.examAttempts.map((a) => pct(a.score, a.totalQuestions)));

    const isEmpty = state.practiceAttempts.length === 0 && state.examAttempts.length === 0;

    container.innerHTML = `
      <h1>Dashboard</h1>
      <div class="dashboard-stats">
        ${statTile(setsAttempted + "/" + totalSets, "Practice sets done")}
        ${statTile(avgPracticeScore + "%", "Avg. practice score")}
        ${statTile(papersAttempted + "/" + totalPapers, "Model papers done")}
        ${statTile(avgExamScore + "%", "Avg. exam score")}
      </div>

      ${isEmpty ? emptyState() : ""}

      <h2>By subject (Volume I)</h2>
      <div class="card-grid">
        ${data.volume1.map((subject) => subjectRow(subject, state)).join("")}
      </div>

      <h2>By group (Volume II)</h2>
      <div class="card-grid">
        ${Object.keys(data.GROUP_LABELS).map((code) => groupRow(code, state)).join("")}
      </div>

      ${focusSuggestion(state)}

      <h2>Recent activity</h2>
      <div class="card">
        ${recentActivity(state)}
      </div>
    `;
  }

  function average(nums) {
    if (!nums.length) return 0;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  function statTile(value, label) {
    return `<div class="stat-tile"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
  }

  function emptyState() {
    return `<div class="empty-state card">
      <h2>Welcome to NTU ECAT practice</h2>
      <p>You haven't attempted anything yet.</p>
      <p><a class="btn" href="#/subjects">Start a practice set</a></p>
    </div>`;
  }

  function subjectRow(subject, state) {
    const attempts = state.practiceAttempts.filter((a) => a.subjectSlug === subject.slug);
    const setsDone = new Set(attempts.map((a) => a.setNumber)).size;
    const best = attempts.length ? Math.max(...attempts.map((a) => pct(a.score, a.totalQuestions))) : null;
    const last = attempts.length ? attempts[attempts.length - 1] : null;
    const color = NTU.data.subjectColor(subject.slug);
    return `<a class="card subject-card" style="--card-accent:${color}" href="#/subjects/${subject.slug}">
      <div class="subject-name">${escapeHtml(subject.name)}</div>
      <div class="subject-meta muted">${setsDone}/3 sets &middot; ${best == null ? "no attempts" : "best " + best + "%"}</div>
      ${last ? `<div class="muted">Last: ${formatDate(last.completedAt)}</div>` : ""}
    </a>`;
  }

  function groupRow(code, state) {
    const attempts = state.examAttempts.filter((a) => a.groupCode === code);
    const papersDone = new Set(attempts.map((a) => a.paperNumber)).size;
    const best = attempts.length ? Math.max(...attempts.map((a) => pct(a.score, a.totalQuestions))) : null;
    return `<a class="card subject-card" href="#/papers" data-group="${code}">
      <div class="subject-name">${NTU.data.GROUP_LABELS[code]}</div>
      <div class="subject-meta muted">${papersDone}/10 papers &middot; ${best == null ? "no attempts" : "best " + best + "%"}</div>
    </a>`;
  }

  function focusSuggestion(state) {
    const missed = {};
    state.practiceAttempts.forEach((a) => {
      const ps = NTU.data.getPracticeSet(a.subjectSlug, a.setNumber);
      if (!ps) return;
      ps.questions.forEach((q) => {
        if (a.answers[q.id] && a.answers[q.id] !== q.correct) {
          missed[a.subjectSlug] = (missed[a.subjectSlug] || 0) + 1;
        }
      });
    });
    const ranked = Object.entries(missed).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return "";
    const [slug, count] = ranked[0];
    const subject = NTU.data.getSubject(slug);
    if (!subject) return "";
    return `<div class="info-box trap">
      <div class="info-box-label">Focus next</div>
      ${escapeHtml(subject.name)} has the most missed questions so far (${count}). Consider another practice set there.
    </div>`;
  }

  function recentActivity(state) {
    const items = []
      .concat(
        state.practiceAttempts.map((a) => ({
          when: a.completedAt,
          text: `Practice: ${a.subjectSlug} Set ${a.setNumber} &mdash; ${a.score}/${a.totalQuestions}`,
          href: `#/subjects/${a.subjectSlug}/practice/${a.setNumber}/result/${a.attemptId}`,
        })),
        state.examAttempts.map((a) => ({
          when: a.completedAt,
          text: `Model Paper: ${a.groupCode} #${a.paperNumber} &mdash; ${a.score}/${a.totalQuestions}`,
          href: `#/papers/${a.groupCode}/${a.paperNumber}/review/${a.attemptId}`,
        }))
      )
      .filter((i) => i.when)
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 8);

    if (!items.length) return `<p class="muted">No activity yet.</p>`;
    return items
      .map(
        (i) =>
          `<div class="activity-row"><a href="${i.href}">${i.text}</a><span class="muted">${formatDate(i.when)}</span></div>`
      )
      .join("");
  }

  window.NTU.views.dashboard = { render };
})();
