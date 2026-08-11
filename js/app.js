/* Top-level tab navigation. Works for the main tab bar and every sub-tab
   bar using the same [role=tablist] / [data-target] convention, and wires
   up the feature controllers (TheoryApp, PracticalApp) if present. */

(function () {
  "use strict";

  function activateTab(tablist, targetId) {
    var buttons = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    buttons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-target") === targetId;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    var panels = buttons.map(function (btn) {
      return document.getElementById(btn.getAttribute("data-target"));
    }).filter(Boolean);

    panels.forEach(function (panel) {
      var isTarget = panel.id === targetId;
      panel.hidden = !isTarget;
      panel.classList.toggle("is-active", isTarget);
    });
  }

  function initTablist(tablist) {
    tablist.addEventListener("click", function (evt) {
      var btn = evt.target.closest('[role="tab"]');
      if (!btn || !tablist.contains(btn)) return;
      var targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      activateTab(tablist, targetId);
      document.dispatchEvent(new CustomEvent("tab:activated", { detail: { id: targetId } }));
    });

    // Basic keyboard support: left/right arrows move between tabs.
    tablist.addEventListener("keydown", function (evt) {
      if (evt.key !== "ArrowRight" && evt.key !== "ArrowLeft") return;
      var buttons = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      var currentIndex = buttons.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      evt.preventDefault();
      var nextIndex = evt.key === "ArrowRight"
        ? (currentIndex + 1) % buttons.length
        : (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    });
  }

  function init() {
    document.querySelectorAll('[role="tablist"]').forEach(initTablist);

    if (window.TheoryApp && typeof window.TheoryApp.init === "function") {
      window.TheoryApp.init();
    }
    if (window.PracticalApp && typeof window.PracticalApp.init === "function") {
      window.PracticalApp.init();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
