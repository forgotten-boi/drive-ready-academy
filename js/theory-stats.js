/* Cumulative theory progress, persisted via AppStorage (sessionStorage).
   Shared by practice mode, mock test mode and the progress dashboard so
   "weak category" detection draws on every question answered anywhere in
   the app, not just a single session or mode. */

var TheoryStats = (function () {
  "use strict";
  var STATS_KEY = "theory:categoryStats";
  var HISTORY_KEY = "theory:mockHistory";

  function getCategoryStats() {
    return AppStorage.get(STATS_KEY, {});
  }

  function recordAnswer(categoryId, wasCorrect) {
    var stats = getCategoryStats();
    if (!stats[categoryId]) stats[categoryId] = { seen: 0, correct: 0 };
    stats[categoryId].seen += 1;
    if (wasCorrect) stats[categoryId].correct += 1;
    AppStorage.set(STATS_KEY, stats);
  }

  function getMockHistory() {
    return AppStorage.get(HISTORY_KEY, []);
  }

  function addMockResult(result) {
    var history = getMockHistory();
    history.push(result);
    AppStorage.set(HISTORY_KEY, history);
  }

  function resetAll() {
    AppStorage.remove(STATS_KEY);
    AppStorage.remove(HISTORY_KEY);
  }

  return {
    getCategoryStats: getCategoryStats,
    recordAnswer: recordAnswer,
    getMockHistory: getMockHistory,
    addMockResult: addMockResult,
    resetAll: resetAll
  };
})();
