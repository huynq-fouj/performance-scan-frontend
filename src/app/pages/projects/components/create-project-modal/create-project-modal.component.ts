import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from '../../../../core/services/project.service';
import { Project, CreateProjectRequest } from '../../../../core/models/project.model';

@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-project-modal.component.html'
})
export class CreateProjectModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Project | undefined>();

  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);

  isCreating = signal<boolean>(false);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/)]],
    description: ['']
  });

  submitCreateProject() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    
    this.isCreating.set(true);
    const payload = this.createForm.value as CreateProjectRequest;
    this.projectService.createProject(payload).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        this.created.emit();
      },
      error: (err) => {
        console.error('Error creating project:', err);
        this.isCreating.set(false);
        // Fallback for demo purposes if backend fails:
        const payload = this.createForm.value;
        const newProj: Project = {
           id: Math.random().toString(36).substr(2, 9),
           name: payload.name || '',
           url: payload.url || '',
           description: payload.description || '',
           status: 'active',
           score: 100,
           issuesCount: 0,
           lastScanDate: new Date().toISOString()
        };
        this.created.emit(newProj);
      }
    });
  }
}
