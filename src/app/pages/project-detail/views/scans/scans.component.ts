import { Component, inject, signal, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../../core/services/project.service';
import { ScanService } from '../../../../core/services/scan.service';
import { Project } from '../../../../core/models/project.model';
import { ScanRecord } from '../../../../core/models/scan.model';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-project-scans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scans.component.html',
  styleUrl: './scans.component.scss'
})
export class ScansComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);

  project = signal<Project | null>(null);
  scans = signal<ScanRecord[]>([]);
  isLoading = signal<boolean>(true);

  // Pagination & Filters
  statusFilter = signal<string>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);

  // Use shared scanning state
  isScanning = this.scanService.isScanning;
  private activeScanId = signal<string | null>(null);
  private pollInterval: any;

  ngOnInit() {
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
      if (proj) {
        this.loadScans();
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadScans() {
    const p = this.project();
    if (!p) return;

    this.isLoading.set(true);
    this.scanService.getScans(p.id, {
      status: this.statusFilter(),
      startDate: this.dateFrom(),
      endDate: this.dateTo(),
      page: this.currentPage(),
      limit: this.pageSize()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.scans.set(res.data ?? []);
        this.totalCount.set(res.count ?? 0);
        this.isLoading.set(false);
        this.checkPolling();
      },
      error: (err) => {
        console.error('Error loading scans:', err);
        this.scans.set([]);
        this.isLoading.set(false);
        this.stopPolling();
      }
    });
  }

  checkPolling() {
    // Check if any scan in current page is running, or if we are already scanning
    const runningScan = this.scans().find(s => s.status === 'queued' || s.status === 'running');
    
    if (runningScan) {
      this.isScanning.set(true);
      this.activeScanId.set(runningScan.id);
      if (!this.pollInterval) {
        this.startPolling();
      }
    } else if (this.pollInterval && !this.activeScanId()) {
       // We were scanning but no scan is running anymore
       this.isScanning.set(false);
       this.stopPolling();
    }
  }

  startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      const p = this.project();
      const scanId = this.activeScanId();
      if (!p) return;

      const obs$ = (scanId 
        ? this.scanService.getScan(scanId).pipe(map(res => ({ ...res, data: [res.data] })))
        : this.scanService.getScans(p.id, { limit: 1 })) as Observable<any>;

      obs$.subscribe({
        next: (res: any) => {
          if (!this.pollInterval) return;
          const scan = Array.isArray(res.data) ? res.data[0] : res.data;
          
          if (scan) {
            if (scan.status === 'success' || scan.status === 'failed') {
              this.isScanning.set(false);
              this.activeScanId.set(null);
              this.stopPolling();
              this.loadScans(); // Refresh list to show results
              this.projectService.getProject(p.id).subscribe();
            } else {
              // Update only the specific scan in the list if it's there
              this.scans.update(list => list.map(s => s.id === scan.id ? scan : s));
              if (!this.activeScanId()) this.activeScanId.set(scan.id);
            }
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

  cancelScan(id: string) {
    this.scanService.cancelScan(id).subscribe({
      next: () => {
        this.loadScans();
      },
      error: (err) => {
        console.error('Failed to cancel scan:', err);
      }
    });
  }

  onStatusFilterChange(value: string) {
    this.statusFilter.set(value);
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
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadScans();
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
