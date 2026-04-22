import { Component, inject, signal, DestroyRef, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { Project } from '../../../../core/models/project.model';
import { ScanRecord } from '../../../../core/models/scan.model';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-project-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);
  private toast = inject(HotToastService);

  project = signal<Project | null>(null);
  
  // Use shared scanning state
  isScanning = this.scanService.isScanning;
  isImporting = signal<boolean>(false);
  
  latestScan = signal<ScanRecord | null>(null);
  historyScans = signal<ScanRecord[]>([]);

  // Trend Settings
  trendRange = signal<7 | 30>(7);
  selectedDevice = signal<'mobile' | 'desktop'>('desktop');

  // Issues and Recommendations UI state
  expandedIssues = signal<Set<number>>(new Set());
  activeRecTab = signal<'High' | 'Medium' | 'Low'>('High');

  filteredRecommendations = computed(() => {
    const scan = this.latestScan();
    if (!scan || !scan.recommendations) return [];
    return scan.recommendations.filter(r => r.priority === this.activeRecTab());
  });

  // ---- CHARTS CONFIGURATION ---- //
  public trendLineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.3 }
    },
    plugins: {
      legend: { display: false }
    },
    scales: { x: { display: false } }
  };
  
  public assetPieChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  trendScoreData = computed<ChartConfiguration<'line'>['data']>(() => {
    const scans = this.historyScans().slice(0, this.trendRange()).reverse();
    return {
      labels: scans.map(s => new Date(s.completedAt || s.createdAt).toLocaleDateString()),
      datasets: [
        {
          data: scans.map(s => s.performanceScore || 0),
          label: 'Performance Score',
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          fill: true
        }
      ]
    };
  });

  trendMetricsData = computed<ChartConfiguration<'line'>['data']>(() => {
    const scans = this.historyScans().slice(0, this.trendRange()).reverse();
    return {
      labels: scans.map(s => new Date(s.completedAt || s.createdAt).toLocaleDateString()),
      datasets: [
        {
          data: scans.map(s => (s.lcp || 0) / 1000),
          label: 'LCP (s)',
          borderColor: '#ea580c',
        },
        {
          data: scans.map(s => s.cls || 0),
          label: 'CLS',
          borderColor: '#16a34a',
        }
      ]
    };
  });

  assetBreakdownData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const scan = this.latestScan();
    if (!scan) return { labels: [], datasets: [] };
    return {
      labels: ['JavaScript', 'CSS', 'Images', 'Fonts', 'Other'],
      datasets: [
        {
          data: [
            scan.jsSizeKb || 0,
            scan.cssSizeKb || 0,
            scan.imageSizeKb || 0,
            scan.fontSizeKb || 0,
            scan.otherSizeKb || 0
          ],
          backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'],
          hoverOffset: 4
        }
      ]
    };
  });

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

  loadLatestScan(projectId: string, forceRefresh = false) {
    this.scanService.getScans(projectId, { page: 1, limit: 30 }, forceRefresh).subscribe(res => {
      if (res.data && res.data.length > 0) {
        // Find latest success scan for detailed display
        const successScan = res.data.find(s => s.status === 'success');
        this.latestScan.set(successScan || res.data[0]);
        // Keep all success scans for history
        this.historyScans.set(res.data.filter(s => s.status === 'success'));
      } else {
        this.latestScan.set(null);
        this.historyScans.set([]);
      }
    });
  }

  setTrendRange(days: 7 | 30) {
    this.trendRange.set(days);
  }

  setDevice(device: 'mobile' | 'desktop') {
    this.selectedDevice.set(device);
  }

  toggleIssue(index: number) {
    const current = new Set(this.expandedIssues());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.expandedIssues.set(current);
  }

  setRecTab(tab: 'High' | 'Medium' | 'Low') {
    this.activeRecTab.set(tab);
  }

  copyRecommendation(rec: any) {
    navigator.clipboard.writeText(rec.title).then(() => {
      this.toast.success('Recommendation copied to clipboard');
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
    this.scanService.createScan({ projectId: p.id }, this.selectedDevice()).subscribe({
      next: () => {
        // Parent handle polling, we just wait.
      },
      error: (err) => {
        console.error('Failed to trigger scan:', err);
        this.isScanning.set(false);
      }
    });
  }

  triggerImport(fileInput: HTMLInputElement) {
    if (this.isImporting() || this.isScanning()) return;
    fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const p = this.project();
    if (!p) return;

    this.isImporting.set(true);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        this.scanService.importScan(p.id, jsonData).subscribe({
          next: () => {
            this.isImporting.set(false);
            setTimeout(() => this.loadLatestScan(p.id, true), 300);
            this.toast.success('Lighthouse report imported successfully!');
          },
          error: (err) => {
            console.error('Failed to import JSON:', err);
            this.isImporting.set(false);
            const errorMsg = err.error?.message || 'Failed to import Lighthouse report. Please check the file format.';
            this.toast.error(errorMsg);
          }
        });
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        this.isImporting.set(false);
        this.toast.error('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    event.target.value = '';
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

  getWeightedPoints(type: 'fcp' | 'si' | 'lcp' | 'tbt' | 'cls', score: number | undefined | null): string {
    if (score === undefined || score === null) return '0';
    const weights = {
      fcp: 0.1,
      si: 0.1,
      lcp: 0.25,
      tbt: 0.3,
      cls: 0.25
    };
    const points = (score / 100) * (weights[type] * 100);
    return points > 0 ? `+${points.toFixed(1)}` : '0';
  }
}
