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
import { AuthService } from '../../Core/Services/auth.service';
import { LoginRequest } from '../../Core/interfaces';

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
  showPassword = false;

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
    });

    // If user is already logged in, redirect to home page
    if (this.authService.isLoggedIn && this.authService.isTokenValid()) {
      this.router.navigate(['/']);
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
        console.log('Current auth state after login:', this.authService.isLoggedIn);
        
        // Get stored redirect URL or default to projects page
        const redirectUrl = this.authService.getAndClearRedirectUrl() || '/';
        console.log('Redirecting to:', redirectUrl);
        
        // Use router.navigateByUrl with replaceUrl to avoid history issues
        this.router.navigateByUrl(redirectUrl, { replaceUrl: true }).then(() => {
          console.log('Navigation completed to:', redirectUrl);
        }).catch(err => {
          console.error('Navigation failed:', err);
          // Fallback: force page reload to the home page
          window.location.href = '/';
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);

        // Handle different error scenarios with user-friendly messages
        if (error.status === 0) {
          this.authError = 'Unable to connect to the server. Please check your internet connection.';
        } else if (error.status === 401) {
          this.authError = 'Invalid email or password. Please check your credentials.';
        } else if (error.status === 403) {
          this.authError = 'Account locked or disabled. Please contact support.';
        } else if (error.status === 404) {
          this.authError = 'No account found with this email address.';
        } else if (error.status === 429) {
          this.authError = 'Too many login attempts. Please wait before trying again.';
        } else if (error.status >= 500) {
          this.authError = 'Server error. Please try again later.';
        } else {
          // Use the error message from the server if available, otherwise use default
          this.authError = error.error?.message || error.message || 'Authentication failed. Please try again.';
        }

        // Auto-dismiss error after 6 seconds
        setTimeout(() => {
          this.authError = null;
        }, 6000);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    const passwordControl = this.controls.find(ctrl => ctrl.name === 'password');
    if (passwordControl) {
      passwordControl.type = this.showPassword ? 'text' : 'password';
    }
  }
}