import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-add-btn',
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './add-btn.component.html',
  styleUrl: './add-btn.component.css',
})
export class AddBtnComponent {
  showAddProjectPopup = false;
  showNameError = false;

  newProject = {
    name: '',
    description: '',
  };

  createProject() {
    if (!this.newProject.name.trim()) {
      this.showNameError = true;
      return;
    }
    this.showAddProjectPopup = false;
    this.newProject = { name: '', description: '' };
    this.showNameError = false;
  }

  cancelAddProject() {
    this.showAddProjectPopup = false;
    this.showNameError = false;
    this.newProject = { name: '', description: '' };
  }
}
