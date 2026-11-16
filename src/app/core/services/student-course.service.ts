
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

export interface StudentEnrollment {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  isCompleted: boolean;
}

export interface EnrollmentPage {
  items: StudentEnrollment[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreatedOrder {
  id: number;
  studentId: number;
  totalAmount: number;
  status: string;
}

export interface DemoPurchaseResponse {
  message: string;
  orderId: number;
}

@Injectable({
  providedIn: 'root'
})
export class StudentCourseService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7194/api';

  // GET: My Enrollments
  getMyEnrollments(
    pageNumber = 1,
    pageSize = 6
  ): Observable<EnrollmentPage> {

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<EnrollmentPage>(
      `${this.apiUrl}/Enrollments/mine`,
      { params }
    );
  }

  // POST: Free Enrollment
  enrollFree(courseId: number): Observable<StudentEnrollment> {

    return this.http.post<StudentEnrollment>(
      `${this.apiUrl}/Enrollments`,
      { courseId }
    );
  }

  // Demo Purchase
  purchaseDemo(
    courseId: number
  ): Observable<DemoPurchaseResponse> {

    return this.http.post<CreatedOrder>(
      `${this.apiUrl}/Orders`,
      {
        courseIds: [courseId]
      }
    ).pipe(
      switchMap(order =>
        this.http.post<DemoPurchaseResponse>(
          `${this.apiUrl}/Orders/${order.id}/confirm-demo`,
          {}
        )
      )
    );
  }
}
