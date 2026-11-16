
import {
  Injectable,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type RegisterRole = 'student' | 'instructor';

export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7194/api/Auth';

  currentUser = signal<AuthResponse | null>(null);

  constructor() {
    afterNextRender(() => {
      const saved = localStorage.getItem('khotwa_auth');

      if (!saved) return;

      try {
        const user: AuthResponse = JSON.parse(saved);

        if (new Date(user.expiresAt).getTime() > Date.now()) {
          this.currentUser.set(user);
        } else {
          this.logout();
        }
      } catch {
        this.logout();
      }
    });
  }

  // LOGIN
  login(
    email: string,
    password: string
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // REGISTER STUDENT OR INSTRUCTOR
  register(
    data: RegisterRequest,
    role: RegisterRole
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register/${role}`,
      data
    ).pipe(
      tap(response => this.saveSession(response))
    );
  }

  // SAVE USER
  private saveSession(user: AuthResponse): void {
    this.currentUser.set(user);

    localStorage.setItem(
      'khotwa_auth',
      JSON.stringify(user)
    );
  }

  // LOGOUT
  logout(): void {
    this.currentUser.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('khotwa_auth');
    }
  }
}
