import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';
export interface Certificate {studentName:string;courseTitle:string;instructorName:string;durationMinutes:number|null;issuedAt:string;certificateNumber:string;}
export interface LearningStatus {enrolled:boolean;completedLessonIds:number[];totalLessons:number;certificate:Certificate|null;}
@Injectable({providedIn:'root'})
export class LearningService {
 private http=inject(HttpClient);
 get(courseId:number){return this.http.get<LearningStatus>(API_BASE_URL+'/learning/'+courseId);}
 complete(courseId:number,lessonId:number){return this.http.put<LearningStatus>(API_BASE_URL+'/learning/'+courseId+'/lessons/'+lessonId,{});}
}
