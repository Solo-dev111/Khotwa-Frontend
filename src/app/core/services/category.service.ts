
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Category,
  PagedResult
} from './course.service';

export interface SaveCategory {
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  private apiUrl = 'https://localhost:7194/api/Categories';

  getAll(
    search: string,
    pageNumber: number,
    pageSize: number
  ): Observable<PagedResult<Category>> {

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResult<Category>>(
      this.apiUrl,
      { params }
    );
  }

  create(data: SaveCategory): Observable<void> {
    return this.http.post<void>(this.apiUrl, data);
  }

  update(id: number, data: SaveCategory): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
