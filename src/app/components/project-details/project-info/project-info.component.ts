import { Component } from '@angular/core';
import { EditProjectComponent } from '../../project-btns/edit-project/edit-project.component';

@Component({
  selector: 'app-project-info',
  imports: [EditProjectComponent],
  templateUrl: './project-info.component.html',
  styleUrl: './project-info.component.css',
})
export class ProjectInfoComponent {}
