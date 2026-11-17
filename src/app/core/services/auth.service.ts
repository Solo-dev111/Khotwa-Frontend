
import {
  Injectable,
  inject,
  signal,
  afterNextRender,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

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
  private platformId = inject(PLATFORM_ID);

  private apiUrl = `${API_BASE_URL}/Auth`;
  private sessionRestored = false;

  currentUser = signal<AuthResponse | null>(null);

  constructor() {
    afterNextRender(() => {
      this.restoreSession();
    });
  }

  /** Restore the browser session synchronously before a protected route is checked. */
  restoreSession(): AuthResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.sessionRestored) {
      const current = this.currentUser();
      if (current && new Date(current.expiresAt).getTime() <= Date.now()) {
        this.logout();
        return null;
      }
      return current;
    }

    this.sessionRestored = true;
    const saved = localStorage.getItem('khotwa_auth');
    if (!saved) return null;

    try {
      const user = JSON.parse(saved) as AuthResponse;
      const expiry = new Date(user.expiresAt).getTime();

      if (user.token && Number.isFinite(expiry) && expiry > Date.now()) {
        this.currentUser.set(user);
        return user;
      }
    } catch {
      // Invalid session data is discarded below.
    }

    this.logout();
    return null;
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
    this.sessionRestored = true;
    this.currentUser.set(user);

    localStorage.setItem(
      'khotwa_auth',
      JSON.stringify(user)
    );
  }

  // LOGOUT
  logout(): void {
    this.sessionRestored = true;
    this.currentUser.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('khotwa_auth');
    }
  }
}
