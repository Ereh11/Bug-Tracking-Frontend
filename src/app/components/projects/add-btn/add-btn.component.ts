// add-btn.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../Core/Services/auth.service';
import { ProjectService } from '../../../Core/Services/projects.service';

interface CreateProjectRequest {
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface NewProjectForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: number;
  isActive: boolean;
}

@Component({
  selector: 'app-add-btn',
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './add-btn.component.html',
  styleUrl: './add-btn.component.css',
})
export class AddBtnComponent {
  @Output() projectCreated = new EventEmitter<void>(); // Emit event when project is created
  
  showAddProjectPopup = false;
  showNameError = false;
  showDescriptionError = false;
  showStartDateError = false;
  showEndDateError = false;
  isCreating = false; // Loading state for create operation
  errorMessage: string | null = null;
  
  nameErrorMessage = '';
  descriptionErrorMessage = '';
  endDateErrorMessage = '';

  newProject: NewProjectForm = {
    name: '',
    description: '',
    startDate: this.getTodayDate(),
    endDate: this.getDefaultEndDate(),
    status: 2, // In Progress by default
    isActive: true,
  };

  constructor(
    private authService: AuthService,
    private projectService: ProjectService
  ) {}

  // Check if current user is admin
  isCurrentUserAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Method to handle start date changes
  onStartDateChange(): void {
    this.validateDates();
    this.errorMessage = null;
    
    // If end date is before or equal to new start date, adjust it
    if (this.newProject.endDate && this.newProject.startDate) {
      const startDateStr = this.newProject.startDate;
      const endDateStr = this.newProject.endDate;
      const todayStr = this.getTodayDate();
      
      // If end date is not valid, adjust it
      if (endDateStr <= startDateStr || endDateStr <= todayStr) {
        // Create a new end date that's at least tomorrow and after start date
        const startDate = new Date(startDateStr);
        const today = new Date(todayStr);
        
        const minEndDate = new Date(Math.max(startDate.getTime(), today.getTime()));
        minEndDate.setDate(minEndDate.getDate() + 1); // Add 1 day
        
        this.newProject.endDate = minEndDate.toISOString().split('T')[0];
      }
    }
  }

  // Method to handle end date changes
  onEndDateChange(): void {
    this.validateDates();
    this.errorMessage = null;
  }

  // Validation methods
  validateName(): void {
    const name = this.newProject.name.trim();
    if (!name) {
      this.showNameError = true;
      this.nameErrorMessage = 'Project name is required.';
    } else if (name.length < 2) {
      this.showNameError = true;
      this.nameErrorMessage = 'Project name must be at least 2 characters long.';
    } else {
      this.showNameError = false;
      this.nameErrorMessage = '';
    }
  }

  validateDescription(): void {
    const description = this.newProject.description.trim();
    if (!description) {
      this.showDescriptionError = true;
      this.descriptionErrorMessage = 'Project description is required.';
    } else if (description.length < 2) {
      this.showDescriptionError = true;
      this.descriptionErrorMessage = 'Project description must be at least 2 characters long.';
    } else {
      this.showDescriptionError = false;
      this.descriptionErrorMessage = '';
    }
  }

  validateDates(): void {
    this.showStartDateError = false;
    this.showEndDateError = false;
    this.endDateErrorMessage = '';

    if (!this.newProject.startDate) {
      this.showStartDateError = true;
      return;
    }

    if (!this.newProject.endDate) {
      this.showEndDateError = true;
      this.endDateErrorMessage = 'End date is required.';
      return;
    }

    // Create dates from strings (this avoids timezone issues)
    const startDateStr = this.newProject.startDate;
    const endDateStr = this.newProject.endDate;
    const todayStr = this.getTodayDate();

    // Compare date strings directly to avoid timezone issues
    if (startDateStr > todayStr) {
      this.showStartDateError = true;
      return;
    }

    // Check if end date is today or in the past (end date should be in the future)
    if (endDateStr <= todayStr) {
      this.showEndDateError = true;
      this.endDateErrorMessage = 'End date must be in the future (tomorrow or later).';
      return;
    }

    // Check if end date is before or equal to start date
    if (endDateStr <= startDateStr) {
      this.showEndDateError = true;
      this.endDateErrorMessage = 'End date must be after start date.';
      return;
    }

    // Check if the project duration is reasonable (optional)
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365 * 5) { // More than 5 years
      this.showEndDateError = true;
      this.endDateErrorMessage = 'Project duration cannot exceed 5 years.';
      return;
    }
  }

  // Validate all fields before submission
  validateForm(): boolean {
    this.validateName();
    this.validateDescription();
    this.validateDates();
    
    return !this.showNameError && !this.showDescriptionError && 
           !this.showStartDateError && !this.showEndDateError;
  }

  createProject() {
    // Validate all fields
    if (!this.validateForm()) {
      return;
    }

    this.isCreating = true;
    this.errorMessage = null;

    // Prepare project data
    const projectData: CreateProjectRequest = {
      name: this.newProject.name.trim(),
      description: this.newProject.description.trim(),
      status: Number(this.newProject.status), // Convert to number
      startDate: this.newProject.startDate,
      endDate: this.newProject.endDate,
      isActive: this.newProject.isActive
    };

    console.log('Creating project with data:', projectData);

    // Call the API to create project
    this.projectService.createProject(projectData).subscribe({
      next: (response) => {
        console.log('Project created successfully:', response);
        this.closePopup();
        this.projectCreated.emit(); // Notify parent component to refresh projects list
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating project:', error);
        this.isCreating = false;
        
        // Enhanced error handling with better parsing
        if (error.status === 400) {
          // Handle validation errors from backend
          if (error.error?.errors && Array.isArray(error.error.errors)) {
            // Handle array of error objects with code and message
            const validationErrors = error.error.errors;
            const errorMessages: string[] = [];
            
            validationErrors.forEach((err: any) => {
              if (err.message) {
                errorMessages.push(err.message);
              }
            });
            
            if (errorMessages.length > 0) {
              this.errorMessage = errorMessages.join('. ');
            } else {
              this.errorMessage = error.error?.message || 'Invalid project data. Please check all fields and try again.';
            }
          } else if (error.error?.errors && typeof error.error.errors === 'object') {
            // Handle object-based validation errors (ASP.NET Core ModelState)
            const validationErrors = error.error.errors;
            const errorMessages: string[] = [];
            
            for (const field in validationErrors) {
              if (validationErrors[field] && Array.isArray(validationErrors[field])) {
                validationErrors[field].forEach((msg: string) => {
                  errorMessages.push(msg);
                });
              }
            }
            
            if (errorMessages.length > 0) {
              this.errorMessage = errorMessages.join('. ');
            } else {
              this.errorMessage = error.error?.message || 'Invalid project data. Please check all fields and try again.';
            }
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Invalid project data. Please check all fields and try again.';
          }
        } else if (error.status === 401) {
          this.errorMessage = 'You are not authorized to create projects. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'Access denied. You do not have permission to create projects.';
        } else if (error.status === 409) {
          this.errorMessage = 'A project with this name already exists. Please choose a different name.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Failed to create project. Please try again.';
        }
      }
    });
  }

  cancelAddProject() {
    this.closePopup();
  }

  private closePopup() {
    this.showAddProjectPopup = false;
    this.showNameError = false;
    this.showDescriptionError = false;
    this.showStartDateError = false;
    this.showEndDateError = false;
    this.errorMessage = null;
    this.nameErrorMessage = '';
    this.descriptionErrorMessage = '';
    this.endDateErrorMessage = '';
    this.newProject = {
      name: '',
      description: '',
      startDate: this.getTodayDate(),
      endDate: this.getDefaultEndDate(),
      status: 2, // In Progress
      isActive: true,
    };
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMinEndDate(): string {
    const todayStr = this.getTodayDate();
    
    if (this.newProject.startDate) {
      const startDateStr = this.newProject.startDate;
      
      // Compare date strings to avoid timezone issues
      if (startDateStr >= todayStr) {
        // Start date is today or future, so end date should be at least day after start date
        const startDate = new Date(startDateStr);
        startDate.setDate(startDate.getDate() + 1);
        return startDate.toISOString().split('T')[0];
      } else {
        // Start date is in past, so end date should be at least tomorrow
        const tomorrow = new Date(todayStr);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
    }
    
    // If no start date, minimum is tomorrow
    const tomorrow = new Date(todayStr);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now (minimum 1 month)
    return endDate.toISOString().split('T')[0];
  }

  // Helper methods for template
  getProjectDuration(): string {
    if (!this.newProject.startDate || !this.newProject.endDate) {
      return 'Not specified';
    }
    
    const start = new Date(this.newProject.startDate);
    const end = new Date(this.newProject.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }

  getStatusName(status: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'Planning',
      2: 'In Progress',
      3: 'On Hold',
      4: 'Completed',
      5: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
  }

  // Open popup only if user is admin
  openAddProjectPopup() {
    if (this.isCurrentUserAdmin()) {
      this.showAddProjectPopup = true;
    }
  }
}