import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { Bug, Member } from '../../../Core/interfaces';

@Component({
  selector: 'app-edit-bug',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-bug.component.html',
  styleUrl: './edit-bug.component.css',
})
export class EditBugComponent implements OnInit, OnChanges {
  @Input() bug: Bug | null = null;
  
  showEditBugPopup = false;
  showNameError = false;
  isUpdating = false;
  
  editBug = {
    name: '',
    description: '',
  };

  priorityOptions: Bug['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  statusOptions: Bug['status'][] = [
    'New',
    'In Progress',
    'Assigned',
    'Resolved',
    'Closed',
    'Reopened',
  ];
  
  projectMembers: Member[] = [];
  teamMembers: string[] = []; // For display

  selectedPriority: Bug['priority'] = 'Low';
  selectedStatus: Bug['status'] = 'New';
  selectedAssignee = 'Unassigned';
  originalAssignee = 'Unassigned'; // To track the original assignee

  isPriorityOpen = false;
  isStatusOpen = false;
  isAssigneeOpen = false;

  constructor(private projectDetailsService: ProjectDetailsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bug'] && this.bug) {
      console.log('Bug input changed in EditBugComponent:', this.bug);
      console.log('Bug assignedTo:', this.bug.assignedTo);
    }
  }

  ngOnInit(): void {
    // Subscribe to project data to get members
    this.projectDetailsService.projectData$.subscribe(projectData => {
      if (projectData) {
        this.projectMembers = projectData.members || [];
        this.teamMembers = ['Unassigned', ...this.projectMembers.map(member => 
          `${member.firstName} ${member.lastName}`
        )];
      }
    });
  }

  openEditModal(): void {
    if (!this.bug) return;
    
    // Initialize form with bug data
    this.editBug = {
      name: this.bug.title,
      description: this.bug.description,
    };
    
    this.selectedPriority = this.bug.priority;
    this.selectedStatus = this.bug.status;
    
    // Load current assignee from backend
    this.loadCurrentAssignee();
    
    this.showEditBugPopup = true;
    this.showNameError = false;
  }

  private loadCurrentAssignee(): void {
    if (!this.bug) return;

    this.projectDetailsService.getBugAssignees(this.bug.id).subscribe({
      next: (response) => {
        if (response.success && response.data.length > 0) {
          // Get the first assignee (assuming one assignee per bug)
          const assignee = response.data[0];
          const assignedUser = this.projectMembers.find(m => m.id === assignee.userId);
          if (assignedUser) {
            const assigneeName = `${assignedUser.firstName} ${assignedUser.lastName}`;
            this.selectedAssignee = assigneeName;
            this.originalAssignee = assigneeName;
          } else {
            this.selectedAssignee = 'Unassigned';
            this.originalAssignee = 'Unassigned';
          }
        } else {
          // No assignees found
          this.selectedAssignee = 'Unassigned';
          this.originalAssignee = 'Unassigned';
        }
      },
      error: (error) => {
        // Handle 404 (no assignees) or other errors
        if (error.status === 404) {
          this.selectedAssignee = 'Unassigned';
          this.originalAssignee = 'Unassigned';
        } else {
          console.error('Failed to load current assignee:', error);
          this.selectedAssignee = 'Unassigned';
          this.originalAssignee = 'Unassigned';
        }
      }
    });
  }

  togglePriority() {
    this.isPriorityOpen = !this.isPriorityOpen;
    this.isStatusOpen = false;
    this.isAssigneeOpen = false;
  }

  toggleStatus() {
    this.isStatusOpen = !this.isStatusOpen;
    this.isPriorityOpen = false;
    this.isAssigneeOpen = false;
  }

  toggleAssignee() {
    this.isAssigneeOpen = !this.isAssigneeOpen;
    this.isPriorityOpen = false;
    this.isStatusOpen = false;
  }

  selectPriority(option: string) {
    this.selectedPriority = option as Bug['priority'];
    this.isPriorityOpen = false;
  }
  selectStatus(option: string) {
    this.selectedStatus = option as Bug['status'];
    this.isStatusOpen = false;
  }
  selectAssignee(option: string) {
    this.selectedAssignee = option;
    this.isAssigneeOpen = false;
  }

  updateBug() {
    if (!this.editBug.name.trim()) {
      this.showNameError = true;
      return;
    }
    
    if (!this.bug) return;
    
    this.isUpdating = true;
    
    // Determine old and new user IDs based on assignment changes
    const oldUserId = this.getAssigneeUserId(this.originalAssignee);
    const newUserId = this.getAssigneeUserId(this.selectedAssignee);
    
    // Prepare bug updates
    const updates: Partial<Bug> = {
      title: this.editBug.name.trim(),
      description: this.editBug.description.trim(),
      status: this.selectedStatus,
      priority: this.selectedPriority
    };
    
    this.projectDetailsService.updateBug(this.bug.id, updates, oldUserId, newUserId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Bug updated successfully:', response.message);
            console.log('Old assignee:', this.originalAssignee, 'New assignee:', this.selectedAssignee);
            console.log('Old user ID:', oldUserId, 'New user ID:', newUserId);
            this.showEditBugPopup = false;
            this.showNameError = false;
            
            // Update original assignee to reflect the change
            this.originalAssignee = this.selectedAssignee;
          } else {
            console.error('Failed to update bug:', response.message);
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Failed to update bug:', error);
          this.isUpdating = false;
        }
      });
  }
  
  private getAssigneeUserId(assigneeName: string): string | null {
    if (assigneeName === 'Unassigned') return null;
    
    const member = this.projectMembers.find(m => 
      `${m.firstName} ${m.lastName}` === assigneeName
    );
    return member?.id || null;
  }

  cancelEditBug() {
    this.showEditBugPopup = false;
    this.showNameError = false;
    this.isUpdating = false;
    
    // Reset form
    this.editBug = {
      name: '',
      description: '',
    };
    
    this.selectedPriority = 'Low';
    this.selectedStatus = 'New';
    this.selectedAssignee = 'Unassigned';
    this.originalAssignee = 'Unassigned';
  }
}
