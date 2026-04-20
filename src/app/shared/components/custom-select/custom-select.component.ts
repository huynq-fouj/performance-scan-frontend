import { Component, Input, forwardRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative min-w-[140px]">
      <button 
        type="button" 
        class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg outline-none transition-all hover:border-gray-300 hover:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="disabled"
        (click)="toggleOpen()">
        <span class="truncate">{{ selectedLabel || placeholder }}</span>
        
        <svg class="w-4 h-4 text-gray-500 transition-transform" [class.rotate-180]="isOpen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
        </svg>
      </button>

      @if (isOpen) {
        <ul class="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto py-1.5 origin-top animate-fade-in-down">
          @for (option of options; track option.value) {
            <li class="group flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-all"
                [class.bg-primary-50]="option.value === value"
                [class.text-primary-700]="option.value === value"
                [class.font-bold]="option.value === value"
                [class.text-gray-700]="option.value !== value"
                [class.hover:bg-gray-50]="option.value !== value"
                (click)="selectOption(option)">
              <span class="truncate">{{ option.label }}</span>
              
              @if (option.value === value) {
                <svg class="w-4 h-4 text-primary-500 animate-in fade-in zoom-in duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
              }
            </li>
          }
          @if (options.length === 0) {
            <li class="px-3 py-4 text-center text-xs text-gray-400 italic">
              No options available
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in-down {
      animation: fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-8px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Select...';
  @Input() disabled: boolean = false;
  
  isOpen = false;
  value: any = null;

  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(private eRef: ElementRef) {}

  get selectedLabel() {
    return this.options.find(opt => opt.value === this.value)?.label;
  }

  toggleOpen() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  selectOption(option: SelectOption) {
    if (this.disabled) return;
    this.value = option.value;
    this.onChange(this.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  writeValue(obj: any): void { 
    this.value = obj; 
  }
  
  registerOnChange(fn: any): void { 
    this.onChange = fn; 
  }
  
  registerOnTouched(fn: any): void { 
    this.onTouch = fn; 
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
