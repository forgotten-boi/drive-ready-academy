/* "Practice by Category" — browse the 13 DVSA-style theory categories,
   then work through a short random set of questions from one category
   with immediate feedback and an explanation for each answer. */

(function () {
  "use strict";

  var SESSION_LENGTH = 10;
  var root = null;                // #theory-practice-app container
  var session = null;             // active practice session state, or null

  function categoryStatsFor(categoryId) {
    var stats = TheoryStats.getCategoryStats()[categoryId];
    if (!stats || stats.seen === 0) return null;
    return { seen: stats.seen, correct: stats.correct, pct: Math.round((stats.correct / stats.seen) * 100) };
  }

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

  /* ---------------- Category list view ---------------- */

  function renderCategoryList(opts) {
    opts = opts || {};
    session = null;
    var cardsHtml = CATEGORIES.map(function (cat) {
      var count = THEORY_QUESTIONS.filter(function (q) { return q.category === cat.id; }).length;
      var stats = categoryStatsFor(cat.id);
      var metaHtml = stats
        ? '<div class="progress-bar" aria-hidden="true"><div class="progress-bar__fill ' + strengthClass(stats.pct) + '" style="width:' + stats.pct + '%"></div></div>' +
          '<span class="badge ' + badgeClass(stats.pct) + '">' + stats.pct + '% (' + stats.correct + '/' + stats.seen + ' answered)</span>'
        : '<span class="badge">Not attempted yet</span>';

      return (
        '<button type="button" class="card card--interactive category-card" data-category="' + cat.id + '">' +
          '<h3 class="category-card__name">' + Util.escapeHtml(cat.name) + '</h3>' +
          '<p class="category-card__count">' + count + ' practice questions</p>' +
          metaHtml +
        '</button>'
      );
    }).join("");

    root.innerHTML =
      '<h2 tabindex="-1" id="theory-practice-heading">Practice by Category</h2>' +
      '<p class="section-intro">Pick a category to work through ' + SESSION_LENGTH + ' random questions with instant feedback and explanations. Your results feed into <strong>My Progress</strong> so you can see your weaker areas.</p>' +
      '<div class="card-grid">' + cardsHtml + '</div>';

    root.querySelectorAll(".category-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startSession(btn.getAttribute("data-category"));
      });
    });

    if (opts.focus !== false) focusHeading("theory-practice-heading");
  }

  function focusHeading(id) {
    var heading = document.getElementById(id);
    if (heading) heading.focus();
  }

  /* ---------------- Practice session ---------------- */

  function startSession(categoryId) {
    var pool = THEORY_QUESTIONS.filter(function (q) { return q.category === categoryId; });
    var questions = Util.sample(pool, Math.min(SESSION_LENGTH, pool.length));
    var category = CATEGORIES.filter(function (c) { return c.id === categoryId; })[0];

    session = {
      category: category,
      questions: questions,
      index: 0,
      score: 0,
      selected: null,
      checked: false,
      missed: []
    };

    renderQuestion();
  }

  function currentQuestion() {
    return session.questions[session.index];
  }

  function renderQuestion() {
    var q = currentQuestion();
    var total = session.questions.length;

    var optionsHtml = q.options.map(function (opt, i) {
      return (
        '<label class="quiz-option" data-index="' + i + '">' +
          '<input class="quiz-option__input" type="radio" name="practice-answer" value="' + i + '">' +
          '<span class="quiz-option__text">' + Util.escapeHtml(opt) + '</span>' +
          '<span class="quiz-option__marker" aria-hidden="true"></span>' +
        '</label>'
      );
    }).join("");

    root.innerHTML =
      '<div class="quiz-header">' +
        '<button type="button" class="btn btn-ghost quiz-exit" aria-label="Exit practice session and return to category list">&larr; Categories</button>' +
        '<span class="quiz-progress">' + Util.escapeHtml(session.category.name) + ' &middot; Question ' + (session.index + 1) + ' of ' + total + '</span>' +
      '</div>' +
      '<div class="card quiz-card">' +
        '<fieldset class="quiz-options">' +
          '<legend class="quiz-question-text" tabindex="-1" id="theory-practice-heading">' + Util.escapeHtml(q.question) + '</legend>' +
          optionsHtml +
        '</fieldset>' +
        '<div class="quiz-explanation" aria-live="polite" hidden></div>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary quiz-check" disabled>Check answer</button>' +
        '</div>' +
      '</div>';

    root.querySelector(".quiz-exit").addEventListener("click", renderCategoryList);

    var inputs = Array.prototype.slice.call(root.querySelectorAll(".quiz-option__input"));
    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        session.selected = Number(input.value);
        root.querySelectorAll(".quiz-option").forEach(function (label) {
          label.classList.toggle("is-selected", Number(label.getAttribute("data-index")) === session.selected);
        });
        root.querySelector(".quiz-check").disabled = false;
      });
    });

    root.querySelector(".quiz-check").addEventListener("click", checkAnswer);

    focusHeading("theory-practice-heading");
  }

  function checkAnswer() {
    if (session.checked || session.selected === null) return;
    session.checked = true;

    var q = currentQuestion();
    var wasCorrect = session.selected === q.correctIndex;
    if (wasCorrect) session.score += 1;
    else session.missed.push(q);

    TheoryStats.recordAnswer(q.category, wasCorrect);

    root.querySelectorAll(".quiz-option").forEach(function (label) {
      var i = Number(label.getAttribute("data-index"));
      var marker = label.querySelector(".quiz-option__marker");
      label.querySelector(".quiz-option__input").disabled = true;
      if (i === q.correctIndex) {
        label.classList.add("is-correct");
        marker.textContent = "✓";
      } else if (i === session.selected) {
        label.classList.add("is-incorrect");
        marker.textContent = "✗";
      }
    });

    var explanation = root.querySelector(".quiz-explanation");
    explanation.hidden = false;
    explanation.innerHTML =
      '<p class="quiz-explanation__result">' + (wasCorrect ? "Correct." : "Not quite.") + '</p>' +
      '<p>' + Util.escapeHtml(q.explanation) + '</p>';

    Util.announce(wasCorrect ? "Correct." : "Incorrect. " + q.explanation);

    var isLast = session.index === session.questions.length - 1;
    var checkBtn = root.querySelector(".quiz-check");
    checkBtn.textContent = isLast ? "See results" : "Next question";
    checkBtn.disabled = false;
    checkBtn.removeEventListener("click", checkAnswer);
    checkBtn.addEventListener("click", advance);
  }

  function advance() {
    session.index += 1;
    session.selected = null;
    session.checked = false;
    if (session.index >= session.questions.length) {
      renderSummary();
    } else {
      renderQuestion();
    }
  }

  /* ---------------- Session summary ---------------- */

  function renderSummary() {
    var total = session.questions.length;
    var pct = Math.round((session.score / total) * 100);

    var missedHtml = session.missed.length === 0
      ? '<p>Nice work — you got every question right in this set.</p>'
      : '<div class="missed-list">' + session.missed.map(function (q) {
          return (
            '<div class="missed-item">' +
              '<p class="missed-item__q">' + Util.escapeHtml(q.question) + '</p>' +
              '<p class="missed-item__a"><strong>Correct answer:</strong> ' + Util.escapeHtml(q.options[q.correctIndex]) + '</p>' +
              '<p class="missed-item__explain">' + Util.escapeHtml(q.explanation) + '</p>' +
            '</div>'
          );
        }).join("") + '</div>';

    root.innerHTML =
      '<h2 tabindex="-1" id="theory-practice-heading">Session complete</h2>' +
      '<div class="card result-card">' +
        '<p class="result-card__score">' + session.score + ' / ' + total + ' <span class="badge ' + badgeClass(pct) + '">' + pct + '%</span></p>' +
        '<p class="result-card__category">' + Util.escapeHtml(session.category.name) + '</p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary quiz-again">Practice this category again</button>' +
          '<button type="button" class="btn btn-secondary quiz-exit">Back to categories</button>' +
        '</div>' +
      '</div>' +
      '<h3>Questions to review</h3>' +
      missedHtml;

    root.querySelector(".quiz-again").addEventListener("click", function () {
      startSession(session.category.id);
    });
    root.querySelector(".quiz-exit").addEventListener("click", renderCategoryList);

    Util.announce("Session complete. Score " + session.score + " out of " + total + ".");
    focusHeading("theory-practice-heading");
  }

  /* ---------------- Init ---------------- */

  function init() {
    root = document.getElementById("theory-practice-app");
    if (!root) return;
    renderCategoryList({ focus: false });
  }

  TheoryApp.register(init);
})();
