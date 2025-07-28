import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, interval } from 'rxjs';
import { catchError, map, switchMap, takeWhile } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserProfile, ApiResponse, LoginRequest, RegisterRequest } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isRefreshing = false;
  private tokenCheckInterval: any;

  constructor(private http: HttpClient, private router: Router) {
    const storedUserData = this.getCookie('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUserData ? JSON.parse(storedUserData) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Start token validation check
    this.startTokenValidationCheck();
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
        roles: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [],
        exp: payload.exp // Add expiration field
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
            // Start token validation check after successful login
            this.startTokenValidationCheck();
            return userData;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        }),
        catchError(error => {
          console.error('Login error', error);
          // Pass through the original error structure instead of creating a new Error
          return throwError(() => error);
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
    this.stopTokenValidationCheck();
    this.makeAuthenticatedRequest('POST', '/users/logout', {}).subscribe({
      next: () => this.completeLogout(),
      error: () => this.completeLogout(),
      complete: () => console.log('Logout completed')
    });
  }

  private completeLogout(): void {
    this.stopTokenValidationCheck();
    this.clearAuthData();
    this.currentUserSubject.next(null);
    
    // Redirect to login page
    console.log('Redirecting to login page after logout');
    this.router.navigate(['/login']);
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

  // NEW: Check if token is valid and not expired
  public isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Decode JWT token to check expiration
      const tokenData = this.extractUserDataFromToken(token);
      
      if (!tokenData) {
        return false;
      }

      if (!tokenData.exp) {
        return false;
      }

      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = tokenData.exp > currentTime;
      
      return isValid;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  // NEW: Clear all authentication data
  public clearAuthData(): void {
    // Clear from memory
    this.currentUserSubject.next(null);
    
    // Clear from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    
    // Clear from cookies
    this.deleteCookie('currentUser');
    this.deleteCookie('token');
    this.deleteCookie('refreshToken');
    
    // Clear any other stored data
    sessionStorage.clear();
    
    console.log('All authentication data cleared');
  }

  // NEW: Set redirect URL for after login
  public setRedirectUrl(url: string): void {
    if (url && url !== '/login' && url !== '/signup') {
      localStorage.setItem('redirectUrl', url);
    }
  }

  // NEW: Get and clear redirect URL
  public getAndClearRedirectUrl(): string | null {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      localStorage.removeItem('redirectUrl');
      return redirectUrl;
    }
    return null;
  }

  // NEW: Force logout (clear data and redirect)
  public forceLogout(reason?: string): void {
    console.log('Force logout triggered:', reason);
    this.clearAuthData();
    this.stopTokenValidationCheck();
    this.currentUserSubject.next(null);
    
    // Redirect to login page
    console.log('Redirecting to login page after force logout');
    this.router.navigate(['/login']);
  }

  // NEW: Start periodic token validation check
  private startTokenValidationCheck(): void {
    // Check token every 30 seconds
    this.tokenCheckInterval = setInterval(() => {
      if (this.isLoggedIn && !this.isTokenValid()) {
        console.log('Token expired during validation check, forcing logout...');
        this.forceLogout('Token expired');
        // Emit null to update current user subject
        this.currentUserSubject.next(null);
        // Window location change to login is handled by guards
        window.location.href = '/login';
      }
    }, 30000); // 30 seconds
  }

  // NEW: Stop token validation check
  private stopTokenValidationCheck(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
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