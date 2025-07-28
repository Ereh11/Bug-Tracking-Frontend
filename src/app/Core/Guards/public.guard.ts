import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    console.log('PublicGuard checking authentication state...');
    console.log('isLoggedIn:', this.authService.isLoggedIn);
    console.log('isTokenValid:', this.authService.isTokenValid());
    
    // If user is already authenticated and token is valid, redirect to home
    if (this.authService.isLoggedIn && this.authService.isTokenValid()) {
      console.log('User already authenticated, redirecting to home...');
      // Use replace instead of navigate to avoid adding to history
      this.router.navigateByUrl('/', { replaceUrl: true });
      return false;
    }

    // If token exists but is invalid, clear the data
    if (this.authService.isLoggedIn && !this.authService.isTokenValid()) {
      console.log('Token expired, clearing auth data...');
      this.authService.clearAuthData();
    }

    // Allow access to public routes (login/signup)
    console.log('Allowing access to public route:', state.url);
    return true;
  }
}
