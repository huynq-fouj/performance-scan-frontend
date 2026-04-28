import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
      },
      {
        path: 'scans',
        loadComponent: () =>
          import('./pages/global-scans/global-scans.component').then(m => m.GlobalScansComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/global-reports/global-reports.component').then(m => m.GlobalReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./pages/project-detail/project-detail-layout.component').then(m => m.ProjectDetailLayoutComponent),
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./pages/project-detail/views/overview/overview.component').then(m => m.OverviewComponent)
          },
          {
            path: 'scans',
            loadComponent: () => import('./pages/project-detail/views/scans/scans.component').then(m => m.ScansComponent)
          },
          {
            path: 'reports',
            loadComponent: () => import('./pages/project-detail/views/reports/reports.component').then(m => m.ReportsComponent)
          },
          {
            path: 'compare',
            loadComponent: () => import('./pages/project-detail/views/compare/compare.component').then(m => m.CompareComponent)
          },
          {
            path: 'alerts',
            loadComponent: () => import('./pages/project-detail/views/alerts/alerts.component').then(m => m.AlertsComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./pages/project-detail/views/settings/settings.component').then(m => m.SettingsComponent)
          }
        ]
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
