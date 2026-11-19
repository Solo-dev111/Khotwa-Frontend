
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/services/course.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories {
  private service = inject(CategoryService);

  language = inject(LanguageService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  deleteCategory = signal<Category | null>(null);
  deleteTargets = signal<Category[]>([]);
  deleteLoading = signal(false);
  deleting = signal(false);
  deleteError = signal('');
  targetId: number | null = null;
  private previewVersion = 0;

  error = signal('');
  message = signal('');

  search = '';
  name = '';
  description = '';
  editingId: number | null = null;

  pageNumber = 1;
  pageSize = 8;

  totalCount = signal(0);
  totalPages = signal(0);

  constructor() {
    afterNextRender(() => {
      this.load();
    });
  }

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getAll(
      this.search,
      this.pageNumber,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.categories.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  searchNow(): void {
    this.pageNumber = 1;
    this.load();
  }

  edit(category: Category): void {
    this.editingId = category.id;
    this.name = category.name;
    this.description = category.description ?? '';

    this.message.set('');
    this.error.set('');
  }

  cancelEdit(): void {
    this.editingId = null;
    this.name = '';
    this.description = '';
  }

  save(): void {
    if (!this.name.trim() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    const data = {
      name: this.name.trim(),
      description: this.description.trim() || null
    };

    const isEditing = this.editingId !== null;

    const request = isEditing
      ? this.service.update(this.editingId!, data)
      : this.service.create(data);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();

        this.message.set(
          isEditing
            ? this.t('تم تعديل التصنيف بنجاح', 'Category updated successfully')
            : this.t('تمت إضافة التصنيف بنجاح', 'Category created successfully')
        );

        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  remove(category: Category): void {
    if (this.deleting()) return;
    this.deleteCategory.set(category);
    this.deleteTargets.set([]);
    this.targetId = null;
    this.deleteError.set('');
    this.deleteLoading.set(true);
    const version = ++this.previewVersion;
    this.service.getDeleteOptions(category.id).subscribe({
      next: response => {
        if (version !== this.previewVersion) return;
        this.deleteCategory.set(response.category);
        this.deleteTargets.set(response.targets);
        this.deleteLoading.set(false);
      },
      error: () => {
        if (version !== this.previewVersion) return;
        this.deleteLoading.set(false);
        this.deleteError.set(this.t('تعذر تحميل معلومات الحذف. أعد المحاولة.', 'Could not load deletion details. Try again.'));
      }
    });
  }

  closeDelete(): void {
    if (this.deleting()) return;
    ++this.previewVersion;
    this.deleteCategory.set(null);
  }

  confirmDelete(): void {
    const category = this.deleteCategory();
    if (!category || category.courseCount === undefined || this.deleteLoading() ||
        this.deleting() || this.deleteError()) return;
    const count = category.courseCount;
    const target = count > 0 ? this.targetId : null;
    if (count > 0 && !this.deleteTargets().some(c => c.id === target)) return;
    this.deleting.set(true);
    this.error.set('');
    this.message.set('');
    this.service.delete(category.id, target ?? undefined, count).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDelete();
        if (this.editingId === category.id) this.cancelEdit();
        this.message.set(count > 0
          ? this.t('تم نقل الدورات وحذف التصنيف بنجاح.', 'Courses moved and category deleted successfully.')
          : this.t('تم حذف التصنيف', 'Category deleted'));
        if (this.categories().length === 1 && this.pageNumber > 1) this.pageNumber--;
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.deleteError.set(err.status === 409 || err.status === 404
          ? this.t('تغيرت بيانات التصنيف أو الدورات. حدّث المعلومات قبل التأكيد من جديد.', 'Categories or courses changed. Refresh before confirming again.')
          : this.t('تعذر تنفيذ العملية. لم يتم تأكيد الحذف.', 'The operation failed. Deletion was not confirmed.'));
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.pageNumber = page;
    this.load();
  }

  private showError(err: HttpErrorResponse): void {
    if (err.status === 401) {
      this.error.set(
        this.t(
          'انتهت الجلسة، سجّل الدخول مجدداً.',
          'Session expired. Please log in again.'
        )
      );
    } else if (err.status === 403) {
      this.error.set(
        this.t(
          'هذه العملية متاحة للأدمن فقط.',
          'Only administrators can perform this action.'
        )
      );
    } else if (err.status === 409) {
      this.error.set(
        this.t(
          'لا يمكن تنفيذ العملية. قد يكون التصنيف مرتبطاً بدورات.',
          'Cannot complete the action. The category may be linked to courses.'
        )
      );
    } else {
      this.error.set(
        this.t(
          'حدث خطأ. تأكد من تشغيل الـ API وصحة البيانات.',
          'An error occurred. Check the API and your data.'
        )
      );
    }
  }
}
