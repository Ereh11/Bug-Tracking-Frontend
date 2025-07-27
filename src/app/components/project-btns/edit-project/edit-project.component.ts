import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.css',
})
export class EditProjectComponent {
  @Input() currentName: string = '';
  @Input() currentDescription: string = '';
  @Input() projectId: string = '';
  @Output() updateProject = new EventEmitter<{ name: string; description: string }>();

  showEditProjectPopup = false;
  isSubmitting = false;
  submitError: string | null = null;

  editProject = {
    name: '',
    description: '',
  };

  // Real-time validation properties
  nameErrors: string[] = [];
  descriptionErrors: string[] = [];

  constructor(private projectDetailsService: ProjectDetailsService) {}

  openEditProjectPopup() {
    this.editProject.name = this.currentName;
    this.editProject.description = this.currentDescription;
    this.showEditProjectPopup = true;
    this.clearErrors();
  }

  cancelEditProject() {
    this.showEditProjectPopup = false;
    this.clearErrors();
    this.isSubmitting = false;
    this.submitError = null;
  }

  // Real-time validation methods
  validateName(): void {
    this.nameErrors = [];
    const name = this.editProject.name.trim();
    
    if (!name) {
      this.nameErrors.push('Project name is required');
    } else if (name.length < 2) {
      this.nameErrors.push('Project name must be at least 2 characters long');
    }
  }

  validateDescription(): void {
    this.descriptionErrors = [];
    const description = this.editProject.description.trim();
    
    if (description && description.length < 2) {
      this.descriptionErrors.push('Description must be at least 2 characters long');
    }
  }

  onNameInput(): void {
    this.validateName();
    this.submitError = null;
  }

  onDescriptionInput(): void {
    this.validateDescription();
    this.submitError = null;
  }

  clearErrors(): void {
    this.nameErrors = [];
    this.descriptionErrors = [];
    this.submitError = null;
  }

  get hasValidationErrors(): boolean {
    return this.nameErrors.length > 0 || this.descriptionErrors.length > 0;
  }

  get isFormValid(): boolean {
    this.validateName();
    this.validateDescription();
    return !this.hasValidationErrors;
  }

  submitEditProject() {
    if (!this.isFormValid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    const projectData = {
      name: this.editProject.name.trim(),
      description: this.editProject.description.trim()
    };

    this.projectDetailsService.updateProjectInfo(this.projectId, projectData)
      .subscribe({
        next: (updatedProject) => {
          this.isSubmitting = false;
          this.showEditProjectPopup = false;
          this.clearErrors();
          
          // Emit the update event for parent component
          this.updateProject.emit({
            name: updatedProject.info.name,
            description: updatedProject.info.description
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          this.submitError = error.message || 'Failed to update project. Please try again.';
          console.error('Error updating project:', error);
        }
      });
  }
}