
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

const API_URL = API_BASE_URL;

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  level: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  instructorId: number;
  instructorName: string;
  lessonCount: number;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  courseCount?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CourseFilters {
  search: string;
  categoryId: number | null;
  level: string;
  minPrice: number | null;
  maxPrice: number | null;
  pageNumber: number;
  pageSize: number;
}

export interface AdminCourseFilters extends CourseFilters {
  isPublished: boolean | null;
}

export interface SaveCourseDto {
  title: string;
  description: string;
  price: number;
  level: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  categoryId: number;
  instructorId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  private http = inject(HttpClient);

  // PUBLIC COURSES
  getCourses(
    filters: CourseFilters
  ): Observable<PagedResult<Course>> {

    let params = new HttpParams()
      .set('pageNumber', filters.pageNumber)
      .set('pageSize', filters.pageSize);

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.categoryId !== null) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters.level) {
      params = params.set('level', filters.level);
    }

    if (filters.minPrice !== null) {
      params = params.set('minPrice', filters.minPrice);
    }

    if (filters.maxPrice !== null) {
      params = params.set('maxPrice', filters.maxPrice);
    }

    return this.http.get<PagedResult<Course>>(
      `${API_URL}/Courses`,
      { params }
    );
  }

  // CATEGORIES
  getCategories(): Observable<PagedResult<Category>> {

    return this.http.get<PagedResult<Category>>(
      `${API_URL}/Categories`,
      {
        params: new HttpParams()
          .set('pageNumber', 1)
          .set('pageSize', 100)
      }
    );
  }

  // ADMIN: ALL COURSES
  getAdminCourses(
    filters: AdminCourseFilters
  ): Observable<PagedResult<Course>> {

    let params = new HttpParams()
      .set('pageNumber', filters.pageNumber)
      .set('pageSize', filters.pageSize);

    if (filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.categoryId !== null) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters.level) {
      params = params.set('level', filters.level);
    }

    if (filters.minPrice !== null) {
      params = params.set('minPrice', filters.minPrice);
    }

    if (filters.maxPrice !== null) {
      params = params.set('maxPrice', filters.maxPrice);
    }

    if (filters.isPublished !== null) {
      params = params.set(
        'isPublished',
        filters.isPublished.toString()
      );
    }

    return this.http.get<PagedResult<Course>>(
      `${API_URL}/Courses/admin`,
      { params }
    );
  }

  // ADMIN: CREATE COURSE
  createCourse(
    data: SaveCourseDto
  ): Observable<Course> {

    return this.http.post<Course>(
      `${API_URL}/Courses`,
      data
    );
  }

  // ADMIN: UPDATE COURSE
  updateCourse(
    id: number,
    data: SaveCourseDto
  ): Observable<void> {

    return this.http.put<void>(
      `${API_URL}/Courses/${id}`,
      data
    );
  }

  // ADMIN: DELETE COURSE
  deleteCourse(id: number): Observable<void> {

    return this.http.delete<void>(
      `${API_URL}/Courses/${id}`
    );
  }
}
