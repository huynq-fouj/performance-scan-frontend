import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from 'app/core/services/project.service';
import { ScanService } from 'app/core/services/scan.service';
import { Project } from 'app/core/models/project.model';
import { ScanRecord } from 'app/core/models/scan.model';
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
  scanA = computed(() => this.scans().find(s => s.id === this.scanAId()) || null);
  scanB = computed(() => this.scans().find(s => s.id === this.scanBId()) || null);

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

  // --- Delta Calculation Helpers ---

  getDeltaScore(): number {
    const a = this.scanA()?.performanceScore || 0;
    const b = this.scanB()?.performanceScore || 0;
    return b - a;
  }

  calculateDelta(valA: number | undefined, valB: number | undefined): { diff: number; percent: number; isBetter: boolean; type: 'lower-is-better' | 'higher-is-better' } {
    const a = valA || 0;
    const b = valB || 0;
    const diff = b - a;
    const percent = a !== 0 ? (diff / a) * 100 : 0;
    
    // Most metrics (LCP, CLS, TBT, Bundle size) are lower-is-better
    const isBetter = diff <= 0;
    
    return { diff, percent, isBetter, type: 'lower-is-better' };
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
