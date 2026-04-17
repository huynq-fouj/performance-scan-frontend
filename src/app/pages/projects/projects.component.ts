import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateProjectModalComponent } from './components/create-project-modal/create-project-modal.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, CreateProjectModalComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  isCreateModalOpen = signal<boolean>(false);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.isLoading.set(true);
    this.projectService.getProjects().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data) {
          this.projects.set(response.data);
        } else {
          this.projects.set((response as any) || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading projects', err);
        this.setMockData();
        this.isLoading.set(false);
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

  getScoreClass(score: number): string {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  }

  private setMockData() {
    this.projects.set([
      { id: '1', name: 'E-Commerce Platform', description: 'Main shopping portal frontend', status: 'active', url: 'shop.example.com', score: 92, lastScanDate: new Date().toISOString(), issuesCount: 2 },
      { id: '2', name: 'Internal Dashboard', description: 'Admin management interface', status: 'warning', url: 'admin.example.com', score: 71, lastScanDate: new Date(Date.now() - 86400000).toISOString(), issuesCount: 15 }
    ]);
  }
}
