import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { TheoryDataService } from '../../core/services/theory-data.service';
import { TheoryStatsService } from '../../core/services/theory-stats.service';
import { toneColor } from '../../core/utils';

addIcons({ 'chevron-forward-outline': chevronForwardOutline });

interface CategoryRow {
  id: string;
  name: string;
  count: number;
  pct: number | null;
  seen: number;
  correct: number;
}

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonIcon
  ]
})
export class CategoryListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly theoryData = inject(TheoryDataService);
  private readonly theoryStats = inject(TheoryStatsService);

  readonly mode = (this.route.snapshot.data['mode'] as 'read' | 'quiz') ?? 'read';
  readonly title = this.mode === 'read' ? 'Theory Categories' : 'Category Quiz';
  readonly intro =
    this.mode === 'read'
      ? 'Browse every question and its answer, side by side — no scoring, no pressure.'
      : 'Pick a category to answer 10 random questions with instant feedback.';

  readonly rows = computed<CategoryRow[]>(() => {
    const stats = this.theoryStats.categoryStats();
    return this.theoryData.categories().map((cat) => {
      const s = stats[cat.id];
      const pct = s && s.seen > 0 ? Math.round((s.correct / s.seen) * 100) : null;
      return {
        id: cat.id,
        name: cat.name,
        count: this.theoryData.questionCountFor(cat.id),
        pct,
        seen: s?.seen ?? 0,
        correct: s?.correct ?? 0
      };
    });
  });

  toneColor = toneColor;

  open(categoryId: string): void {
    this.router.navigate([categoryId], { relativeTo: this.route });
  }
}
