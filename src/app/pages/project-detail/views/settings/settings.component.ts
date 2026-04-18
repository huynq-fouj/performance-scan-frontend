import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);

  projectId: string | null = null;
  project = signal<Project | null>(null);
  isLoading = signal<boolean>(!this.projectService.currentProjectValue);
  isSaving = signal<boolean>(false);
  isDeleting = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  settingsForm = this.fb.group({
    name: ['', { validators: [Validators.required, Validators.maxLength(100)], updateOn: 'change' }],
    url: ['', { 
      validators: [Validators.required, Validators.pattern(/^(https?:\/\/)?([^\s:/]+\.[^\s:/]+)(:\d+)?(\/.*)?$/)],
      updateOn: 'blur' 
    }],
    description: ['', { updateOn: 'blur' }],
    logo: ['', { 
      validators: [Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/[^\s]*)?$/)],
      updateOn: 'blur' 
    }]
  });

  ngOnInit() {
    // 1. Get Project ID
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.projectId = params.get('id');
    });

    // 2. Listen to project data updates
    this.projectService.currentProject$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(proj => {
      if (proj) {
        this.project.set(proj);
        this.settingsForm.patchValue({
          name: proj.name,
          url: proj.url,
          description: proj.description,
          logo: proj.logo || ''
        }, { emitEvent: false }); // Prevents potential infinite loop/unnecessary checks
        this.isLoading.set(false);
      } else if (!this.projectService.currentProjectValue) {
        // Only show loading if we really don't have data
        this.isLoading.set(true);
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
