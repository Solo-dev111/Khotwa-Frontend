
import { Component, inject, signal } from '@angular/core';
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
  error = signal<'emailExists' | 'authError' | null>(null);

  submit(): void {
    if (
      !this.fullName.trim() ||
      !this.email.trim() ||
      this.password.length < 8 ||
      this.loading()
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
        this.router.navigateByUrl('/');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 409 ? 'emailExists' : 'authError'
        );
      }
    });
  }
}
