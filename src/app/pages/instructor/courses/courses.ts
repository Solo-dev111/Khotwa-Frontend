import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import {
  InstructorCourseService,
  SaveCourse
} from '../../../core/services/instructor-course.service';

import {
  CourseService,
  Course,
  Category
} from '../../../core/services/course.service';

import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-instructor-courses',
  imports: [FormsModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css'
})
export class Courses {

  private service = inject(InstructorCourseService);
  private courseService = inject(CourseService);
  private router = inject(Router);


  language = inject(LanguageService);

  courses = signal<Course[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(true);
  saving = signal(false);
  uploading = signal(false);

  error = signal('');
  message = signal('');

  formOpen = signal(false);
  editingId: number | null = null;

  search = '';
  publicationFilter = '';

  pageNumber = 1;
  pageSize = 6;
  totalPages = signal(0);
  totalCount = signal(0);

  form: SaveCourse = this.emptyForm();

  constructor() {
    afterNextRender(() => {
      this.loadCategories();
      this.loadCourses();
    });

  }


  manageLessons(course: Course): void {
  this.router.navigate([
    '/instructor/courses',
    course.id,
    'lessons'
    ]);
  }

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  private emptyForm(): SaveCourse {
    return {
      title: '',
      description: '',
      price: 0,
      level: 'Beginner',
      thumbnailUrl: null,
      isPublished: false,
      categoryId: 0
    };
  }

  // GET CATEGORIES
  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: response => {
        this.categories.set(response.items);
      },
      error: err => {
        console.error('Categories error:', err);

        this.error.set(this.t(
          'تعذر تحميل التصنيفات.',
          'Could not load categories.'
        ));
      }
    });
  }

  // GET MY COURSES
  loadCourses(): void {
    this.loading.set(true);

    const published =
      this.publicationFilter === ''
        ? null
        : this.publicationFilter === 'true';

    this.service.getMine({
      search: this.search,
      isPublished: published,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize
    }).subscribe({
      next: response => {
        this.courses.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);

        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  // SEARCH
  applyFilters(): void {
    this.pageNumber = 1;
    this.loadCourses();
  }

  // PAGINATION
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pageNumber = page;
    this.loadCourses();
  }

  // SHOW CREATE FORM
  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  // SHOW EDIT FORM
  openEdit(course: Course): void {
    this.editingId = course.id;

    this.form = {
      title: course.title,
      description: course.description,
      price: course.price,
      level: course.level,
      thumbnailUrl: course.thumbnailUrl,
      isPublished: course.isPublished,
      categoryId: course.categoryId
    };

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  // CLOSE FORM
  closeForm(): void {
    if (this.saving() || this.uploading()) {
      return;
    }

    this.formOpen.set(false);
    this.editingId = null;
    this.form = this.emptyForm();
  }

  // UPLOAD IMAGE FROM DEVICE
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.type)) {
      this.error.set(this.t(
        'اختر صورة JPG أو PNG أو WEBP.',
        'Choose a JPG, PNG or WEBP image.'
      ));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.error.set(this.t(
        'حجم الصورة يجب ألا يتجاوز 3 ميجابايت.',
        'Image must not exceed 3 MB.'
      ));
      return;
    }

    this.uploading.set(true);
    this.error.set('');

    this.service.uploadImage(file).subscribe({
      next: response => {
        this.form.thumbnailUrl = response.url;
        this.uploading.set(false);
      },
      error: err => {
        this.uploading.set(false);
        this.showError(err);
      }
    });
  }

  // CREATE OR UPDATE COURSE
  save(): void {
    if (this.saving() || this.uploading()) {
      return;
    }

    if (
      !this.form.title.trim() ||
      !this.form.description.trim() ||
      this.form.categoryId <= 0 ||
      this.form.price < 0
    ) {
      this.error.set(this.t(
        'تأكد من تعبئة جميع البيانات المطلوبة.',
        'Please complete all required fields.'
      ));
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const data: SaveCourse = {
      ...this.form,
      title: this.form.title.trim(),
      description: this.form.description.trim()
    };

    const isEditing = this.editingId !== null;

    
const request: Observable<Course | void> = isEditing
  ? this.service.update(this.editingId!, data)
  : this.service.create(data);


    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();

        this.message.set(isEditing
          ? this.t('تم تعديل الدورة بنجاح.', 'Course updated.')
          : this.t('تم إنشاء الدورة بنجاح.', 'Course created.')
        );

        this.pageNumber = 1;
        this.loadCourses();
      },
      error: (err: HttpErrorResponse) =>  {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  // DELETE
  remove(course: Course): void {
    const confirmed = confirm(this.t(
      `هل تريد حذف دورة "${course.title}"؟`,
      `Delete "${course.title}"?`
    ));

    if (!confirmed) return;

    this.error.set('');
    this.message.set('');

    this.service.delete(course.id).subscribe({
      next: () => {
        this.message.set(this.t(
          'تم حذف الدورة بنجاح.',
          'Course deleted.'
        ));

        if (this.courses().length === 1 &&
            this.pageNumber > 1) {
          this.pageNumber--;
        }

        this.loadCourses();
      },
      error: err => this.showError(err)
    });
  }

  // DISPLAY HTTP ERRORS
  private showError(err: HttpErrorResponse): void {
    console.error('Course API Error:', err);

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
    } else if (err.status === 409) {
      this.error.set(this.t(
        'لا يمكن حذف الدورة لأنها مرتبطة بتسجيلات أو مشتريات.',
        'Cannot delete a course with enrollments or purchases.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'البيانات غير صحيحة. تأكد من التصنيف وبقية الحقول.',
        'Invalid data. Check category and other fields.'
      ));
    } else {
      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'A server connection error occurred.'
      ));
    }
  }
}
