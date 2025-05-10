import { Component } from '@angular/core';
import { EditManagerComponent } from '../../project-btns/edit-manager/edit-manager.component';

@Component({
  selector: 'app-project-manager',
  imports: [EditManagerComponent],
  templateUrl: './project-manager.component.html',
  styleUrl: './project-manager.component.css',
})
export class ProjectManagerComponent {
  managerName = 'Manager Name';
  managerEmail = 'manager@example.com';
}
