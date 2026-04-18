import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScanService } from '../../core/services/scan.service';
import { ProjectService } from '../../core/services/project.service';
import { ScanRecord } from '../../core/models/scan.model';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-global-scans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-scans.component.html',
  styleUrl: './global-scans.component.scss'
})
export class GlobalScansComponent implements OnInit {
  private scanService = inject(ScanService);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  scans = signal<ScanRecord[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);

  // Filters
  statusFilter = signal<string>('all');
  projectFilter = signal<string>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(15);
  totalCount = signal<number>(0);

  ngOnInit() {
    this.loadProjects();
    this.loadScans();
  }

  loadProjects() {
    this.projectService.getProjects().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.projects.set(res.data ?? []);
      }
    });
  }

  loadScans() {
    this.isLoading.set(true);
    this.scanService.getAllScans({
      status: this.statusFilter(),
      projectId: this.projectFilter() === 'all' ? undefined : this.projectFilter(),
      startDate: this.dateFrom(),
      endDate: this.dateTo(),
      page: this.currentPage(),
      limit: this.pageSize(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.scans.set(res.data ?? []);
        this.totalCount.set(res.count ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.scans.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadScans();
  }

  onProjectChange(value: string) {
    this.projectFilter.set(value);
    this.currentPage.set(1);
    this.loadScans();
  }

  onDateFromChange(value: string) {
    this.dateFrom.set(value);
    this.currentPage.set(1);
    this.loadScans();
  }

  onDateToChange(value: string) {
    this.dateTo.set(value);
    this.currentPage.set(1);
    this.loadScans();
  }

  clearFilters() {
    this.statusFilter.set('all');
    this.projectFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadScans();
  }

  hasActiveFilters(): boolean {
    return this.statusFilter() !== 'all' || this.projectFilter() !== 'all' || !!this.dateFrom() || !!this.dateTo();
  }

  nextPage() {
    if (this.currentPage() * this.pageSize() < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadScans();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadScans();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize());
  }

  get startIndex(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalCount());
  }

  goToProject(projectId: string) {
    this.router.navigate(['/dashboard/projects', projectId]);
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success': return 'status-success';
      case 'failed': return 'status-failed';
      case 'running': return 'status-running';
      case 'queued': return 'status-queued';
      default: return '';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(scan: ScanRecord): string {
    if (!scan.startedAt || !scan.completedAt) return '—';
    const start = new Date(scan.startedAt).getTime();
    const end = new Date(scan.completedAt).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  cancelScan(id: string) {
    this.scanService.cancelScan(id).subscribe({
      next: () => this.loadScans()
    });
  }
}
