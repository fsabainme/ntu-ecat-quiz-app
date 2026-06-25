/* Minimal hash router: route table of {pattern, render(params)}. */
window.NTU = window.NTU || {};

(function () {
  const routes = [];

  function register(pattern, render) {
    // pattern like "#/subjects/:slug/practice/:setNumber"
    const paramNames = [];
    const regexStr = pattern
      .replace(/^#/, "")
      .split("/")
      .map((seg) => {
        if (seg.startsWith(":")) {
          paramNames.push(seg.slice(1));
          return "([^/]+)";
        }
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/");
    const regex = new RegExp("^" + regexStr + "$");
    routes.push({ regex, paramNames, render });
  }

  function currentPath() {
    const hash = location.hash || "#/";
    return hash.replace(/^#/, "") || "/";
  }

  function resolve() {
    const path = currentPath();
    for (const route of routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
        return { route, params };
      }
    }
    return null;
  }

  function navigate(hash) {
    if (location.hash === hash) {
      render();
    } else {
      location.hash = hash;
    }
  }

  function render() {
    const viewRoot = document.getElementById("view-root");
    const resolved = resolve();
    window.scrollTo(0, 0);
    if (!resolved) {
      viewRoot.innerHTML = '<div class="empty-state"><h2>Not found</h2><p><a href="#/">Go to dashboard</a></p></div>';
      return;
    }
    try {
      resolved.route.render(resolved.params, viewRoot);
    } catch (err) {
      console.error("View render error:", err);
      viewRoot.innerHTML =
        '<div class="empty-state"><h2>Something went wrong</h2><p class="muted">' +
        String(err.message || err) +
        '</p><p><a href="#/">Go to dashboard</a></p></div>';
    }
  }

  function start() {
    window.addEventListener("hashchange", render);
    render();
  }

  window.NTU.router = { register, navigate, start, currentPath };
})();
