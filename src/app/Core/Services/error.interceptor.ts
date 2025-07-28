import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, concatMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retryWhen(errors =>
        errors.pipe(
          concatMap((error: HttpErrorResponse, count) => {
            // Only retry on network errors and 5xx server errors
            if (count < 2 && (error.status === 0 || error.status >= 500)) {
              console.log(`Retrying request... Attempt ${count + 1}`);
              return timer(1000 * Math.pow(2, count)); // Exponential backoff
            }
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        // Let the global error handler deal with it
        if (this.shouldHandleGlobally(error)) {
          this.handleGlobalError(error);
        }
        return throwError(() => error);
      })
    );
  }

  private shouldHandleGlobally(error: HttpErrorResponse): boolean {
    // Handle these errors globally
    const globalErrorStatuses = [0, 401, 500, 502, 503, 504];
    return globalErrorStatuses.includes(error.status);
  }

  private handleGlobalError(error: HttpErrorResponse): void {
    let errorType = 'general';
    let errorMessage = error.message;

    switch (error.status) {
      case 0:
        errorType = 'server-down';
        errorMessage = 'Unable to connect to the server. Please check your connection.';
        break;
      case 401:
        errorType = 'authentication';
        errorMessage = 'Your session has expired. Please sign in again.';
        // Clear authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorType = 'server-down';
        errorMessage = 'Server is currently unavailable. Please try again later.';
        break;
    }

    // Don't navigate if already on error page
    if (!this.router.url.includes('/error')) {
      this.router.navigate(['/error'], {
        state: {
          errorType,
          errorMessage
        }
      });
    }
  }
}
