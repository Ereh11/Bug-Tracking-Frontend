import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-project',
  imports: [LucideAngularModule, CommonModule, RouterModule],
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
