window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml, pct } = NTU.util;

  function render(params, container) {
    const groups = Object.keys(NTU.data.GROUP_LABELS);
    const initial = params.group && groups.includes(params.group) ? params.group : groups[0];
    let activeGroup = initial;

    function draw() {
      const state = NTU.store.load();
      const papers = NTU.data.papersForGroup(activeGroup);
      container.innerHTML = `
        <h1>Volume II &mdash; Model Papers</h1>
        <p class="muted">Ten full-length 100-question papers per candidate group. 2-hour timed simulation.</p>
        <div class="tab-row" id="group-tabs"></div>
        <div class="card-grid cols-2" id="paper-grid"></div>
      `;
      const tabRow = container.querySelector("#group-tabs");
      groups.forEach((code) => {
        const btn = document.createElement("button");
        btn.textContent = NTU.data.GROUP_LABELS[code];
        if (code === activeGroup) btn.classList.add("is-active");
        btn.addEventListener("click", () => { activeGroup = code; draw(); });
        tabRow.appendChild(btn);
      });

      const grid = container.querySelector("#paper-grid");
      papers.forEach((paper) => {
        const attempts = state.examAttempts.filter(
          (a) => a.groupCode === paper.group_code && a.paperNumber === paper.paper_number
        );
        const best = attempts.length ? Math.max(...attempts.map((a) => pct(a.score, a.totalQuestions))) : null;
        const a = document.createElement("a");
        a.className = "card subject-card";
        a.href = `#/papers/${paper.group_code}/${paper.paper_number}`;
        a.innerHTML = `<div class="subject-name">Paper ${paper.paper_number}</div>
          <div class="subject-meta muted">100 questions &middot; 2 hours</div>
          <div class="muted">${best == null ? "Not attempted" : "Best: " + best + "%"}</div>`;
        grid.appendChild(a);
      });
    }

    draw();
  }

  window.NTU.views.paperList = { render };
})();
