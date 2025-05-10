import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-bug',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-bug.component.html',
  styleUrl: './edit-bug.component.css',
})
export class EditBugComponent {
  showEditBugPopup = false;
  showNameError = false;

  editBug = {
    name: 'Bug Name',
    description: 'This is a bug description',
  };

  priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  statusOptions = [
    'New',
    'In Progress',
    'Assigned',
    'Resolved',
    'Closed',
    'Reopened',
  ];
  teamMembers = ['Unassigned', 'Kholoud', 'Hani'];

  selectedPriority = 'Low';
  selectedStatus = 'New';
  selectedAssignee = 'Hani';

  isPriorityOpen = false;
  isStatusOpen = false;
  isAssigneeOpen = false;

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
    this.selectedPriority = option;
    this.isPriorityOpen = false;
  }
  selectStatus(option: string) {
    this.selectedStatus = option;
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
    this.showEditBugPopup = false;
    this.showNameError = false;
  }

  cancelEditBug() {
    this.showEditBugPopup = false;
    this.showNameError = false;
    this.editBug = {
      name: 'Bug Name',
      description: 'This is a bug description',
    };
  }
}
