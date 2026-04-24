import { Component, inject, signal, computed, DestroyRef, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../core/services/dashboard.service';
import { ExecutiveReport } from '../../core/models/dashboard.model';
import { CustomSelectComponent } from 'app/shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-global-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './global-reports.component.html',
  styleUrl: './global-reports.component.scss'
})
export class GlobalReportsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Raw data
  reportData = signal<ExecutiveReport | null>(null);
  isLoading = signal<boolean>(true);

  // Filters
  timeRange = signal<string>('30days');
  deviceFilter = signal<string>('all');

  timeRangeOptions = [
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 90 Days', value: '90days' },
    { label: 'All Time', value: 'all' }
  ];

  deviceOptions = [
    { label: 'All Devices', value: 'all' },
    { label: 'Mobile Only', value: 'mobile' },
    { label: 'Desktop Only', value: 'desktop' }
  ];

  // Aggregated Data Computed Signals
  portfolioAverageScore = computed(() => this.reportData()?.averageScore || 0);
  
  healthDistribution = computed(() => this.reportData()?.healthDistribution || {
    good: { count: 0, percent: 0 },
    average: { count: 0, percent: 0 },
    poor: { count: 0, percent: 0 }
  });

  commonIssues = computed(() => this.reportData()?.commonIssues || []);
  topPerformers = computed(() => this.reportData()?.topPerformers || []);
  needsAttention = computed(() => this.reportData()?.needsAttention || []);
  totalScansAnalyzed = computed(() => this.reportData()?.totalScansAnalyzed || 0);

  ngOnInit() {
    this.loadAnalyticsData();
  }

  loadAnalyticsData() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading.set(true);
    
    let days: number | undefined;
    if (this.timeRange() !== 'all') {
      days = parseInt(this.timeRange().replace('days', ''));
    }

    this.dashboardService.getAnalytics({
      device: this.deviceFilter(),
      days: days
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.reportData.set(res.data || null);
        this.isLoading.set(false);
      },
      error: () => {
        this.reportData.set(null);
        this.isLoading.set(false);
      }
    });
  }

  onTimeRangeChange(value: string) {
    this.timeRange.set(value);
    this.loadAnalyticsData();
  }

  onDeviceChange(value: string) {
    this.deviceFilter.set(value);
    this.loadAnalyticsData();
  }

  exportReport() {
    // In a real app, this would trigger a PDF generation or CSV download
    alert('Exporting Executive Summary Report... (Mocked)');
  }

  goToProjectReport(projectId: string | undefined, scanId: string) {
    if (!projectId) return;
    this.router.navigate(['/dashboard/projects', projectId, 'reports'], { queryParams: { scanId } });
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  }
}
