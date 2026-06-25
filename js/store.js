/* localStorage-backed progress store. Single versioned JSON blob. */
window.NTU = window.NTU || {};

(function () {
  const KEY = "ntu-ecat-progress-v1";

  function emptyState() {
    return {
      version: 1,
      practiceAttempts: [],
      examAttempts: [],
      inProgress: { exam: null },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return emptyState();
      parsed.practiceAttempts = parsed.practiceAttempts || [];
      parsed.examAttempts = parsed.examAttempts || [];
      parsed.inProgress = parsed.inProgress || { exam: null };
      return parsed;
    } catch (e) {
      console.warn("NTU.store: failed to load, resetting", e);
      return emptyState();
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function addPracticeAttempt(attempt) {
    const state = load();
    const full = Object.assign({ attemptId: uid() }, attempt);
    state.practiceAttempts.push(full);
    save(state);
    return full;
  }

  function addExamAttempt(attempt) {
    const state = load();
    const full = Object.assign({ attemptId: uid() }, attempt);
    state.examAttempts.push(full);
    state.inProgress.exam = null;
    save(state);
    return full;
  }

  function getPracticeAttempt(attemptId) {
    return load().practiceAttempts.find((a) => a.attemptId === attemptId) || null;
  }

  function getExamAttempt(attemptId) {
    return load().examAttempts.find((a) => a.attemptId === attemptId) || null;
  }

  function setInProgressExam(exam) {
    const state = load();
    state.inProgress.exam = exam;
    save(state);
  }

  function getInProgressExam() {
    return load().inProgress.exam;
  }

  function resetAll() {
    localStorage.removeItem(KEY);
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid progress file");
    parsed.version = 1;
    save(parsed);
  }

  window.NTU.store = {
    load,
    save,
    addPracticeAttempt,
    addExamAttempt,
    getPracticeAttempt,
    getExamAttempt,
    setInProgressExam,
    getInProgressExam,
    resetAll,
    exportJSON,
    importJSON,
  };
})();
