import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Alerts</h3>
      <p class="text-gray-500">Configure alert thresholds and destination channels (Slack, Email).</p>
    </div>
  `,
  styles: ``
})
export class AlertsComponent {}
