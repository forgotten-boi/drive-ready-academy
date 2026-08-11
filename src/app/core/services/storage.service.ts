import { Injectable } from '@angular/core';

/**
 * Thin localStorage wrapper, namespaced and versioned so app state never
 * collides with anything else and a future schema change can be detected.
 *
 * Deliberately localStorage rather than sessionStorage: this is a mobile
 * app the user opens and closes repeatedly, not a browser tab — wiping
 * quiz progress and checklist ticks every time the app is reopened would
 * be a real regression from the web version, not just a style choice.
 */
const PREFIX = 'ukDrivingPrep::v1::';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly memoryFallback = new Map<string, string>();
  private readonly storageOk = this.testStorage();

  private testStorage(): boolean {
    try {
      const key = PREFIX + '__test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, fallback: T): T {
    const raw = this.storageOk
      ? window.localStorage.getItem(PREFIX + key)
      : this.memoryFallback.get(key);
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (this.storageOk) {
      window.localStorage.setItem(PREFIX + key, raw);
    } else {
      this.memoryFallback.set(key, raw);
    }
  }

  remove(key: string): void {
    if (this.storageOk) {
      window.localStorage.removeItem(PREFIX + key);
    } else {
      this.memoryFallback.delete(key);
    }
  }

  /** Clears every key this app owns, without touching anything else on the origin. */
  resetAll(): void {
    if (this.storageOk) {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => window.localStorage.removeItem(k));
    } else {
      this.memoryFallback.clear();
    }
  }
}
