
import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'Student' | 'Instructor' | 'Admin';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UsersPage {
  items: AdminUser[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CreateUser {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUser {
  fullName: string;
  email: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7194/api/Users';

  getAll(
    search = '',
    role: UserRole | null = null,
    pageNumber = 1,
    pageSize = 8
  ): Observable<UsersPage> {

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (role) {
      params = params.set('role', role);
    }

    return this.http.get<UsersPage>(
      this.apiUrl,
      { params }
    );
  }

  create(data: CreateUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      this.apiUrl,
      data
    );
  }

  update(
    id: number,
    data: UpdateUser
  ): Observable<void> {

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
