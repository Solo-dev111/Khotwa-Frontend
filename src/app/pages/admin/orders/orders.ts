
import {
  Component,
  inject,
  signal,
  afterNextRender
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import {
  OrderService,
  Order,
  OrderStatus
} from '../../../core/services/order.service';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {

  private orderService = inject(OrderService);

  auth = inject(AuthService);
  language = inject(LanguageService);

  orders = signal<Order[]>([]);

  loading = signal(true);
  loadingDetails = signal(false);

  deletingId = signal<number | null>(null);

  selectedOrder = signal<Order | null>(null);

  error = signal('');
  message = signal('');

  // Filters
  studentId: number | null = null;

  statusFilter: OrderStatus | '' = '';

  readonly statusOptions: OrderStatus[] = [
    'Pending',
    'Paid',
    'Cancelled'
  ];

  // Pagination
  pageNumber = 1;
  pageSize = 8;

  totalCount = signal(0);

  // Summary
  summary = signal({
    total: 0,
    pending: 0,
    paid: 0,
    cancelled: 0
  });

  constructor() {

    afterNextRender(() => {

      if (this.isAdmin()) {

        this.loadOrders();
        this.loadSummary();

      } else {

        this.loading.set(false);

      }

    });

  }

  // TRANSLATION
  t(ar: string, en: string): string {

    return this.language.current() === 'ar'
      ? ar
      : en;

  }

  // CHECK ADMIN
  isAdmin(): boolean {

    return this.auth.currentUser()?.role === 'Admin';

  }

  // TOTAL PAGES
  totalPages(): number {

    return Math.ceil(
      this.totalCount() / this.pageSize
    );

  }

  // LOAD ORDERS
  loadOrders(page = this.pageNumber): void {

    if (!this.isAdmin()) return;

    this.loading.set(true);
    this.error.set('');

    this.orderService.getAdminOrders({

      studentId: this.studentId,
      status: this.statusFilter,
      pageNumber: page,
      pageSize: this.pageSize

    }).subscribe({

      next: result => {

        this.orders.set(result.items);

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

  // LOAD SUMMARY COUNTS
  loadSummary(): void {

    if (!this.isAdmin()) return;

    forkJoin({

      all: this.orderService.getAdminOrders({
        studentId: null,
        status: '',
        pageNumber: 1,
        pageSize: 1
      }),

      pending: this.orderService.getAdminOrders({
        studentId: null,
        status: 'Pending',
        pageNumber: 1,
        pageSize: 1
      }),

      paid: this.orderService.getAdminOrders({
        studentId: null,
        status: 'Paid',
        pageNumber: 1,
        pageSize: 1
      }),

      cancelled: this.orderService.getAdminOrders({
        studentId: null,
        status: 'Cancelled',
        pageNumber: 1,
        pageSize: 1
      })

    }).subscribe({

      next: result => {

        this.summary.set({

          total: result.all.totalCount,

          pending: result.pending.totalCount,

          paid: result.paid.totalCount,

          cancelled: result.cancelled.totalCount

        });

      },

      error: err => {

        console.error('Orders Summary Error:', err);

      }

    });

  }

  // APPLY FILTERS
  applyFilters(): void {

    if (
      this.studentId !== null &&
      (!Number.isInteger(this.studentId) || this.studentId <= 0)
    ) {

      this.error.set(this.t(
        'رقم الطالب يجب أن يكون رقماً صحيحاً موجباً.',
        'Student ID must be a positive integer.'
      ));

      return;

    }

    this.pageNumber = 1;

    this.selectedOrder.set(null);

    this.message.set('');

    this.loadOrders(1);

  }

  // CLEAR FILTERS
  clearFilters(): void {

    this.studentId = null;

    this.statusFilter = '';

    this.pageNumber = 1;

    this.selectedOrder.set(null);

    this.message.set('');

    this.loadOrders(1);

  }

  // VIEW ORDER DETAILS
  viewDetails(order: Order): void {

    this.selectedOrder.set(order);

    this.loadingDetails.set(true);

    this.orderService.getOrderById(order.id)
      .subscribe({

        next: result => {

          this.selectedOrder.set(result);

          this.loadingDetails.set(false);

        },

        error: err => {

          this.loadingDetails.set(false);

          this.showError(err);

        }

      });

  }

  // CLOSE DETAILS
  closeDetails(): void {

    this.selectedOrder.set(null);

  }

  // DELETE ORDER
  remove(order: Order): void {

    if (
      !this.isAdmin() ||
      order.status !== 'Pending' ||
      this.deletingId() !== null
    ) {

      return;

    }

    const confirmed = confirm(this.t(

      `هل تريد حذف الطلب رقم ${order.id}؟`,

      `Do you want to delete order #${order.id}?`

    ));

    if (!confirmed) return;

    this.deletingId.set(order.id);

    this.error.set('');

    this.message.set('');

    this.orderService.deleteOrder(order.id)
      .subscribe({

        next: () => {

          this.deletingId.set(null);

          this.selectedOrder.set(null);

          this.message.set(this.t(
            'تم حذف الطلب بنجاح.',
            'Order deleted successfully.'
          ));

          if (
            this.orders().length === 1 &&
            this.pageNumber > 1
          ) {

            this.pageNumber--;

          }

          this.loadOrders(this.pageNumber);

          this.loadSummary();

        },

        error: (err: HttpErrorResponse) => {

          this.deletingId.set(null);

          this.showError(err);

        }

      });

  }

  // STATUS TRANSLATION
  statusName(status: OrderStatus): string {

    switch (status) {

      case 'Pending':
        return this.t('معلق', 'Pending');

      case 'Paid':
        return this.t('مدفوع', 'Paid');

      case 'Cancelled':
        return this.t('ملغي', 'Cancelled');

      default:
        return status;

    }

  }

  // FORMAT DATE
  formatDate(value: string): string {

    return new Date(value).toLocaleString(

      this.language.current() === 'ar'
        ? 'ar'
        : 'en-US',

      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }

    );

  }

  // FORMAT AMOUNT
  formatAmount(value: number): string {
    return this.language.formatCurrency(value);
  }

  // ERROR HANDLING
  private showError(err: HttpErrorResponse): void {

    console.error('Admin Orders API:', err);

    if (err.status === 401) {

      this.error.set(this.t(
        'انتهت الجلسة. سجّل الدخول مجدداً.',
        'Session expired. Please log in again.'
      ));

    } else if (err.status === 403) {

      this.error.set(this.t(
        'ليست لديك صلاحية لإدارة الطلبات.',
        'You are not authorized to manage orders.'
      ));

    } else if (err.status === 404) {

      this.error.set(this.t(
        'الطلب غير موجود.',
        'Order not found.'
      ));

    } else if (err.status === 409) {

      this.error.set(this.t(
        'لا يمكن حذف هذا الطلب لأنه ليس معلقاً.',
        'This order cannot be deleted because it is not pending.'
      ));

    } else if (err.status === 400) {

      this.error.set(this.t(
        'البيانات المرسلة غير صحيحة.',
        'Invalid request data.'
      ));

    } else {

      this.error.set(this.t(
        'حدث خطأ أثناء الاتصال بالخادم.',
        'A server error occurred.'
      ));

    }

  }

}
