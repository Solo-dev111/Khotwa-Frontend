
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewPage {
  items: Review[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface SaveReview {
  courseId: number;
  rating: number;
  comment: string | null;
}

export interface UpdateReview {
  rating: number;
  comment: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7194/api/Reviews';

  // Public: Reviews of a course
  getByCourse(
    courseId: number,
    pageNumber = 1,
    pageSize = 5
  ): Observable<ReviewPage> {

    const params = new HttpParams()
      .set('courseId', courseId)
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<ReviewPage>(
      this.apiUrl,
      { params }
    );
  }

  // Student: My reviews
  getMine(
    pageNumber = 1,
    pageSize = 100
  ): Observable<ReviewPage> {

    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<ReviewPage>(
      `${this.apiUrl}/mine`,
      { params }
    );
  }

  // Student: Create review
  create(data: SaveReview): Observable<Review> {
    return this.http.post<Review>(
      this.apiUrl,
      data
    );
  }

  // Student: Update own review
  update(
    reviewId: number,
    data: UpdateReview
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${reviewId}`,
      data
    );
  }

  // Student: Delete own review
  delete(reviewId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${reviewId}`
    );
  }
}
