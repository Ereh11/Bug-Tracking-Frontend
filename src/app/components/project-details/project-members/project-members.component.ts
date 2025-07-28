import { Component, OnInit, OnDestroy } from '@angular/core';
import { DeleteMemberComponent } from '../../project-btns/delete-member/delete-member.component';
import { AddMemberComponent } from '../../project-btns/add-member/add-member.component';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { Member, Manager } from '../../../Core/interfaces';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, DeleteMemberComponent, AddMemberComponent],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.css',
})
export class ProjectMembersComponent implements OnInit, OnDestroy {
  members: Member[] = [];
  manager: Manager | null = null;
  private subscription!: Subscription;

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.projectDetailsService.projectData$.subscribe(
      data => {
        if (data) {
          this.members = data.members;
          // Manager is stored separately in the data structure
          this.manager = data.manager;
        } else {
          this.members = [];
          this.manager = null;
        }
      }
    );
  }

  get regularMembers(): Member[] {
    // All members are regular members since manager is stored separately
    return this.members;
  }

  addMemberToProject(userId: string) {
    // The member has already been added via the API call in add-member component
    // Just log for confirmation - the project data will be refreshed automatically
    console.log('Member added to project:', userId);
  }

  /**
   * Check if current user can add members to this project
   * Only admins and project managers can add members
   */
  get canShowAddMemberButton(): boolean {
    // Check if user is admin (can manage any project)
    if (this.isCurrentUserAdmin()) {
      return true;
    }

    // Check if user is manager of this specific project
    if (this.isCurrentUserProjectManager()) {
      return true;
    }

    // Regular members cannot add other members
    return false;
  }

  /**
   * Check if current user is admin
   */
  private isCurrentUserAdmin(): boolean {
    const userRoles = this.authService.getCurrentUserRoles();
    return userRoles.some((role: string) => 
      role.toLowerCase().includes('admin')
    );
  }

  /**
   * Check if current user is the manager of this project
   */
  private isCurrentUserProjectManager(): boolean {
    if (!this.manager) {
      return false;
    }

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return false;
    }

    // Check if current user ID matches the project manager ID
    return this.manager.id === currentUserId;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}