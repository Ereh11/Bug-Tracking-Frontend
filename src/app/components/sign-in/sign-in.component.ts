import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService, LoginRequest } from '../../Core/Services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  signInForm!: FormGroup;
  authError: string | null = null;
  isLeaving = false;
  swapBorders = false;
  isLoading = false;

  controls = [
    {
      name: 'email',
      label: 'Email address',
      type: 'email',
      placeholder: 'Email',
      icon: 'fa-solid fa-envelope',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Password',
      icon: 'fa-solid fa-lock',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });

    // If user is already logged in, redirect to home or dashboard
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/project']);
    }
  }

  getErrors(controlName: string): string[] {
    const control = this.signInForm.get(controlName);
    if (!control || !control.errors) return [];
    const errs: string[] = [];
    const errors = control.errors;

    if (errors['required']) errs.push('This field is required');
    if (controlName === 'email' && errors['email'])
      errs.push('Enter a valid email');

    return errs;
  }

  leaveAndNavigate(path: string) {
    this.isLeaving = true;
    this.swapBorders = true;
    setTimeout(() => this.router.navigate([path]), 1000);
  }

  dismissError(): void {
    this.authError = null;
  }

  onSubmit() {
    this.authError = null;
    this.isLoading = true;

    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const loginRequest: LoginRequest = {
      email: this.signInForm.value.email,
      password: this.signInForm.value.password,
    };

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.isLoading = false;
        console.log('Login successful:', user);
        // Navigate to dashboard or home page after successful login
        this.leaveAndNavigate('/');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);

        // Handle different error scenarios with user-friendly messages
        if (error.status === 0) {
          this.authError = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.status === 401) {
          this.authError = 'The email or password you entered is incorrect. Please check your credentials and try again.';
        } else if (error.status === 403) {
          this.authError = 'Your account has been locked or disabled. Please contact support for assistance.';
        } else if (error.status === 404) {
          this.authError = 'No account found with this email address. Please check your email or sign up for a new account.';
        } else if (error.status === 429) {
          this.authError = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.status >= 500) {
          this.authError = 'Our servers are currently experiencing issues. Please try again in a few moments.';
        } else if (error.message?.includes('Invalid credentials') || error.message?.includes('not found')) {
          this.authError = 'The email or password you entered is incorrect. Please double-check your credentials.';
        } else if (error.message?.includes('locked') || error.message?.includes('disabled')) {
          this.authError = 'Your account is temporarily locked. Please contact support or try again later.';
        } else {
          this.authError = 'Sign in failed. Please check your credentials and try again.';
        }

        // Auto-dismiss error after 8 seconds
        setTimeout(() => {
          this.authError = null;
        }, 8000);
      },
    });
  }
}