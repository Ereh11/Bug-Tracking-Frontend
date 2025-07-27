import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DeleteBugComponent } from '../../project-btns/delete-bug/delete-bug.component';
import { AddBugComponent } from '../../project-btns/add-bug/add-bug.component';
import { EditBugComponent } from '../../project-btns/edit-bug/edit-bug.component';
import { AddAttachmentComponent } from '../../project-btns/add-attachment/add-attachment.component';
import { AddTicketComponent } from '../../project-btns/add-ticket/add-ticket.component';
import { ProjectDetailsService, Bug } from '../../../Core/Services/project-details.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-project-bugs',
  imports: [
    CommonModule,
    DeleteBugComponent,
    AddBugComponent,
    EditBugComponent,
    AddAttachmentComponent,
    AddTicketComponent,
  ],
  templateUrl: './project-bugs.component.html',
  styleUrl: './project-bugs.component.css',
})
export class ProjectBugsComponent implements OnInit, OnDestroy {
  bugs: Bug[] = [];
  projectId: string = '';
  private subscriptions: Subscription[] = [];

  constructor(private projectDetailsService: ProjectDetailsService) {}

  ngOnInit(): void {
    // Subscribe to project data changes to get bugs
    this.subscriptions.push(
      this.projectDetailsService.projectData$.subscribe(projectData => {
        this.bugs = projectData?.bugs || [];
        this.projectId = projectData?.info?.id || '';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Helper methods for the template
  getBugStatusClass(status: Bug['status']): string {
    const statusClasses = {
      'New': 'text-cancelled',
      'In Progress': 'text-inprogress',
      'Closed': 'text-onhold',
      'Resolved': 'text-completed',
      'Reopened': 'text-orange-500',
      'Assigned': 'text-planning'
    };
    return statusClasses[status] || 'text-gray-400';
  }

  getBugPriorityClass(priority: Bug['priority']): string {
    const priorityClasses = {
      'Medium': 'bg-planning',
      'High': 'bg-cancelled',
      'Low': 'bg-completed',
      'Critical': 'bg-inprogress'
    };
    return priorityClasses[priority] || 'bg-gray-500';
  }

  // Methods for bug operations (to be called by child components)
  onAddBug(bugData: Omit<Bug, 'id' | 'assignedTo'>): void {
    const currentProject = this.projectDetailsService.currentProjectData;
    if (currentProject?.info?.id) {
      this.projectDetailsService.addBug(currentProject.info.id, bugData).subscribe({
        next: (updatedProject) => {
          console.log('Bug added successfully:', updatedProject);
        },
        error: (error) => {
          console.error('Failed to add bug:', error);
        }
      });
    } else {
      console.error('Cannot add bug: project not loaded or missing project info');
    }
  }

  onUpdateBug(bugId: string, updates: Partial<Bug>): void {
    const currentProject = this.projectDetailsService.currentProjectData;
    if (currentProject?.info?.id) {
      this.projectDetailsService.updateBug(currentProject.info.id, bugId, updates).subscribe({
        next: (updatedProject) => {
          console.log('Bug updated successfully:', updatedProject);
        },
        error: (error) => {
          console.error('Failed to update bug:', error);
        }
      });
    } else {
      console.error('Cannot update bug: project not loaded or missing project info');
    }
  }

  onDeleteBug(bugId: string): void {
    const currentProject = this.projectDetailsService.currentProjectData;
    if (currentProject?.info?.id) {
      this.projectDetailsService.removeBug(currentProject.info.id, bugId).subscribe({
        next: (updatedProject) => {
          console.log('Bug deleted successfully:', updatedProject);
        },
        error: (error) => {
          console.error('Failed to delete bug:', error);
        }
      });
    } else {
      console.error('Cannot delete bug: project not loaded or missing project info');
    }
  }

  // Get bug by ID for child components
  getBugById(bugId: string): Bug | undefined {
    return this.projectDetailsService.getBugById(bugId);
  }

  // TrackBy function for better performance
  trackByBugId(index: number, bug: Bug): string {
    return bug.id;
  }
}