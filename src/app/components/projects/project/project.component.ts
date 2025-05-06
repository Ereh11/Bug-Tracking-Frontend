import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-project',
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css',
})
export class ProjectComponent {
  showConfirmPopup = false;

  confirmDelete() {
    this.showConfirmPopup = false;
    console.log('Deleted!');
  }

  cancelDelete() {
    this.showConfirmPopup = false;
  }
}
