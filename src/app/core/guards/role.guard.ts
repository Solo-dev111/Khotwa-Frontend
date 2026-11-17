import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);

  // The server cannot read the browser's local session. The guard runs again
  // in the browser, where it can make the authoritative route decision.
  if (!isPlatformBrowser(platformId)) return true;

  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.restoreSession();

  if (!user) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const allowedRoles = route.data['roles'] as string[] | undefined;
  if (!allowedRoles?.length) return true;

  const role = user.role.toLowerCase();
  return allowedRoles.some(allowed => allowed.toLowerCase() === role)
    ? true
    : router.createUrlTree(['/']);
};
