/* Top-level tab navigation. Works for the main tab bar and every sub-tab
   bar using the same [role=tablist] / [data-target] convention (roving
   tabindex per the standard ARIA tabs pattern), remembers the last active
   tabs for the session, and wires up the feature controllers (TheoryApp,
   PracticalApp) if present. */

(function () {
  "use strict";

  var UI_STATE_KEY = "ui:activeTabs";
  var TAB_TITLES = {
    "panel-theory": "Theory Test Prep",
    "panel-practical": "Practical Test & Centre Finder"
  };

  function readUiState() {
    return window.AppStorage ? window.AppStorage.get(UI_STATE_KEY, {}) : {};
  }

  function writeUiState(state) {
    if (window.AppStorage) window.AppStorage.set(UI_STATE_KEY, state);
  }

  function rememberActiveTab(tablist, targetId) {
    var state = readUiState();
    if (tablist.id === "main-tablist") {
      state.mainTab = targetId;
    } else {
      var ownerPanel = tablist.closest(".panel");
      state.subtabs = state.subtabs || {};
      if (ownerPanel) state.subtabs[ownerPanel.id] = targetId;
    }
    writeUiState(state);
  }

  function activateTab(tablist, targetId) {
    var buttons = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    buttons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-target") === targetId;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      btn.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    var panels = buttons.map(function (btn) {
      return document.getElementById(btn.getAttribute("data-target"));
    }).filter(Boolean);

    panels.forEach(function (panel) {
      var isTarget = panel.id === targetId;
      panel.hidden = !isTarget;
      panel.classList.toggle("is-active", isTarget);
    });

    if (tablist.id === "main-tablist" && TAB_TITLES[targetId]) {
      document.title = TAB_TITLES[targetId] + " · UK Driving Licence Prep";
    }
  }

  function selectTab(tablist, targetId, opts) {
    activateTab(tablist, targetId);
    rememberActiveTab(tablist, targetId);
    if (!opts || opts.dispatch !== false) {
      document.dispatchEvent(new CustomEvent("tab:activated", { detail: { id: targetId } }));
    }
  }

  function initTablist(tablist) {
    // Roving tabindex: only the active tab is in the natural tab order.
    var buttons = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    buttons.forEach(function (btn) {
      btn.setAttribute("tabindex", btn.classList.contains("is-active") ? "0" : "-1");
    });

    tablist.addEventListener("click", function (evt) {
      var btn = evt.target.closest('[role="tab"]');
      if (!btn || !tablist.contains(btn)) return;
      var targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      selectTab(tablist, targetId);
    });

    tablist.addEventListener("keydown", function (evt) {
      var isNext = evt.key === "ArrowRight" || evt.key === "ArrowDown";
      var isPrev = evt.key === "ArrowLeft" || evt.key === "ArrowUp";
      if (!isNext && !isPrev && evt.key !== "Home" && evt.key !== "End") return;

      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      var currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      evt.preventDefault();

      var nextIndex = currentIndex;
      if (isNext) nextIndex = (currentIndex + 1) % tabs.length;
      else if (isPrev) nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      else if (evt.key === "Home") nextIndex = 0;
      else if (evt.key === "End") nextIndex = tabs.length - 1;

      tabs[nextIndex].focus();
      selectTab(tablist, tabs[nextIndex].getAttribute("data-target"));
    });
  }

  function restoreSavedTabs() {
    var saved = readUiState();
    if (!saved || (!saved.mainTab && !saved.subtabs)) return;

    if (saved.mainTab && document.getElementById(saved.mainTab)) {
      var mainTablist = document.getElementById("main-tablist");
      if (mainTablist) activateTab(mainTablist, saved.mainTab);
    }
    if (saved.subtabs) {
      Object.keys(saved.subtabs).forEach(function (panelId) {
        var panel = document.getElementById(panelId);
        var target = saved.subtabs[panelId];
        if (!panel || !document.getElementById(target)) return;
        var tablist = panel.querySelector('[role="tablist"]');
        if (tablist) activateTab(tablist, target);
      });
    }
  }

  function init() {
    document.querySelectorAll('[role="tablist"]').forEach(initTablist);
    restoreSavedTabs();

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
