/* Timed mock test: 50 questions drawn from the bank (stratified across
   all 13 categories so the category breakdown is meaningful), a countdown
   timer mirroring the real DVSA car theory test (57 minutes), a flag /
   jump question navigator, and a results screen with a category
   breakdown and full answer review. */

(function () {
  "use strict";

  var MOCK_TOTAL = 50;
  var MOCK_PASS_MARK = 43;
  var MOCK_DURATION_SECONDS = 57 * 60;
  var MILESTONE_SECONDS = [1800, 900, 300, 60]; // 30, 15, 5, 1 minutes remaining
  var ATTEMPT_KEY = "theory:mockAttempt:current";
  var PER_CATEGORY = Math.floor(MOCK_TOTAL / CATEGORIES.length);

  var root = null;
  var QUESTIONS_BY_ID = {};
  var attempt = null;
  var timerHandle = null;
  var lastDisplayedSeconds = null;
  var startNotice = null; // set when a previous attempt auto-expired, shown once on the start screen

  THEORY_QUESTIONS.forEach(function (q) { QUESTIONS_BY_ID[q.id] = q; });

  /* ---------------- Drawing + scoring ---------------- */

  function drawMockQuestions() {
    var picked = [];
    var pickedIds = {};

    CATEGORIES.forEach(function (cat) {
      var pool = THEORY_QUESTIONS.filter(function (q) { return q.category === cat.id; });
      Util.sample(pool, Math.min(PER_CATEGORY, pool.length)).forEach(function (q) {
        picked.push(q);
        pickedIds[q.id] = true;
      });
    });

    var remainingPool = THEORY_QUESTIONS.filter(function (q) { return !pickedIds[q.id]; });
    var extraNeeded = Math.min(MOCK_TOTAL - picked.length, remainingPool.length);
    picked = picked.concat(Util.sample(remainingPool, extraNeeded));

    return Util.shuffle(picked).slice(0, MOCK_TOTAL);
  }

  function newAttempt() {
    var now = Date.now();
    return {
      questionIds: drawMockQuestions().map(function (q) { return q.id; }),
      answers: {},
      flagged: [],
      currentIndex: 0,
      startedAt: now,
      endsAt: now + MOCK_DURATION_SECONDS * 1000,
      submitted: false,
      finishedAt: null,
      score: null
    };
  }

  function scoreAttempt(a) {
    var breakdown = {};
    var score = 0;
    a.questionIds.forEach(function (id) {
      var q = QUESTIONS_BY_ID[id];
      if (!breakdown[q.category]) breakdown[q.category] = { correct: 0, total: 0 };
      breakdown[q.category].total += 1;
      if (a.answers[id] === q.correctIndex) {
        score += 1;
        breakdown[q.category].correct += 1;
      }
    });
    return { score: score, total: a.questionIds.length, pass: score >= MOCK_PASS_MARK, breakdown: breakdown };
  }

  function finalizeAttempt(a) {
    var result = scoreAttempt(a);
    a.submitted = true;
    a.finishedAt = Date.now();
    a.score = result.score;

    a.questionIds.forEach(function (id) {
      var ans = a.answers[id];
      if (ans !== undefined) {
        TheoryStats.recordAnswer(QUESTIONS_BY_ID[id].category, ans === QUESTIONS_BY_ID[id].correctIndex);
      }
    });

    TheoryStats.addMockResult({
      date: new Date().toISOString(),
      score: result.score,
      total: result.total,
      pass: result.pass,
      breakdown: result.breakdown,
      durationSeconds: Math.round((a.finishedAt - a.startedAt) / 1000)
    });

    return result;
  }

  function saveAttempt() {
    AppStorage.set(ATTEMPT_KEY, attempt);
  }

  /* ---------------- Timer ---------------- */

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function beforeUnloadHandler(evt) {
    evt.preventDefault();
    evt.returnValue = "";
  }

  function guardUnload(on) {
    if (on) window.addEventListener("beforeunload", beforeUnloadHandler);
    else window.removeEventListener("beforeunload", beforeUnloadHandler);
  }

  function updateTimerDisplay(remainingMs) {
    var totalSeconds = Math.ceil(remainingMs / 1000);
    if (totalSeconds === lastDisplayedSeconds) return;
    lastDisplayedSeconds = totalSeconds;

    var el = document.getElementById("mock-timer-display");
    if (el) el.textContent = Util.formatMMSS(totalSeconds);

    if (MILESTONE_SECONDS.indexOf(totalSeconds) !== -1) {
      Util.announce(Util.formatMMSS(totalSeconds) + " remaining on your mock test.");
    }
  }

  function startTimer() {
    lastDisplayedSeconds = null;
    function tick() {
      var remaining = Math.max(0, attempt.endsAt - Date.now());
      updateTimerDisplay(remaining);
      if (remaining <= 0) {
        stopTimer();
        submit({ auto: true });
      }
    }
    tick();
    timerHandle = setInterval(tick, 250);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible" || !attempt || attempt.submitted) return;
    if (Date.now() >= attempt.endsAt) {
      stopTimer();
      submit({ auto: true });
    }
  });

  /* ---------------- Submit ---------------- */

  function submit(opts) {
    if (!attempt || attempt.submitted) return;
    opts = opts || {};

    var unanswered = attempt.questionIds.length - Object.keys(attempt.answers).length;
    if (!opts.auto && unanswered > 0) {
      var proceed = window.confirm(
        unanswered + " question" + (unanswered === 1 ? " is" : "s are") +
        " still unanswered. Submit the test anyway?"
      );
      if (!proceed) return;
    }

    stopTimer();
    guardUnload(false);
    var result = finalizeAttempt(attempt);
    AppStorage.remove(ATTEMPT_KEY);
    renderResults(attempt, result);
  }

  /* ---------------- Views ---------------- */

  function focusHeading() {
    var heading = document.getElementById("theory-mock-heading");
    if (heading) heading.focus();
  }

  function renderStart() {
    stopTimer();
    guardUnload(false);
    attempt = null;

    var noticeHtml = startNotice
      ? '<div class="card mock-notice">' + startNotice + '</div>'
      : "";
    startNotice = null;

    root.innerHTML =
      '<h2 tabindex="-1" id="theory-mock-heading">Mock Test</h2>' +
      noticeHtml +
      '<div class="card mock-intro">' +
        '<p>A full mock test draws <strong>' + MOCK_TOTAL + ' random questions</strong> spread across all 13 categories, ' +
        'just like the real thing. You&rsquo;ll have <strong>' + Math.round(MOCK_DURATION_SECONDS / 60) + ' minutes</strong> ' +
        '&mdash; the same time limit as the real DVSA car theory test &mdash; and the real pass mark is ' +
        '<strong>' + MOCK_PASS_MARK + ' out of ' + MOCK_TOTAL + '</strong>.</p>' +
        '<p>You can flag questions to revisit and jump between questions freely before submitting. There&rsquo;s no answer feedback ' +
        'during the test itself &mdash; just like on the day &mdash; but you&rsquo;ll get a full review afterwards.</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary mock-start-btn">Start mock test</button></div>' +
      '</div>';

    root.querySelector(".mock-start-btn").addEventListener("click", function () {
      attempt = newAttempt();
      saveAttempt();
      guardUnload(true);
      renderActive();
    });

    focusHeading();
  }

  function renderResumePrompt(existing) {
    var remaining = Math.max(0, existing.endsAt - Date.now());
    root.innerHTML =
      '<h2 tabindex="-1" id="theory-mock-heading">Resume your mock test?</h2>' +
      '<div class="card mock-intro">' +
        '<p>You have a mock test in progress with <strong>' + Util.formatMMSS(Math.ceil(remaining / 1000)) + '</strong> left on the clock.</p>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-primary mock-resume-btn">Resume test</button>' +
          '<button type="button" class="btn btn-secondary mock-abandon-btn">Abandon and start new</button>' +
        '</div>' +
      '</div>';

    root.querySelector(".mock-resume-btn").addEventListener("click", function () {
      attempt = existing;
      guardUnload(true);
      renderActive();
    });
    root.querySelector(".mock-abandon-btn").addEventListener("click", function () {
      AppStorage.remove(ATTEMPT_KEY);
      renderStart();
    });

    focusHeading();
  }

  function renderActive() {
    var q = QUESTIONS_BY_ID[attempt.questionIds[attempt.currentIndex]];
    var total = attempt.questionIds.length;
    var answeredCount = Object.keys(attempt.answers).length;
    var isFlagged = attempt.flagged.indexOf(q.id) !== -1;
    var selected = attempt.answers[q.id];

    var optionsHtml = q.options.map(function (opt, i) {
      var isSelected = selected === i;
      return (
        '<label class="quiz-option' + (isSelected ? " is-selected" : "") + '" data-index="' + i + '">' +
          '<input class="quiz-option__input" type="radio" name="mock-answer" value="' + i + '"' + (isSelected ? " checked" : "") + '>' +
          '<span class="quiz-option__text">' + Util.escapeHtml(opt) + '</span>' +
        '</label>'
      );
    }).join("");

    var navHtml = attempt.questionIds.map(function (id, i) {
      var answered = attempt.answers[id] !== undefined;
      var flagged = attempt.flagged.indexOf(id) !== -1;
      var isCurrent = i === attempt.currentIndex;
      var stateLabel = "Question " + (i + 1) + (answered ? ", answered" : ", not answered") + (flagged ? ", flagged for review" : "");
      return (
        '<button type="button" class="mock-nav-btn' +
          (answered ? " is-answered" : "") + (flagged ? " is-flagged" : "") + (isCurrent ? " is-current" : "") + '"' +
          ' data-index="' + i + '" aria-label="' + stateLabel + '"' + (isCurrent ? ' aria-current="true"' : "") + '>' +
          (i + 1) +
        '</button>'
      );
    }).join("");

    root.innerHTML =
      '<div class="mock-header">' +
        '<div class="mock-header__timer">' +
          '<span class="visually-hidden">Time remaining</span>' +
          '<span id="mock-timer-display" aria-hidden="true">' + Util.formatMMSS(MOCK_DURATION_SECONDS) + '</span>' +
        '</div>' +
        '<div class="mock-header__meta">Question ' + (attempt.currentIndex + 1) + ' of ' + total + ' &middot; ' + answeredCount + ' answered</div>' +
        '<button type="button" class="btn btn-secondary mock-submit-btn">Submit test</button>' +
      '</div>' +
      '<div class="card quiz-card">' +
        '<div class="mock-question-toolbar">' +
          '<button type="button" class="btn btn-ghost mock-flag-btn" aria-pressed="' + isFlagged + '">' +
            (isFlagged ? "⚑ Flagged for review" : "⚐ Flag for review") +
          '</button>' +
        '</div>' +
        '<fieldset class="quiz-options">' +
          '<legend class="quiz-question-text" tabindex="-1" id="theory-mock-heading">' + Util.escapeHtml(q.question) + '</legend>' +
          optionsHtml +
        '</fieldset>' +
        '<div class="btn-row">' +
          '<button type="button" class="btn btn-secondary mock-prev-btn"' + (attempt.currentIndex === 0 ? " disabled" : "") + '>&larr; Previous</button>' +
          '<button type="button" class="btn btn-primary mock-next-btn">' + (attempt.currentIndex === total - 1 ? "Review & submit" : "Next →") + '</button>' +
        '</div>' +
      '</div>' +
      '<nav class="mock-navigator" aria-label="Question navigator">' + navHtml + '</nav>';

    root.querySelectorAll(".quiz-option__input").forEach(function (input) {
      input.addEventListener("change", function () {
        attempt.answers[q.id] = Number(input.value);
        saveAttempt();
        root.querySelectorAll(".quiz-option").forEach(function (label) {
          label.classList.toggle("is-selected", Number(label.getAttribute("data-index")) === Number(input.value));
        });
        var meta = root.querySelector(".mock-header__meta");
        if (meta) meta.textContent = "Question " + (attempt.currentIndex + 1) + " of " + total + " · " + Object.keys(attempt.answers).length + " answered";
        var navBtn = root.querySelector('.mock-nav-btn[data-index="' + attempt.currentIndex + '"]');
        if (navBtn) navBtn.classList.add("is-answered");
      });
    });

    root.querySelector(".mock-flag-btn").addEventListener("click", function (evt) {
      var idx = attempt.flagged.indexOf(q.id);
      var flaggedNow;
      if (idx === -1) { attempt.flagged.push(q.id); flaggedNow = true; }
      else { attempt.flagged.splice(idx, 1); flaggedNow = false; }
      saveAttempt();

      var btn = evt.currentTarget;
      btn.setAttribute("aria-pressed", String(flaggedNow));
      btn.textContent = flaggedNow ? "⚑ Flagged for review" : "⚐ Flag for review";

      var navBtn = root.querySelector('.mock-nav-btn[data-index="' + attempt.currentIndex + '"]');
      if (navBtn) {
        navBtn.classList.toggle("is-flagged", flaggedNow);
        var answered = attempt.answers[q.id] !== undefined;
        navBtn.setAttribute("aria-label", "Question " + (attempt.currentIndex + 1) +
          (answered ? ", answered" : ", not answered") + (flaggedNow ? ", flagged for review" : ""));
      }
    });

    var prevBtn = root.querySelector(".mock-prev-btn");
    if (prevBtn) prevBtn.addEventListener("click", function () { goToQuestion(attempt.currentIndex - 1); });

    root.querySelector(".mock-next-btn").addEventListener("click", function () {
      if (attempt.currentIndex < total - 1) goToQuestion(attempt.currentIndex + 1);
      else submit({ auto: false });
    });

    root.querySelector(".mock-submit-btn").addEventListener("click", function () { submit({ auto: false }); });

    root.querySelectorAll(".mock-nav-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { goToQuestion(Number(btn.getAttribute("data-index"))); });
    });

    if (!timerHandle) startTimer();
    focusHeading();
  }

  function goToQuestion(index) {
    attempt.currentIndex = Util.clamp(index, 0, attempt.questionIds.length - 1);
    saveAttempt();
    renderActive();
  }

  function renderResults(finishedAttempt, result) {
    var pct = Math.round((result.score / result.total) * 100);
    var gap = MOCK_PASS_MARK - result.score;
    var gapMessage = gap <= 0
      ? "That clears the pass mark of " + MOCK_PASS_MARK + " by " + (-gap) + (result.score - MOCK_PASS_MARK === 1 ? " mark" : " marks") + "."
      : "You needed " + gap + " more correct answer" + (gap === 1 ? "" : "s") + " to reach the pass mark of " + MOCK_PASS_MARK + "/" + MOCK_TOTAL + ".";

    var breakdownHtml = CATEGORIES.map(function (cat) {
      var b = result.breakdown[cat.id];
      if (!b || b.total === 0) return "";
      var catPct = Math.round((b.correct / b.total) * 100);
      var strength = catPct >= 80 ? "is-strong" : catPct >= 50 ? "is-medium" : "is-weak";
      var badge = catPct >= 80 ? "badge-success" : catPct >= 50 ? "badge-warning" : "badge-danger";
      return (
        '<div class="card breakdown-item">' +
          '<h4 class="breakdown-item__name">' + Util.escapeHtml(cat.name) + '</h4>' +
          '<div class="progress-bar" aria-hidden="true"><div class="progress-bar__fill ' + strength + '" style="width:' + catPct + '%"></div></div>' +
          '<span class="badge ' + badge + '">' + b.correct + '/' + b.total + ' &middot; ' + catPct + '%</span>' +
        '</div>'
      );
    }).join("");

    root.innerHTML =
      '<h2 tabindex="-1" id="theory-mock-heading">Mock test results</h2>' +
      '<div class="card result-card mock-result-card">' +
        '<p class="result-card__score">' + result.score + ' / ' + result.total +
          ' <span class="badge ' + (result.pass ? "badge-success" : "badge-danger") + '">' + (result.pass ? "PASS" : "NOT YET") + '</span></p>' +
        '<p class="mock-result-gap">' + gapMessage + '</p>' +
        '<p class="result-card__category">Real DVSA pass mark: ' + MOCK_PASS_MARK + '/' + MOCK_TOTAL + ' &middot; time used ' +
          Util.formatMMSS(Math.round((finishedAttempt.finishedAt - finishedAttempt.startedAt) / 1000)) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn btn-primary mock-retry-btn">Start a new mock test</button></div>' +
      '</div>' +
      '<h3>Category breakdown</h3>' +
      '<div class="card-grid breakdown-grid">' + breakdownHtml + '</div>' +
      '<div class="mock-review">' +
        '<div class="mock-review__toolbar">' +
          '<h3>Review answers</h3>' +
          '<label class="mock-review__filter"><input type="checkbox" class="mock-review-filter-input"> Show incorrect / unanswered only</label>' +
        '</div>' +
        '<div class="mock-review-list"></div>' +
      '</div>';

    renderReviewList(finishedAttempt, false);
    root.querySelector(".mock-review-filter-input").addEventListener("change", function (evt) {
      renderReviewList(finishedAttempt, evt.target.checked);
    });

    root.querySelector(".mock-retry-btn").addEventListener("click", renderStart);

    Util.announce("Mock test finished. Score " + result.score + " out of " + result.total + ", " + (result.pass ? "a pass" : "not a pass yet") + ".");
    focusHeading();
  }

  function renderReviewList(finishedAttempt, incorrectOnly) {
    var list = root.querySelector(".mock-review-list");
    var items = finishedAttempt.questionIds.map(function (id, i) {
      var q = QUESTIONS_BY_ID[id];
      var ans = finishedAttempt.answers[id];
      var wasCorrect = ans === q.correctIndex;
      return { index: i, q: q, ans: ans, wasCorrect: wasCorrect };
    });

    var filtered = incorrectOnly ? items.filter(function (it) { return !it.wasCorrect; }) : items;

    if (filtered.length === 0) {
      list.innerHTML = "<p>Nothing to show here.</p>";
      return;
    }

    list.innerHTML = filtered.map(function (it) {
      var yourAnswerHtml = it.ans === undefined
        ? '<p class="missed-item__a mock-review__unanswered">You left this blank.</p>'
        : '<p class="missed-item__a' + (it.wasCorrect ? "" : " mock-review__wrong") + '">Your answer: ' + Util.escapeHtml(it.q.options[it.ans]) + '</p>';
      var correctAnswerHtml = it.wasCorrect ? "" :
        '<p class="missed-item__a">Correct answer: ' + Util.escapeHtml(it.q.options[it.q.correctIndex]) + '</p>';

      return (
        '<div class="missed-item' + (it.wasCorrect ? " missed-item--correct" : "") + '">' +
          '<p class="missed-item__q">' + (it.index + 1) + '. ' + Util.escapeHtml(it.q.question) +
            ' <span class="mock-review__icon" aria-hidden="true">' + (it.wasCorrect ? "✓" : "✗") + '</span></p>' +
          yourAnswerHtml + correctAnswerHtml +
          '<p class="missed-item__explain">' + Util.escapeHtml(it.q.explanation) + '</p>' +
        '</div>'
      );
    }).join("");
  }

  /* ---------------- Init ---------------- */

  function init() {
    root = document.getElementById("theory-mock-app");
    if (!root) return;

    var existing = AppStorage.get(ATTEMPT_KEY, null);
    if (existing && !existing.submitted) {
      if (Date.now() >= existing.endsAt) {
        var result = finalizeAttempt(existing);
        AppStorage.remove(ATTEMPT_KEY);
        startNotice = "Your last mock test ran out of time and was submitted automatically — you scored " +
          result.score + "/" + result.total + ". See <strong>My Progress</strong> for the full breakdown.";
        renderStart();
      } else {
        renderResumePrompt(existing);
      }
    } else {
      renderStart();
    }
  }

  TheoryApp.register(init);
})();
