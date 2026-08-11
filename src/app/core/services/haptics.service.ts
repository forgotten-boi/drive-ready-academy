import { Injectable } from '@angular/core';

/**
 * Tasteful, best-effort haptic feedback — no-ops silently on the web, only
 * fires inside a real Capacitor shell. Kept to a few meaningful moments
 * (answering right/wrong, a rating tap) rather than buzzing on everything.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  async success(): Promise<void> {
    await this.run(async () => {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Success });
    });
  }

  async error(): Promise<void> {
    await this.run(async () => {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      await Haptics.notification({ type: NotificationType.Error });
    });
  }

  async selection(): Promise<void> {
    await this.run(async () => {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    });
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;
      await fn();
    } catch {
      // Haptics plugin unavailable — safe to ignore.
    }
  }
}
