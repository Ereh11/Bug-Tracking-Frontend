import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProjectInfoComponent } from './project-info/project-info.component';
import { ProjectManagerComponent } from './project-manager/project-manager.component';
import { ProjectMembersComponent } from './project-members/project-members.component';
import { ProjectBugsComponent } from './project-bugs/project-bugs.component';

@Component({
  selector: 'app-project-details',
  imports: [
    CommonModule,
    ProjectInfoComponent,
    ProjectManagerComponent,
    ProjectMembersComponent,
    ProjectBugsComponent,
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css',
})
export class ProjectDetailsComponent {}
