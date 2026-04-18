import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { Project } from '../../../../core/models/project.model';
import { ScanRecord } from '../../../../core/models/scan.model';

@Component({
  selector: 'app-project-scans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scans.component.html',
  styleUrl: './scans.component.scss'
})
export class ScansComponent implements OnInit {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);

  project = signal<Project | null>(null);
  scans = signal<ScanRecord[]>([]);
  filteredScans = signal<ScanRecord[]>([]);
  isLoading = signal<boolean>(true);

  // Filters
  statusFilter = signal<string>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  ngOnInit() {
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
      if (proj) {
        this.loadScans(proj.id);
      }
    });
  }

  loadScans(projectId: string) {
    this.isLoading.set(true);
    this.scanService.getScans(projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.scans.set(res.data ?? []);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading scans:', err);
        this.scans.set([]);
        this.filteredScans.set([]);
        this.isLoading.set(false);
      }
    });
  }

  applyFilters() {
    let result = [...this.scans()];

    // Status filter (client-side for date range combo)
    const status = this.statusFilter();
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }

    // Date range filter
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from) {
      const fromDate = new Date(from);
      result = result.filter(s => s.startedAt && new Date(s.startedAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59);
      result = result.filter(s => s.startedAt && new Date(s.startedAt) <= toDate);
    }

    this.filteredScans.set(result);
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value);
    this.applyFilters();
  }

  onDateFromChange(value: string) {
    this.dateFrom.set(value);
    this.applyFilters();
  }

  onDateToChange(value: string) {
    this.dateTo.set(value);
    this.applyFilters();
  }

  clearFilters() {
    this.statusFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.statusFilter() !== 'all' || !!this.dateFrom() || !!this.dateTo();
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
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
}
