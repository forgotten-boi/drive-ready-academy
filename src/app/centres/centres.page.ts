import { Component, computed, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge
} from '@ionic/angular/standalone';
import { PracticalDataService } from '../core/services/practical-data.service';

@Component({
  selector: 'app-centres',
  templateUrl: './centres.page.html',
  styleUrl: './centres.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge
  ]
})
export class CentresPage {
  readonly data = inject(PracticalDataService);

  readonly query = signal('');
  readonly region = signal<string>('all');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const qTight = q.replace(/\s+/g, '');
    const region = this.region();

    return this.data.centres().filter((centre) => {
      if (region !== 'all' && centre.region !== region) return false;
      if (!q) return true;
      return (
        centre.name.toLowerCase().includes(q) ||
        centre.town.toLowerCase().includes(q) ||
        centre.postcode.toLowerCase().replace(/\s+/g, '').includes(qTight) ||
        centre.address.toLowerCase().replace(/\s+/g, '').includes(qTight)
      );
    });
  });

  onSearch(value: string | null | undefined): void {
    this.query.set(value ?? '');
  }

  onRegionChange(value: string): void {
    this.region.set(value);
  }

  featureLabel(tag: string): string {
    return tag
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
