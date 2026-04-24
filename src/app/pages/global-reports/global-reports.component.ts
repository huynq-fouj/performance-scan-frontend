import { Component, inject, signal, computed, DestroyRef, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScanService } from '../../core/services/scan.service';
import { ProjectService } from '../../core/services/project.service';
import { ScanRecord } from '../../core/models/scan.model';
import { Project } from '../../core/models/project.model';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-global-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './global-reports.component.html',
  styleUrl: './global-reports.component.scss'
})
export class GlobalReportsComponent implements OnInit {
  private scanService = inject(ScanService);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  reports = signal<ScanRecord[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  // Filters
  projectFilter = signal<string>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  scoreFilter = signal<string>('all');

  // Dropdown options
  projectOptions = computed(() => {
    const defaultOption = { label: 'All Projects', value: 'all' };
    const pOptions = this.projects().map(p => ({ label: p.name, value: p.id }));
    return [defaultOption, ...pOptions];
  });

  scoreOptions = [
    { label: 'All Scores', value: 'all' },
    { label: 'Good (90-100)', value: 'good' },
    { label: 'Needs Improvement (50-89)', value: 'average' },
    { label: 'Poor (0-49)', value: 'poor' }
  ];

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(12); // Grid layout, 12 per page
  totalCount = signal<number>(0);

  ngOnInit() {
    this.loadProjects();
    this.loadReports();
  }

  loadProjects() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.projectService.getProjects().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.projects.set(res.data ?? []);
      }
    });
  }

  loadReports() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading.set(true);
    this.scanService.getAllScans({
      status: 'success', // Only successful scans have reports
      projectId: this.projectFilter() === 'all' ? undefined : this.projectFilter(),
      startDate: this.dateFrom(),
      endDate: this.dateTo(),
      page: this.currentPage(),
      limit: this.pageSize(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        let data = res.data ?? [];
        
        // Manual score filtering if needed
        if (this.scoreFilter() !== 'all') {
          data = data.filter(s => {
            const score = s.performanceScore ?? 0;
            if (this.scoreFilter() === 'good') return score >= 90;
            if (this.scoreFilter() === 'average') return score >= 50 && score < 90;
            if (this.scoreFilter() === 'poor') return score < 50;
            return true;
          });
        }

        this.reports.set(data);
        this.totalCount.set(res.count ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.reports.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onProjectChange(value: string) {
    this.projectFilter.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  onScoreChange(value: string) {
    this.scoreFilter.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  onDateFromChange(value: string) {
    this.dateFrom.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  onDateToChange(value: string) {
    this.dateTo.set(value);
    this.currentPage.set(1);
    this.loadReports();
  }

  clearFilters() {
    this.projectFilter.set('all');
    this.scoreFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadReports();
  }

  hasActiveFilters(): boolean {
    return this.projectFilter() !== 'all' || this.scoreFilter() !== 'all' || !!this.dateFrom() || !!this.dateTo();
  }

  nextPage() {
    if (this.currentPage() * this.pageSize() < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadReports();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadReports();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }

  goToReport(projectId: string, scanId: string) {
    this.router.navigate(['/dashboard/projects', projectId, 'reports'], { queryParams: { scanId } });
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getMetricStatus(metric: string, value?: number): string {
    if (value === undefined || value === null) return 'unknown';
    
    switch (metric) {
      case 'lcp': return value <= 2500 ? 'good' : (value <= 4000 ? 'average' : 'poor');
      case 'cls': return value <= 0.1 ? 'good' : (value <= 0.25 ? 'average' : 'poor');
      case 'tbt': return value <= 200 ? 'good' : (value <= 600 ? 'average' : 'poor');
      default: return 'unknown';
    }
  }
}
