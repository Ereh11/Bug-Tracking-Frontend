import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface User {
  userId: string;
  email: string;
  roles: string[];
  token: string;
  refreshToken: string;
  expiration: string;
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

  // Login method
  login(loginRequest: LoginRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/users/login`, loginRequest)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Store user details and token in cookie
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
          return throwError(() => new Error(error.error?.message || 'Registration failed'));
        })
      );
  }

  // Logout method
  logout(): void {
    
    this.http.post(`${this.apiUrl}/users/logout`, {}).subscribe({
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
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure';
  }
}
