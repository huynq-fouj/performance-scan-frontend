import { Component, inject, signal, computed, OnInit, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from 'app/core/services/project.service';
import { ScanService } from 'app/core/services/scan.service';
import { Project } from 'app/core/models/project.model';
import { ScanRecord, ScanCompareResponse } from 'app/core/models/scan.model';
import { ScanSelectComponent } from 'app/shared/components/scan-select/scan-select.component';

@Component({
  selector: 'app-project-compare',
  standalone: true,
  imports: [CommonModule, FormsModule, ScanSelectComponent],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss'
})
export class CompareComponent implements OnInit {
  private projectService = inject(ProjectService);
  private scanService = inject(ScanService);
  private destroyRef = inject(DestroyRef);

  protected readonly Math = Math;

  project = signal<Project | null>(null);
  scans = signal<ScanRecord[]>([]);
  isLoading = signal<boolean>(true);

  // Selected Scans for comparison
  scanAId = signal<string | null>(null);
  scanBId = signal<string | null>(null);

  // Computeds for the selected scans
  scanA = computed(() => this.compareResult()?.scanA || null);
  scanB = computed(() => this.compareResult()?.scanB || null);
  
  compareResult = signal<ScanCompareResponse | null>(null);

  constructor() {
    effect(() => {
      const aId = this.scanAId();
      const bId = this.scanBId();
      if (aId && bId) {
        if (aId === bId) {
          this.compareResult.set(null);
          return;
        }
        // Could optimize by bypassing isLoading flash if caching, but we'll show it
        this.scanService.compareScans(aId, bId).subscribe({
          next: (res) => {
            if (res.data) this.compareResult.set(res.data);
          },
          error: (err) => console.error('Compare Error:', err)
        });
      }
    });
  }

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
    this.scanService.getScans(projectId, { status: 'success' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        let loadedScans = res.data ?? [];
        
        this.scans.set(loadedScans);
        
        if (loadedScans.length >= 2) {
          // By default, compare the latest (B) with the previous (A)
          this.scanBId.set(loadedScans[0].id);
          this.scanAId.set(loadedScans[1].id);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading scans for compare:', err);
        this.isLoading.set(false);
      }
    });
  }

  onScanAChange(id: string) {
    this.scanAId.set(id);
  }

  onScanBChange(id: string) {
    this.scanBId.set(id);
  }

  swapScans() {
    const a = this.scanAId();
    const b = this.scanBId();
    this.scanAId.set(b);
    this.scanBId.set(a);
  }

  formatDate(dateVal: string | Date | undefined): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    // e.g. "Apr 15, 14:30"
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }


  // UI Helpers

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  getBarWidth(val: number | undefined, max: number): string {
    if (val === undefined) return '0%';
    const pct = Math.min((val / max) * 100, 100);
    return `${pct}%`;
  }


}
