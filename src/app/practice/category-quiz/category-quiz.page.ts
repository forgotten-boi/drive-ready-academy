import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonCardContent
} from '@ionic/angular/standalone';
import { TheoryDataService } from '../../core/services/theory-data.service';
import { TheoryStatsService } from '../../core/services/theory-stats.service';
import { HapticsService } from '../../core/services/haptics.service';
import { TheoryQuestion } from '../../core/models/theory.model';
import { sample, toneColor } from '../../core/utils';

const SESSION_LENGTH = 10;

@Component({
  selector: 'app-category-quiz',
  templateUrl: './category-quiz.page.html',
  styleUrl: './category-quiz.page.scss',
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
    IonCardContent
  ]
})
export class CategoryQuizPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly theoryData = inject(TheoryDataService);
  private readonly theoryStats = inject(TheoryStatsService);
  private readonly haptics = inject(HapticsService);

  readonly toneColor = toneColor;

  readonly categoryId = this.route.snapshot.paramMap.get('categoryId') ?? '';
  readonly categoryName = computed(() => this.theoryData.categoryName(this.categoryId));

  readonly sessionQuestions = signal<TheoryQuestion[]>([]);
  readonly index = signal(0);
  readonly selected = signal<number | null>(null);
  readonly checked = signal(false);
  readonly score = signal(0);
  readonly missed = signal<TheoryQuestion[]>([]);
  readonly finished = signal(false);

  readonly current = computed<TheoryQuestion | null>(() => {
    const list = this.sessionQuestions();
    const i = this.index();
    return i < list.length ? list[i] : null;
  });

  readonly isLast = computed(() => this.index() === this.sessionQuestions().length - 1);
  readonly pct = computed(() => {
    const total = this.sessionQuestions().length;
    return total > 0 ? Math.round((this.score() / total) * 100) : 0;
  });

  constructor() {
    // The question bank loads over HTTP, so it may not be ready the
    // instant this page is constructed — start the first session
    // reactively once it is, rather than racing it in the constructor.
    effect(() => {
      if (this.theoryData.questionsFor(this.categoryId).length > 0 && this.sessionQuestions().length === 0) {
        this.startSession();
      }
    });
  }

  startSession(): void {
    const pool = this.theoryData.questionsFor(this.categoryId);
    this.sessionQuestions.set(sample(pool, Math.min(SESSION_LENGTH, pool.length)));
    this.index.set(0);
    this.selected.set(null);
    this.checked.set(false);
    this.score.set(0);
    this.missed.set([]);
    this.finished.set(false);
  }

  select(optionIndex: number): void {
    if (this.checked()) return;
    this.selected.set(optionIndex);
  }

  check(): void {
    const q = this.current();
    const sel = this.selected();
    if (!q || sel === null || this.checked()) return;

    this.checked.set(true);
    const wasCorrect = sel === q.correctIndex;
    if (wasCorrect) {
      this.score.update((s) => s + 1);
      void this.haptics.success();
    } else {
      this.missed.update((m) => [...m, q]);
      void this.haptics.error();
    }

    this.theoryStats.recordAnswer(q.category, wasCorrect);
  }

  next(): void {
    if (this.isLast()) {
      this.finished.set(true);
      return;
    }
    this.index.update((i) => i + 1);
    this.selected.set(null);
    this.checked.set(false);
  }

  backToCategories(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }
}
