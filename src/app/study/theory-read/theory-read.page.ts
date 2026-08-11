import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonBadge
} from '@ionic/angular/standalone';
import { TheoryDataService } from '../../core/services/theory-data.service';

@Component({
  selector: 'app-theory-read',
  templateUrl: './theory-read.page.html',
  styleUrl: './theory-read.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonBadge
  ]
})
export class TheoryReadPage {
  private readonly route = inject(ActivatedRoute);
  readonly theoryData = inject(TheoryDataService);

  private readonly categoryId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('categoryId') ?? '')),
    { initialValue: '' }
  );

  readonly categoryName = computed(() => this.theoryData.categoryName(this.categoryId()));
  readonly questions = computed(() => this.theoryData.questionsFor(this.categoryId()));

  optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
