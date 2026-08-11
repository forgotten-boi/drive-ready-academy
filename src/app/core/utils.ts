/** Fisher-Yates shuffle — returns a new array, never mutates the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Random sample of `count` items, without replacement. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function strengthTone(pct: number): 'strong' | 'medium' | 'weak' {
  if (pct >= 80) return 'strong';
  if (pct >= 50) return 'medium';
  return 'weak';
}

/** Ionic colour name for the given accuracy percentage — used for badges/bars. */
export function toneColor(pct: number): 'success' | 'warning' | 'danger' {
  const tone = strengthTone(pct);
  return tone === 'strong' ? 'success' : tone === 'medium' ? 'warning' : 'danger';
}
