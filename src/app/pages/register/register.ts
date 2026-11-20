
import { Component, inject, signal, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AuthService,
  RegisterRole
} from '../../core/services/auth.service';

import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: '../auth.css'
})
export class Register {
  private auth = inject(AuthService);
  language = inject(LanguageService);
  private router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  role: RegisterRole = 'student';

  loading = signal(false);
  error = signal<'emailExists' | 'authError' | 'adminUnavailable' | null>(null);
  canRegisterAdmin = signal(false);
  checkingStatus = signal(true);
  statusError = signal(false);

  constructor() {
    afterNextRender(() => this.loadRegistrationStatus());
  }

  loadRegistrationStatus(): void {
    this.checkingStatus.set(true);
    this.statusError.set(false);
    this.auth.registrationStatus().subscribe({
      next: status => {
        this.canRegisterAdmin.set(status.canRegisterAdmin);
        if (status.canRegisterAdmin) this.role = 'admin';
        else if (this.role === 'admin') this.role = 'student';
        this.checkingStatus.set(false);
      },
      error: () => {
        this.canRegisterAdmin.set(false);
        this.statusError.set(true);
        this.checkingStatus.set(false);
      }
    });
  }

  submit(): void {
    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      this.password.length < 8 ||
      this.loading() || this.checkingStatus() || this.statusError() ||
      (this.role === 'admin' && !this.canRegisterAdmin())
    ) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.register({
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password
    }, this.role).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.role === 'admin' ? '/admin/users' : '/');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 403 && this.role === 'admin') {
          this.canRegisterAdmin.set(false);
          this.role = 'student';
          this.error.set('adminUnavailable');
          this.loadRegistrationStatus();
        } else {
          this.error.set(err.status === 409 ? 'emailExists' : 'authError');
        }
      }
    });
  }
}
