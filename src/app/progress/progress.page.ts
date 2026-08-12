import { Component, computed, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonProgressBar,
  IonBadge,
  IonButton,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sunnyOutline, moonOutline, phonePortraitOutline } from 'ionicons/icons';
import { TheoryStatsService } from '../core/services/theory-stats.service';
import { PracticalStateService } from '../core/services/practical-state.service';
import { TheoryDataService } from '../core/services/theory-data.service';
import { ThemeService, ThemeMode } from '../core/services/theme.service';
import { toneColor } from '../core/utils';
import { SUPPORT_LINK } from '../core/config/support.config';

addIcons({
  'sunny-outline': sunnyOutline,
  'moon-outline': moonOutline,
  'phone-portrait-outline': phonePortraitOutline
});

interface CategoryRow {
  id: string;
  name: string;
  seen: number;
  correct: number;
  pct: number | null;
}

@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonList,
    IonListHeader,
    IonItem,
    IonProgressBar,
    IonBadge,
    IonButton
  ]
})
export class ProgressPage {
  private readonly alertController = inject(AlertController);

  readonly theme = inject(ThemeService);
  readonly theoryStats = inject(TheoryStatsService);
  readonly practicalState = inject(PracticalStateService);
  private readonly theoryData = inject(TheoryDataService);

  toneColor = toneColor;
  readonly supportLink = SUPPORT_LINK;

  readonly categoryRows = computed<CategoryRow[]>(() => {
    const stats = this.theoryStats.categoryStats();
    const rows = this.theoryData.categories().map((cat) => {
      const s = stats[cat.id];
      return {
        id: cat.id,
        name: cat.name,
        seen: s?.seen ?? 0,
        correct: s?.correct ?? 0,
        pct: s && s.seen > 0 ? Math.round((s.correct / s.seen) * 100) : null
      };
    });
    return rows.sort((a, b) => {
      if (a.pct === null && b.pct === null) return 0;
      if (a.pct === null) return 1;
      if (b.pct === null) return -1;
      return a.pct - b.pct;
    });
  });

  readonly mockHistoryDesc = computed(() => [...this.theoryStats.mockHistory()].reverse());

  onThemeChange(mode: string | number | undefined): void {
    if (typeof mode === 'string') this.theme.setMode(mode as ThemeMode);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    );
  }

  async confirmResetProgress(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reset all progress?',
      message: 'Clears every category score and mock test result. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reset', role: 'destructive', handler: () => this.theoryStats.resetAll() }
      ]
    });
    await alert.present();
  }

  async confirmResetEverything(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reset everything?',
      message: 'Clears theory progress, mock history, checklist ticks and flashcard ratings. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reset all',
          role: 'destructive',
          handler: () => {
            this.theoryStats.resetAll();
            this.practicalState.resetChecklist();
            this.practicalState.resetFlashcardRatings();
          }
        }
      ]
    });
    await alert.present();
  }
}
