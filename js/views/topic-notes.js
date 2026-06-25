window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml } = NTU.util;

  function renderBlocks(blocks) {
    let html = "";
    let pendingList = null; // {tag, items}

    function flush() {
      if (pendingList) {
        const tag = pendingList.tag;
        html += `<${tag}>` + pendingList.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("") + `</${tag}>`;
        pendingList = null;
      }
    }

    blocks.forEach((b) => {
      if (b.type === "list_bullet" || b.type === "list_number") {
        const tag = b.type === "list_bullet" ? "ul" : "ol";
        if (pendingList && pendingList.tag !== tag) flush();
        if (!pendingList) pendingList = { tag, items: [] };
        pendingList.items.push(b.text);
        return;
      }
      flush();
      if (b.type === "heading3") {
        html += `<div class="note-block heading3">${escapeHtml(b.text)}</div>`;
      } else if (b.type === "marker") {
        html += `<div class="note-block marker">${escapeHtml(b.text.trim())}</div>`;
      } else if (b.type === "table") {
        html += renderTable(b.rows);
      } else {
        html += `<p class="note-block">${escapeHtml(b.text)}</p>`;
      }
    });
    flush();
    return html;
  }

  function renderTable(rows) {
    if (!rows || !rows.length) return "";
    const [head, ...body] = rows;
    return (
      `<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:0.88rem">` +
      `<thead><tr>${head.map((c) => `<th style="text-align:left;border-bottom:2px solid var(--ntu-navy);padding:4px">${escapeHtml(c)}</th>`).join("")}</tr></thead>` +
      `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td style="border-bottom:1px solid #eef1f4;padding:4px">${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`
    );
  }

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
      <div class="card">${renderBlocks(topic.blocks)}</div>
      <div class="quiz-nav-row">
        <button class="btn btn-secondary" id="prev-topic" ${idx === 0 ? "disabled" : ""}>&larr; Previous topic</button>
        <span class="muted">Topic ${idx + 1} of ${subject.topics.length}</span>
        <button class="btn btn-secondary" id="next-topic" ${idx === subject.topics.length - 1 ? "disabled" : ""}>Next topic &rarr;</button>
      </div>
    `;

    const picker = container.querySelector("#topic-picker");
    const select = document.createElement("select");
    select.style.cssText = "padding:6px 10px;border-radius:999px;border:1.5px solid #d7dee4;max-width:100%;";
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

  window.NTU.views.topicNotes = { renderTopic, renderBlocks };
})();
