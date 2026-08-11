import { Component } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  readerOutline,
  eyeOutline,
  chatbubbleEllipsesOutline,
  listOutline,
  chevronForwardOutline
} from 'ionicons/icons';

addIcons({
  'reader-outline': readerOutline,
  'eye-outline': eyeOutline,
  'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
  'list-outline': listOutline,
  'chevron-forward-outline': chevronForwardOutline
});

@Component({
  selector: 'app-study-hub',
  templateUrl: './study-hub.page.html',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon]
})
export class StudyHubPage {}
