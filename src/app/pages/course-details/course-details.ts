import { Observable } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { CourseReviews } from '../course-reviews/course-reviews';

import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Course
} from '../../core/services/course.service';

import {
  LessonService,
  Lesson,
  LessonSummary
} from '../../core/services/lesson.service';

import {
  StudentCourseService
} from '../../core/services/student-course.service';

import {
  AuthService
} from '../../core/services/auth.service';

import {
  LanguageService
} from '../../core/services/language.service';

@Component({
  selector: 'app-course-details',
 imports: [RouterLink, CourseReviews, DecimalPipe],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css'
})
export class CourseDetails {

  private route = inject(ActivatedRoute);
  private lessonService = inject(LessonService);
  private studentService = inject(StudentCourseService);

  auth = inject(AuthService);
  language = inject(LanguageService);

  courseId = Number(this.route.snapshot.paramMap.get('id'));

  course = signal<Course | null>(null);
  lessons = signal<LessonSummary[]>([]);

  selectedLesson = signal<Lesson | null>(null);

  loading = signal(true);
  lessonsLoading = signal(true);
  lessonLoading = signal(false);
  checkingEnrollment = signal(false);

  busy = signal(false);
  enrolled = signal(false);

  error = signal('');
  lessonError = signal('');
  message = signal('');

  constructor() {
    afterNextRender(() => {
      if (!Number.isInteger(this.courseId) || this.courseId <= 0) {
        this.loading.set(false);
        this.lessonsLoading.set(false);
        this.error.set(this.t(
          'رابط الدورة غير صحيح.',
          'Invalid course link.'
        ));
        return;
      }

      this.loadCourse();
      this.loadLessons();

      if (this.auth.currentUser()?.role === 'Student') {
        this.checkEnrollment();
      }
    });
  }

  // Arabic / English
  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  // Get course details
  loadCourse(): void {
    this.loading.set(true);
    this.error.set('');

    this.lessonService.getCourse(this.courseId).subscribe({
      next: response => {
        this.course.set(response);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  // Get course lesson titles
  loadLessons(): void {
    this.lessonsLoading.set(true);

    this.lessonService.getByCourse(this.courseId).subscribe({
      next: response => {
        this.lessons.set(response);
        this.lessonsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.lessonsLoading.set(false);
        console.error('Lessons:', err);
      }
    });
  }

  // Check whether student already owns the course
  checkEnrollment(): void {
    this.checkingEnrollment.set(true);

    this.studentService.getMyEnrollments().subscribe({
      next: response => {
        this.enrolled.set(
          response.items.some(e => e.courseId === this.courseId)
        );
        this.checkingEnrollment.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.checkingEnrollment.set(false);
        this.showError(err);
      }
    });
  }

  // Access rules for lesson viewing
  canViewLesson(lesson: LessonSummary): boolean {
    if (lesson.isPreview || this.enrolled()) {
      return true;
    }

    const user = this.auth.currentUser();
    const course = this.course();

    if (!user || !course) {
      return false;
    }

    return user.role === 'Admin' ||
      (
        user.role === 'Instructor' &&
        user.userId === course.instructorId
      );
  }

  // Open a lesson and display its content
  openLesson(lesson: LessonSummary): void {
    if (!this.canViewLesson(lesson)) {
      return;
    }

    this.lessonLoading.set(true);
    this.lessonError.set('');
    this.selectedLesson.set(null);

    this.lessonService.getById(lesson.id).subscribe({
      next: response => {
        this.selectedLesson.set(response);
        this.lessonLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.lessonLoading.set(false);

        this.lessonError.set(this.t(
          'تعذر فتح الدرس. تحقق من صلاحية الوصول.',
          'Could not open the lesson. Check your access.'
        ));

        console.error('Lesson error:', err);
      }
    });
  }

  // Allow HTTP/HTTPS video links only
  videoLink(url: string | null): string | null {
    const value = url?.trim() ?? '';

    return /^https?:\/\//i.test(value) ? value : null;
  }

  // Free enrollment or paid demo purchase
  enrollOrBuy(): void {
    const user = this.auth.currentUser();
    const course = this.course();

    if (
      !user ||
      user.role !== 'Student' ||
      !course ||
      this.busy() ||
      this.enrolled()
    ) {
      return;
    }

    this.busy.set(true);
    this.error.set('');
    this.message.set('');

    const request: Observable<unknown> = course.price === 0
  ? this.studentService.enrollFree(course.id)
  : this.studentService.purchaseDemo(course.id);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.enrolled.set(true);

        this.message.set(this.t(
          'تم تسجيلك في الدورة بنجاح! يمكنك الآن مشاهدة دروسها.',
          'Enrollment successful! You can now view the lessons.'
        ));
      },
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.showError(err);
      }
    });
  }

  // Friendly error messages
  private showError(err: HttpErrorResponse): void {
    console.error('Course Details API:', err);

    if (err.status === 401) {
      this.error.set(this.t(
        'انتهت الجلسة. سجّل الدخول مجدداً.',
        'Session expired. Please log in again.'
      ));
    } else if (err.status === 403) {
      this.error.set(this.t(
        'ليست لديك صلاحية لهذه العملية.',
        'You do not have permission.'
      ));
    } else if (err.status === 404) {
      this.error.set(this.t(
        'الدورة غير موجودة أو غير متاحة.',
        'Course not found or unavailable.'
      ));
    } else if (err.status === 409) {
      this.error.set(this.t(
        'أنت مسجل بالفعل في هذه الدورة أو يوجد تعارض في الطلب.',
        'You are already enrolled or the request conflicts.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'تعذر تنفيذ العملية. تحقق من بيانات الدورة.',
        'Could not complete the request.'
      ));
    } else {
      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'An error occurred while connecting to the server.'
      ));
    }
  }
}
