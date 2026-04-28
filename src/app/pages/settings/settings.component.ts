import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(HotToastService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  isProfileLoading = signal(false);
  isPasswordLoading = signal(false);

  user = this.userService.currentUser;

  ngOnInit() {
    this.initForms();
    
    // Load initial data
    const currentUser = this.user();
    if (currentUser) {
      this.profileForm.patchValue({
        fullName: currentUser.fullName,
        email: currentUser.email
      });
    }
  }

  private initForms() {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }] // Email usually requires a separate flow
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSaveProfile() {
    if (this.profileForm.invalid) return;
    
    this.isProfileLoading.set(true);
    const { fullName } = this.profileForm.value;

    this.userService.updateProfile({ fullName }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Profile updated successfully');
        this.isProfileLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update profile');
        this.isProfileLoading.set(false);
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.isPasswordLoading.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Password changed successfully');
        this.passwordForm.reset();
        this.isPasswordLoading.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to change password');
        this.isPasswordLoading.set(false);
      }
    });
  }
}
