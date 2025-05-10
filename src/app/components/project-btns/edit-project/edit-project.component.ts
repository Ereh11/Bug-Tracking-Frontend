import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-project',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-project.component.html',
  styleUrl: './edit-project.component.css',
})
export class EditProjectComponent {
  showEditProjectPopup = false;
  showNameError = false;

  editProject = {
    name: 'project name',
    description: 'This is the project description',
  };

  openEditProjectPopup() {
    this.showEditProjectPopup = true;
  }

  cancelEditProject() {
    this.showEditProjectPopup = false;
    this.showNameError = false;
    this.editProject.name = 'project name';
    this.editProject.description = 'This is the project description';
  }

  submitEditProject() {
    if (this.editProject.name.trim() === '') {
      this.showNameError = true;
      return;
    }
    this.showEditProjectPopup = false;
    this.showNameError = false;
  }
}
