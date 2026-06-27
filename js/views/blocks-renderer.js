window.NTU = window.NTU || {};

/* Shared renderer for both volume1 topic blocks ({type, text}, typed:
   heading3/marker/list_bullet/list_number/table/paragraph) and front_matter
   blocks ({type:"paragraph", style, marker} + occasional {type:"table"}).
   Detects recognizable UPPERCASE-prefixed paragraphs (e.g. "WORKED EXAMPLE:",
   "QUICK TACTIC:") and renders them as colored callout boxes instead of
   plain text. */
window.NTU.blocksRenderer = (function () {
  const { escapeHtml } = NTU.util;

  // Maps a known UPPERCASE prefix (the literal text before the first colon
  // in many paragraph blocks) to a callout "kind" for styling. Grouped into
  // 5 semantic kinds rather than one style per prefix, so the result stays
  // visually coherent instead of a 40-color mess.
  const CALLOUT_KIND_BY_PREFIX = {
    "WORKED EXAMPLE": "example", "SECOND WORKED EXAMPLE": "example",
    "WORKED EXAMPLE 1": "example", "WORKED EXAMPLE 2": "example", "WORKED EXAMPLE 3": "example",
    "EXAMPLE": "example", "EXAMPLES": "example",
    "EXAMPLE A": "example", "EXAMPLE B": "example", "EXAMPLE C": "example",
    "WORKED SCENARIO": "example", "SECOND WORKED SCENARIO": "example",
    "SECOND GUIDED EXAMPLE": "example", "SOLUTION": "example", "DETAILED SOLUTION": "example",
    "QUICK TACTIC": "tactic", "EXAM TACTIC": "tactic", "FAST GRAMMAR ROUTINE": "tactic",
    "THREE-STEP CONVERSION": "tactic", "CORE HABIT": "tactic", "FOUR-LINE ROUGH WORK": "tactic",
    "GENERATION CODE": "tactic", "COLLOCATION NOTEBOOK": "tactic", "NARRATION ROUTINE": "tactic",
    "STEP-BY-STEP REASONING": "reasoning", "REASONING": "reasoning",
    "AGREEMENT CHECKLIST": "reasoning", "CONDITIONAL SKELETONS": "reasoning",
    "SEQUENCE TEST": "reasoning", "CONTRAST": "reasoning", "FORMULAS": "reasoning",
    "PROBABILITY APPLICATION": "reasoning",
    "COMMON ERROR TO AVOID": "warning", "COMMON TENSE TRAPS": "warning",
    "VOICE TRAPS": "warning", "INVALID MOVE TO AVOID": "warning",
    "QUICK CHECK": "check", "FINAL CHECK": "check", "MODEL CHECK": "check", "CONCLUSION": "check",
  };
  const PREFIX_RE = /^([A-Z][A-Z0-9 \-\/]{2,40}?):\s*([\s\S]*)$/;

  const KIND_META = {
    example: { icon: "🧩" },
    tactic: { icon: "⚡" },
    reasoning: { icon: "🧭" },
    warning: { icon: "⚠️" },
    check: { icon: "✅" },
    note: { icon: "📌" },
  };

  // Best-effort classification for ALL-CAPS prefixes not in the explicit
  // map above (e.g. ones unique to front_matter's exam-strategy section,
  // like "READ THE TASK WORD:" or "PROTECT EASY MARKS:") -- every
  // recognizable label still gets colored, just via a keyword guess
  // instead of a precise lookup, falling back to a neutral "note" kind.
  function classifyUnknownPrefix(prefix) {
    if (/ERROR|TRAP|AVOID|WARNING|WRONG|INVALID|MISTAKE/.test(prefix)) return "warning";
    if (/CHECK|VERIFY|CONFIRM|REVIEW|TRANSFER/.test(prefix)) return "check";
    if (/EXAMPLE|SOLUTION|SCENARIO|ILLUSTRATION|DEMONSTRATION/.test(prefix)) return "example";
    if (/TACTIC|ROUTINE|HABIT|METHOD|STRATEGY|APPROACH|TECHNIQUE|RULE|TIP|PASS|PROTECT|ELIMINATE|USE /.test(prefix)) return "tactic";
    if (/REASON|STEP|LOGIC|DEDUCTION|ANALYSIS|READ /.test(prefix)) return "reasoning";
    return "note";
  }

  function detectCallout(text) {
    const m = text.match(PREFIX_RE);
    if (!m) return null;
    const prefix = m[1].trim();
    const kind = CALLOUT_KIND_BY_PREFIX[prefix] || classifyUnknownPrefix(prefix);
    return { kind, label: prefix, rest: m[2] };
  }

  function calloutHtml(kind, label, rest) {
    const meta = KIND_META[kind];
    return `<div class="callout callout-${kind}">
      <div class="callout-icon" aria-hidden="true">${meta.icon}</div>
      <div class="callout-body">
        <div class="callout-label">${escapeHtml(label)}</div>
        <p>${escapeHtml(rest)}</p>
      </div>
    </div>`;
  }

  // Normalizes either schema into {kind, text} / {kind, rows} pairs, where
  // kind is one of: heading2, heading3, marker, bullet, number, table, paragraph.
  function normalize(block) {
    if (block.type === "table") return { kind: "table", rows: block.rows };
    if (block.type === "heading3") return { kind: "heading3", text: block.text };
    if (block.type === "marker") return { kind: "marker", text: block.text };
    if (block.type === "list_bullet") return { kind: "bullet", text: block.text };
    if (block.type === "list_number") return { kind: "number", text: block.text };
    // paragraph: either volume1's plain form, or front_matter's {style, marker} form
    if (block.style === "Heading 2") return { kind: "heading2", text: block.text };
    if (block.style === "List Bullet") return { kind: "bullet", text: block.text };
    if (block.style === "List Number") return { kind: "number", text: block.text };
    if (block.marker === true) return { kind: "marker", text: block.text };
    return { kind: "paragraph", text: block.text };
  }

  function renderBlocks(blocks) {
    let html = "";
    let pendingList = null; // {tag, items}

    function flush() {
      if (!pendingList) return;
      const tag = pendingList.tag;
      html += `<${tag}>` + pendingList.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("") + `</${tag}>`;
      pendingList = null;
    }

    (blocks || []).map(normalize).forEach((b) => {
      if (b.kind === "bullet" || b.kind === "number") {
        const tag = b.kind === "bullet" ? "ul" : "ol";
        if (pendingList && pendingList.tag !== tag) flush();
        if (!pendingList) pendingList = { tag, items: [] };
        pendingList.items.push(b.text);
        return;
      }
      flush();
      if (b.kind === "heading2") {
        html += `<h2 class="note-block heading2">${escapeHtml(b.text)}</h2>`;
      } else if (b.kind === "heading3") {
        html += `<div class="note-block heading3">${escapeHtml(b.text)}</div>`;
      } else if (b.kind === "marker") {
        html += `<div class="note-block marker">${escapeHtml(b.text.trim())}</div>`;
      } else if (b.kind === "table") {
        html += renderTable(b.rows);
      } else {
        const callout = detectCallout(b.text);
        if (callout) html += calloutHtml(callout.kind, callout.label, callout.rest);
        else html += `<p class="note-block">${escapeHtml(b.text)}</p>`;
      }
    });
    flush();
    return html;
  }

  function renderTable(rows) {
    if (!rows || !rows.length) return "";
    const [head, ...body] = rows;
    return (
      `<div class="note-table-wrap"><table class="note-table">` +
      `<thead><tr>${head.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>` +
      `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    );
  }

  return { renderBlocks, detectCallout, normalize };
})();
