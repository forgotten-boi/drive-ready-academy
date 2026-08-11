/* Namespace + init coordinator for the Practical Test & Centre Finder tab,
   mirroring TheoryApp so each sub-feature (checklist, flashcards, centre
   finder) stays in its own file and its own feature branch. */

var PracticalApp = (function () {
  "use strict";
  var modules = [];

  function register(initFn) {
    modules.push(initFn);
  }

  function init() {
    modules.forEach(function (fn) { fn(); });
  }

  return { register: register, init: init };
})();
