export interface Category {
  id: string;
  name: string;
}

export interface TheoryQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CategoryStat {
  seen: number;
  correct: number;
}

export type CategoryStatsMap = Record<string, CategoryStat>;

export interface CategoryBreakdownEntry {
  correct: number;
  total: number;
}

export interface MockAttemptResult {
  date: string;
  score: number;
  total: number;
  pass: boolean;
  breakdown: Record<string, CategoryBreakdownEntry>;
  durationSeconds: number;
}

/** In-progress (or just-finished) timed mock test state. */
export interface MockAttempt {
  questionIds: string[];
  answers: Record<string, number>;
  flagged: string[];
  currentIndex: number;
  startedAt: number;
  endsAt: number;
  submitted: boolean;
  finishedAt: number | null;
  score: number | null;
}
