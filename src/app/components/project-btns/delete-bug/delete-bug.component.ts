import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-delete-bug',
  imports: [CommonModule],
  templateUrl: './delete-bug.component.html',
  styleUrl: './delete-bug.component.css',
})
export class DeleteBugComponent {
  showConfirmPopup = false;
  confirmDelete() {
    this.showConfirmPopup = false;
    console.log('Deleted!');
  }

  cancelDelete() {
    this.showConfirmPopup = false;
  }
}
