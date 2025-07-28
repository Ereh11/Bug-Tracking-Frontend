import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProjectDetailsService, Bug } from '../../../Core/Services/project-details.service';

@Component({
  selector: 'app-delete-bug',
  imports: [CommonModule],
  templateUrl: './delete-bug.component.html',
  styleUrl: './delete-bug.component.css',
})
export class DeleteBugComponent {
  @Input() bug: Bug | null = null;
  
  showConfirmPopup = false;
  isDeleting = false;
  errorMessage = '';

  constructor(private projectDetailsService: ProjectDetailsService) {}

  showDeleteConfirmation(): void {
    if (!this.bug) return;
    this.showConfirmPopup = true;
    this.errorMessage = '';
  }

  confirmDelete(): void {
    if (!this.bug || this.isDeleting) return;
    
    this.isDeleting = true;
    this.errorMessage = '';
    
    this.projectDetailsService.deleteBug(this.bug.id).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Bug deleted successfully:', response.message);
          this.showConfirmPopup = false;
          // The service already handles reloading the project data
        } else {
          this.errorMessage = response.message || 'Failed to delete bug';
        }
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Failed to delete bug:', error);
        this.errorMessage = error.message || 'Failed to delete bug';
        this.isDeleting = false;
      }
    });
  }

  cancelDelete(): void {
    this.showConfirmPopup = false;
    this.errorMessage = '';
  }
}
