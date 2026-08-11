import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { CategoryStatsMap, MockAttemptResult } from '../models/theory.model';

const STATS_KEY = 'theory:categoryStats';
const HISTORY_KEY = 'theory:mockHistory';

/**
 * Cumulative theory progress, shared by category practice and the mock
 * test. Exposed as signals rather than plain getters so every page
 * (Home's quick stats, the Progress tab, category badges in Study) stays
 * in sync automatically the moment an answer is recorded anywhere in the
 * app — no manual "refresh on tab focus" needed like the web version.
 */
@Injectable({ providedIn: 'root' })
export class TheoryStatsService {
  private readonly storage = inject(StorageService);

  readonly categoryStats = signal<CategoryStatsMap>(this.storage.get<CategoryStatsMap>(STATS_KEY, {}));
  readonly mockHistory = signal<MockAttemptResult[]>(this.storage.get<MockAttemptResult[]>(HISTORY_KEY, []));

  readonly totalSeen = computed(() =>
    Object.values(this.categoryStats()).reduce((sum, s) => sum + s.seen, 0)
  );
  readonly totalCorrect = computed(() =>
    Object.values(this.categoryStats()).reduce((sum, s) => sum + s.correct, 0)
  );
  readonly overallPct = computed(() => {
    const seen = this.totalSeen();
    return seen > 0 ? Math.round((this.totalCorrect() / seen) * 100) : 0;
  });
  readonly hasAnyProgress = computed(() => this.totalSeen() > 0 || this.mockHistory().length > 0);
  readonly latestMockResult = computed(() => {
    const history = this.mockHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  });

  recordAnswer(category: string, wasCorrect: boolean): void {
    const stats = { ...this.categoryStats() };
    const current = stats[category] ?? { seen: 0, correct: 0 };
    stats[category] = { seen: current.seen + 1, correct: current.correct + (wasCorrect ? 1 : 0) };
    this.categoryStats.set(stats);
    this.storage.set(STATS_KEY, stats);
  }

  addMockResult(result: MockAttemptResult): void {
    const history = [...this.mockHistory(), result];
    this.mockHistory.set(history);
    this.storage.set(HISTORY_KEY, history);
  }

  resetAll(): void {
    this.storage.remove(STATS_KEY);
    this.storage.remove(HISTORY_KEY);
    this.categoryStats.set({});
    this.mockHistory.set([]);
  }
}
