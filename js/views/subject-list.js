window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml } = NTU.util;

  function renderList(params, container) {
    const subjects = NTU.data.volume1;
    container.innerHTML = `
      <h1>Volume I &mdash; Subjects</h1>
      <p class="muted">Read the topic notes, then attempt the three practice sets for each subject.</p>
      <div class="card-grid cols-2">
        ${subjects
          .map(
            (s) => `<a class="card subject-card" style="--card-accent:${NTU.data.subjectColor(s.slug)}" href="#/subjects/${s.slug}">
              <div class="subject-name">${escapeHtml(titleCase(s.name))}</div>
              <div class="subject-meta muted">${s.topics.length} topics &middot; 3 practice sets</div>
            </a>`
          )
          .join("")}
      </div>
    `;
  }

  function renderDetail(params, container) {
    const subject = NTU.data.getSubject(params.slug);
    if (!subject) {
      container.innerHTML = `<div class="empty-state"><h2>Subject not found</h2><a href="#/subjects">Back to subjects</a></div>`;
      return;
    }
    const state = NTU.store.load();
    const color = NTU.data.subjectColor(subject.slug);

    container.innerHTML = `
      <p><a href="#/subjects">&larr; All subjects</a></p>
      <h1 style="color:${color}">${escapeHtml(titleCase(subject.name))}</h1>
      <p class="muted">${subject.topics.length} topics &middot; 3 practice sets of 25 questions each</p>

      <div class="card">
        <a class="btn btn-secondary" href="#/subjects/${subject.slug}/notes/0">Read topic notes</a>
      </div>

      <h2>Practice sets</h2>
      <div class="card-grid cols-3">
        ${subject.practice_sets
          .map((ps) => {
            const attempts = state.practiceAttempts.filter(
              (a) => a.subjectSlug === subject.slug && a.setNumber === ps.set_number
            );
            const best = attempts.length
              ? Math.max(...attempts.map((a) => Math.round((a.score / a.totalQuestions) * 100)))
              : null;
            return `<a class="card subject-card" style="--card-accent:${color}" href="#/subjects/${subject.slug}/practice/${ps.set_number}">
              <div class="subject-name">Set ${ps.set_number}</div>
              <div class="subject-meta muted">25 questions</div>
              <div class="muted">${best == null ? "Not attempted" : "Best: " + best + "%"}</div>
            </a>`;
          })
          .join("")}
      </div>
    `;
  }

  function titleCase(s) {
    return s
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  window.NTU.views.subjectList = { renderList, renderDetail };
})();
