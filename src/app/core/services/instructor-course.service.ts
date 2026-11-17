
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

import {
  Course,
  PagedResult
} from './course.service';

export interface SaveCourse {
  title: string;
  description: string;
  price: number;
  level: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  categoryId: number;
}

export interface InstructorCourseFilters {
  search: string;
  isPublished: boolean | null;
  pageNumber: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorCourseService {

  private http = inject(HttpClient);
  private apiUrl = API_BASE_URL;

  // GET: Instructor's own courses
  getMine(
    filters: InstructorCourseFilters
  ): Observable<PagedResult<Course>> {

    let params = new HttpParams()
      .set('pageNumber', filters.pageNumber)
      .set('pageSize', filters.pageSize);

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.isPublished !== null) {
      params = params.set(
        'isPublished',
        filters.isPublished
      );
    }

    return this.http.get<PagedResult<Course>>(
      `${this.apiUrl}/Courses/mine`,
      { params }
    );
  }

  // POST: Create course
  create(data: SaveCourse): Observable<Course> {
    return this.http.post<Course>(
      `${this.apiUrl}/Courses`,
      data
    );
  }

  // PUT: Update course
  update(
    id: number,
    data: SaveCourse
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/Courses/${id}`,
      data
    );
  }

  // DELETE: Delete course
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/Courses/${id}`
    );
  }

  // POST: Upload course thumbnail
  uploadImage(
    file: File
  ): Observable<{ url: string }> {

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ url: string }>(
      `${this.apiUrl}/upload/course`,
      formData
    );
  }
}
