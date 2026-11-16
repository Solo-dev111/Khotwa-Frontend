
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Course } from './course.service';

// Data shown in the lessons list
export interface LessonSummary {
  id: number;
  courseId: number;
  title: string;
  sortOrder: number;
  isPreview: boolean;
}

// Full lesson details
export interface Lesson extends LessonSummary {
  content: string | null;
  videoUrl: string | null;
}

// Create and update data
export interface SaveLesson {
  title: string;
  content: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isPreview: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LessonService {

  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7194/api';

  // Get course information
  getCourse(courseId: number): Observable<Course> {
    return this.http.get<Course>(
      `${this.apiUrl}/Courses/${courseId}`
    );
  }

  // Get lessons of a course
  getByCourse(
    courseId: number
  ): Observable<LessonSummary[]> {

    return this.http.get<LessonSummary[]>(
      `${this.apiUrl}/courses/${courseId}/lessons`
    );
  }

  // Get one lesson with its content
  getById(id: number): Observable<Lesson> {
    return this.http.get<Lesson>(
      `${this.apiUrl}/lessons/${id}`
    );
  }

  // Create lesson
  create(
    courseId: number,
    data: SaveLesson
  ): Observable<Lesson> {

    return this.http.post<Lesson>(
      `${this.apiUrl}/courses/${courseId}/lessons`,
      data
    );
  }

  // Update lesson
  update(
    id: number,
    data: SaveLesson
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/lessons/${id}`,
      data
    );
  }

  // Delete lesson
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/lessons/${id}`
    );
  }
}
