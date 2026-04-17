import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss'
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: Project;

  getScoreClass(score: number): string {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-500';
  }
}
