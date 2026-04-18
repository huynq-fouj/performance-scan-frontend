import { Component, inject, OnInit, PLATFORM_ID, signal, DestroyRef, OnDestroy, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../core/services/project.service';
import { ScanService } from '../../core/services/scan.service';
import { Project } from '../../core/models/project.model';
import { switchMap, tap, filter, finalize, map, Observable } from 'rxjs';

@Component({
  selector: 'app-project-detail-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-detail-layout.component.html',
  styleUrls: ['./project-detail-layout.component.scss']
})
export class ProjectDetailLayoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);
  
  projectId: string | null = null;
  isLoading = signal<boolean>(true);
  project = signal<Project | null>(null);
  
  // Expose the global isScanning state from ScanService
  isScanning = this.scanService.isScanning;
  private activeScanId = signal<string | null>(null);
  private pollInterval: any;

  constructor() {
    effect(() => {
      if (this.isScanning()) {
        if (!this.pollInterval && this.projectId) {
          this.startPolling(this.projectId);
        }
      } else {
        this.stopPolling();
      }
    });
  }

  tabs = [
    { name: 'Overview', path: 'overview' },
    { name: 'Scans', path: 'scans' },
    { name: 'Compare', path: 'compare' },
    { name: 'Settings', path: 'settings' }
  ];

  ngOnInit() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(params => {
        const id = params.get('id');
        this.projectId = id;
        if (id && isPlatformBrowser(this.platformId)) {
          this.isLoading.set(true);
          this.isScanning.set(false); // Clear previous project's global scanning state
          this.activeScanId.set(null);
          this.checkInitialScanStatus(id);
        }
      }),
      filter(params => !!params.get('id') && isPlatformBrowser(this.platformId)),
      switchMap(params => this.projectService.getProject(params.get('id')!).pipe(finalize(() => this.isLoading.set(false))))
    ).subscribe();

    // 2. Sync local signal with Global State
    this.projectService.currentProject$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(proj => {
      this.project.set(proj);
    });

    // 3. Cleanup on Destroy: Clear the global project state
    this.destroyRef.onDestroy(() => {
      this.projectService.setCurrentProject(null);
      this.stopPolling();
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  checkInitialScanStatus(projectId: string) {
    // Just check the most recent scan
    this.scanService.getScans(projectId, { limit: 1 }).subscribe(res => {
      const scans = res.data;
      if (scans && scans.length > 0) {
        const latest = scans[0];
        if (latest.status === 'queued' || latest.status === 'running') {
          this.isScanning.set(true);
          this.activeScanId.set(latest.id);
          this.startPolling(projectId);
        }
      }
    });
  }

  startPolling(projectId: string) {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      const scanId = this.activeScanId();
      
      const obs$ = (scanId 
        ? this.scanService.getScan(scanId).pipe(map(res => ({ ...res, data: [res.data] })))
        : this.scanService.getScans(projectId, { limit: 1 })) as Observable<any>;

      obs$.subscribe((res: any) => {
        const scan = Array.isArray(res.data) ? res.data[0] : res.data;
        if (scan) {
          if (scan.status === 'success' || scan.status === 'failed') {
            this.isScanning.set(false);
            this.activeScanId.set(null);
            this.stopPolling();
            // Refresh project data to reflect new scores
            this.projectService.getProject(projectId).subscribe();
          } else {
            // If we didn't have an ID (e.g. from checkInitialScanStatus refresh), sync it now
            if (!this.activeScanId()) {
              this.activeScanId.set(scan.id);
            }
          }
        } else if (!scanId) {
          // No scans at all
          this.isScanning.set(false);
          this.stopPolling();
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

  runScan() {
    const p = this.project();
    if (!p || this.isScanning()) return;

    this.isScanning.set(true);
    this.scanService.createScan({ projectId: p.id }).subscribe({
      next: (res) => {
        if (res.data) {
          this.activeScanId.set(res.data.id);
        }
        this.startPolling(p.id);
      },
      error: (err) => {
        console.error('Failed to trigger scan:', err);
        this.isScanning.set(false);
      }
    });
  }
}
