
import {
  Component,
  inject,
  input,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ReviewService,
  Review,
  SaveReview,
  UpdateReview
} from '../../core/services/review.service';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-course-reviews',
  imports: [FormsModule],
  templateUrl: './course-reviews.html',
  styleUrl: './course-reviews.css'
})
export class CourseReviews {

  private service = inject(ReviewService);

  auth = inject(AuthService);
  language = inject(LanguageService);

  // Values received from CourseDetails
  courseId = input.required<number>();
  canWrite = input(false);

  reviews = signal<Review[]>([]);
  myReview = signal<Review | null>(null);

  loading = signal(true);
  loadingMine = signal(true);
  saving = signal(false);
  deleting = signal(false);

  formOpen = signal(false);

  error = signal('');
  message = signal('');

  pageNumber = signal(1);
  totalCount = signal(0);

  readonly pageSize = 5;
  readonly stars = [1, 2, 3, 4, 5];

  rating = 5;
  comment = '';

  constructor() {
    afterNextRender(() => {
      this.loadReviews();

      if (this.auth.currentUser()?.role === 'Student') {
        this.loadMyReview();
      } else {
        this.loadingMine.set(false);
      }
    });
  }

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  // Public course reviews
  loadReviews(page = 1): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getByCourse(
      this.courseId(),
      page,
      this.pageSize
    ).subscribe({
      next: result => {
        this.reviews.set(result.items);
        this.totalCount.set(result.totalCount);
        this.pageNumber.set(result.pageNumber);
        this.loading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  // Find the student's review of this course
  loadMyReview(page = 1): void {
    this.loadingMine.set(true);

    this.service.getMine(page, 100).subscribe({
      next: result => {
        const found = result.items.find(
          review => review.courseId === this.courseId()
        );

        if (found) {
          this.myReview.set(found);
          this.loadingMine.set(false);
          return;
        }

        // Continue if the student has more reviews
        if (
          result.items.length > 0 &&
          page * 100 < result.totalCount
        ) {
          this.loadMyReview(page + 1);
          return;
        }

        this.myReview.set(null);
        this.loadingMine.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loadingMine.set(false);
        this.showError(err);
      }
    });
  }

  // Add a new review
  openCreate(): void {
    if (
      !this.canWrite() ||
      this.loadingMine() ||
      this.myReview()
    ) {
      return;
    }

    this.rating = 5;
    this.comment = '';
    this.formOpen.set(true);

    this.error.set('');
    this.message.set('');
  }

  // Edit existing review
  openEdit(): void {
    const review = this.myReview();

    if (!review || !this.canWrite()) {
      return;
    }

    this.rating = review.rating;
    this.comment = review.comment ?? '';

    this.formOpen.set(true);
    this.error.set('');
    this.message.set('');
  }

  closeForm(): void {
    if (this.saving()) return;

    this.formOpen.set(false);
    this.error.set('');
  }

  // Save review
  save(): void {
    if (
      !this.canWrite() ||
      this.saving() ||
      !this.formOpen()
    ) {
      return;
    }

    if (
      !Number.isInteger(this.rating) ||
      this.rating < 1 ||
      this.rating > 5 ||
      this.comment.trim().length > 1000
    ) {
      this.error.set(this.t(
        'اختر تقييماً بين 1 و5 نجوم، ولا تتجاوز 1000 حرف.',
        'Choose 1–5 stars and use at most 1000 characters.'
      ));
      return;
    }

    const previous = this.myReview();

    const data: SaveReview = {
      courseId: this.courseId(),
      rating: this.rating,
      comment: this.comment.trim() || null
    };

    const updateData: UpdateReview = {
      rating: data.rating,
      comment: data.comment
    };

    const request: Observable<Review | void> = previous
      ? this.service.update(previous.id, updateData)
      : this.service.create(data);

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);

        this.message.set(previous
          ? this.t('تم تعديل تقييمك.', 'Review updated.')
          : this.t('تم نشر تقييمك.', 'Review published.')
        );

        this.loadReviews(1);
        this.loadMyReview();
      },

      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(err);

        if (err.status === 409) {
          this.loadMyReview();
        }
      }
    });
  }

  // Delete own review
  remove(): void {
    const review = this.myReview();

    if (
      !review ||
      !this.canWrite() ||
      this.deleting()
    ) {
      return;
    }

    const confirmed = confirm(this.t(
      'هل تريد حذف تقييمك نهائياً؟',
      'Are you sure you want to delete your review?'
    ));

    if (!confirmed) return;

    this.deleting.set(true);
    this.error.set('');
    this.message.set('');

    this.service.delete(review.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.myReview.set(null);
        this.formOpen.set(false);

        this.message.set(this.t(
          'تم حذف تقييمك.',
          'Your review was deleted.'
        ));

        this.loadReviews(1);
      },

      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.showError(err);
      }
    });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.loadReviews(this.pageNumber() - 1);
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages) {
      this.loadReviews(this.pageNumber() + 1);
    }
  }

  formatDate(value: string): string {
    const locale = this.language.current() === 'ar'
      ? 'ar'
      : 'en-US';

    return new Date(value).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  private showError(err: HttpErrorResponse): void {
    console.error('Review API Error:', err);

    if (err.status === 401) {
      this.error.set(this.t(
        'انتهت الجلسة. سجّل الدخول مجدداً.',
        'Session expired. Please sign in again.'
      ));
    } else if (err.status === 403) {
      this.error.set(this.t(
        'ليست لديك صلاحية لتنفيذ هذه العملية.',
        'You do not have permission.'
      ));
    } else if (err.status === 404) {
      this.error.set(this.t(
        'التقييم أو الدورة غير موجود.',
        'Review or course not found.'
      ));
    } else if (err.status === 409) {
      this.error.set(this.t(
        'سبق أن قيّمت هذه الدورة. يمكنك تعديل تقييمك.',
        'You already reviewed this course. Edit your existing review.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'تعذر حفظ التقييم. تأكد من تسجيلك في الدورة وصحة البيانات.',
        'Could not save review. Check enrollment and review data.'
      ));
    } else {
      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'A server connection error occurred.'
      ));
    }
  }
}
