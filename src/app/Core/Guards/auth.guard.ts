import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../Services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url);
  }

  private checkAuth(url: string): boolean {
    console.log('AuthGuard checking authentication for URL:', url);
    console.log('isLoggedIn:', this.authService.isLoggedIn);
    console.log('isTokenValid:', this.authService.isTokenValid());
    
    // Check if user is authenticated and token is valid
    if (this.authService.isLoggedIn && this.authService.isTokenValid()) {
      console.log('Authentication successful, allowing access');
      return true;
    }

    // If not authenticated or token expired, clear data and redirect
    console.log('Authentication failed, redirecting to login...');
    
    // Clear all authentication data
    this.authService.clearAuthData();
    
    // Store the attempted URL for redirect after login
    this.authService.setRedirectUrl(url);
    
    // Navigate to login page
    this.router.navigate(['/login']);
    
    return false;
  }
}
