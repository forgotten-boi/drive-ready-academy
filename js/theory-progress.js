/* "My Progress" — aggregates every answer given in Practice by Category
   and every Mock Test into one weak-areas view, plus mock test history.
   Reads straight from TheoryStats, so it always reflects the latest
   state whichever mode produced it. */

(function () {
  "use strict";

  var root = null;

  function strengthClass(pct) {
    if (pct >= 80) return "is-strong";
    if (pct >= 50) return "is-medium";
    return "is-weak";
  }

  function badgeClass(pct) {
    if (pct >= 80) return "badge-success";
    if (pct >= 50) return "badge-warning";
    return "badge-danger";
  }

  function formatDate(isoString) {
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
      " at " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function render() {
    var stats = TheoryStats.getCategoryStats();
    var history = TheoryStats.getMockHistory();

    var totalSeen = 0, totalCorrect = 0;
    CATEGORIES.forEach(function (cat) {
      var s = stats[cat.id];
      if (s) { totalSeen += s.seen; totalCorrect += s.correct; }
    });

    if (totalSeen === 0 && history.length === 0) {
      renderEmptyState();
      return;
    }

    var overallPct = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

    var rows = CATEGORIES.map(function (cat) {
      var s = stats[cat.id];
      return {
        cat: cat,
        seen: s ? s.seen : 0,
        correct: s ? s.correct : 0,
        pct: s && s.seen > 0 ? Math.round((s.correct / s.seen) * 100) : null
      };
    });
    // Weakest areas first (unattempted categories sort to the bottom, not the top,
    // since "no data" isn't the same as "weak").
    rows.sort(function (a, b) {
      if (a.pct === null && b.pct === null) return 0;
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });

    var categoryRowsHtml = rows.map(function (r) {
      if (r.pct === null) {
        return (
          '<div class="card progress-row">' +
            '<h4 class="progress-row__name">' + Util.escapeHtml(r.cat.name) + '</h4>' +
            '<span class="badge">Not attempted yet</span>' +
          '</div>'
        );
      }
      return (
        '<div class="card progress-row">' +
          '<h4 class="progress-row__name">' + Util.escapeHtml(r.cat.name) + '</h4>' +
          '<div class="progress-bar" aria-hidden="true"><div class="progress-bar__fill ' + strengthClass(r.pct) + '" style="width:' + r.pct + '%"></div></div>' +
          '<span class="badge ' + badgeClass(r.pct) + '">' + r.pct + '% &middot; ' + r.correct + '/' + r.seen + ' correct</span>' +
        '</div>'
      );
    }).join("");

    var historyHtml = history.length === 0
      ? '<p class="section-intro">No mock tests completed yet — results will appear here after your first one.</p>'
      : '<div class="history-list">' + history.slice().reverse().map(function (h) {
          var pct = Math.round((h.score / h.total) * 100);
          return (
            '<div class="card history-item">' +
              '<div class="history-item__main">' +
                '<span class="history-item__date">' + Util.escapeHtml(formatDate(h.date)) + '</span>' +
                '<span class="badge ' + (h.pass ? "badge-success" : "badge-danger") + '">' + (h.pass ? "PASS" : "NOT YET") + '</span>' +
              '</div>' +
              '<p class="history-item__score">' + h.score + ' / ' + h.total + ' <span class="history-item__pct">(' + pct + '%)</span></p>' +
              (h.durationSeconds ? '<p class="history-item__time">Time used: ' + Util.formatMMSS(h.durationSeconds) + '</p>' : "") +
            '</div>'
          );
        }).join("") + '</div>';

    root.innerHTML =
      '<h2 tabindex="-1" id="theory-progress-heading">My Progress</h2>' +
      '<p class="storage-notice">Your progress is saved for this browser tab only &mdash; closing the tab (not just navigating away) clears it. Nothing is sent anywhere; it all stays on this device.</p>' +
      '<div class="card overall-summary">' +
        '<p class="overall-summary__figure">' + overallPct + '%<span class="badge ' + badgeClass(overallPct) + '"> overall</span></p>' +
        '<p class="overall-summary__meta">' + totalCorrect + ' correct out of ' + totalSeen + ' questions answered across practice and mock tests</p>' +
      '</div>' +
      '<h3>Category breakdown &mdash; weakest first</h3>' +
      '<div class="progress-row-list">' + categoryRowsHtml + '</div>' +
      '<h3>Mock test history</h3>' +
      historyHtml +
      '<div class="btn-row">' +
        '<button type="button" class="btn btn-secondary progress-reset-btn">Reset all progress</button>' +
      '</div>';

    root.querySelector(".progress-reset-btn").addEventListener("click", handleReset);
    focusHeading();
  }

  function renderEmptyState() {
    root.innerHTML =
      '<h2 tabindex="-1" id="theory-progress-heading">My Progress</h2>' +
      '<p class="storage-notice">Your progress is saved for this browser tab only &mdash; closing the tab clears it. Nothing is sent anywhere; it all stays on this device.</p>' +
      '<div class="empty-state card">' +
        '<p>You haven&rsquo;t answered any questions yet. Try a category in <strong>Practice by Category</strong> or take a full <strong>Mock Test</strong> to start building your progress picture.</p>' +
      '</div>';
    focusHeading();
  }

  function handleReset() {
    var confirmed = window.confirm("Reset all saved progress? This clears every category score and mock test result from this browser tab. This can't be undone.");
    if (!confirmed) return;
    TheoryStats.resetAll();
    render();
    Util.announce("Progress reset.");
  }

  function focusHeading() {
    var heading = document.getElementById("theory-progress-heading");
    if (heading) heading.focus();
  }

  function init() {
    root = document.getElementById("theory-progress-app");
    if (!root) return;
    render();

    document.addEventListener("tab:activated", function (evt) {
      if (evt.detail && evt.detail.id === "theory-progress") render();
    });
  }

  TheoryApp.register(init);
})();
