import { Component, inject, signal, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { Project } from '../../../../core/models/project.model';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);

  project = signal<Project | null>(null);
  isScanning = signal<boolean>(false);
  
  private pollInterval: any;

  ngOnInit() {
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
      if (proj) {
        this.checkInitialScanStatus(proj.id);
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  checkInitialScanStatus(projectId: string) {
    this.scanService.getScans(projectId).subscribe(res => {
      const scans = res.data;
      if (scans && scans.length > 0) {
        const latest = scans[0];
        if (latest.status === 'queued' || latest.status === 'running') {
          this.isScanning.set(true);
          this.startPolling(projectId);
        }
      }
    });
  }

  startPolling(projectId: string) {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.scanService.getScans(projectId).subscribe(res => {
        const scans = res.data;
        if (scans && scans.length > 0) {
          const latest = scans[0];
          if (latest.status === 'success' || latest.status === 'failed') {
            this.isScanning.set(false);
            this.stopPolling();
            // Refresh project data to reflect new scores
            this.projectService.getProject(projectId).subscribe();
          }
        }
      });
    }, 3000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
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
    const p = this.project();
    if (!p || this.isScanning()) return;

    this.isScanning.set(true);
    this.scanService.createScan({ projectId: p.id }).subscribe({
      next: () => {
        this.startPolling(p.id);
      },
      error: (err) => {
        console.error('Failed to trigger scan:', err);
        this.isScanning.set(false);
      }
    });
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
