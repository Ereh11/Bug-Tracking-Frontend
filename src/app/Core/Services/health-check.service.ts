import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HealthCheckService {
  
  constructor(private http: HttpClient) {}

  /**
   * Check if the server is available
   */
  checkServerHealth(): Observable<boolean> {
    return this.http.get(`${environment.apiUrl}/health`, {
      responseType: 'text' // Some health endpoints just return "OK"
    }).pipe(
      timeout(5000), // 5 second timeout
      catchError(error => {
        console.log('Health check failed:', error);
        return of(false);
      }),
      // Transform any successful response to true
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Ping the server with a simple request
   */
  ping(): Promise<boolean> {
    return fetch(`${environment.apiUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    .then(response => response.ok)
    .catch(() => false);
  }
}
