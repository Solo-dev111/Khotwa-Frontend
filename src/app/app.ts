
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LanguageService } from './core/services/language.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  language = inject(LanguageService);
  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = signal(false);
  headerSearch = '';

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  searchCourses(): void {
    this.router.navigate(['/'], {
      fragment: 'catalog',
      queryParams: this.headerSearch.trim() ? { search: this.headerSearch.trim() } : {}
    });
    this.closeMenu();
  }
}
