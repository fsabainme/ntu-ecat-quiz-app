window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml } = NTU.util;

  function renderTopic(params, container) {
    const subject = NTU.data.getSubject(params.slug);
    if (!subject) {
      container.innerHTML = `<div class="empty-state"><h2>Subject not found</h2><a href="#/subjects">Back</a></div>`;
      return;
    }
    const idx = Math.max(0, Math.min(subject.topics.length - 1, parseInt(params.topicIndex, 10) || 0));
    const topic = subject.topics[idx];
    const color = NTU.data.subjectColor(subject.slug);

    container.innerHTML = `
      <p><a href="#/subjects/${subject.slug}">&larr; ${escapeHtml(subject.name)}</a></p>
      <div class="tab-row" id="topic-picker"></div>
      <h1 style="color:${color}">${escapeHtml(topic.heading)}</h1>
      <div class="card" style="--card-accent:${color}">${NTU.blocksRenderer.renderBlocks(topic.blocks)}</div>
      <div class="topic-nav-row">
        <button class="btn btn-secondary" id="prev-topic" ${idx === 0 ? "disabled" : ""}>&larr; Previous topic</button>
        <span class="muted">Topic ${idx + 1} of ${subject.topics.length}</span>
        <button class="btn btn-secondary" id="next-topic" ${idx === subject.topics.length - 1 ? "disabled" : ""}>Next topic &rarr;</button>
      </div>
    `;

    const picker = container.querySelector("#topic-picker");
    const select = document.createElement("select");
    select.style.cssText = "padding:6px 10px;border-radius:999px;border:1.5px solid var(--surface-border);max-width:100%;background:var(--surface-card);color:var(--text-primary);";
    subject.topics.forEach((t, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = (i + 1) + ". " + t.heading;
      if (i === idx) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", () => {
      NTU.router.navigate(`#/subjects/${subject.slug}/notes/${select.value}`);
    });
    picker.appendChild(select);

    const prevBtn = container.querySelector("#prev-topic");
    const nextBtn = container.querySelector("#next-topic");
    if (prevBtn) prevBtn.addEventListener("click", () => NTU.router.navigate(`#/subjects/${subject.slug}/notes/${idx - 1}`));
    if (nextBtn) nextBtn.addEventListener("click", () => NTU.router.navigate(`#/subjects/${subject.slug}/notes/${idx + 1}`));
  }

  window.NTU.views.topicNotes = { renderTopic };
})();
