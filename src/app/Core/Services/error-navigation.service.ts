import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ErrorNavigationService {
  
  constructor(private router: Router) {}

  /**
   * Navigate to error page with specific error details
   */
  navigateToError(errorType: string, errorMessage: string): void {
    this.router.navigate(['/error'], {
      state: {
        errorType,
        errorMessage
      }
    });
  }

  /**
   * Navigate to server down error page
   */
  navigateToServerError(message?: string): void {
    this.navigateToError(
      'server-down', 
      message || 'Unable to connect to the server. Please try again later.'
    );
  }

  /**
   * Navigate to authentication error page
   */
  navigateToAuthError(message?: string): void {
    this.navigateToError(
      'authentication',
      message || 'Your session has expired. Please sign in again.'
    );
  }

  /**
   * Navigate to permission error page
   */
  navigateToPermissionError(message?: string): void {
    this.navigateToError(
      'permission',
      message || 'You don\'t have permission to access this resource.'
    );
  }

  /**
   * Navigate to network error page
   */
  navigateToNetworkError(message?: string): void {
    this.navigateToError(
      'network',
      message || 'Network error. Please check your connection and try again.'
    );
  }

  /**
   * Navigate to general error page
   */
  navigateToGeneralError(message?: string): void {
    this.navigateToError(
      'general',
      message || 'An unexpected error occurred. Please try again.'
    );
  }
}
