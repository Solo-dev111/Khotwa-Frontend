
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  // Only attach JWT to our ASP.NET Core API
  if (!req.url.startsWith(`${API_BASE_URL}/`)) {
    return next(req);
  }

  const session = auth.restoreSession();
  const authenticatedRequest = session
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${session.token}`
      }
    })
    : req;

  return next(authenticatedRequest).pipe(
    catchError(error => {
      const isLoginRequest = req.url.endsWith('/Auth/login');
      if (error.status === 401 && session && !isLoginRequest) {
        const returnUrl = router.url;
        auth.logout();
        void router.navigate(['/login'], {
          queryParams: { returnUrl }
        });
      }

      return throwError(() => error);
    })
  );
};
