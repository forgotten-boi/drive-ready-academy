import { Component, computed, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonBadge,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonIcon,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flagOutline, flag } from 'ionicons/icons';
import { MockTestService, MOCK_DURATION_SECONDS, MOCK_PASS_MARK, MOCK_TOTAL } from '../../core/services/mock-test.service';
import { TheoryDataService } from '../../core/services/theory-data.service';
import { HapticsService } from '../../core/services/haptics.service';
import { formatMMSS, toneColor } from '../../core/utils';

addIcons({ 'flag-outline': flagOutline, flag });

@Component({
  selector: 'app-mock-test',
  templateUrl: './mock-test.page.html',
  styleUrl: './mock-test.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonBadge,
    IonCard,
    IonCardContent,
    IonCheckbox,
    IonIcon
  ]
})
export class MockTestPage {
  private readonly alertController = inject(AlertController);

  readonly mockTest = inject(MockTestService);
  private readonly theoryData = inject(TheoryDataService);
  private readonly haptics = inject(HapticsService);

  readonly total = MOCK_TOTAL;
  readonly passMark = MOCK_PASS_MARK;
  readonly durationLabel = Math.round(MOCK_DURATION_SECONDS / 60);
  readonly toneColor = toneColor;

  readonly reviewIncorrectOnly = signal(false);

  readonly timerLabel = computed(() => formatMMSS(this.mockTest.remainingMs() / 1000));

  readonly navigatorItems = computed(() => {
    const a = this.mockTest.attempt();
    if (!a) return [];
    return a.questionIds.map((id, i) => ({
      id,
      index: i,
      answered: a.answers[id] !== undefined,
      flagged: a.flagged.includes(id),
      current: i === a.currentIndex
    }));
  });

  readonly breakdownRows = computed(() => {
    const result = this.mockTest.lastResult();
    if (!result) return [];
    return Object.entries(result.breakdown)
      .map(([categoryId, entry]) => ({
        categoryId,
        name: this.theoryData.categoryName(categoryId),
        correct: entry.correct,
        total: entry.total,
        pct: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly reviewItems = computed(() => {
    const a = this.mockTest.attempt();
    if (!a || !a.submitted) return [];
    const items = a.questionIds.map((id, i) => {
      const q = this.theoryData.questionById(id)!;
      const given = a.answers[id];
      const wasCorrect = given === q?.correctIndex;
      return { index: i, question: q, given, wasCorrect };
    });
    return this.reviewIncorrectOnly() ? items.filter((it) => !it.wasCorrect) : items;
  });

  gapMessage(score: number): string {
    const gap = this.passMark - score;
    if (gap <= 0) {
      const over = -gap;
      return `That clears the pass mark of ${this.passMark} by ${over} mark${over === 1 ? '' : 's'}.`;
    }
    return `You needed ${gap} more correct answer${gap === 1 ? '' : 's'} to reach the pass mark of ${this.passMark}/${this.total}.`;
  }

  timeUsedLabel(): string {
    const a = this.mockTest.attempt();
    if (!a || !a.finishedAt) return '';
    return formatMMSS((a.finishedAt - a.startedAt) / 1000);
  }

  async start(): Promise<void> {
    this.mockTest.startNew();
  }

  async trySubmit(): Promise<void> {
    const unanswered = this.mockTest.unansweredCount();
    if (unanswered === 0) {
      this.submitAndFeedback();
      return;
    }
    const alert = await this.alertController.create({
      header: 'Submit test?',
      message: `${unanswered} question${unanswered === 1 ? ' is' : 's are'} still unanswered.`,
      buttons: [
        { text: 'Keep going', role: 'cancel' },
        {
          text: 'Submit anyway',
          role: 'destructive',
          handler: () => {
            this.submitAndFeedback(true);
          }
        }
      ]
    });
    await alert.present();
  }

  private submitAndFeedback(force = false): void {
    const result = this.mockTest.submit(force);
    if (!result) return;
    void (result.pass ? this.haptics.success() : this.haptics.error());
  }

  async confirmAbandon(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Abandon this test?',
      message: 'Your answers so far will be lost.',
      buttons: [
        { text: 'Keep going', role: 'cancel' },
        { text: 'Abandon', role: 'destructive', handler: () => this.mockTest.abandon() }
      ]
    });
    await alert.present();
  }
}
