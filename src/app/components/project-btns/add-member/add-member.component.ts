import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.css',
})
export class AddMemberComponent {
  showChangeMemberPopup = false;

  selectedMembers: any[] = [];
  selectMember(member: any) {
    const index = this.selectedMembers.indexOf(member);
    if (index === -1) {
      this.selectedMembers.push(member);
    } else {
      this.selectedMembers.splice(index, 1);
    }
  }

  teamMembers = [
    {
      name: 'John Smith',
      email: 'john@example.com',
      roles: ['Manager', 'Developer'],
      badgeColors: ['text-Manager', 'text-[#08992F]'],
      color: 'bg-Manager',
    },
    {
      name: 'Emily Davis',
      email: 'emily@example.com',
      roles: ['Developer'],
      badgeColors: ['text-[#08992F]'],
      color: 'bg-[#059669]',
    },
    {
      name: 'Michael Jones',
      email: 'michael@example.com',
      roles: ['Tester'],
      badgeColors: ['text-[#B8D244]'],
      color: 'bg-[#b45309]',
    },
  ];

  openChangeMemberPopup() {
    this.showChangeMemberPopup = true;
  }

  closePopup() {
    this.showChangeMemberPopup = false;
    this.selectedMembers = [];
  }

  confirmMemberChange() {
    if (!this.selectedMembers.length) return;
    console.log('Selected Members:', this.selectedMembers);
    this.closePopup();
  }
}
