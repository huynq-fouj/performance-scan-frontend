import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { Project } from '../../../../core/models/project.model';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);

  project = signal<Project | null>(null);
  isScanning = signal<boolean>(false);

  ngOnInit() {
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
    });
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  getScoreLabel(score: number | undefined): string {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  }

  getStatusInfo(project: Project): { label: string; class: string; icon: string } {
    if (!project.isActive) {
      return { label: 'Inactive', class: 'status-inactive', icon: 'pause' };
    }
    if (!project.lastScanAt) {
      return { label: 'Pending Scan', class: 'status-pending', icon: 'clock' };
    }
    if ((project.lastScore ?? 0) >= 90) {
      return { label: 'Healthy', class: 'status-healthy', icon: 'check' };
    }
    if ((project.lastScore ?? 0) >= 50) {
      return { label: 'Needs Attention', class: 'status-warning', icon: 'alert' };
    }
    return { label: 'Critical', class: 'status-critical', icon: 'x' };
  }

  runScan() {
    this.isScanning.set(true);
    // TODO: Call real scan API when available
    setTimeout(() => {
      this.isScanning.set(false);
    }, 3000);
  }

  getTimeSince(date: string | Date | undefined): string {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }
}
