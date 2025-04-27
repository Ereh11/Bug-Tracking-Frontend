import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  signInForm!: FormGroup;
  authError: string | null = null;
  isLeaving = false;
  swapBorders = false;

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

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
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

    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.signInForm.value;

    fakeAuthService
      .signIn(email, password)
      .then(() => {
        this.leaveAndNavigate('/signup');
      })
      .catch((errCode) => {
        if (errCode === 'user-not-found') {
          this.authError = 'No account found with this email';
        } else if (errCode === 'wrong-password') {
          this.authError = 'Incorrect password';
        } else {
          this.authError = 'Authentication failed. Please try again.';
        }
      });
  }
}

//fake
const fakeAuthService = {
  signIn(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email !== 'user@example.com') {
          return reject('user-not-found');
        }
        if (password !== 'Password1!') {
          return reject('wrong-password');
        }
        resolve();
      }, 700);
    });
  },
};
