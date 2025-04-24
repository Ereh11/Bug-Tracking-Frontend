import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;
  isLeaving = false;
  isEntering = false;

  controls = [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      placeholder: 'Your username',
    },
    {
      name: 'email',
      label: 'Email address',
      type: 'email',
      placeholder: 'you@example.com',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: '••••••••',
    },
    {
      name: 'confirm',
      label: 'Confirm Password',
      type: 'password',
      placeholder: '••••••••',
    },
  ];
  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        username: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&+=])[A-Za-z\d!@#$%^&+=]{8,}$/
            ),
          ],
        ],
        confirm: ['', [Validators.required]],
      },
      { validators: this.passwordsMatch }
    );
  }

  passwordsMatch(group: FormGroup): ValidationErrors | null {
    return group.get('password')?.value === group.get('confirm')?.value
      ? null
      : { mismatch: 'Passwords do not match' };
  }

  getErrors(controlName: string): string[] {
    const control = this.signupForm.get(controlName);
    if (!control || !control.errors) return [];
    const errs: string[] = [];
    const errors = control.errors;

    if (errors['required']) errs.push('This field is required');

    if (errors['email']) errs.push('Enter a valid email');

    if (controlName === 'password' && errors['pattern']) {
      errs.push(
        'Password must be ≥8 chars, include uppercase, number & symbol'
      );
    }

    if (controlName === 'confirm' && errors['mismatch']) {
      errs.push(errors['mismatch'] as string);
    }

    return errs;
  }

  ngAfterViewInit() {
    setTimeout(() => (this.isEntering = true), 10);
  }
  leaveAndNavigate(path: string) {
    if (this.signupForm.invalid && path === '/login') {
    }
    this.isLeaving = true;
    setTimeout(() => {
      this.router.navigate([path]);
    }, 500);
  }
}
