import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import { Project, UpdateProjectRequest } from '../../../../core/models/project.model';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  projectId: string | null = null;
  project = signal<Project | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  settingsForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/)]],
    description: [''],
    logo: ['', [Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)]]
  });

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.fetchProject(this.projectId);
      }
    });
  }

  fetchProject(id: string) {
    this.isLoading.set(true);
    this.projectService.getProject(id).subscribe({
      next: (res) => {
        this.project.set(res.data);
        this.settingsForm.patchValue({
          name: res.data.name,
          url: res.data.url,
          description: res.data.description,
          logo: res.data.logo || ''
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching project:', err);
        this.isLoading.set(false);
      }
    });
  }

  saveSettings() {
    if (this.settingsForm.invalid || !this.projectId) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const payload = this.settingsForm.value as UpdateProjectRequest;
    this.projectService.updateProject(this.projectId, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        console.log('Project updated successfully');
      },
      error: (err) => {
        console.error('Error updating project:', err);
        this.isSaving.set(false);
      }
    });
  }

  deleteProject() {
    if (!this.projectId) return;

    this.isDeleting.set(true);
    this.projectService.deleteProject(this.projectId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/dashboard/projects']);
      },
      error: (err) => {
        console.error('Error deleting project:', err);
        this.isDeleting.set(false);
      }
    });
  }
}
