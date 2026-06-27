window.NTU = window.NTU || {};
window.NTU.views = window.NTU.views || {};

(function () {
  function render(params, container) {
    const manifest = window.NTU_DATA_MANIFEST || {};
    container.innerHTML = `
      <h1>Settings</h1>
      <div class="card">
        <h3>Appearance</h3>
        <p class="muted">Switch between light and dark theme.</p>
        <p><button class="btn btn-secondary" id="theme-toggle-settings" type="button">${themeLabel()}</button></p>
      </div>
      <div class="card">
        <h3>Your progress</h3>
        <p class="muted">Progress is stored only in this browser (localStorage). It does not sync between devices.</p>
        <p>
          <button class="btn btn-secondary" id="export-btn">Export progress</button>
          <label class="btn btn-secondary" style="display:inline-block">Import progress<input type="file" id="import-input" accept="application/json" style="display:none"></label>
          <button class="btn btn-danger" id="reset-btn">Reset all progress</button>
        </p>
      </div>
      <div class="card">
        <h3>Content version</h3>
        <p class="muted">Generated: ${manifest.generatedAt || "unknown"}<br>Questions: ${(manifest.counts && manifest.counts.practice_questions) || "?"} practice + ${(manifest.counts && manifest.counts.paper_questions) || "?"} model-paper</p>
      </div>
    `;

    container.querySelector("#export-btn").addEventListener("click", () => {
      const blob = new Blob([NTU.store.exportJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ntu-ecat-progress.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    container.querySelector("#import-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          NTU.store.importJSON(reader.result);
          alert("Progress imported.");
          NTU.router.navigate("#/");
        } catch (err) {
          alert("Could not import file: " + err.message);
        }
      };
      reader.readAsText(file);
    });

    container.querySelector("#reset-btn").addEventListener("click", () => {
      if (confirm("This will permanently delete all stored progress on this device. Continue?")) {
        NTU.store.resetAll();
        NTU.router.navigate("#/");
      }
    });

    const themeBtn = container.querySelector("#theme-toggle-settings");
    themeBtn.addEventListener("click", () => {
      NTU.theme.toggle();
      themeBtn.textContent = themeLabel();
    });
  }

  function themeLabel() {
    return NTU.theme.get() === "dark" ? "☀️ Switch to light" : "🌙 Switch to dark";
  }

  window.NTU.views.settings = { render };
})();
