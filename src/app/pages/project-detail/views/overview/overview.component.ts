import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { Project } from '../../../../core/models/project.model';
import { ScanRecord } from '../../../../core/models/scan.model';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);

  project = signal<Project | null>(null);
  
  // Use shared scanning state
  isScanning = this.scanService.isScanning;
  
  // Latest scan for detailed metrics
  latestScan = signal<ScanRecord | null>(null);

  ngOnInit() {
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
      if (proj) {
        this.loadLatestScan(proj.id);
      }
    });

    // Refresh when scanning stops
    // We can use a simple effect or just subscribe to the signal indirectly
  }

  loadLatestScan(projectId: string) {
    this.scanService.getScans(projectId).subscribe(res => {
      if (res.data && res.data.length > 0) {
        // Find latest success scan
        const successScan = res.data.find(s => s.status === 'success');
        this.latestScan.set(successScan || res.data[0]);
      } else {
        this.latestScan.set(null);
      }
    });
  }

  getScoreClass(score: number | undefined | null): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  getScoreLabel(score: number | undefined | null): string {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Average';
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
        // Parent handle polling, we just wait.
      },
      error: (err) => {
        console.error('Failed to trigger scan:', err);
        this.isScanning.set(false);
      }
    });
  }

  stopScan() {
    this.isScanning.set(false);
  }

  getVitalsClass(type: 'lcp' | 'cls' | 'tbt', value: number | undefined | null): string {
    if (value === undefined || value === null) return 'score-na';
    
    if (type === 'lcp') {
      const seconds = value / 1000;
      if (seconds <= 2.5) return 'score-good';
      if (seconds <= 4.0) return 'score-average';
      return 'score-poor';
    }
    if (type === 'cls') {
      if (value <= 0.1) return 'score-good';
      if (value <= 0.25) return 'score-average';
      return 'score-poor';
    }
    if (type === 'tbt') {
      if (value <= 200) return 'score-good';
      if (value <= 600) return 'score-average';
      return 'score-poor';
    }
    return 'score-na';
  }

  getVitalsPercent(type: 'lcp' | 'cls' | 'tbt', value: number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    
    if (type === 'lcp') {
      // 0-8s scale
      const seconds = value / 1000;
      return Math.min((seconds / 8) * 100, 100);
    }
    if (type === 'cls') {
      // 0-0.5 scale
      return Math.min((value / 0.5) * 100, 100);
    }
    if (type === 'tbt') {
      // 0-2000ms scale
      return Math.min((value / 2000) * 100, 100);
    }
    return 0;
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
