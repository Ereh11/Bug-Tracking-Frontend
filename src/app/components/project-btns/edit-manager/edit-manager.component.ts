import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-manager',
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-manager.component.html',
  styleUrl: './edit-manager.component.css',
})
export class EditManagerComponent {
  showChangeManagerPopup = false;

  selectedManager: any = null;
  selectManager(member: any) {
    this.selectedManager = member;
  }

  teamMembers = [
    {
      name: 'John Smith',
      email: 'john@example.com',
      role: 'Manager',
      badgeColor: 'text-Manager',
      color: 'bg-Manager',
    },
    {
      name: 'Emily Davis',
      email: 'emily@example.com',
      role: 'Developer',
      badgeColor: 'text-[#08992F]',
      color: 'bg-[#059669]',
    },
    {
      name: 'Michael Jones',
      email: 'michael@example.com',
      role: 'Tester',
      badgeColor: 'text-[#B8D244]',
      color: 'bg-[#b45309]',
    },
  ];

  openChangeManagerPopup() {
    this.showChangeManagerPopup = true;
  }

  closePopup() {
    this.showChangeManagerPopup = false;
    this.selectedManager = null;
  }

  confirmManagerChange() {
    if (!this.selectedManager) return;
    console.log('New manager selected:', this.selectedManager);
    this.closePopup();
  }
}
