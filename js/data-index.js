/* Builds fast lookup maps from the raw window.NTU_VOLUME1 / NTU_VOLUME2 data
   at startup. Negligible cost (~5,000 small objects) so this runs in-browser
   rather than being precomputed by the Python pipeline. */
window.NTU = window.NTU || {};

(function () {
  const SUBJECT_COLORS = {
    english: "var(--subj-english)",
    "analytical-reasoning": "var(--subj-ar)",
    "mathematics-based-quantitative-reasoning": "var(--subj-qr)",
    mathematics: "var(--subj-math)",
    physics: "var(--subj-physics)",
    chemistry: "var(--subj-chemistry)",
    "computer-science": "var(--subj-cs)",
    biology: "var(--subj-biology)",
    statistics: "var(--subj-statistics)",
  };

  const GROUP_LABELS = {
    PM: "Pre-Medical",
    PE: "Pre-Engineering / DAE",
    ICSP: "ICS Physics",
    ICSS: "ICS Statistics",
  };

  // Fixed across all 40 model papers (NTU ECAT revised 100-MCQ structure).
  const SECTION_RANGES = [
    { name: "English", from: 1, to: 25 },
    { name: "Analytical Reasoning", from: 26, to: 35 },
    { name: "Quantitative Reasoning", from: 36, to: 55 },
    { name: "Subject 1", from: 56, to: 70 },
    { name: "Subject 2", from: 71, to: 85 },
    { name: "Subject 3", from: 86, to: 100 },
  ];

  function sectionForQuestionNumber(n) {
    return SECTION_RANGES.find((s) => n >= s.from && n <= s.to) || null;
  }

  const volume1 = window.NTU_VOLUME1 || [];
  const volume2 = window.NTU_VOLUME2 || [];

  const subjectsBySlug = {};
  const practiceQuestionIndex = {}; // id -> {subjectSlug, setNumber, questionNumber}
  volume1.forEach((subject) => {
    subjectsBySlug[subject.slug] = subject;
    subject.practice_sets.forEach((ps) => {
      ps.questions.forEach((q) => {
        practiceQuestionIndex[q.id] = {
          subjectSlug: subject.slug,
          setNumber: ps.set_number,
          questionNumber: q.question_number,
        };
      });
    });
  });

  const papersByKey = {}; // "PM-1" -> paper
  const examQuestionIndex = {}; // id -> {groupCode, paperNumber, questionNumber}
  volume2.forEach((paper) => {
    const key = paper.group_code + "-" + paper.paper_number;
    papersByKey[key] = paper;
    paper.questions.forEach((q) => {
      examQuestionIndex[q.id] = {
        groupCode: paper.group_code,
        paperNumber: paper.paper_number,
        questionNumber: q.question_number,
      };
    });
  });

  function getSubject(slug) {
    return subjectsBySlug[slug] || null;
  }

  function getPracticeSet(slug, setNumber) {
    const subject = getSubject(slug);
    if (!subject) return null;
    return subject.practice_sets.find((ps) => ps.set_number === Number(setNumber)) || null;
  }

  function getPaper(groupCode, paperNumber) {
    return papersByKey[groupCode + "-" + Number(paperNumber)] || null;
  }

  function papersForGroup(groupCode) {
    return volume2.filter((p) => p.group_code === groupCode).sort((a, b) => a.paper_number - b.paper_number);
  }

  function subjectColor(slug) {
    return SUBJECT_COLORS[slug] || "var(--ntu-blue)";
  }

  const SECTION_DIVIDER_RE = /^SECTION\s+[IVX\-A-Z0-9]+\s*[:\-]?\s*(.+?)\s*\|\s*(\d+)\s*QUESTIONS?\s*\|\s*(.+)$/i;

  // Walks a paper's `stream` (banners + questions interleaved) and returns a
  // map questionNumber -> { sectionTitle, scenarioText } so the exam view can
  // show the shared Analytical Reasoning scenario premise alongside each
  // question that depends on it (mirrors naseer2/scripts/build_volume2.py's
  // render_banner classification).
  const questionContextCache = {};
  function questionContext(paper) {
    const cacheKey = paper.group_code + "-" + paper.paper_number;
    if (questionContextCache[cacheKey]) return questionContextCache[cacheKey];

    const map = {};
    let currentSection = null;
    let currentScenario = null;
    paper.stream.forEach((item) => {
      if (item.type === "banner") {
        const text = ((item.rows && item.rows[0] && item.rows[0][0]) || "").replace(/\n/g, " ").trim();
        const sectionMatch = text.match(SECTION_DIVIDER_RE);
        if (sectionMatch) {
          currentSection = sectionMatch[1].trim();
          currentScenario = null;
        } else if (text.toUpperCase().startsWith("ANALYTICAL SCENARIO")) {
          currentScenario = text.includes(":") ? text.split(":").slice(1).join(":").trim() : text;
        }
        // Other generic banners (group/title bands) don't affect context.
      } else if (item.type === "question") {
        map[item.question_number] = { sectionTitle: currentSection, scenarioText: currentScenario };
      }
    });
    questionContextCache[cacheKey] = map;
    return map;
  }

  window.NTU.data = {
    volume1,
    volume2,
    subjectsBySlug,
    practiceQuestionIndex,
    papersByKey,
    examQuestionIndex,
    SUBJECT_COLORS,
    GROUP_LABELS,
    SECTION_RANGES,
    sectionForQuestionNumber,
    getSubject,
    getPracticeSet,
    getPaper,
    papersForGroup,
    subjectColor,
    questionContext,
  };
})();
