import { Injectable, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  constructor(private router: Router) {}

  handleError(error: any): void {
    console.error('Global Error Handler caught an error:', error);

    // Determine error type and navigate to appropriate error page
    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else if (error instanceof Error) {
      this.handleClientError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private handleHttpError(error: HttpErrorResponse): void {
    let errorType = 'general';
    let errorMessage = error.message;

    switch (error.status) {
      case 0:
        // Network error or server is down
        errorType = 'server-down';
        errorMessage = 'Unable to connect to the server. Please check your connection or try again later.';
        break;
      case 401:
        errorType = 'authentication';
        errorMessage = 'Your session has expired. Please sign in again.';
        // Clear any stored authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        break;
      case 403:
        errorType = 'permission';
        errorMessage = 'You don\'t have permission to access this resource.';
        break;
      case 404:
        errorType = 'not-found';
        errorMessage = 'The requested resource was not found.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = 'server-down';
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        errorType = 'network';
        errorMessage = `HTTP Error ${error.status}: ${error.message}`;
    }

    this.navigateToErrorPage(errorType, errorMessage);
  }

  private handleClientError(error: Error): void {
    let errorType = 'general';
    let errorMessage = error.message;

    // Check for specific client-side errors
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      errorType = 'network';
      errorMessage = 'Failed to load application resources. Please refresh the page.';
      this.navigateToErrorPage(errorType, errorMessage);
    } else if (error.message.includes('Script error')) {
      errorType = 'general';
      errorMessage = 'A script error occurred. Please refresh the page.';
      this.navigateToErrorPage(errorType, errorMessage);
    } else if (error.message.includes('Cannot read properties of undefined') || 
               error.message.includes('Cannot read property') ||
               error.message.includes('is not a function')) {
      // Template/component errors - log but don't navigate away
      console.error('Template/Component Error (not redirecting):', error);
      return;
    } else {
      // For other serious client errors, navigate to error page
      this.navigateToErrorPage(errorType, errorMessage);
    }
  }

  private handleUnknownError(error: any): void {
    const errorMessage = error?.message || 'An unknown error occurred';
    this.navigateToErrorPage('general', errorMessage);
  }

  private navigateToErrorPage(errorType: string, errorMessage: string): void {
    // Don't navigate if we're already on the error page to prevent infinite loops
    if (this.router.url.includes('/error')) {
      console.log('Already on error page, not navigating again');
      return;
    }

    this.router.navigate(['/error'], {
      state: {
        errorType,
        errorMessage
      }
    });
  }
}
