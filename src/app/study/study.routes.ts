import { Routes } from '@angular/router';

/** Reading and study tools — no scoring, no time pressure. */
export const STUDY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./study-hub/study-hub.page').then((m) => m.StudyHubPage)
  },
  {
    path: 'theory-categories',
    data: { mode: 'read' },
    loadComponent: () => import('./category-list/category-list.page').then((m) => m.CategoryListPage)
  },
  {
    path: 'theory-categories/:categoryId',
    loadComponent: () => import('./theory-read/theory-read.page').then((m) => m.TheoryReadPage)
  },
  {
    path: 'hazard-perception',
    loadComponent: () =>
      import('./hazard-perception/hazard-perception.page').then((m) => m.HazardPerceptionPage)
  },
  {
    path: 'flashcards',
    loadComponent: () => import('./flashcards/flashcards.page').then((m) => m.FlashcardsPage)
  },
  {
    path: 'checklist',
    loadComponent: () => import('./checklist/checklist.page').then((m) => m.ChecklistPage)
  }
];
