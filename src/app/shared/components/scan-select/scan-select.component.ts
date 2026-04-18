import { Component, Input, forwardRef, ElementRef, HostListener, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ScanRecord } from 'app/core/models/scan.model';

@Component({
  selector: 'app-scan-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScanSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="custom-select-wrapper" [class.is-open]="isOpen()">
      <button 
        type="button" 
        class="custom-select-trigger" 
        [class.select-target]="isTarget"
        (click)="toggle()" 
        [disabled]="isDisabled() || scans.length === 0">
        
        @if (scans.length === 0) {
          <span class="placeholder">No scans available</span>
        } @else if (selectedScan()) {
          <div class="selected-scan">
            <span class="scan-date">{{ formatDate(selectedScan()?.startedAt) }}</span>
            <span class="scan-score-badge" [ngClass]="getScoreClass(selectedScan()?.performanceScore)">{{ selectedScan()?.performanceScore }}</span>
          </div>
        } @else {
          <span class="placeholder">{{ placeholder }}</span>
        }
        <svg class="chevron" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
      </button>

      @if (isOpen() && scans.length > 0) {
        <div class="custom-select-dropdown">
          @for (s of scans; track s.id) {
            <button 
              type="button" 
              class="custom-option" 
              [class.is-selected]="s.id === value()" 
              (click)="selectOption(s.id)">
              <div class="option-content">
                <span class="scan-date">{{ formatDate(s.startedAt) }}</span>
                <span class="scan-score-badge" [ngClass]="getScoreClass(s.performanceScore)">{{ s.performanceScore }}</span>
              </div>
              @if (s.id === value()) {
                <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" /></svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-select-wrapper {
      @apply relative w-full;
    }

    .custom-select-trigger {
      @apply w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700
             flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500/10 transition-all;

      &.select-target {
        @apply border-primary-200 bg-primary-50/20 hover:bg-primary-50/40;
      }

      &:disabled {
        @apply opacity-60 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-50;
        .chevron { display: none; }
      }

      .chevron {
        @apply w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0;
      }

      .placeholder {
        @apply text-gray-400;
      }
    }

    .custom-select-wrapper.is-open .chevron {
      @apply transform rotate-180;
    }

    .custom-select-wrapper.is-open .custom-select-trigger {
      @apply border-primary-400 ring-2 ring-primary-500/10;
    }

    .selected-scan {
      @apply flex items-center justify-between gap-3 w-full pr-2;
    }

    .scan-date {
      @apply text-sm text-gray-700 font-medium whitespace-nowrap;
    }

    .scan-score-badge {
      @apply px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap border border-transparent;
    }
    
    .score-good { @apply bg-emerald-50 text-emerald-700; }
    .score-average { @apply bg-amber-50 text-amber-700; }
    .score-poor { @apply bg-red-50 text-red-600; }
    .score-na { @apply bg-gray-50 text-gray-400; }

    .custom-select-dropdown {
      @apply absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden flex flex-col;
      max-height: 240px;
      overflow-y: auto;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .custom-option {
      @apply w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:bg-gray-50 outline-none border-b border-gray-50 last:border-0 transition-colors;

      &.is-selected {
        @apply bg-primary-50/50;
      }

      .option-content {
        @apply flex items-center justify-between w-full pr-4;
      }
      
      .check-icon {
        @apply w-5 h-5 text-primary-600 flex-shrink-0;
      }
    }
  `]
})
export class ScanSelectComponent implements ControlValueAccessor {
  private elementRef = inject(ElementRef);

  @Input() scans: ScanRecord[] = [];
  @Input() placeholder: string = 'Select a scan';
  @Input() isTarget: boolean = false; // For styling differences

  value = signal<string | null>(null);
  isOpen = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  selectedScan = computed(() => {
    return this.scans.find(s => s.id === this.value()) || null;
  });

  onChange: (value: string | null) => void = () => {};
  onTouch: () => void = () => {};

  toggle() {
    if (!this.isDisabled() && this.scans.length > 0) {
      this.isOpen.update(v => !v);
      this.onTouch();
    }
  }

  selectOption(id: string) {
    this.value.set(id);
    this.isOpen.set(false);
    this.onChange(id);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  // --- HTML formatting helpers ---
  formatDate(dateVal: string | Date | undefined): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-na';
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-average';
    return 'score-poor';
  }

  // --- ControlValueAccessor Implementation ---
  writeValue(obj: any): void {
    this.value.set(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
