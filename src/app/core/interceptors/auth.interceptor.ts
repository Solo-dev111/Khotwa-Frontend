
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Only attach JWT to our ASP.NET Core API
  if (!req.url.startsWith('https://localhost:7194/api/')) {
    return next(req);
  }

  const saved = localStorage.getItem('khotwa_auth');

  if (!saved) {
    console.log('Auth Interceptor: No session');
    return next(req);
  }

  try {
    const session = JSON.parse(saved);

    const valid =
      !!session.token &&
      new Date(session.expiresAt).getTime() > Date.now();

    console.log('Auth Interceptor:', {
      url: req.url,
      method: req.method,
      tokenAttached: valid
    });

    if (!valid) {
      return next(req);
    }

    const authenticatedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${session.token}`
      }
    });

    return next(authenticatedRequest);

  } catch (error) {
    console.error('Auth Interceptor Error:', error);
    return next(req);
  }
};
