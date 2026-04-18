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
  templateUrl: './scan-select.component.html',
  styleUrl: './scan-select.component.scss'
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
