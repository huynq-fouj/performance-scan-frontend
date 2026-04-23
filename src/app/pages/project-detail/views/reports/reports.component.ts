import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { ScanRecord, ScanIssue } from '../../../../core/models/scan.model';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-project-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styles: ``
})
export class ReportsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private route = inject(ActivatedRoute);

  project = toSignal(this.projectService.currentProject$, { initialValue: null });
  scan = signal<ScanRecord | null>(null);
  previousScan = signal<ScanRecord | null>(null);

  topIssues = computed(() => {
    const s = this.scan();
    if (!s || !s.issues) return [];
    return s.issues
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .slice(0, 3);
  });

  topRecommendations = computed(() => {
    const s = this.scan();
    if (!s || !s.recommendations) return [];
    return s.recommendations
      .filter(r => r.priority === 'High')
      .slice(0, 3);
  });

  groupedIssues = computed(() => {
    const s = this.scan();
    if (!s || !s.issues) return [];
    const groups: { severity: string; items: ScanIssue[] }[] = [
      { severity: 'critical', items: [] },
      { severity: 'high', items: [] },
      { severity: 'medium', items: [] },
      { severity: 'low', items: [] },
    ];
    
    s.issues.forEach(issue => {
      const group = groups.find(g => g.severity === issue.severity);
      if (group) group.items.push(issue);
    });
    
    return groups.filter(g => g.items.length > 0);
  });

  sortedRecommendations = computed(() => {
    const s = this.scan();
    if (!s || !s.recommendations) return [];
    const priorityMap: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
    return [...s.recommendations].sort((a, b) => (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4));
  });

  totalSize = computed(() => {
    const s = this.scan();
    if (!s) return 0;
    return (s.jsSizeKb || 0) + (s.cssSizeKb || 0) + (s.imageSizeKb || 0) + (s.fontSizeKb || 0) + (s.otherSizeKb || 0);
  });

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      const projectId = params.get('id');
      if (projectId) {
        this.fetchScans(projectId);
      }
    });
  }

  fetchScans(projectId: string) {
    // Fetch latest 2 scans to show current and compare
    this.scanService.getScans(projectId, { limit: 2 }).subscribe(res => {
      const scans = res.data || [];
      if (scans.length > 0) {
        this.scan.set(scans[0]);
      }
      if (scans.length > 1) {
        this.previousScan.set(scans[1]);
      }
    });
  }

  getScoreColorClass(score: number): string {
    if (score >= 90) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  }

  getScoreTextColorClass(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  }

  getStatusText(score: number): string {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Warning';
    return 'Critical';
  }

  getBadgeClass(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  }

  formatTime(value?: number): string {
    if (value === undefined || value === null) return '-';
    return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
  }

  // Very rough targets for status colors
  getMetricStatus(metric: string, value?: number): string {
    if (value === undefined || value === null) return '-';
    
    let isGood = false;
    let isWarning = false;

    switch (metric) {
      case 'fcp': isGood = value <= 1800; isWarning = value <= 3000; break;
      case 'lcp': isGood = value <= 2500; isWarning = value <= 4000; break;
      case 'cls': isGood = value <= 0.1; isWarning = value <= 0.25; break;
      case 'inp': isGood = value <= 200; isWarning = value <= 500; break;
      case 'tbt': isGood = value <= 200; isWarning = value <= 600; break;
      case 'speedIndex': isGood = value <= 3400; isWarning = value <= 5800; break;
      default: return 'Unknown';
    }

    if (isGood) return 'Good';
    if (isWarning) return 'Needs Improvement';
    return 'Poor';
  }

  getMetricBadgeClass(metric: string, value?: number): string {
    const status = this.getMetricStatus(metric, value);
    if (status === 'Good') return 'bg-green-100 text-green-700';
    if (status === 'Needs Improvement') return 'bg-orange-100 text-orange-700';
    if (status === 'Poor') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  getMetricColorClass(metric: string, value?: number): string {
    const status = this.getMetricStatus(metric, value);
    if (status === 'Good') return 'text-green-700';
    if (status === 'Needs Improvement') return 'text-orange-700';
    if (status === 'Poor') return 'text-red-700';
    return 'text-gray-900';
  }

  getPercent(value: number | undefined, total: number): number {
    if (!value || !total) return 0;
    return Math.round((value / total) * 100);
  }

  getDiffClass(diff: number): string {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-500';
  }

  getDiffIconClass(diff: number): string {
    if (diff > 0) return 'ph-trend-up';
    if (diff < 0) return 'ph-trend-down';
    return 'ph-minus';
  }

  getDiffText(diff: number): string {
    if (diff > 0) return `+${diff}`;
    return `${diff}`;
  }

  getInverseDiffClass(diff: number): string {
    if (diff < 0) return 'text-green-600';
    if (diff > 0) return 'text-red-600';
    return 'text-gray-500';
  }

  getInverseDiffIconClass(diff: number): string {
    if (diff < 0) return 'ph-trend-down';
    if (diff > 0) return 'ph-trend-up';
    return 'ph-minus';
  }

  getInverseDiffText(diff: number): string {
    if (diff < 0) return `${this.formatTime(Math.abs(diff))} faster`;
    if (diff > 0) return `+${this.formatTime(diff)}`;
    return 'No change';
  }

  getDuration(start?: string | Date, end?: string | Date): string {
    if (!start || !end) return '-';
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    const ms = Math.abs(d2 - d1);
    return `${Math.round(ms / 1000)}s`;
  }
}
