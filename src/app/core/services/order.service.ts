
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'https://localhost:7194/api';

export type OrderStatus =
  | 'Pending'
  | 'Paid'
  | 'Cancelled';

export interface OrderItem {
  id: number;
  courseId: number;
  courseTitle: string;
  priceAtPurchase: number;
}

export interface Order {
  id: number;
  studentId: number;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface OrderPagedResult {
  items: Order[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderFilters {
  studentId: number | null;
  status: OrderStatus | '';
  pageNumber: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  // GET ALL ORDERS (ADMIN)
  getAdminOrders(
    filters: OrderFilters
  ): Observable<OrderPagedResult> {

    let params = new HttpParams()
      .set('pageNumber', filters.pageNumber)
      .set('pageSize', filters.pageSize);

    if (filters.studentId !== null) {
      params = params.set('studentId', filters.studentId);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<OrderPagedResult>(
      `${API_URL}/Orders`,
      { params }
    );
  }

  // GET ORDER DETAILS
  getOrderById(id: number): Observable<Order> {

    return this.http.get<Order>(
      `${API_URL}/Orders/${id}`
    );
  }

  // DELETE PENDING ORDER
  deleteOrder(id: number): Observable<void> {

    return this.http.delete<void>(
      `${API_URL}/Orders/${id}`
    );
  }
}
