import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-detail-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-detail-layout.component.html',
  styleUrls: ['./project-detail-layout.component.scss']
})
export class ProjectDetailLayoutComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  projectId: string | null = null;
  // Placeholder project info
  project = {
    name: 'Loading...',
    url: '',
    logo: '',
    status: 'active'
  };

  tabs = [
    { name: 'Overview', path: 'overview' },
    { name: 'Scans', path: 'scans' },
    { name: 'Reports', path: 'reports' },
    { name: 'Compare', path: 'compare' },
    { name: 'Alerts', path: 'alerts' },
    { name: 'Settings', path: 'settings' }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      // Later: Fetch actual project data using this.projectId
      this.project = {
        name: 'Demo Project',
        url: 'https://example.com',
        logo: '',
        status: 'active'
      };
    });
  }
}
