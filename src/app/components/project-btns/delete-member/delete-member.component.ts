import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { Member } from '../../../Core/interfaces';
import { AuthService } from '../../../Core/Services/auth.service';

@Component({
  selector: 'app-delete-member',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-member.component.html',
  styleUrl: './delete-member.component.css',
})
export class DeleteMemberComponent {
  @Input() member!: Member;
  @Output() memberDeleted = new EventEmitter<string>();
  showConfirmPopup = false;
  isDeleting = false;
  errorMessage: string | null = null;

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  get canDeleteMember(): boolean {
    return this.isCurrentUserAdmin() || this.isCurrentUserProjectManager();
  }

  private isCurrentUserAdmin(): boolean {
    const userRoles = this.authService.getCurrentUserRoles();
    return userRoles.includes('admin');
  }

  private isCurrentUserProjectManager(): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    const currentProject = this.projectDetailsService.currentProjectData;
    
    return !!currentUserId && !!currentProject && 
           currentUserId === currentProject.manager.id;
  }

  confirmDelete() {
    if (!this.canDeleteMember) {
      this.errorMessage = 'Only admins and project managers can delete members';
      this.showConfirmPopup = false;
      return;
    }

    this.isDeleting = true;
    const projectId = this.projectDetailsService.currentProjectData?.info.id;
    
    if (projectId && this.member) {
      this.projectDetailsService.removeMember(projectId, this.member.id).subscribe({
        next: () => {
          this.memberDeleted.emit(this.member.id);
          this.showConfirmPopup = false;
          this.isDeleting = false;
          // Manually refresh project data
          this.projectDetailsService.loadProject(projectId).subscribe();
        },
        error: (err) => {
          this.errorMessage = 'Failed to delete member';
          this.isDeleting = false;
          console.error(err);
        }
      });
    }
  }

  cancelDelete() {
    this.showConfirmPopup = false;
    this.errorMessage = null;
  }
}