/* Thin sessionStorage wrapper, namespaced so app state never collides with
   anything else that might share the origin. Falls back to an in-memory
   object if sessionStorage is unavailable (private browsing edge cases). */

var AppStorage = (function () {
  var PREFIX = "ukDrivingPrep::";
  var memoryFallback = {};
  var storageOk = (function () {
    try {
      var testKey = PREFIX + "__test__";
      window.sessionStorage.setItem(testKey, "1");
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function get(key, fallback) {
    var raw = storageOk
      ? window.sessionStorage.getItem(PREFIX + key)
      : memoryFallback[key];
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    var raw = JSON.stringify(value);
    if (storageOk) {
      window.sessionStorage.setItem(PREFIX + key, raw);
    } else {
      memoryFallback[key] = raw;
    }
  }

  function remove(key) {
    if (storageOk) {
      window.sessionStorage.removeItem(PREFIX + key);
    } else {
      delete memoryFallback[key];
    }
  }

  function resetAll() {
    if (storageOk) {
      Object.keys(window.sessionStorage)
        .filter(function (k) { return k.indexOf(PREFIX) === 0; })
        .forEach(function (k) { window.sessionStorage.removeItem(k); });
    } else {
      memoryFallback = {};
    }
  }

  return { get: get, set: set, remove: remove, resetAll: resetAll };
})();
