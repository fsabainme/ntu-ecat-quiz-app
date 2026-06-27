window.NTU = window.NTU || {};

(function () {
  const v = NTU.views;
  const r = NTU.router;

  r.register("#/", v.dashboard.render);
  r.register("#/dashboard", v.dashboard.render);

  r.register("#/subjects", v.subjectList.renderList);
  r.register("#/subjects/:slug", v.subjectList.renderDetail);
  r.register("#/subjects/:slug/notes/:topicIndex", v.topicNotes.renderTopic);
  r.register("#/subjects/:slug/practice/:setNumber", v.practiceQuiz.renderQuiz);
  r.register("#/subjects/:slug/practice/:setNumber/result/:attemptId", v.practiceQuiz.renderResult);

  r.register("#/papers", v.paperList.render);
  r.register("#/papers/:group", v.paperList.render);
  r.register("#/papers/:group/:paperNumber", v.exam.renderLanding);
  r.register("#/papers/:group/:paperNumber/exam", v.exam.renderExam);
  r.register("#/papers/:group/:paperNumber/review/:attemptId", v.review.renderExamReview);

  r.register("#/book", v.book.render);

  r.register("#/settings", v.settings.render);

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    NTU.theme.init();
    registerServiceWorker();
    r.start();
  });
})();
