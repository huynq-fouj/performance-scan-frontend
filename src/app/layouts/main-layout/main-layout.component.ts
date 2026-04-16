import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  private platformId = inject(PLATFORM_ID);

  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Scans', icon: 'scan', route: '/dashboard/scans' },
    { label: 'Reports', icon: 'report', route: '/dashboard/reports' },
    { label: 'Settings', icon: 'settings', route: '/dashboard/settings' },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
