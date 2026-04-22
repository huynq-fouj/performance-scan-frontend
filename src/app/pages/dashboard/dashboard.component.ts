import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from 'app/core/services/dashboard.service';
import { DashboardSummary, ProjectHealthItem } from 'app/core/models/dashboard.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  summary = signal<DashboardSummary | null>(null);
  isLoading = signal(true);
  healthFilter = signal<'all' | 'critical' | 'needs-scan' | 'improving'>('all');

  // Filtered project list
  get filteredProjects(): ProjectHealthItem[] {
    const s = this.summary();
    if (!s) return [];
    const list = s.projectHealthList;
    switch (this.healthFilter()) {
      case 'critical': return list.filter(p => p.status === 'Critical');
      case 'needs-scan': return list.filter(p => !p.lastScanAt);
      case 'improving': return list.filter(p => p.trend === 'up');
      default: return list;
    }
  }

  // Chart
  trendChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.9)',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12 },
        bodyFont: { size: 13, weight: 'bold' },
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          stepSize: 25,
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          maxRotation: 0,
        }
      }
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2.5 },
      point: { radius: 4, hoverRadius: 6 }
    }
  };

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.dashboardService.getSummary().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.data) {
          this.summary.set(res.data);
          this.buildTrendChart(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  buildTrendChart(data: DashboardSummary) {
    const labels = data.trends.map(t => {
      const d = new Date(t.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const scores = data.trends.map(t => t.score);

    this.trendChartData.set({
      labels,
      datasets: [{
        data: scores,
        label: 'Avg Score',
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }]
    });
  }

  setFilter(f: 'all' | 'critical' | 'needs-scan' | 'improving') {
    this.healthFilter.set(f);
  }

  goToProject(id: string) {
    this.router.navigate(['/dashboard/projects', id]);
  }

  goToProjects() {
    this.router.navigate(['/dashboard/projects']);
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Healthy': return 'status-healthy';
      case 'Warning': return 'status-warning';
      case 'Critical': return 'status-critical';
      default: return '';
    }
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      default: return '';
    }
  }

  formatTimeAgo(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  }
}
