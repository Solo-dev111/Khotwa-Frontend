
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  UserService,
  AdminUser,
  UserRole,
  CreateUser,
  UpdateUser
} from '../../../core/services/user.service';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users {

  private service = inject(UserService);

  auth = inject(AuthService);
  language = inject(LanguageService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  saving = signal(false);
  deletingId = signal<number | null>(null);

  error = signal('');
  message = signal('');

  search = '';
  roleFilter: UserRole | '' = '';

  pageNumber = 1;
  pageSize = 8;
  totalCount = signal(0);

  formOpen = signal(false);
  editingId: number | null = null;

  form: CreateUser = this.emptyForm();

  readonly roles: UserRole[] = [
    'Student',
    'Instructor',
    'Admin'
  ];

  constructor() {
    afterNextRender(() => {
      if (this.isAdmin()) {
        this.loadUsers();
      } else {
        this.loading.set(false);
      }
    });
  }

  t(ar: string, en: string): string {
    return this.language.current() === 'ar' ? ar : en;
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'Admin';
  }

  isSelf(user: AdminUser): boolean {
    return this.auth.currentUser()?.userId === user.id;
  }

  roleName(role: UserRole): string {
    if (role === 'Student') {
      return this.t('طالب', 'Student');
    }

    if (role === 'Instructor') {
      return this.t('مدرب', 'Instructor');
    }

    return this.t('مدير النظام', 'Admin');
  }

  private emptyForm(): CreateUser {
    return {
      fullName: '',
      email: '',
      password: '',
      role: 'Student'
    };
  }

  totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  // GET USERS
  loadUsers(): void {
    if (!this.isAdmin()) return;

    this.loading.set(true);
    this.error.set('');

    this.service.getAll(
      this.search,
      this.roleFilter || null,
      this.pageNumber,
      this.pageSize
    ).subscribe({
      next: response => {
        this.users.set(response.items);
        this.totalCount.set(response.totalCount);
        this.pageNumber = response.pageNumber;
        this.loading.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  applyFilters(): void {
    this.pageNumber = 1;
    this.loadUsers();
  }

  changePage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      this.loading()
    ) {
      return;
    }

    this.pageNumber = page;
    this.loadUsers();
  }

  // NEW USER FORM
  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  // EDIT USER FORM
  openEdit(user: AdminUser): void {
    this.editingId = user.id;

    this.form = {
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role
    };

    this.error.set('');
    this.message.set('');
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.saving()) return;

    this.formOpen.set(false);
    this.editingId = null;
    this.form = this.emptyForm();
  }

  // CREATE OR UPDATE
  save(): void {
    if (!this.isAdmin() || this.saving()) return;

    const fullName = this.form.fullName.trim();
    const email = this.form.email.trim().toLowerCase();

    if (!fullName || !email) {
      this.error.set(this.t(
        'الاسم والبريد الإلكتروني مطلوبان.',
        'Name and email are required.'
      ));
      return;
    }

    if (
      this.editingId === null &&
      !this.form.password.trim()
    ) {
      this.error.set(this.t(
        'كلمة المرور مطلوبة للحساب الجديد.',
        'Password is required for a new user.'
      ));
      return;
    }

    const isEditing = this.editingId !== null;

    const updateData: UpdateUser = {
      fullName,
      email,
      role: this.form.role
    };

    const createData: CreateUser = {
      ...updateData,
      password: this.form.password
    };

    const request: Observable<AdminUser | void> = isEditing
      ? this.service.update(this.editingId!, updateData)
      : this.service.create(createData);

    this.saving.set(true);
    this.error.set('');
    this.message.set('');

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();

        this.message.set(isEditing
          ? this.t('تم تعديل الحساب بنجاح.', 'User updated.')
          : this.t('تم إنشاء الحساب بنجاح.', 'User created.')
        );

        this.pageNumber = 1;
        this.loadUsers();
      },

      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(err);
      }
    });
  }

  // DELETE USER
  remove(user: AdminUser): void {
    if (
      !this.isAdmin() ||
      this.isSelf(user) ||
      this.deletingId() !== null
    ) {
      return;
    }

    const confirmed = confirm(this.t(
      `هل تريد حذف حساب "${user.fullName}"؟`,
      `Delete the account "${user.fullName}"?`
    ));

    if (!confirmed) return;

    this.error.set('');
    this.message.set('');
    this.deletingId.set(user.id);

    this.service.delete(user.id).subscribe({
      next: () => {
        this.deletingId.set(null);

        this.message.set(this.t(
          'تم حذف الحساب بنجاح.',
          'User deleted successfully.'
        ));

        if (
          this.users().length === 1 &&
          this.pageNumber > 1
        ) {
          this.pageNumber--;
        }

        this.loadUsers();
      },

      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.showError(err);
      }
    });
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

  private showError(err: HttpErrorResponse): void {
    console.error('Admin Users API:', err);

    if (err.status === 401) {
      this.error.set(this.t(
        'انتهت الجلسة، سجّل الدخول مجدداً.',
        'Session expired. Please log in again.'
      ));
    } else if (err.status === 403) {
      this.error.set(this.t(
        'ليست لديك صلاحية لإدارة المستخدمين.',
        'You do not have permission to manage users.'
      ));
    } else if (err.status === 409) {
      this.error.set(this.t(
        'يوجد تعارض: ربما البريد مستخدم، أو الحساب مرتبط بسجلات لا تسمح بتعديله أو حذفه.',
        'Conflict: Email may already exist, or the account has related records.'
      ));
    } else if (err.status === 400) {
      this.error.set(this.t(
        'البيانات غير صحيحة أو العملية غير مسموحة.',
        'Invalid data or operation not allowed.'
      ));
    } else if (err.status === 404) {
      this.error.set(this.t(
        'المستخدم غير موجود.',
        'User not found.'
      ));
    } else {
      this.error.set(this.t(
        'تعذر الاتصال بالخادم.',
        'Could not connect to the server.'
      ));
    }
  }
}
