import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectDetailsService, SystemUser } from '../../../Core/Services/project-details.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [CommonModule], // Add CommonModule to imports
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.css',
})
export class AddMemberComponent {
  showAddMemberModal = false;
  allUsers: SystemUser[] = [];
  availableUsers: SystemUser[] = [];
  selectedUserId: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  isAdding = false;
  
  private usersSubscription!: Subscription;

  @Output() memberAdded = new EventEmitter<string>();

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  openAddMemberModal() {
    this.showAddMemberModal = true;
    this.isLoading = true;
    
    // Subscribe to all users observable
    this.usersSubscription = this.projectDetailsService.allUsers$.subscribe({
      next: (users) => {
        this.allUsers = users;
        this.filterAvailableUsers();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  closeAddMemberModal() {
    this.showAddMemberModal = false;
    this.selectedUserId = null;
    this.errorMessage = null;
    this.isAdding = false;
    
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }

  private filterAvailableUsers() {
    const currentProject = this.projectDetailsService.currentProjectData;
    if (!currentProject) {
      this.availableUsers = this.allUsers;
      return;
    }

    // Get IDs of current project members (including manager)
    const existingMemberIds = new Set([
      ...currentProject.members.map(member => member.id),
      currentProject.manager.id
    ]);

    // Filter out users who are already members
    this.availableUsers = this.allUsers.filter(user => 
      !existingMemberIds.has(user.id) && user.isActive
    );
  }

  selectUser(userId: string) {
    this.selectedUserId = userId;
  }

  addUserToProject() {
    if (!this.selectedUserId) {
      this.errorMessage = 'Please select a user';
      return;
    }

    const projectId = this.projectDetailsService.currentProjectData?.info?.id;
    if (!projectId) {
      this.errorMessage = 'Project not found';
      return;
    }

    this.isAdding = true;
    this.errorMessage = null;

    this.projectDetailsService.addMemberToProject(projectId, this.selectedUserId, 'Added to project').subscribe({
      next: () => {
        this.memberAdded.emit(this.selectedUserId!);
        this.closeAddMemberModal();
        // Manually refresh project data
        this.projectDetailsService.loadProject(projectId).subscribe();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to add member to project';
        this.isAdding = false;
        console.error('Error adding member:', error);
      }
    });
  }
}