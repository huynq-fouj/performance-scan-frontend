import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, CreateProjectModalComponent, ProjectCardComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private platformId = inject(PLATFORM_ID);

  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  isCreateModalOpen = signal<boolean>(false);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading.set(true);
    this.projectService.getProjects()
    .pipe(finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (response) => {
        const data = (response.status === 'success' && response.data) ? response.data : (response as any || []);
        this.projects.set(data);
      },
      error: (err) => {
        console.error('Error loading projects', err);
        this.error.set('Failed to load projects. Please try again later.');
      }
    });
  }

  openCreateModal() {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  onProjectCreated(newProj?: Project) {
    if (newProj) {
      this.projects.update(p => [newProj, ...p]);
    } else {
      this.loadProjects();
    }
    this.closeCreateModal();
  }
}

