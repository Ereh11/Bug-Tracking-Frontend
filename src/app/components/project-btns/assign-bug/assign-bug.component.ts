import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService, Bug, Member, BugAssignee, AssignBugRequest} from '../../../Core/Services/project-details.service';

@Component({
  selector: 'app-assign-bug',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="assign-bug-container">
      <button 
        class="btn btn-primary btn-sm"
        (click)="toggleAssignModal()"
        [disabled]="!bug">
        Assign Bug
      </button>

      <!-- Assignment Modal -->
      <div *ngIf="showAssignModal" class="modal-overlay" (click)="closeAssignModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Assign Bug: {{ bug?.title }}</h3>
            <button class="close-btn" (click)="closeAssignModal()">&times;</button>
          </div>
          
          <div class="modal-body">
            <!-- Current Assignees -->
            <div *ngIf="currentAssignees.length > 0" class="current-assignees">
              <h4>Currently Assigned To:</h4>
              <div *ngFor="let assignee of currentAssignees" class="assignee-item">
                <span>{{ getUserName(assignee.userId) }}</span>
                <span class="assign-date">({{ formatDate(assignee.assignedDate) }})</span>
                <button 
                  class="btn btn-danger btn-sm ml-2"
                  (click)="unassignBug(assignee.userId)"
                  [disabled]="isAssigning">
                  Unassign
                </button>
              </div>
            </div>

            <!-- Assignment Form -->
            <div class="assign-form">
              <h4>Assign to User:</h4>
              <select [(ngModel)]="selectedUserId" class="form-select">
                <option value="">Select a user...</option>
                <option *ngFor="let member of getAvailableMembers()" [value]="member.id">
                  {{ member.firstName }} {{ member.lastName }}
                </option>
              </select>
              
              <div class="form-actions">
                <button 
                  class="btn btn-success"
                  (click)="assignBug()"
                  [disabled]="!selectedUserId || isAssigning">
                  {{ isAssigning ? 'Assigning...' : 'Assign Bug' }}
                </button>
                <button class="btn btn-secondary" (click)="closeAssignModal()">
                  Cancel
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      padding: 20px;
      width: 500px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
    }

    .current-assignees {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
    }

    .assignee-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .assignee-item:last-child {
      border-bottom: none;
    }

    .assign-date {
      color: #666;
      font-size: 0.9em;
    }

    .assign-form .form-select {
      width: 100%;
      padding: 8px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .error-message {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
    }
  `]
})
export class AssignBugComponent implements OnInit {
  @Input() bug: Bug | null = null;
  
  showAssignModal = false;
  selectedUserId = '';
  isAssigning = false;
  projectMembers: Member[] = [];
  currentAssignees: BugAssignee[] = [];
  errorMessage = '';

  constructor(private projectDetailsService: ProjectDetailsService) {}

  ngOnInit(): void {
    this.loadProjectMembers();
  }

  loadProjectMembers(): void {
    this.projectDetailsService.projectData$.subscribe(projectData => {
      this.projectMembers = projectData?.members || [];
    });
  }

  toggleAssignModal(): void {
    if (!this.bug) return;
    
    this.showAssignModal = true;
    this.errorMessage = '';
    this.loadCurrentAssignees();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedUserId = '';
    this.currentAssignees = [];
    this.errorMessage = '';
  }

  loadCurrentAssignees(): void {
    if (!this.bug) return;

    this.projectDetailsService.getBugAssignees(this.bug.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentAssignees = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load current assignees';
        }
      },
      error: (error) => {
        // Don't show error for 404 (no assignees found)
        if (error.status === 404) {
          console.log('No assignees found for this bug');
          this.currentAssignees = [];
        } else {
          console.error('Failed to load assignees:', error);
          this.errorMessage = 'Failed to load current assignees';
        }
      }
    });
  }

  assignBug(): void {
    if (!this.bug || !this.selectedUserId) return;

    this.isAssigning = true;
    this.errorMessage = '';
    
    const assignmentData: AssignBugRequest = {
      userid: this.selectedUserId,
      assigneddate: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    };

    this.projectDetailsService.assignBugToUser(this.bug.id, assignmentData).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Bug assigned successfully:', response.message);
          this.loadCurrentAssignees(); // Refresh the assignees list
          this.selectedUserId = '';
          
          // Refresh the entire project data to update the assignedTo field in the bugs list
          const currentProject = this.projectDetailsService.currentProjectData;
          if (currentProject?.info?.id) {
            this.projectDetailsService.loadProject(currentProject.info.id).subscribe();
          }
        } else {
          this.errorMessage = response.message || 'Failed to assign bug';
        }
        this.isAssigning = false;
      },
      error: (error) => {
        console.error('Failed to assign bug:', error);
        this.errorMessage = error.message || 'Failed to assign bug';
        this.isAssigning = false;
      }
    });
  }

  unassignBug(userId: string): void {
    if (!this.bug || !userId) return;

    this.isAssigning = true;
    this.errorMessage = '';

    // You'll need to implement this endpoint in your backend
    // For now, we'll use a DELETE request to the assignees endpoint
    this.projectDetailsService.unassignBugFromUser(this.bug.id, userId).subscribe({
      next: (response: any) => {
        console.log('Bug unassigned successfully');
        this.loadCurrentAssignees(); // Refresh the assignees list
        
        // Refresh the entire project data to update the assignedTo field in the bugs list
        const currentProject = this.projectDetailsService.currentProjectData;
        if (currentProject?.info?.id) {
          this.projectDetailsService.loadProject(currentProject.info.id).subscribe();
        }
        this.isAssigning = false;
      },
      error: (error: any) => {
        console.error('Failed to unassign bug:', error);
        this.errorMessage = error.message || 'Failed to unassign bug';
        this.isAssigning = false;
      }
    });
  }

  getUserName(userId: string): string {
    const member = this.projectMembers.find(m => m.id === userId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown User';
  }

  getAvailableMembers(): Member[] {
    // Filter out members who are already assigned to this bug
    const assignedUserIds = this.currentAssignees.map(assignee => assignee.userId);
    return this.projectMembers.filter(member => !assignedUserIds.includes(member.id));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
