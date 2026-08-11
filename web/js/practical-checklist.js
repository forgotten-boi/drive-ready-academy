/* Practical test requirements checklist. Tick state persists to
   sessionStorage via AppStorage, same as the theory progress data. The
   subpanel stays in the DOM (just hidden/shown by app.js), so a single
   render on init is enough — checkbox changes update state and the
   progress bar in place without a full re-render. */

(function () {
  "use strict";

  var STORAGE_KEY = "practical:checklistState";
  var root = null;

  function getState() { return AppStorage.get(STORAGE_KEY, {}); }
  function setState(state) { AppStorage.set(STORAGE_KEY, state); }

  function totalItems() {
    return PRACTICAL_CHECKLIST.reduce(function (sum, sec) { return sum + sec.items.length; }, 0);
  }

  function checkedCount(state) {
    return Object.keys(state).filter(function (k) { return state[k]; }).length;
  }

  function strengthClass(pct) {
    if (pct >= 80) return "is-strong";
    if (pct >= 50) return "is-medium";
    return "is-weak";
  }

  function render(opts) {
    opts = opts || {};
    var state = getState();
    var total = totalItems();
    var done = checkedCount(state);
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    var sectionsHtml = PRACTICAL_CHECKLIST.map(function (sec) {
      var itemsHtml = sec.items.map(function (item) {
        var checked = !!state[item.id];
        return (
          '<li class="checklist-item">' +
            '<label class="checklist-item__label">' +
              '<input type="checkbox" class="checklist-item__input" data-id="' + item.id + '"' + (checked ? " checked" : "") + '>' +
              '<span class="checklist-item__text">' + Util.escapeHtml(item.text) + '</span>' +
            '</label>' +
            '<p class="checklist-item__note">' + Util.escapeHtml(item.note) + '</p>' +
          '</li>'
        );
      }).join("");
      return (
        '<div class="card checklist-section">' +
          '<h3 class="checklist-section__title">' + Util.escapeHtml(sec.section) + '</h3>' +
          '<ul class="checklist-list">' + itemsHtml + '</ul>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<h2 tabindex="-1" id="practical-checklist-heading">Requirements Checklist</h2>' +
      '<p class="section-intro">Tick items off as you feel ready for them. This reflects the general format of the UK practical test &mdash; always confirm the specifics for your test with your instructor or gov.uk.</p>' +
      '<div class="card checklist-progress-card">' +
        '<div class="progress-bar" aria-hidden="true"><div class="progress-bar__fill ' + strengthClass(pct) + '" style="width:' + pct + '%"></div></div>' +
        '<p class="checklist-progress-text">' + done + ' of ' + total + ' ready</p>' +
      '</div>' +
      sectionsHtml +
      '<div class="btn-row"><button type="button" class="btn btn-secondary checklist-reset-btn">Reset checklist</button></div>';

    root.querySelectorAll(".checklist-item__input").forEach(function (input) {
      input.addEventListener("change", function () {
        var s = getState();
        s[input.getAttribute("data-id")] = input.checked;
        setState(s);
        updateProgressOnly();
      });
    });

    root.querySelector(".checklist-reset-btn").addEventListener("click", function () {
      var confirmed = window.confirm("Reset the checklist? All ticks will be cleared.");
      if (!confirmed) return;
      AppStorage.remove(STORAGE_KEY);
      render();
      Util.announce("Checklist reset.");
    });

    if (opts.focus !== false) focusHeading();
  }

  function updateProgressOnly() {
    var state = getState();
    var total = totalItems();
    var done = checkedCount(state);
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    var fill = root.querySelector(".checklist-progress-card .progress-bar__fill");
    if (fill) {
      fill.style.width = pct + "%";
      fill.className = "progress-bar__fill " + strengthClass(pct);
    }
    var text = root.querySelector(".checklist-progress-text");
    if (text) text.textContent = done + " of " + total + " ready";
  }

  function focusHeading() {
    var heading = document.getElementById("practical-checklist-heading");
    if (heading) heading.focus();
  }

  function init() {
    root = document.getElementById("practical-checklist-app");
    if (!root) return;
    render({ focus: false });
  }

  PracticalApp.register(init);
})();
