
import {
  Component,
  inject,
  signal,
  afterNextRender,
  ElementRef,
  Injector
} from '@angular/core';

import { CourseImagePicker, isCourseImageUrlValid } from '../../../shared/course-image-picker/course-image-picker';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CourseService,
  Course,
  Category,
  SaveCourseDto
} from '../../../core/services/course.service';

import {
  UserService,
  AdminUser
} from '../../../core/services/user.service';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-courses',
  imports: [FormsModule, CourseImagePicker],
  templateUrl: './courses.html',
  styleUrl: './courses.css'
})
export class Courses {

  private courseService = inject(CourseService);
  private userService = inject(UserService);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  auth = inject(AuthService);
  language = inject(LanguageService);

  courses = signal<Course[]>([]);
  categories = signal<Category[]>([]);
  instructors = signal<AdminUser[]>([]);

  loading = signal(true);
  loadingOptions = signal(true);
  saving = signal(false);
  uploading = signal(false);
  deletingId = signal<number | null>(null);

  error = signal('');
  message = signal('');

  // Filters
  search = '';
  categoryFilter: number | null = null;
  levelFilter = '';
  publicationFilter: '' | 'true' | 'false' = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Pagination
  pageNumber = 1;
  pageSize = 8;
  totalCount = signal(0);

  // Form
  formOpen = signal(false);
  editingId: number | null = null;

  form: SaveCourseDto = this.emptyForm();

  readonly levels = [
    'Beginner',
    'Intermediate',
    'Advanced'
  ];

  constructor() {
    afterNextRender(() => {
      if (this.isAdmin()) {
        this.loadOptions();
        this.loadCourses();
      } else {
        this.loading.set(false);
        this.loadingOptions.set(false);
      }
    });
  }

  private scrollToEditor(): void {
    afterNextRender(() => {
      this.host.nativeElement.querySelector<HTMLElement>('.editor-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, { injector: this.injector });
  }

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'Admin';
  }

  private emptyForm(): SaveCourseDto {
    return {
      title: '',
      description: '',
      price: 0,
      level: 'Beginner',
      thumbnailUrl: null,
      isPublished: false,
      categoryId: 0,
      instructorId: null
    };
  }

  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  // LOAD CATEGORIES AND INSTRUCTORS
  loadOptions(): void {

    this.loadingOptions.set(true);

    this.courseService.getCategories().subscribe({
      next: result => {
        this.categories.set(result.items);
      },
      error: err => {
        console.error('Categories Error:', err);
      }
    });

    this.userService.getAll(
      '',
      'Instructor',
      1,
      100
    ).subscribe({
      next: result => {
        this.instructors.set(result.items);
        this.loadingOptions.set(false);
      },
      error: err => {
        console.error('Instructors Error:', err);
        this.loadingOptions.set(false);
      }
    });
  }

  // LOAD ALL COURSES
  loadCourses(page = this.pageNumber): void {

    if (!this.isAdmin()) return;

    this.loading.set(true);
    this.error.set('');

    const isPublished =
      this.publicationFilter === ''
        ? null
        : this.publicationFilter === 'true';

    this.courseService.getAdminCourses({
      search: this.search,
      categoryId: this.categoryFilter,
      level: this.levelFilter,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      isPublished,
      pageNumber: page,
      pageSize: this.pageSize
    }).subscribe({

      next: result => {
        this.courses.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber = result.pageNumber;
        this.loading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }

    });
  }

  applyFilters(): void {

    if (
      this.minPrice !== null &&
      this.minPrice < 0 ||
      this.maxPrice !== null &&
      this.maxPrice < 0
    ) {
      this.error.set(this.t(
        'السعر لا يمكن أن يكون سالباً.',
        'Price cannot be negative.'
      ));
      return;
    }

    if (
      this.minPrice !== null &&
      this.maxPrice !== null &&
      this.minPrice > this.maxPrice
    ) {
      this.error.set(this.t(
        'السعر الأدنى لا يمكن أن يتجاوز السعر الأعلى.',
        'Minimum price cannot exceed maximum price.'
      ));
      return;
    }

    this.pageNumber = 1;
    this.message.set('');
    this.loadCourses(1);
  }

  // FORM: CREATE
  openCreate(): void {
    if (this.saving() || this.uploading()) return;

    this.editingId = null;
    this.form = this.emptyForm();

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  // FORM: EDIT
  openEdit(course: Course): void {
    if (this.saving() || this.uploading()) return;

    this.editingId = course.id;

    this.form = {
      title: course.title,
      description: course.description,
      price: course.price,
      level: course.level,
      thumbnailUrl: course.thumbnailUrl,
      isPublished: course.isPublished,
      categoryId: course.categoryId,
      instructorId: course.instructorId
    };

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
    this.scrollToEditor();
  }

  closeForm(): void {

    if (this.saving() || this.uploading()) return;

    this.formOpen.set(false);
    this.editingId = null;
    this.form = this.emptyForm();
  }

  // SAVE COURSE
  save(): void {

    if (!this.isAdmin() || this.saving() || this.uploading()) return;

    if (!isCourseImageUrlValid(this.form.thumbnailUrl)) {
      this.error.set(this.t('أدخل رابط صورة صحيحاً يبدأ بـ http أو https.', 'Enter a valid HTTP or HTTPS image URL.'));
      return;
    }

    const title = this.form.title.trim();
    const description = this.form.description.trim();
    const level = this.form.level.trim();

    if (!title || !description || !level) {
      this.error.set(this.t(
        'يرجى تعبئة عنوان الدورة والوصف والمستوى.',
        'Title, description and level are required.'
      ));
      return;
    }

    if (this.form.price < 0) {
      this.error.set(this.t(
        'السعر لا يمكن أن يكون سالباً.',
        'Price cannot be negative.'
      ));
      return;
    }

    if (!this.form.categoryId || !this.form.instructorId) {
      this.error.set(this.t(
        'اختر التصنيف والمدرب المسؤول عن الدورة.',
        'Please select a category and instructor.'
      ));
      return;
    }

    const data: SaveCourseDto = {
      ...this.form,
      title,
      description,
      level,
      thumbnailUrl: this.form.thumbnailUrl?.trim() || null
    };

    const isEditing = this.editingId !== null;

    const request: Observable<Course | void> = isEditing
      ? this.courseService.updateCourse(this.editingId!, data)
      : this.courseService.createCourse(data);

    this.saving.set(true);
    this.error.set('');

    request.subscribe({

      next: () => {

        this.saving.set(false);
        this.closeForm();

        this.message.set(isEditing
          ? this.t('تم تحديث الدورة بنجاح.', 'Course updated.')
          : this.t('تم إنشاء الدورة بنجاح.', 'Course created.')
        );

        if (!isEditing) {
          this.pageNumber = 1;
        }

        this.loadCourses(this.pageNumber);
      },

      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(err);
      }

    });
  }

  // DELETE COURSE
  remove(course: Course): void {

    if (
      !this.isAdmin() ||
      this.deletingId() !== null
    ) {
      return;
    }

    const confirmed = confirm(this.t(
      `هل تريد حذف الدورة "${course.title}"؟`,
      `Delete the course "${course.title}"?`
    ));

    if (!confirmed) return;

    this.deletingId.set(course.id);
    this.error.set('');
    this.message.set('');

    this.courseService.deleteCourse(course.id).subscribe({

      next: () => {

        this.deletingId.set(null);

        this.message.set(this.t(
          'تم حذف الدورة بنجاح.',
          'Course deleted successfully.'
        ));

        if (
          this.courses().length === 1 &&
          this.pageNumber > 1
        ) {
          this.pageNumber--;
        }

        this.loadCourses(this.pageNumber);
      },

      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.showError(err);
      }

    });
  }

  useImageFallback(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/images/course-cover.svg')) {
      image.src = '/images/course-cover.svg';
    }
  }

  // DISPLAY HELPERS
  levelName(level: string): string {

    const value = level.toLowerCase();

    if (value === 'beginner') {
      return this.t('مبتدئ', 'Beginner');
    }

    if (value === 'intermediate') {
      return this.t('متوسط', 'Intermediate');
    }

    if (value === 'advanced') {
      return this.t('متقدم', 'Advanced');
    }

    return level;
  }

  formatDate(value: string): string {

    return new Date(value).toLocaleDateString(
      this.language.current() === 'ar' ? 'ar' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  // ERROR HANDLING
  private showError(err: HttpErrorResponse): void {

    console.error('Admin Courses API:', err);

    if (err.status === 401) {
      this.error.set(this.t(
        'انتهت الجلسة. سجّل الدخول مجدداً.',
        'Session expired. Please log in again.'
      ));
    } else if (err.status === 403) {
      this.error.set(this.t(
        'ليست لديك صلاحية لإدارة الدورات.',
        'You are not authorized to manage courses.'
      ));
    } else if (err.status === 404) {
      this.error.set(this.t(
        'الدورة أو التصنيف أو المدرب غير موجود.',
        'Course, category or instructor not found.'
      ));
    } else if (err.status === 409) {
      this.error.set(this.t(
        'لا يمكن حذف هذه الدورة لأنها مرتبطة بتسجيلات أو طلبات أو تقييمات.',
        'Cannot delete this course because it has enrollments, orders or reviews.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'البيانات غير صحيحة. تحقق من التصنيف والمدرب والحقول المطلوبة.',
        'Invalid data. Check the category, instructor and required fields.'
      ));
    } else {
      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'A server error occurred.'
      ));
    }
  }
}
