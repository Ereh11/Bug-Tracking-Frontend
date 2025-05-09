import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-delete-member',
  imports: [CommonModule],
  templateUrl: './delete-member.component.html',
  styleUrl: './delete-member.component.css',
})
export class DeleteMemberComponent {
  showConfirmPopup = false;

  confirmDelete() {
    this.showConfirmPopup = false;
    console.log('Deleted!');
  }

  cancelDelete() {
    this.showConfirmPopup = false;
  }
}
