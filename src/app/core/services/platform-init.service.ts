import { Injectable } from '@angular/core';

/**
 * One-off native platform setup — safe no-op on the web. Kept separate
 * from ThemeService so "make the status bar match the theme" and
 * "configure how the keyboard resizes the view" stay independent
 * concerns even though both only matter under Capacitor.
 */
@Injectable({ providedIn: 'root' })
export class PlatformInitService {
  constructor() {
    void this.configureKeyboard();
  }

  private async configureKeyboard(): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
      // 'Native' defers to the OS's own resize behaviour, which plays more
      // predictably with Ionic's own keyboard-aware scrolling than forcing
      // Capacitor to resize the WebView body itself. Relevant wherever text
      // input opens the keyboard — right now, the centre finder's search bar.
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch {
      // Keyboard plugin unavailable — safe to ignore on web.
    }
  }
}
