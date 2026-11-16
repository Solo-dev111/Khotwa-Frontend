
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth.css'
})
export class Login {
  auth = inject(AuthService);
  language = inject(LanguageService);
  private router = inject(Router);

  email = '';
  password = '';

  loading = signal(false);
  error = signal<'invalidLogin' | 'authError' | null>(null);

  submit(): void {
    if (!this.email.trim() || !this.password || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 401 ? 'invalidLogin' : 'authError'
        );
      }
    });
  }
}
