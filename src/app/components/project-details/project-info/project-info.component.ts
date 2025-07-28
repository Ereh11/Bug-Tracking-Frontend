import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { ProjectInfo, Manager, ProjectData } from '../../../Core/interfaces';
import { Subscription } from 'rxjs';
import { EditProjectComponent } from '../../project-btns/edit-project/edit-project.component';

@Component({
  selector: 'app-project-info',
  standalone: true,
  imports: [CommonModule, EditProjectComponent],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.css',
})
export class ProjectInfoComponent implements OnInit, OnDestroy {
  projectInfo: ProjectInfo | null = null;
  manager: Manager | null = null;
  loading = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to project data
    this.subscriptions.push(
      this.projectDetailsService.projectData$.subscribe(
        (data: ProjectData | null) => {
          this.projectInfo = data?.info || null;
          this.manager = data?.manager || null;
          console.log('Project info updated:', this.projectInfo);
          console.log('Project manager updated:', this.manager);
        }
      )
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.projectDetailsService.loading$.subscribe(
        loading => {
          this.loading = loading;
        }
      )
    );

    // Subscribe to error state
    this.subscriptions.push(
      this.projectDetailsService.error$.subscribe(
        error => {
          this.error = error;
          if (error) {
            console.log('Project loading error:', error);
            this.projectInfo = null; // Clear project info on error
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onProjectUpdated(updatedInfo: { name: string; description: string }) {
    console.log('Project updated successfully:', updatedInfo);
    // The edit-project component handles the backend integration now,
    // so we just need to log the success here
  }

  // Safe getter methods for template
  get hasValidProjectInfo(): boolean {
    return !!(this.projectInfo && this.projectInfo.id && this.projectInfo.name);
  }

  get projectName(): string {
    return this.projectInfo?.name || 'Loading...';
  }

  get projectDescription(): string {
    return this.projectInfo?.description || 'No description available';
  }

  get canShowEditButton(): boolean {
    if (!this.hasValidProjectInfo) {
      return false;
    }

    // Check if user is admin (can edit any project)
    if (this.isCurrentUserAdmin()) {
      return true;
    }

    // Check if user is manager of this specific project
    if (this.isCurrentUserProjectManager()) {
      return true;
    }

    // Regular members cannot edit projects
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
}