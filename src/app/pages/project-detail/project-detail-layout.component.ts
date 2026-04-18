import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-project-detail-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-detail-layout.component.html',
  styleUrls: ['./project-detail-layout.component.scss']
})
export class ProjectDetailLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  
  projectId: string | null = null;
  isLoading = signal<boolean>(true);
  project = signal<Project | null>(null);

  tabs = [
    { name: 'Overview', path: 'overview' },
    { name: 'Scans', path: 'scans' },
    { name: 'Reports', path: 'reports' },
    { name: 'Compare', path: 'compare' },
    { name: 'Alerts', path: 'alerts' },
    { name: 'Settings', path: 'settings' }
  ];

  ngOnInit() {
    // 1. Listen for route changes
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.fetchProject(this.projectId);
      } else {
        this.router.navigate(['/projects']);
      }
    });

    // 2. Sync with service state (updates from child views)
    this.projectService.currentProject$.subscribe(proj => {
      if (proj) {
        this.project.set(proj);
      }
    });
  }

  fetchProject(id: string) {
    this.isLoading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching project:', err);
        this.isLoading.set(false);
      }
    });
  }
}
