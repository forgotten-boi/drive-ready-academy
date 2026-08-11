import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { TheoryDataService } from './theory-data.service';
import { TheoryStatsService } from './theory-stats.service';
import { Category, CategoryBreakdownEntry, MockAttempt, TheoryQuestion } from '../models/theory.model';
import { clamp, sample, shuffle } from '../utils';

export const MOCK_TOTAL = 50;
export const MOCK_PASS_MARK = 43;
export const MOCK_DURATION_SECONDS = 57 * 60;

const ATTEMPT_KEY = 'theory:mockAttempt:current';

export interface MockResult {
  score: number;
  total: number;
  pass: boolean;
  breakdown: Record<string, CategoryBreakdownEntry>;
}

/**
 * Owns the timed mock test end to end: stratified question draw, the
 * in-progress attempt (persisted so backgrounding/reopening the app
 * resumes rather than loses it), the countdown, and scoring. Pages read
 * this service's signals rather than holding their own timer state.
 */
@Injectable({ providedIn: 'root' })
export class MockTestService {
  private readonly storage = inject(StorageService);
  private readonly theoryData = inject(TheoryDataService);
  private readonly theoryStats = inject(TheoryStatsService);

  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private appStateListenerAttached = false;

  readonly attempt = signal<MockAttempt | null>(
    this.storage.get<MockAttempt | null>(ATTEMPT_KEY, null)
  );
  readonly remainingMs = signal(0);
  /** Set once if an attempt expired in the background and was auto-submitted before the page ever saw it. */
  readonly autoSubmittedResult = signal<MockResult | null>(null);
  /** The score/breakdown for the most recently submitted attempt, for the results view. */
  readonly lastResult = signal<MockResult | null>(null);

  readonly isActive = computed(() => {
    const a = this.attempt();
    return !!a && !a.submitted;
  });

  readonly currentQuestion = computed<TheoryQuestion | null>(() => {
    const a = this.attempt();
    if (!a) return null;
    return this.theoryData.questionById(a.questionIds[a.currentIndex]) ?? null;
  });

  readonly answeredCount = computed(() => {
    const a = this.attempt();
    return a ? Object.keys(a.answers).length : 0;
  });

  constructor() {
    // If the app was closed/backgrounded past the deadline, resolve that
    // quietly once the question bank has loaded, rather than showing a
    // stale, already-expired timer. Gated on `questions()` being non-empty
    // because this runs at service-construction time, before the
    // categories/questions HTTP fetch has necessarily resolved — scoring
    // against an empty bank would silently zero every answer.
    effect(() => {
      const loaded = this.theoryData.questions().length > 0;
      const existing = this.attempt();
      if (!loaded || !existing || existing.submitted || Date.now() < existing.endsAt) return;

      const result = this.finalize(existing);
      this.autoSubmittedResult.set(result);
      this.attempt.set(null);
      this.storage.remove(ATTEMPT_KEY);
    });

    effect(() => {
      if (this.isActive()) {
        this.startTicking();
      } else {
        this.stopTicking();
      }
    });

    this.attachAppStateListener();
  }

  private startTicking(): void {
    if (this.intervalHandle) return;
    const tick = () => {
      const a = this.attempt();
      if (!a) return;
      const remaining = Math.max(0, a.endsAt - Date.now());
      this.remainingMs.set(remaining);
      if (remaining <= 0) this.submit(true);
    };
    tick();
    this.intervalHandle = setInterval(tick, 250);
  }

  private stopTicking(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /** Best-effort: catch the case where the app was backgrounded through the deadline and came back. */
  private attachAppStateListener(): void {
    if (this.appStateListenerAttached) return;
    this.appStateListenerAttached = true;
    import('@capacitor/app')
      .then(({ App }) => {
        App.addListener('appStateChange', (state) => {
          if (!state.isActive) return;
          const a = this.attempt();
          if (a && !a.submitted && Date.now() >= a.endsAt) this.submit(true);
        });
      })
      .catch(() => {
        // Not running under Capacitor (plain web) — the setInterval tick above still covers it.
      });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      const a = this.attempt();
      if (a && !a.submitted && Date.now() >= a.endsAt) this.submit(true);
    });
  }

  hasResumableAttempt(): boolean {
    const a = this.attempt();
    return !!a && !a.submitted;
  }

  startNew(): void {
    const questions = this.drawStratified();
    const now = Date.now();
    const attempt: MockAttempt = {
      questionIds: questions.map((q) => q.id),
      answers: {},
      flagged: [],
      currentIndex: 0,
      startedAt: now,
      endsAt: now + MOCK_DURATION_SECONDS * 1000,
      submitted: false,
      finishedAt: null,
      score: null
    };
    this.attempt.set(attempt);
    this.lastResult.set(null);
    this.autoSubmittedResult.set(null);
    this.persist();
  }

  abandon(): void {
    this.attempt.set(null);
    this.storage.remove(ATTEMPT_KEY);
  }

  selectAnswer(questionId: string, optionIndex: number): void {
    const a = this.attempt();
    if (!a || a.submitted) return;
    const next: MockAttempt = { ...a, answers: { ...a.answers, [questionId]: optionIndex } };
    this.attempt.set(next);
    this.persist();
  }

  toggleFlag(questionId: string): void {
    const a = this.attempt();
    if (!a || a.submitted) return;
    const flagged = a.flagged.includes(questionId)
      ? a.flagged.filter((id) => id !== questionId)
      : [...a.flagged, questionId];
    this.attempt.set({ ...a, flagged });
    this.persist();
  }

  goTo(index: number): void {
    const a = this.attempt();
    if (!a) return;
    const clamped = clamp(index, 0, a.questionIds.length - 1);
    this.attempt.set({ ...a, currentIndex: clamped });
    this.persist();
  }

  next(): void {
    const a = this.attempt();
    if (a) this.goTo(a.currentIndex + 1);
  }

  previous(): void {
    const a = this.attempt();
    if (a) this.goTo(a.currentIndex - 1);
  }

  /** Returns the number of unanswered questions — pages use this to confirm before a manual submit. */
  unansweredCount(): number {
    const a = this.attempt();
    return a ? a.questionIds.length - Object.keys(a.answers).length : 0;
  }

  submit(force = false): MockResult | null {
    const a = this.attempt();
    if (!a || a.submitted) return null;
    if (!force && this.unansweredCount() > 0) return null;

    const result = this.finalize(a);
    this.attempt.set({ ...a, submitted: true, finishedAt: Date.now(), score: result.score });
    this.lastResult.set(result);
    this.storage.remove(ATTEMPT_KEY);
    return result;
  }

  /** Scores the attempt and records it into TheoryStatsService — used for both manual and auto submits. */
  private finalize(attempt: MockAttempt): MockResult {
    const breakdown: Record<string, CategoryBreakdownEntry> = {};
    let score = 0;

    for (const id of attempt.questionIds) {
      const q = this.theoryData.questionById(id);
      if (!q) continue;
      breakdown[q.category] ??= { correct: 0, total: 0 };
      breakdown[q.category].total += 1;

      const givenAnswer = attempt.answers[id];
      const wasCorrect = givenAnswer === q.correctIndex;
      if (wasCorrect) {
        score += 1;
        breakdown[q.category].correct += 1;
      }
      if (givenAnswer !== undefined) this.theoryStats.recordAnswer(q.category, wasCorrect);
    }

    const result: MockResult = { score, total: attempt.questionIds.length, pass: score >= MOCK_PASS_MARK, breakdown };

    this.theoryStats.addMockResult({
      date: new Date().toISOString(),
      score: result.score,
      total: result.total,
      pass: result.pass,
      breakdown: result.breakdown,
      durationSeconds: Math.round(((attempt.finishedAt ?? Date.now()) - attempt.startedAt) / 1000) || 0
    });

    return result;
  }

  private drawStratified(): TheoryQuestion[] {
    const categories: Category[] = this.theoryData.categories();
    const allQuestions = this.theoryData.questions();
    const perCategory = Math.floor(MOCK_TOTAL / Math.max(categories.length, 1));

    const picked: TheoryQuestion[] = [];
    const pickedIds = new Set<string>();

    for (const cat of categories) {
      const pool = allQuestions.filter((q) => q.category === cat.id);
      for (const q of sample(pool, Math.min(perCategory, pool.length))) {
        picked.push(q);
        pickedIds.add(q.id);
      }
    }

    const remainingPool = allQuestions.filter((q) => !pickedIds.has(q.id));
    const extraNeeded = Math.min(MOCK_TOTAL - picked.length, remainingPool.length);
    picked.push(...sample(remainingPool, extraNeeded));

    return shuffle(picked).slice(0, MOCK_TOTAL);
  }

  private persist(): void {
    const a = this.attempt();
    if (a) this.storage.set(ATTEMPT_KEY, a);
  }
}
