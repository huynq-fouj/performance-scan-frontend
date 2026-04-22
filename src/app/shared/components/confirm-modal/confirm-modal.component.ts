import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="modal-backdrop" (click)="onCancel()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <!-- Icon -->
          <div class="modal-icon" [ngClass]="type">
            @if (type === 'danger') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }
          </div>

          <!-- Content -->
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="btn-confirm" [ngClass]="type" (click)="onConfirm()" [disabled]="loading">
              @if (loading) {
                <svg class="animate-spin w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
              }
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      @apply fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-panel {
      @apply bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4
             flex flex-col items-center text-center;
      animation: scaleIn 0.2s ease-out;
    }

    .modal-icon {
      @apply w-14 h-14 rounded-full flex items-center justify-center mb-4;

      svg { @apply w-7 h-7; }

      &.danger {
        @apply bg-red-50 text-red-500;
      }
      &.warning {
        @apply bg-amber-50 text-amber-500;
      }
      &.info {
        @apply bg-blue-50 text-blue-500;
      }
    }

    .modal-title {
      @apply text-lg font-bold text-gray-900 mb-1.5;
    }

    .modal-message {
      @apply text-sm text-gray-500 leading-relaxed mb-6;
    }

    .modal-actions {
      @apply flex items-center gap-3 w-full;
    }

    .btn-cancel {
      @apply flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold
             border border-gray-200 text-gray-700 bg-white
             hover:bg-gray-50 transition-colors;
    }

    .btn-confirm {
      @apply flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white
             transition-colors flex items-center justify-center;

      &.danger { @apply bg-red-500 hover:bg-red-600; }
      &.warning { @apply bg-amber-500 hover:bg-amber-600; }
      &.info { @apply bg-blue-500 hover:bg-blue-600; }

      &:disabled { @apply opacity-60 cursor-not-allowed; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() type: 'danger' | 'warning' | 'info' = 'danger';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
