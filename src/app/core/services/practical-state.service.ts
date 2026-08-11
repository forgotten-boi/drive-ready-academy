import { Injectable, computed, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { FlashcardRating } from '../models/practical.model';

const CHECKLIST_KEY = 'practical:checklistState';
const RATINGS_KEY = 'practical:flashcardRatings';

/** Persisted state for the practical checklist ticks and flashcard self-ratings. */
@Injectable({ providedIn: 'root' })
export class PracticalStateService {
  private readonly storage = inject(StorageService);

  readonly checklistState = signal<Record<string, boolean>>(
    this.storage.get<Record<string, boolean>>(CHECKLIST_KEY, {})
  );
  readonly flashcardRatings = signal<Record<string, FlashcardRating>>(
    this.storage.get<Record<string, FlashcardRating>>(RATINGS_KEY, {})
  );

  readonly checklistDoneCount = computed(
    () => Object.values(this.checklistState()).filter(Boolean).length
  );

  setChecklistItem(id: string, checked: boolean): void {
    const state = { ...this.checklistState(), [id]: checked };
    this.checklistState.set(state);
    this.storage.set(CHECKLIST_KEY, state);
  }

  resetChecklist(): void {
    this.storage.remove(CHECKLIST_KEY);
    this.checklistState.set({});
  }

  rateFlashcard(id: string, rating: FlashcardRating): void {
    const ratings = { ...this.flashcardRatings(), [id]: rating };
    this.flashcardRatings.set(ratings);
    this.storage.set(RATINGS_KEY, ratings);
  }

  resetFlashcardRatings(): void {
    this.storage.remove(RATINGS_KEY);
    this.flashcardRatings.set({});
  }
}
