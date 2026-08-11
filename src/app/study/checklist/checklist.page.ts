import { Component, computed, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonProgressBar,
  IonButton,
  AlertController
} from '@ionic/angular/standalone';
import { PracticalDataService } from '../../core/services/practical-data.service';
import { PracticalStateService } from '../../core/services/practical-state.service';

@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonCheckbox,
      IonProgressBar,
    IonButton
  ]
})
export class ChecklistPage {
  private readonly alertController = inject(AlertController);

  readonly data = inject(PracticalDataService);
  readonly state = inject(PracticalStateService);

  readonly total = computed(() => this.data.checklistItemCount());
  readonly done = computed(() => this.state.checklistDoneCount());
  readonly pct = computed(() => (this.total() > 0 ? this.done() / this.total() : 0));

  isChecked(id: string): boolean {
    return !!this.state.checklistState()[id];
  }

  toggle(id: string, checked: boolean): void {
    this.state.setChecklistItem(id, checked);
  }

  async confirmReset(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reset checklist?',
      message: 'All ticks will be cleared.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reset', role: 'destructive', handler: () => this.state.resetChecklist() }
      ]
    });
    await alert.present();
  }
}
