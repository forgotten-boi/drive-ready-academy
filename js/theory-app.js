/* Namespace + init coordinator for the Theory Test Prep tab. Each
   sub-feature (practice, mock test, progress, hazard perception) lives in
   its own file and registers an init callback here, so feature branches
   stay file-disjoint instead of all editing one theory.js. */

var TheoryApp = (function () {
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
