/* Small shared helpers used across the theory and practical controllers.
   Kept dependency-free so every feature file can rely on it without a
   build step. */

var Util = (function () {
  "use strict";

  // Fisher-Yates shuffle — returns a new array, never mutates the input.
  function shuffle(array) {
    var result = array.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  // Random sample of `count` items, without replacement.
  function sample(array, count) {
    return shuffle(array).slice(0, Math.min(count, array.length));
  }

  function formatMMSS(totalSeconds) {
    var s = Math.max(0, Math.round(totalSeconds));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? "0" + m : "" + m) + ":" + (sec < 10 ? "0" + sec : "" + sec);
  }

  var ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) { return ESCAPE_MAP[ch]; });
  }

  // Minimal element builder: el("div", { class: "card", text: "Hi" }, [child1, child2])
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else if (key.indexOf("on") === 0 && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value !== false && value !== null && value !== undefined) {
        node.setAttribute(key, value);
      }
    });
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  // Politely announces a message via the shared #a11y-announcer live region,
  // for state changes that matter but shouldn't spam a screen reader on
  // every keystroke (e.g. quiz milestones, not per-second timer ticks).
  function announce(message) {
    var region = document.getElementById("a11y-announcer");
    if (!region) return;
    region.textContent = "";
    window.setTimeout(function () { region.textContent = message; }, 50);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  return {
    shuffle: shuffle,
    sample: sample,
    formatMMSS: formatMMSS,
    escapeHtml: escapeHtml,
    el: el,
    announce: announce,
    clamp: clamp
  };
})();
