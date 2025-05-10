import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-bug',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-bug.component.html',
  styleUrl: './add-bug.component.css',
})
export class AddBugComponent {
  showAddBugPopup = false;
  showNameError = false;

  newBug = {
    name: '',
    description: '',
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
  selectedAssignee = 'Unassigned';

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

  createBug() {
    if (!this.newBug.name.trim()) {
      this.showNameError = true;
      return;
    }
    this.showAddBugPopup = false;
    this.newBug = { name: '', description: '' };
    this.showNameError = false;
  }

  cancelAddBug() {
    this.showAddBugPopup = false;
    this.showNameError = false;
    this.newBug = { name: '', description: '' };
  }
}
