
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  LessonService,
  Lesson,
  LessonSummary,
  SaveLesson
} from '../../../core/services/lesson.service';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-lessons',
  imports: [FormsModule],
  templateUrl: './lessons.html',
  styleUrl: './lessons.css'
})
export class Lessons {

  private service = inject(LessonService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  language = inject(LanguageService);

  // Read the course ID from the URL
  courseId = Number(
    this.route.snapshot.paramMap.get('courseId')
  );

  courseTitle = signal('');
  lessons = signal<LessonSummary[]>([]);

  loading = signal(true);
  loadingDetails = signal(false);
  saving = signal(false);
  deletingId = signal<number | null>(null);

  formOpen = signal(false);
  error = signal('');
  message = signal('');

  editingId: number | null = null;

  form: SaveLesson = this.emptyForm();

  constructor() {
    afterNextRender(() => {
      if (
        !Number.isInteger(this.courseId) ||
        this.courseId <= 0
      ) {
        this.goBack();
        return;
      }

      this.loadCourse();
      this.loadLessons();
    });
  }

  // Arabic / English
  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  // Empty form
  private emptyForm(): SaveLesson {
    return {
      title: '',
      content: '',
      videoUrl: '',
      durationMinutes: null,
      sortOrder: 1,
      isPreview: false
    };
  }

  // Return to instructor courses
  goBack(): void {
    this.router.navigateByUrl('/instructor/courses');
  }

  // Load course title
  loadCourse(): void {
    this.service.getCourse(this.courseId).subscribe({
      next: course => {
        this.courseTitle.set(course.title);
      },
      error: (err: HttpErrorResponse) => {
        this.showError(err);
      }
    });
  }

  // Load course lessons
  loadLessons(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getByCourse(this.courseId).subscribe({
      next: response => {
        this.lessons.set(response);
        this.loading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  // Show create form
  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();

    // Default order: after the last lesson
    const orders = this.lessons().map(
      lesson => lesson.sortOrder
    );

    this.form.sortOrder = Math.max(0, ...orders) + 1;

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  // Show edit form and load full lesson data
  openEdit(id: number): void {
    if (this.loadingDetails()) return;

    this.loadingDetails.set(true);
    this.error.set('');
    this.message.set('');

    this.service.getById(id).subscribe({
      next: lesson => {
        this.editingId = lesson.id;

        this.form = {
          title: lesson.title,
          content: lesson.content ?? '',
          videoUrl: lesson.videoUrl ?? '',
          durationMinutes: lesson.durationMinutes,
          sortOrder: lesson.sortOrder,
          isPreview: lesson.isPreview
        };

        this.formOpen.set(true);
        this.loadingDetails.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loadingDetails.set(false);
        this.showError(err);
      }
    });
  }

  // Close form
  closeForm(): void {
    if (this.saving() || this.loadingDetails()) {
      return;
    }

    this.formOpen.set(false);
    this.editingId = null;
    this.form = this.emptyForm();
  }

  // Create or update lesson
  save(): void {
    if (this.saving() || this.loadingDetails()) {
      return;
    }

    if (
      !this.form.title.trim() ||
      !Number.isInteger(this.form.durationMinutes) || (this.form.durationMinutes ?? 0) < 1 || (this.form.durationMinutes ?? 0) > 1440 ||
      !Number.isInteger(this.form.sortOrder) ||
      this.form.sortOrder < 0
    ) {
      this.error.set(this.t(
        'تأكد من عنوان الدرس وترتيبه.',
        'Check the lesson title and order.'
      ));
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    const data: SaveLesson = {
      title: this.form.title.trim(),
      content: this.form.content?.trim() || null,
      videoUrl: this.form.videoUrl?.trim() || null,
      durationMinutes: this.form.durationMinutes,
      sortOrder: this.form.sortOrder,
      isPreview: this.form.isPreview
    };

    const isEditing = this.editingId !== null;

    // Explicit union type avoids subscribe errors
    const request: Observable<Lesson | void> = isEditing
      ? this.service.update(this.editingId!, data)
      : this.service.create(this.courseId, data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();

        this.message.set(
          isEditing
            ? this.t(
                'تم تعديل الدرس بنجاح.',
                'Lesson updated successfully.'
              )
            : this.t(
                'تمت إضافة الدرس بنجاح.',
                'Lesson created successfully.'
              )
        );

        this.loadLessons();
      },

      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  // Delete lesson
  remove(lesson: LessonSummary): void {
    if (this.deletingId() !== null) return;

    const confirmed = confirm(this.t(
      `هل تريد حذف الدرس "${lesson.title}"؟`,
      `Delete lesson "${lesson.title}"?`
    ));

    if (!confirmed) return;

    this.error.set('');
    this.message.set('');
    this.deletingId.set(lesson.id);

    this.service.delete(lesson.id).subscribe({
      next: () => {
        this.deletingId.set(null);

        // Close editor if the deleted lesson was open
        if (this.editingId === lesson.id) {
          this.closeForm();
        }

        this.message.set(this.t(
          'تم حذف الدرس بنجاح.',
          'Lesson deleted successfully.'
        ));

        this.loadLessons();
      },

      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.showError(err);
      }
    });
  }

  // Handle errors
  private showError(err: HttpErrorResponse): void {
    console.error('Lessons API Error:', err);

    if (err.status === 401) {
      this.error.set(this.t(
        'انتهت الجلسة. سجّل الدخول مجدداً.',
        'Session expired. Please log in again.'
      ));
    } else if (err.status === 403) {
      this.error.set(this.t(
        'لا يمكنك إدارة دروس دورة لا تملكها.',
        'You cannot manage another instructor’s lessons.'
      ));
    } else if (err.status === 404) {
      this.error.set(this.t(
        'الدورة أو الدرس غير موجود.',
        'Course or lesson not found.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'بيانات الدرس غير صحيحة.',
        'Invalid lesson data.'
      ));
    } else {
      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'A server connection error occurred.'
      ));
    }
  }
}
