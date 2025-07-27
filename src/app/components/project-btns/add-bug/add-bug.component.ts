import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';

// Enums matching backend
export enum BugPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export enum BugStatus {
  New = 1,
  Assigned = 2,
  InProgress = 3,
  Resolved = 4,
  Closed = 5,
  Reopened = 6
}

@Component({
  selector: 'app-add-bug',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-bug.component.html',
  styleUrl: './add-bug.component.css',
})
export class AddBugComponent {
  @Input() projectId: string = '';

  showAddBugPopup = false;
  isSubmitting = false;
  submitError: string | null = null;

  newBug = {
    title: '',
    description: '',
  };

  // Real-time validation properties
  titleErrors: string[] = [];
  descriptionErrors: string[] = [];

  priorityOptions = [
    { label: 'Low', value: BugPriority.Low },
    { label: 'Medium', value: BugPriority.Medium },
    { label: 'High', value: BugPriority.High },
    { label: 'Critical', value: BugPriority.Critical }
  ];

  statusOptions = [
    { label: 'New', value: BugStatus.New },
    { label: 'Assigned', value: BugStatus.Assigned },
    { label: 'In Progress', value: BugStatus.InProgress },
    { label: 'Resolved', value: BugStatus.Resolved },
    { label: 'Closed', value: BugStatus.Closed },
    { label: 'Reopened', value: BugStatus.Reopened }
  ];

  selectedPriority = BugPriority.Low;
  selectedStatus = BugStatus.New;

  isPriorityOpen = false;
  isStatusOpen = false;

  constructor(private projectDetailsService: ProjectDetailsService) {}

  openAddBugPopup() {
    this.showAddBugPopup = true;
    this.clearErrors();
  }

  // Real-time validation methods
  validateTitle(): void {
    this.titleErrors = [];
    const title = this.newBug.title.trim();
    
    if (!title) {
      this.titleErrors.push('Bug title is required');
    } else if (title.length < 2) {
      this.titleErrors.push('Bug title must be at least 2 characters long');
    }
  }

  validateDescription(): void {
    this.descriptionErrors = [];
    const description = this.newBug.description.trim();
    
    if (!description) {
      this.descriptionErrors.push('Bug description is required');
    } else if (description.length < 2) {
      this.descriptionErrors.push('Bug description must be at least 2 characters long');
    }
  }

  onTitleInput(): void {
    this.validateTitle();
    this.submitError = null;
  }

  onDescriptionInput(): void {
    this.validateDescription();
    this.submitError = null;
  }

  clearErrors(): void {
    this.titleErrors = [];
    this.descriptionErrors = [];
    this.submitError = null;
  }

  get hasValidationErrors(): boolean {
    return this.titleErrors.length > 0 || this.descriptionErrors.length > 0;
  }

  get isFormValid(): boolean {
    this.validateTitle();
    this.validateDescription();
    return !this.hasValidationErrors;
  }

  // Dropdown methods
  togglePriority() {
    this.isPriorityOpen = !this.isPriorityOpen;
    this.isStatusOpen = false;
  }

  toggleStatus() {
    this.isStatusOpen = !this.isStatusOpen;
    this.isPriorityOpen = false;
  }

  selectPriority(priority: BugPriority) {
    this.selectedPriority = priority;
    this.isPriorityOpen = false;
  }

  selectStatus(status: BugStatus) {
    this.selectedStatus = status;
    this.isStatusOpen = false;
  }

  getPriorityLabel(priority: BugPriority): string {
    return this.priorityOptions.find(p => p.value === priority)?.label || 'Low';
  }

  getStatusLabel(status: BugStatus): string {
    return this.statusOptions.find(s => s.value === status)?.label || 'New';
  }

  createBug() {
    if (!this.isFormValid || this.isSubmitting) {
      return;
    }

    if (!this.projectId) {
      this.submitError = 'Project ID is required to create a bug';
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    this.projectDetailsService.createBug(
      this.projectId,
      this.newBug.title.trim(),
      this.newBug.description.trim(),
      this.selectedStatus,
      this.selectedPriority
    )
    .subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.showAddBugPopup = false;
        this.resetForm();
        this.clearErrors();
        console.log('Bug created successfully');
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submitError = error.message || 'Failed to create bug. Please try again.';
        console.error('Error creating bug:', error);
      }
    });
  }

  cancelAddBug() {
    this.showAddBugPopup = false;
    this.resetForm();
    this.clearErrors();
    this.isSubmitting = false;
    this.submitError = null;
  }

  private resetForm() {
    this.newBug = { title: '', description: '' };
    this.selectedPriority = BugPriority.Low;
    this.selectedStatus = BugStatus.New;
  }
}
