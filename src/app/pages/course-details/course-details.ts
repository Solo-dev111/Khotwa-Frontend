import { FavoriteButton } from '../../shared/favorite-button/favorite-button';
import { LearningService, LearningStatus } from '../../core/services/learning.service';
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
 imports: [RouterLink, CourseReviews, DecimalPipe, FavoriteButton],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css'
})
export class CourseDetails {

  private learning = inject(LearningService);
  progress = signal<LearningStatus | null>(null);
  completing = signal(false);
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

    this.learning.get(this.courseId).subscribe({
      next: response => {
        this.progress.set(response);
        this.enrolled.set(response.enrolled);
        this.checkingEnrollment.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.checkingEnrollment.set(false);
        this.showError(err);
      }
    });
  }

  duration(minutes: number | null | undefined): string {
    if (minutes == null) return this.t('غير محددة', 'Not specified');
    const h = Math.floor(minutes / 60), m = minutes % 60;
    return [h ? h + this.t(' ساعة', ' h') : '', m ? m + this.t(' دقيقة', ' min') : ''].filter(Boolean).join(' ') || '0';
  }

  percent(): number {
    const p = this.progress();
    return p && p.totalLessons > 0 ? Math.min(100, Math.round(p.completedLessonIds.length * 100 / p.totalLessons)) : 0;
  }

  completeLesson(id: number): void {
    if (!this.enrolled() || this.completing()) return;
    this.completing.set(true);
    this.learning.complete(this.courseId, id).subscribe({
      next: p => { this.progress.set(p); this.completing.set(false); },
      error: err => { this.completing.set(false); this.showError(err); }
    });
  }

  printCertificate(): void {
    const c = this.progress()?.certificate;
    if (!c) return;
    const popup = window.open('', '_blank');
    if (!popup) { this.error.set(this.t('اسمح بالنوافذ المنبثقة لعرض الشهادة.', 'Allow popups to view the certificate.')); return; }
    popup.opener = null;
    const doc = popup.document;
    doc.title = this.t('شهادة إتمام - خطوة','Khotwa - Certificate');
    doc.documentElement.dir = this.language.current() === 'ar' ? 'rtl' : 'ltr';
    const style = doc.createElement('style');
    style.textContent = '@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#153e32;margin:0;padding:24px;text-align:center}main{border:6px double #355b48;padding:35px;min-height:145mm;box-sizing:border-box}h1{font-size:30px}h2{font-size:25px;overflow-wrap:anywhere}p{font-size:17px}small{font-size:12px;overflow-wrap:anywhere}button{margin:16px;padding:12px 20px;background:#355b48;color:white;border:0;border-radius:5px;cursor:pointer}@media print{button{display:none}body{padding:0}}';
    doc.head.append(style);
    const main = doc.createElement('main');
    const add = (tag: string, value: string) => {const el=doc.createElement(tag);el.textContent=value;main.append(el);};
    add('h1', this.t('خطوة | شهادة إتمام','Khotwa | Certificate of Completion'));
    add('p',this.t('تشهد منصة خطوة بإتمام الطالب','Khotwa certifies that'));
    add('h2',c.studentName);add('p',this.t('دورة','Course'));add('h2',c.courseTitle);
    add('p',this.t('المدرب: ','Instructor: ')+c.instructorName);
    add('p',this.t('المدة: ','Duration: ')+this.duration(c.durationMinutes));
    add('p',c.issuedAt.slice(0,10));add('small',c.certificateNumber);
    doc.body.append(main);
    const button=doc.createElement('button');button.textContent=this.t('طباعة / حفظ PDF','Print / save PDF');button.onclick=()=>popup.print();doc.body.append(button);
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
        this.checkEnrollment();

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
  useFallback(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/images/course-cover.svg')) {
      image.src = '/images/course-cover.svg';
    }
  }
}
