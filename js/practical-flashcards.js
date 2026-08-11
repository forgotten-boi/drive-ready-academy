/* "Show me, tell me" flashcard quiz. One card at a time: question on the
   front, an accessible reveal toggle for the answer (hidden/aria-expanded
   rather than a pure CSS 3D flip, so a screen reader user doesn't get the
   answer before choosing to reveal it), then an optional self-rating that
   persists across the session and feeds a small "known vs still learning"
   summary. */

(function () {
  "use strict";

  var RATINGS_KEY = "practical:flashcardRatings";
  var root = null;
  var deckOrder = [];
  var currentIndex = 0;
  var revealed = false;

  var CARDS_BY_ID = {};
  SHOW_ME_TELL_ME.forEach(function (c) { CARDS_BY_ID[c.id] = c; });

  function getRatings() { return AppStorage.get(RATINGS_KEY, {}); }
  function setRatings(r) { AppStorage.set(RATINGS_KEY, r); }

  function summaryCounts() {
    var ratings = getRatings();
    var known = 0, learning = 0;
    SHOW_ME_TELL_ME.forEach(function (c) {
      if (ratings[c.id] === "known") known += 1;
      else if (ratings[c.id] === "learning") learning += 1;
    });
    return { known: known, learning: learning, notReviewed: SHOW_ME_TELL_ME.length - known - learning };
  }

  function currentCard() {
    return CARDS_BY_ID[deckOrder[currentIndex]];
  }

  function typeLabel(type) {
    return type === "tell-me" ? "Tell me" : "Show me";
  }

  function render(opts) {
    opts = opts || {};
    var card = currentCard();
    var ratings = getRatings();
    var counts = summaryCounts();
    var rating = ratings[card.id];

    root.innerHTML =
      '<h2 tabindex="-1" id="practical-flashcards-heading">Show Me, Tell Me</h2>' +
      '<p class="section-intro">One of these is asked before you set off (a &lsquo;tell me&rsquo; question) and one while you&rsquo;re driving, if it can be done safely (a &lsquo;show me&rsquo; question). Tap a card to reveal the answer.</p>' +
      '<p class="flashcard-summary">Card ' + (currentIndex + 1) + ' of ' + deckOrder.length + ' &middot; ' +
        counts.known + ' known &middot; ' + counts.learning + ' still learning &middot; ' + counts.notReviewed + ' not yet reviewed</p>' +
      '<div class="card flashcard">' +
        '<span class="badge ' + (card.type === "tell-me" ? "badge-warning" : "badge-success") + '">' + typeLabel(card.type) + '</span>' +
        '<p class="flashcard__question">' + Util.escapeHtml(card.question) + '</p>' +
        '<button type="button" class="btn btn-primary flashcard-reveal-btn" aria-expanded="' + revealed + '" aria-controls="flashcard-answer">' +
          (revealed ? "Hide answer" : "Reveal answer") +
        '</button>' +
        '<div id="flashcard-answer" class="flashcard__answer"' + (revealed ? "" : " hidden") + '>' +
          '<p>' + Util.escapeHtml(card.answer) + '</p>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn btn-secondary flashcard-rate-btn' + (rating === "learning" ? " is-selected" : "") + '" data-rating="learning">Still learning</button>' +
            '<button type="button" class="btn btn-accent flashcard-rate-btn' + (rating === "known" ? " is-selected" : "") + '" data-rating="known">Got it</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="btn-row flashcard-nav">' +
        '<button type="button" class="btn btn-secondary flashcard-prev-btn"' + (deckOrder.length <= 1 ? " disabled" : "") + '>&larr; Previous</button>' +
        '<button type="button" class="btn btn-secondary flashcard-shuffle-btn">Shuffle deck</button>' +
        '<button type="button" class="btn btn-primary flashcard-next-btn"' + (deckOrder.length <= 1 ? " disabled" : "") + '>Next &rarr;</button>' +
      '</div>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost flashcard-reset-btn">Reset ratings</button></div>';

    root.querySelector(".flashcard-reveal-btn").addEventListener("click", function () {
      revealed = !revealed;
      render({ focus: false });
    });

    root.querySelectorAll(".flashcard-rate-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var r = getRatings();
        r[card.id] = btn.getAttribute("data-rating");
        setRatings(r);
        goTo(currentIndex + 1 < deckOrder.length ? currentIndex + 1 : 0, { focus: false });
      });
    });

    root.querySelector(".flashcard-prev-btn").addEventListener("click", function () {
      goTo(currentIndex - 1 >= 0 ? currentIndex - 1 : deckOrder.length - 1, { focus: false });
    });
    root.querySelector(".flashcard-next-btn").addEventListener("click", function () {
      goTo(currentIndex + 1 < deckOrder.length ? currentIndex + 1 : 0, { focus: false });
    });
    root.querySelector(".flashcard-shuffle-btn").addEventListener("click", function () {
      deckOrder = Util.shuffle(deckOrder);
      goTo(0, { focus: false });
      Util.announce("Deck shuffled.");
    });

    root.querySelector(".flashcard-reset-btn").addEventListener("click", function () {
      var confirmed = window.confirm("Clear all 'known' / 'still learning' ratings for these flashcards?");
      if (!confirmed) return;
      AppStorage.remove(RATINGS_KEY);
      render({ focus: false });
      Util.announce("Flashcard ratings reset.");
    });

    if (opts.focus !== false) focusHeading();
  }

  function goTo(index, opts) {
    currentIndex = index;
    revealed = false;
    render(opts);
  }

  function focusHeading() {
    var heading = document.getElementById("practical-flashcards-heading");
    if (heading) heading.focus();
  }

  function init() {
    root = document.getElementById("practical-flashcards-app");
    if (!root) return;
    deckOrder = Util.shuffle(SHOW_ME_TELL_ME.map(function (c) { return c.id; }));
    render({ focus: false });

    document.addEventListener("tab:activated", function (evt) {
      if (evt.detail && evt.detail.id === "practical-flashcards") focusHeading();
    });
  }

  PracticalApp.register(init);
})();
