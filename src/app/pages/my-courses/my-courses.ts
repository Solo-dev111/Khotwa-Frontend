
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { StudentCourseService, StudentEnrollment } from '../../core/services/student-course.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-my-courses',
  imports: [RouterLink],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.css'
})
export class MyCourses {

  private service = inject(StudentCourseService);

  auth = inject(AuthService);
  language = inject(LanguageService);

  enrollments = signal<StudentEnrollment[]>([]);

  loading = signal(true);
  error = signal('');

  pageNumber = signal(1);
  pageSize = 6;
  totalCount = signal(0);

  constructor() {
    afterNextRender(() => {

      if (this.auth.currentUser()?.role === 'Student') {
        this.loadCourses();
      } else {
        this.loading.set(false);
      }

    });
  }

  // Language
  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  // Load student courses
  loadCourses(page = 1): void {

    this.loading.set(true);
    this.error.set('');

    this.service.getMyEnrollments(page, this.pageSize)
      .subscribe({

        next: response => {

          this.enrollments.set(response.items);
          this.totalCount.set(response.totalCount);
          this.pageNumber.set(response.pageNumber);

          this.loading.set(false);
        },

        error: (err: HttpErrorResponse) => {

          console.error('My Courses Error:', err);

          this.loading.set(false);

          if (err.status === 401) {
            this.error.set(this.t(
              'انتهت جلسة تسجيل الدخول.',
              'Your session has expired.'
            ));
          } else if (err.status === 403) {
            this.error.set(this.t(
              'هذه الصفحة مخصصة للطلاب.',
              'This page is for students only.'
            ));
          } else {
            this.error.set(this.t(
              'تعذر تحميل دوراتك. حاول مجدداً.',
              'Could not load your courses. Please try again.'
            ));
          }
        }

      });
  }

  // Pagination
  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.loadCourses(this.pageNumber() - 1);
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.loadCourses(this.pageNumber() + 1);
    }
  }

  // Format enrollment date
  formatDate(value: string): string {

    const locale = this.language.current() === 'ar'
      ? 'ar'
      : 'en-US';

    return new Date(value).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

}
