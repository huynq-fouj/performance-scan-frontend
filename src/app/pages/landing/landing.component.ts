import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  constructor(private authService: AuthService) {}

  get dashboardLink(): string {
    return this.authService.isLoggedIn() ? '/dashboard' : '/auth/login';
  }
}
