import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay } from 'rxjs';
import { Category, TheoryQuestion } from '../models/theory.model';

/**
 * Loads the shared theory content (public/assets/data/{categories,questions}.json)
 * once per app session and exposes it as signals. Both files live in the
 * same common data folder the web app's content was converted from, so
 * adding a question or category there is the only step needed to have it
 * show up here too.
 */
@Injectable({ providedIn: 'root' })
export class TheoryDataService {
  private readonly http = inject(HttpClient);

  private readonly categories$ = this.http
    .get<Category[]>('assets/data/categories.json')
    .pipe(shareReplay(1));

  private readonly questions$ = this.http
    .get<TheoryQuestion[]>('assets/data/questions.json')
    .pipe(shareReplay(1));

  readonly categories = toSignal(this.categories$, { initialValue: [] as Category[] });
  readonly questions = toSignal(this.questions$, { initialValue: [] as TheoryQuestion[] });

  categoryName(categoryId: string): string {
    return this.categories().find((c) => c.id === categoryId)?.name ?? categoryId;
  }

  questionsFor(categoryId: string): TheoryQuestion[] {
    return this.questions().filter((q) => q.category === categoryId);
  }

  questionCountFor(categoryId: string): number {
    return this.questionsFor(categoryId).length;
  }

  questionById(id: string): TheoryQuestion | undefined {
    return this.questions().find((q) => q.id === id);
  }
}
