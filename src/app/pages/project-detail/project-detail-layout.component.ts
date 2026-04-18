import { Component, inject, OnInit, PLATFORM_ID, signal, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { switchMap, of, tap, filter, finalize } from 'rxjs';

@Component({
  selector: 'app-project-detail-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-detail-layout.component.html',
  styleUrls: ['./project-detail-layout.component.scss']
})
export class ProjectDetailLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  
  projectId: string | null = null;
  isLoading = signal<boolean>(true);
  project = signal<Project | null>(null);

  tabs = [
    { name: 'Overview', path: 'overview' },
    { name: 'Scans', path: 'scans' },
    // { name: 'Reports', path: 'reports' },
    { name: 'Compare', path: 'compare' },
    { name: 'Alerts', path: 'alerts' },
    { name: 'Settings', path: 'settings' }
  ];

  ngOnInit() {
    // 1. Reactive Data Fetching (Cancels previous requests automatically)
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(params => {
        this.projectId = params.get('id');
        if (this.projectId && isPlatformBrowser(this.platformId)) {
          this.isLoading.set(true);
        }
      }),
      filter(params => !!params.get('id') && isPlatformBrowser(this.platformId)),
      switchMap(params => this.projectService.getProject(params.get('id')!).pipe(finalize(() => this.isLoading.set(false))))
    ).subscribe();

    // 2. Sync local signal with Global State
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
    });

    // 3. Cleanup on Destroy: Clear the global project state
    this.destroyRef.onDestroy(() => {
      this.projectService.setCurrentProject(null);
    });
  }
}
