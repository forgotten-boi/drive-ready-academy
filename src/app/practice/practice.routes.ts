import { Routes } from '@angular/router';

/** Scored, pressure-on tools — category quiz and the timed mock test. */
export const PRACTICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./practice-hub/practice-hub.page').then((m) => m.PracticeHubPage)
  },
  {
    path: 'quiz',
    data: { mode: 'quiz' },
    loadComponent: () => import('../study/category-list/category-list.page').then((m) => m.CategoryListPage)
  },
  {
    path: 'quiz/:categoryId',
    loadComponent: () => import('./category-quiz/category-quiz.page').then((m) => m.CategoryQuizPage)
  },
  {
    path: 'mock-test',
    loadComponent: () => import('./mock-test/mock-test.page').then((m) => m.MockTestPage)
  }
];
