/* Renders SUPPORT_LINK (see support-config.js) into the footer, if enabled. */

(function () {
  "use strict";

  function init() {
    if (!window.SUPPORT_LINK || !SUPPORT_LINK.enabled || !SUPPORT_LINK.url) return;

    var footer = document.querySelector(".app-footer");
    if (!footer) return;

    var line = document.createElement("p");
    line.className = "app-footer__support";
    line.innerHTML =
      '☕ <a href="' + Util.escapeHtml(SUPPORT_LINK.url) + '" target="_blank" rel="noopener">' +
      Util.escapeHtml(SUPPORT_LINK.label || "Support this project") +
      "</a>";
    footer.appendChild(line);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
