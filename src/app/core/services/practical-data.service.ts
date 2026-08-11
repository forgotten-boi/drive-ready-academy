import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay } from 'rxjs';
import { ChecklistSection, ShowMeTellMeCard, TestCentre } from '../models/practical.model';

/** Loads the practical-test content (flashcards, centres, checklist) from the common data folder. */
@Injectable({ providedIn: 'root' })
export class PracticalDataService {
  private readonly http = inject(HttpClient);

  private readonly flashcards$ = this.http
    .get<ShowMeTellMeCard[]>('assets/data/flashcards.json')
    .pipe(shareReplay(1));

  private readonly centres$ = this.http
    .get<TestCentre[]>('assets/data/centres.json')
    .pipe(shareReplay(1));

  private readonly checklist$ = this.http
    .get<ChecklistSection[]>('assets/data/checklist.json')
    .pipe(shareReplay(1));

  readonly flashcards = toSignal(this.flashcards$, { initialValue: [] as ShowMeTellMeCard[] });
  readonly centres = toSignal(this.centres$, { initialValue: [] as TestCentre[] });
  readonly checklist = toSignal(this.checklist$, { initialValue: [] as ChecklistSection[] });

  regions(): string[] {
    const seen = new Set<string>();
    const regions: string[] = [];
    for (const centre of this.centres()) {
      if (!seen.has(centre.region)) {
        seen.add(centre.region);
        regions.push(centre.region);
      }
    }
    return regions.sort();
  }

  checklistItemCount(): number {
    return this.checklist().reduce((sum, section) => sum + section.items.length, 0);
  }
}
