export type FlashcardType = 'tell-me' | 'show-me';

export interface ShowMeTellMeCard {
  id: string;
  type: FlashcardType;
  question: string;
  answer: string;
}

export type FlashcardRating = 'known' | 'learning';

export interface TestCentre {
  id: string;
  name: string;
  region: string;
  town: string;
  postcode: string;
  address: string;
  roadFeatures: string[];
  notes: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  note: string;
}

export interface ChecklistSection {
  id: string;
  section: string;
  items: ChecklistItem[];
}
