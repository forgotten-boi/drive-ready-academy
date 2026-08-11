import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'study',
        loadChildren: () => import('./study/study.routes').then((m) => m.STUDY_ROUTES)
      },
      {
        path: 'practice',
        loadChildren: () => import('./practice/practice.routes').then((m) => m.PRACTICE_ROUTES)
      },
      {
        path: 'centres',
        loadComponent: () => import('./centres/centres.page').then((m) => m.CentresPage)
      },
      {
        path: 'progress',
        loadComponent: () => import('./progress/progress.page').then((m) => m.ProgressPage)
      }
    ]
  },
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/home' }
];
