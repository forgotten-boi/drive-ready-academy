import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'ui:themeMode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Declared first: field initializers below run in declaration order and
  // read from this, so it must exist before them.
  private readonly storage = inject(StorageService);

  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');

  readonly mode = signal<ThemeMode>(this.storage.get<ThemeMode>(THEME_KEY, 'system'));
  readonly systemPrefersDark = signal<boolean>(this.media.matches);

  /** What actually gets applied, resolving 'system' against the live OS preference. */
  readonly isDark = computed(() => {
    const mode = this.mode();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return this.systemPrefersDark();
  });

  constructor() {
    this.media.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));

    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('ion-palette-dark', dark);
      void this.syncStatusBar(dark);
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.storage.set(THEME_KEY, mode);
  }

  /** No-ops safely on the web — only touches the native status bar inside a Capacitor shell. */
  private async syncStatusBar(isDark: boolean): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch {
      // Status bar plugin not available in this context — safe to ignore.
    }
  }
}
