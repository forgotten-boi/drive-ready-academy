import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { helpCircleOutline, timerOutline, chevronForwardOutline } from 'ionicons/icons';
import { MockTestService, MOCK_PASS_MARK, MOCK_TOTAL } from '../../core/services/mock-test.service';

addIcons({
  'help-circle-outline': helpCircleOutline,
  'timer-outline': timerOutline,
  'chevron-forward-outline': chevronForwardOutline
});

@Component({
  selector: 'app-practice-hub',
  templateUrl: './practice-hub.page.html',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge]
})
export class PracticeHubPage {
  readonly mockTest = inject(MockTestService);
  readonly passMark = MOCK_PASS_MARK;
  readonly total = MOCK_TOTAL;
}
