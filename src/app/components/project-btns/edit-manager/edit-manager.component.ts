import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { SystemUser } from '../../../Core/interfaces';
import { AuthService } from '../../../Core/Services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-manager',
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-manager.component.html',
  styleUrl: './edit-manager.component.css',
})
export class EditManagerComponent implements OnInit, OnDestroy {
  showChangeManagerPopup = false;
  selectedManager: SystemUser | null = null;
  availableUsers: SystemUser[] = [];
  currentProjectId: string | null = null;
  isLoading = false;
  isUpdating = false;
  errorMessage: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to current project data to get project ID
    const projectSub = this.projectDetailsService.projectData$.subscribe(data => {
      this.currentProjectId = data?.info?.id || null;
    });
    this.subscriptions.push(projectSub);

    // Load all system users
    this.loadAvailableUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAvailableUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    const usersSub = this.projectDetailsService.allUsers$.subscribe({
      next: (users) => {
        this.availableUsers = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.errorMessage = 'Failed to load available users';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(usersSub);
  }

  selectManager(user: SystemUser): void {
    this.selectedManager = user;
  }

  openChangeManagerPopup(): void {
    this.showChangeManagerPopup = true;
    this.selectedManager = null;
    this.errorMessage = null;
  }

  closePopup(): void {
    this.showChangeManagerPopup = false;
    this.selectedManager = null;
    this.errorMessage = null;
  }

  confirmManagerChange(): void {
    if (!this.selectedManager || !this.currentProjectId) {
      this.errorMessage = 'Please select a manager and ensure project is loaded';
      return;
    }

    this.isUpdating = true;
    this.errorMessage = null;

    this.projectDetailsService.changeProjectManager(this.currentProjectId, this.selectedManager.id)
      .subscribe({
        next: (response) => {
          this.isUpdating = false;
          if (response.success) {
            console.log('Manager changed successfully:', response.message);
            this.closePopup();
          } else {
            this.errorMessage = response.message || 'Failed to change manager';
          }
        },
        error: (error) => {
          this.isUpdating = false;
          console.error('Error changing manager:', error);
          this.errorMessage = error.error?.message || error.message || 'Failed to change manager';
        }
      });
  }

  // Helper method to get user initials for avatar
  getUserInitials(user: SystemUser): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  // Helper method to get user display name
  getUserDisplayName(user: SystemUser): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  // Check if current user is admin
  isCurrentUserAdmin(): boolean {
    const userRoles = this.authService.getCurrentUserRoles();
    return userRoles.includes('Admin') || userRoles.includes('admin') || userRoles.includes('Administrator');
  }
}
