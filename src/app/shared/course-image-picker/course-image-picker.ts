import { Component, DestroyRef, computed, inject, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { InstructorCourseService } from '../../core/services/instructor-course.service';
import { LanguageService } from '../../core/services/language.service';

export function isCourseImageUrlValid(value: string | null): boolean {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
  } catch {
    return false;
  }
}

@Component({
  selector: 'app-course-image-picker',
  templateUrl: './course-image-picker.html',
  styleUrl: './course-image-picker.css'
})
export class CourseImagePicker {
  // The existing upload endpoint supports both instructors and administrators.
  private readonly courses = inject(InstructorCourseService);
  private readonly language = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly imageUrl = model<string | null>(null);
  readonly disabled = input(false);
  readonly uploadingChange = output<boolean>();
  readonly uploading = signal(false);
  readonly busy = computed(() => this.disabled() || this.uploading());
  readonly uploadError = signal('');
  readonly failedUrl = signal<string | null>(null);
  readonly validUrl = computed(() => isCourseImageUrlValid(this.imageUrl()));
  readonly previewUrl = computed(() => this.validUrl() ? this.imageUrl()?.trim() || null : null);

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  changeUrl(value: string): void {
    if (this.busy()) return;
    this.uploadError.set('');
    this.failedUrl.set(null);
    this.imageUrl.set(value || null);
  }

  removeImage(): void {
    this.changeUrl('');
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) return;

    this.uploadError.set('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || (file.type && !allowed.includes(file.type))) {
      this.uploadError.set(this.t('اختر صورة JPG أو PNG أو WEBP.', 'Choose a JPG, PNG or WEBP image.'));
      return;
    }
    if (!file.size || file.size > 3 * 1024 * 1024) {
      this.uploadError.set(this.t('اختر صورة غير فارغة لا تتجاوز 3 ميجابايت.', 'Choose a non-empty image up to 3 MB.'));
      return;
    }

    this.setUploading(true);
    this.courses.uploadImage(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.failedUrl.set(null);
        this.imageUrl.set(response.url);
        this.setUploading(false);
      },
      error: (err: HttpErrorResponse) => {
        this.setUploading(false);
        this.uploadError.set(err.status === 401 || err.status === 403
          ? this.t('انتهت الجلسة أو لا توجد صلاحية للرفع. سجّل الدخول مجدداً.', 'Session expired or upload not permitted. Sign in again.')
          : this.t('تعذر رفع الصورة. حاول مجدداً أو استخدم رابطاً مباشراً.', 'Upload failed. Try again or use a direct URL.'));
      }
    });
  }

  private setUploading(value: boolean): void {
    this.uploading.set(value);
    this.uploadingChange.emit(value);
  }
}
