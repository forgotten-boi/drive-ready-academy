import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonCard,
  IonCardContent,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shuffleOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { PracticalDataService } from '../../core/services/practical-data.service';
import { PracticalStateService } from '../../core/services/practical-state.service';
import { HapticsService } from '../../core/services/haptics.service';
import { shuffle } from '../../core/utils';
import { FlashcardRating } from '../../core/models/practical.model';

addIcons({
  'shuffle-outline': shuffleOutline,
  'chevron-back-outline': chevronBackOutline,
  'chevron-forward-outline': chevronForwardOutline
});

@Component({
  selector: 'app-flashcards',
  templateUrl: './flashcards.page.html',
  styleUrl: './flashcards.page.scss',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonCard,
    IonCardContent
  ]
})
export class FlashcardsPage {
  private readonly alertController = inject(AlertController);
  private readonly haptics = inject(HapticsService);

  readonly data = inject(PracticalDataService);
  readonly state = inject(PracticalStateService);

  readonly deckOrder = signal<string[]>([]);
  readonly index = signal(0);
  readonly revealed = signal(false);

  constructor() {
    // Side effect (shuffling into `deckOrder` once the data has loaded)
    // belongs in an effect, not a computed — computeds must stay pure.
    effect(() => {
      const cards = this.data.flashcards();
      if (cards.length > 0 && this.deckOrder().length === 0) {
        this.deckOrder.set(shuffle(cards.map((c) => c.id)));
      }
    });
  }

  readonly current = computed(() => {
    const cards = this.data.flashcards();
    const order = this.deckOrder();
    if (order.length === 0) return null;
    const id = order[this.index()];
    return cards.find((c) => c.id === id) ?? null;
  });

  readonly counts = computed(() => {
    const ratings = this.state.flashcardRatings();
    const cards = this.data.flashcards();
    let known = 0;
    let learning = 0;
    for (const card of cards) {
      if (ratings[card.id] === 'known') known += 1;
      else if (ratings[card.id] === 'learning') learning += 1;
    }
    return { known, learning, notReviewed: cards.length - known - learning };
  });

  currentRating(): FlashcardRating | undefined {
    const card = this.current();
    return card ? this.state.flashcardRatings()[card.id] : undefined;
  }

  reveal(): void {
    this.revealed.set(!this.revealed());
  }

  rate(rating: FlashcardRating): void {
    const card = this.current();
    if (!card) return;
    this.state.rateFlashcard(card.id, rating);
    void this.haptics.selection();
    this.next();
  }

  next(): void {
    const order = this.deckOrder();
    if (order.length === 0) return;
    this.index.set((this.index() + 1) % order.length);
    this.revealed.set(false);
  }

  previous(): void {
    const order = this.deckOrder();
    if (order.length === 0) return;
    this.index.set((this.index() - 1 + order.length) % order.length);
    this.revealed.set(false);
  }

  shuffleDeck(): void {
    this.deckOrder.set(shuffle(this.data.flashcards().map((c) => c.id)));
    this.index.set(0);
    this.revealed.set(false);
  }

  async confirmReset(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Reset ratings?',
      message: "Clears all 'known' / 'still learning' marks for these flashcards.",
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reset', role: 'destructive', handler: () => this.state.resetFlashcardRatings() }
      ]
    });
    await alert.present();
  }
}
