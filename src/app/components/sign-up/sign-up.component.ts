import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../../Core/Services/auth.service';

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
  swapBorders = false;
  isSubmitting = false;
  backendErrors: string[] = [];

  controls = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'First Name',
      icon: 'fa-solid fa-user',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Last Name',
      icon: 'fa-solid fa-user',
    },
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
    {
      name: 'confirm',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'Confirm Password',
      icon: 'fa-solid fa-lock',
    },
  ];

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.signupForm = this.fb.group(
      {
        

        firstName: ['', [Validators.required, Validators.minLength(2), this.alphabeticValidator]],
        lastName: ['', [Validators.required, Validators.minLength(2), this.alphabeticValidator]],
        email: ['', [Validators.required, Validators.email, this.customEmailValidator]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6), // Changed from 8 to 6 to match backend
            this.passwordStrengthValidator
          ],
        ],
        confirm: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator }
    );

    // Real-time validation - clear backend errors when user starts typing
    this.signupForm.valueChanges.subscribe(() => {
      if (this.backendErrors.length > 0) {
        this.backendErrors = [];
      }
    });
  }

  // Custom validator for alphabetic characters only (no spaces)
  alphabeticValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const alphabeticPattern = /^[a-zA-Z]*$/; // Removed \s to exclude spaces
    return alphabeticPattern.test(control.value) ? null : { alphabeticOnly: true };
  }

  // Custom email validator (more comprehensive than built-in)
  customEmailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(control.value) ? null : { invalidEmail: true };
  }

  // Password strength validator
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value;
    const errors: any = {};

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.missingUppercase = true;
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.missingLowercase = true;
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      errors.missingNumber = true;
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.missingSpecialChar = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Password match validator
  passwordsMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    
    if (!password || !confirm) return null;
    
    return password === confirm ? null : { passwordMismatch: true };
  }

  getErrors(controlName: string): string[] {
    const control = this.signupForm.get(controlName);
    if (!control || (!control.errors && !this.signupForm.errors)) return [];
    
    // Show errors immediately when user starts typing (after first interaction)
    const shouldShowErrors = control.touched || control.dirty || (control.value && control.value.length > 0);
    if (!shouldShowErrors) return [];
    
    const errs: string[] = [];
    const errors = control.errors || {};

    // Individual field errors
    if (errors['required']) {
      errs.push('This field is required');
    }

    if (errors['minLength']) {
      const requiredLength = errors['minLength'].requiredLength;
      const actualLength = errors['minLength'].actualLength;
      if (controlName === 'firstName') {
        errs.push(`First name must be at least ${requiredLength} characters long`);
      } else if (controlName === 'lastName') {
        errs.push(`Last name must be at least ${requiredLength} characters long`);
      } else if (controlName === 'password') {
        errs.push(`Password must be at least ${requiredLength} characters (currently ${actualLength})`);
      } else {
        errs.push(`Minimum ${requiredLength} characters required (currently ${actualLength})`);
      }
    }

    if (errors['alphabeticOnly']) {
      errs.push('Only letters are allowed (no spaces or numbers)');
    }

    // Real-time validation for first name and last name length
    if ((controlName === 'firstName' || controlName === 'lastName') && control.value && control.value.length > 0 && control.value.length < 2) {
      const fieldName = controlName === 'firstName' ? 'First name' : 'Last name';
      errs.push(`${fieldName} must be at least 2 characters long`);
    }

    if (errors['email'] || errors['invalidEmail']) {
      errs.push('Please enter a valid email address');
    }

    // Password specific errors - show real-time
    if (controlName === 'password' && control.value && control.value.length > 0) {
      if (errors['missingUppercase']) {
        errs.push('Must contain at least one uppercase letter');
      }
      if (errors['missingLowercase']) {
        errs.push('Must contain at least one lowercase letter');
      }
      if (errors['missingNumber']) {
        errs.push('Must contain at least one number');
      }
      if (errors['missingSpecialChar']) {
        errs.push('Must contain at least one special character');
      }
      if (control.value.length < 6) {
        errs.push('Password must be at least 6 characters long');
      }
    }

    // Password confirmation errors
    if (controlName === 'confirm' && this.signupForm.errors?.['passwordMismatch']) {
      errs.push('Passwords do not match');
    }

    return errs;
  }

  // Get field validation state for styling
  getFieldState(controlName: string): 'valid' | 'invalid' | 'neutral' {
    const control = this.signupForm.get(controlName);
    if (!control) return 'neutral';

    // If there are backend errors, don't show any success states
    if (this.backendErrors.length > 0) {
      return control.invalid && (control.touched || control.dirty || (control.value && control.value.length > 0)) ? 'invalid' : 'neutral';
    }

    // Show validation state if field has been interacted with or has value
    const hasInteracted = control.touched || control.dirty || (control.value && control.value.length > 0);
    if (!hasInteracted) return 'neutral';
    
    if (controlName === 'confirm') {
      // Special handling for confirm password
      return (control.valid && !this.signupForm.errors?.['passwordMismatch']) ? 'valid' : 'invalid';
    }

    return control.valid ? 'valid' : 'invalid';
  }

  onSubmit() {
    // Prevent double submission
    if (this.isSubmitting) {
      console.log('Form is already being submitted, ignoring duplicate submission');
      return;
    }

    // Mark all fields as touched to show validation errors
    this.markAllFieldsAsTouched();

    if (this.signupForm.invalid) {
      this.shakeForm();
      return;
    }

    this.isSubmitting = true;
    this.backendErrors = [];

    const formValue = this.signupForm.value;
    const registerRequest: RegisterRequest = {
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      password: formValue.password
    };

    console.log('Submitting registration request:', registerRequest);

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.isSubmitting = false;
        // Navigate to welcome page after successful registration
        this.leaveAndNavigate('/welcome');
      },
      error: (error) => {
        console.log('Registration failed:', error);
        this.isSubmitting = false;
        this.handleBackendErrors(error);
      }
    });
  }

  private handleBackendErrors(error: any) {
    this.backendErrors = [];
    
    console.log('Full error object:', error);
    console.log('Error.error:', error.error);
    console.log('Error type:', typeof error);
    console.log('Error constructor:', error.constructor.name);
    
    try {
      // Check if this is an HttpErrorResponse (the original error)
      if (error.error && typeof error.error === 'object') {
        // This is the original HttpErrorResponse
        const errorResponse = error.error;
        
        console.log('Found HttpErrorResponse.error:', errorResponse);
        console.log('Error response errors:', errorResponse?.errors);
        
        // Handle structured backend errors - check if errors array exists
        if (errorResponse && errorResponse.errors && Array.isArray(errorResponse.errors)) {
          // Extract actual error messages from the errors array
          this.backendErrors = errorResponse.errors.map((err: any) => {
            console.log('Processing error item:', err);
            // Handle different error object structures
            if (typeof err === 'string') {
              return err;
            } else if (err.message) {
              return err.message; // This should extract "Username 'email' is already taken."
            } else if (err.description) {
              return err.description;
            } else if (err.errorMessage) {
              return err.errorMessage;
            } else {
              // If the error object has other properties, try to extract meaningful info
              return JSON.stringify(err);
            }
          }).filter((msg: string) => msg && msg.trim() !== ''); // Filter out empty messages
          
          console.log('Extracted error messages from errors array:', this.backendErrors);
          
          // If we successfully extracted errors, don't use fallback messages
          if (this.backendErrors.length > 0) {
            console.log('Using extracted error messages:', this.backendErrors);
            this.shakeForm();
            return;
          }
        }
        
        // Fallback to the main message from the HTTP response
        if (errorResponse && errorResponse.message) {
          this.backendErrors = [errorResponse.message];
          console.log('Using HTTP response message:', this.backendErrors);
          this.shakeForm();
          return;
        }
      }
      
      // If it's a thrown Error object (like from auth service), check if it has the message
      if (error instanceof Error && error.message) {
        this.backendErrors = [error.message];
        console.log('Using Error.message:', this.backendErrors);
      } else if (typeof error === 'string') {
        this.backendErrors = [error];
        console.log('Using string error:', this.backendErrors);
      } else {
        this.backendErrors = ['Registration failed. Please try again.'];
        console.log('Using fallback message:', this.backendErrors);
      }
    } catch (e) {
      console.error('Error parsing backend response:', e);
      this.backendErrors = ['An unexpected error occurred. Please try again.'];
    }

    // Log for debugging
    console.log('Final processed backend errors:', this.backendErrors);

    // Shake form to draw attention to errors
    this.shakeForm();
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

  private shakeForm() {
    // Add shake animation class
    const formElement = document.querySelector('.signup-form');
    if (formElement) {
      formElement.classList.add('animate-shake');
      setTimeout(() => {
        formElement.classList.remove('animate-shake');
      }, 600);
    }
  }

  leaveAndNavigate(path: string) {
    // For login navigation, don't validate form - just navigate
    if (path === '/login') {
      this.isLeaving = true;
      this.swapBorders = true;
      setTimeout(() => {
        this.router.navigate([path]);
      }, 1500);
      return;
    }

    // For welcome navigation (after successful registration), just navigate
    if (path === '/welcome') {
      this.isLeaving = true;
      this.swapBorders = true;
      setTimeout(() => {
        this.router.navigate([path]);
      }, 1500);
      return;
    }

    // For other paths, validate form first
    this.onSubmit();
  }

  // Helper method to check if form has any errors
  get hasAnyErrors(): boolean {
    return this.signupForm.invalid || this.backendErrors.length > 0;
  }

  // Helper method to get overall form validation state
  get formValidationState(): 'valid' | 'invalid' | 'neutral' {
    if (this.backendErrors.length > 0) return 'invalid';
    if (this.signupForm.pristine) return 'neutral';
    return this.signupForm.valid ? 'valid' : 'invalid';
  }

  // Check if we should show success indicators
  get shouldShowSuccessIndicators(): boolean {
    return this.backendErrors.length === 0;
  }

  // Password strength calculation - updated for 6 character minimum
  getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    const password = this.signupForm.get('password')?.value || '';
    let score = 0;

    if (password.length >= 6) score++; // Changed from 8 to 6
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'Weak - Add more characters, numbers, and symbols';
      case 'medium': return 'Medium - Good, but could be stronger';
      case 'strong': return 'Strong - Excellent password!';
      default: return '';
    }
  }

  // Track by functions for ngFor performance
  trackByIndex(index: number): number {
    return index;
  }

  trackByControlName(index: number, item: any): string {
    return item.name;
  }
}