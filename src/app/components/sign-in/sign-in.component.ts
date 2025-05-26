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
import { AuthService, LoginRequest } from '../../core/services/auth.service';

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
      password: this.signInForm.value.password
    };

    this.authService.login(loginRequest)
      .subscribe({
        next: (user) => {
          this.isLoading = false;
          console.log('Login successful:', user);
          // Navigate to dashboard or home page after successful login
          this.leaveAndNavigate('/project');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login erro');
          console.error('Login error:', error);
          this.authError = error.message || 'Login failed';

          // Handle different error scenarios
          if (error.status === 0) {
            this.authError = 'Unable to connect to the server. Please check your internet connection or try again later.';
          } else if (error.status === 401 || error.message?.includes('Invalid credentials') || error.message?.includes('not found')) {
            this.authError = 'Invalid email or password';

          } else if (error.status === 403 || error.message?.includes('locked') || error.message?.includes('disabled')) {
            this.authError = 'Account is locked or disabled. Please contact support.';
          } else {
            this.authError = 'Authentication failed. Please try again.';
          }
        }
      });
  }
}
