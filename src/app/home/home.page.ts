import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { schoolOutline, checkmarkDoneCircleOutline, locationOutline } from 'ionicons/icons';
import { TheoryStatsService } from '../core/services/theory-stats.service';
import { PracticalStateService } from '../core/services/practical-state.service';
import { PracticalDataService } from '../core/services/practical-data.service';
import { MOCK_PASS_MARK } from '../core/services/mock-test.service';

addIcons({
  'school-outline': schoolOutline,
  'checkmark-done-circle-outline': checkmarkDoneCircleOutline,
  'location-outline': locationOutline
});

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class HomePage {
  readonly theoryStats = inject(TheoryStatsService);
  readonly practicalState = inject(PracticalStateService);
  readonly practicalData = inject(PracticalDataService);

  readonly passMark = MOCK_PASS_MARK;

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  readonly checklistTotal = computed(() => this.practicalData.checklistItemCount());
  readonly checklistDone = computed(() => this.practicalState.checklistDoneCount());
}
