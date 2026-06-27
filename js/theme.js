window.NTU = window.NTU || {};

(function () {
  const KEY = "ntu-ecat-theme";

  function get() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  function set(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
    updateIcon();
  }

  function toggle() {
    set(get() === "dark" ? "light" : "dark");
  }

  function updateIcon() {
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.textContent = get() === "dark" ? "☀️" : "🌙";
    });
  }

  function init() {
    updateIcon();
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", toggle);
    });
  }

  window.NTU.theme = { get, set, toggle, init };
})();
