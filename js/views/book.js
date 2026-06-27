window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  const { escapeHtml } = NTU.util;

  function render(params, container) {
    container.classList.add("is-wide");

    const subjects = NTU.data.volume1;
    const frontMatter = window.NTU_FRONTMATTER || [];

    container.innerHTML = `
      <div class="reading-progress"><div id="reading-progress-fill"></div></div>
      <button class="btn btn-secondary book-toc-toggle" id="toc-toggle" type="button">&#9776; Contents</button>
      <div class="book-layout">
        <nav class="book-toc" id="book-toc" aria-label="Table of contents"></nav>
        <article class="book-content" id="book-content"></article>
      </div>
    `;

    const tocEl = container.querySelector("#book-toc");
    const contentEl = container.querySelector("#book-content");

    // 1. Front matter renders immediately (small, ~66 blocks).
    contentEl.innerHTML = `<section id="book-section-front" class="book-section">
      <h1>About This Book</h1>
      ${NTU.blocksRenderer.renderBlocks(frontMatter)}
    </section>`;

    // 2. TOC built immediately (cheap: headings + topic titles only).
    let tocHtml = `<a href="#book-section-front" class="toc-link is-active">About This Book</a>`;
    subjects.forEach((subject) => {
      const color = NTU.data.subjectColor(subject.slug);
      tocHtml += `<div class="toc-group">
        <div class="toc-subject" style="--card-accent:${color}">${escapeHtml(titleCase(subject.name))}</div>
        ${subject.topics.map((t, i) => `<a href="#book-topic-${subject.slug}-${i}" class="toc-link">${escapeHtml(t.heading)}</a>`).join("")}
      </div>`;
    });
    tocEl.innerHTML = tocHtml;

    // 3. Topic content streamed in idle-time chunks so the main thread
    // isn't blocked rendering ~300 topics worth of HTML at once.
    const queue = [];
    subjects.forEach((subject) => {
      queue.push({ type: "subject-header", subject });
      subject.topics.forEach((topic, i) => queue.push({ type: "topic", subject, topic, i }));
    });

    function renderChunk(deadline) {
      let html = "";
      let count = 0;
      while (queue.length && (count < 4 || (deadline && deadline.timeRemaining() > 4))) {
        const item = queue.shift();
        const color = NTU.data.subjectColor(item.subject.slug);
        if (item.type === "subject-header") {
          html += `<h1 id="book-section-${item.subject.slug}" class="book-subject-heading" style="color:${color}">${escapeHtml(titleCase(item.subject.name))}</h1>`;
        } else {
          html += `<section id="book-topic-${item.subject.slug}-${item.i}" class="book-section" style="--card-accent:${color}">
            <h2>${escapeHtml(item.topic.heading)}</h2>
            ${NTU.blocksRenderer.renderBlocks(item.topic.blocks)}
          </section>`;
        }
        count++;
      }
      if (html) contentEl.insertAdjacentHTML("beforeend", html);
      if (queue.length) {
        scheduleIdle(renderChunk);
      } else {
        setupScrollSpy(container);
      }
    }
    scheduleIdle(renderChunk);

    setupReadingProgress();
    setupTocToggle(container);
  }

  function scheduleIdle(fn) {
    if ("requestIdleCallback" in window) requestIdleCallback(fn);
    else setTimeout(() => fn(null), 0);
  }

  function setupReadingProgress() {
    if (window.__ntuBookScrollHandler) {
      window.removeEventListener("scroll", window.__ntuBookScrollHandler);
    }
    const fill = document.getElementById("reading-progress-fill");
    function update() {
      if (!fill || !fill.isConnected) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = max > 0 ? Math.min(100, (window.scrollY / max) * 100) + "%" : "0%";
    }
    window.__ntuBookScrollHandler = update;
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function setupScrollSpy(container) {
    const links = Array.from(container.querySelectorAll(".toc-link"));
    const sections = links.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
    if (window.__ntuBookObserver) window.__ntuBookObserver.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === id));
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    window.__ntuBookObserver = observer;
  }

  function setupTocToggle(container) {
    const toggle = container.querySelector("#toc-toggle");
    const toc = container.querySelector("#book-toc");
    if (toggle && toc) {
      toggle.addEventListener("click", () => toc.classList.toggle("is-open"));
    }
    // TOC links are plain "#some-id" fragment anchors used to scroll within
    // this single page -- they must NOT go through the app's hash router
    // (which treats every hashchange as a route lookup and would render
    // "Not found", since "#book-topic-..." doesn't match any "#/..." route).
    // Scroll manually instead, without touching location.hash.
    container.querySelectorAll(".toc-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        if (toc) toc.classList.remove("is-open");
      });
    });
  }

  function titleCase(s) {
    return String(s).toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  window.NTU.views.book = { render };
})();
