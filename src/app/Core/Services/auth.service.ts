import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface User {
  userId: string;
  email: string;
  roles: string[];
  token: string;
  refreshToken: string;
  expiration: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  errors: any;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5279/api';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isRefreshing = false;

  constructor(private http: HttpClient) {
    const storedUserData = this.getCookie('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUserData ? JSON.parse(storedUserData) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!this.currentUserValue?.token;
  }

  // NEW: Get current user response data
  public getCurrentUserResponse(): UserProfile | null {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return null;
    }

    // Extract user data from JWT token if available
    const tokenData = this.extractUserDataFromToken(currentUser.token);
    
    return {
      userId: currentUser.userId,
      email: currentUser.email,
      firstName: tokenData?.firstName || '',
      lastName: tokenData?.lastName || '',
      fullName: tokenData?.fullName || `${tokenData?.firstName || ''} ${tokenData?.lastName || ''}`.trim(),
      roles: currentUser.roles || []
    };
  }

  // NEW: Get user ID
  public getCurrentUserId(): string | null {
    return this.currentUserValue?.userId || null;
  }

  // NEW: Get user roles
  public getCurrentUserRoles(): string[] {
    return this.currentUserValue?.roles || [];
  }

  // NEW: Get user name (from token)
  public getCurrentUserName(): string {
    const tokenData = this.extractUserDataFromToken(this.getToken());
    if (tokenData?.fullName) {
      return tokenData.fullName;
    }
    if (tokenData?.firstName || tokenData?.lastName) {
      return `${tokenData.firstName || ''} ${tokenData.lastName || ''}`.trim();
    }
    return this.currentUserValue?.email || 'User';
  }

  // NEW: Get user first name
  public getCurrentUserFirstName(): string {
    const tokenData = this.extractUserDataFromToken(this.getToken());
    return tokenData?.firstName || '';
  }

  // NEW: Get user last name
  public getCurrentUserLastName(): string {
    const tokenData = this.extractUserDataFromToken(this.getToken());
    return tokenData?.lastName || '';
  }

  // NEW: Check if user has specific role
  public hasRole(role: string): boolean {
    const roles = this.getCurrentUserRoles();
    return roles.includes(role);
  }

  // NEW: Check if user has any of the specified roles
  public hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getCurrentUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  // NEW: Check if user is admin
  public isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  // NEW: Extract user data from JWT token
  private extractUserDataFromToken(token: string | null): any {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.userId,
        email: payload.sub || payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        roles: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || []
      };
    } catch (error) {
      console.error('Error extracting user data from token:', error);
      return null;
    }
  }

  // Method to make authenticated HTTP requests
  public makeAuthenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any
  ): Observable<T> {
    return this.executeRequest<T>(method, url, body).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handleTokenRefresh<T>(method, url, body);
        }
        return throwError(() => error);
      })
    );
  }

  private executeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any
  ): Observable<T> {
    const headers = this.getAuthHeaders();
    const fullUrl = url.startsWith('http') ? url : `${this.apiUrl}${url}`;

    switch (method) {
      case 'GET':
        return this.http.get<T>(fullUrl, { headers });
      case 'POST':
        return this.http.post<T>(fullUrl, body, { headers });
      case 'PUT':
        return this.http.put<T>(fullUrl, body, { headers });
      case 'DELETE':
        return this.http.delete<T>(fullUrl, { headers });
      default:
        return throwError(() => new Error('Unsupported HTTP method'));
    }
  }

  private handleTokenRefresh<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: any
  ): Observable<T> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      return this.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          return this.executeRequest<T>(method, url, body);
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Wait for refresh to complete then retry
      return new Observable(observer => {
        const checkRefresh = () => {
          if (!this.isRefreshing) {
            this.executeRequest<T>(method, url, body).subscribe({
              next: result => observer.next(result),
              error: err => observer.error(err),
              complete: () => observer.complete()
            });
          } else {
            setTimeout(checkRefresh, 100);
          }
        };
        checkRefresh();
      });
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Login method
  login(loginRequest: LoginRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users/login`, loginRequest)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const userData = response.data;
            this.setAuthCookie(userData);
            this.currentUserSubject.next(userData);
            return userData;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        }),
        catchError(error => {
          console.error('Login error', error);
          return throwError(() => new Error(error.error?.message || 'Login failed'));
        })
      );
  }

  // Register method
  register(registerRequest: RegisterRequest): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/users/register`, registerRequest)
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        }),
        catchError(error => {
          console.error('Registration error', error);
          // Pass through the original HTTP error instead of creating a new generic error
          // This preserves the detailed error information from the backend
          return throwError(() => error);
        })
      );
  }

  // Logout method
  logout(): void {
    this.makeAuthenticatedRequest('POST', '/users/logout', {}).subscribe({
      next: () => this.completeLogout(),
      error: () => this.completeLogout(),
      complete: () => console.log('Logout completed')
    });
  }

  private completeLogout(): void {
    this.deleteCookie('currentUser');
    this.deleteCookie('auth_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.getCookie('auth_token') || this.currentUserValue?.token || null;
  }

  refreshToken(): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users/refresh-token`, {
      refreshToken: this.currentUserValue?.refreshToken
    })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            const userData = response.data;
            this.setAuthCookie(userData);
            this.currentUserSubject.next(userData);
            return userData;
          } else {
            throw new Error(response.message || 'Token refresh failed');
          }
        }),
        catchError(error => {
          console.error('Token refresh error', error);
          this.completeLogout();
          return throwError(() => new Error('Token refresh failed'));
        })
      );
  }

  private setAuthCookie(user: User): void {
    const userDataForCookie = { ...user };
    this.setCookie('currentUser', JSON.stringify(userDataForCookie), 30);
    this.setCookie('auth_token', user.token, 30);
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = '; expires=' + date.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Strict; Secure';
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = name + '=' + '; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
  }
}