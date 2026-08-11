import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  homeSharp,
  schoolOutline,
  schoolSharp,
  checkmarkDoneCircleOutline,
  checkmarkDoneCircleSharp,
  locationOutline,
  locationSharp,
  statsChartOutline,
  statsChartSharp
} from 'ionicons/icons';

addIcons({
  'home-outline': homeOutline,
  'home-sharp': homeSharp,
  'school-outline': schoolOutline,
  'school-sharp': schoolSharp,
  'checkmark-done-circle-outline': checkmarkDoneCircleOutline,
  'checkmark-done-circle-sharp': checkmarkDoneCircleSharp,
  'location-outline': locationOutline,
  'location-sharp': locationSharp,
  'stats-chart-outline': statsChartOutline,
  'stats-chart-sharp': statsChartSharp
});

@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.page.html'
})
export class TabsPage {}
