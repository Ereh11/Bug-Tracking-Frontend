import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DeleteBugComponent } from '../../project-btns/delete-bug/delete-bug.component';
import { AddBugComponent } from '../../project-btns/add-bug/add-bug.component';
import { EditBugComponent } from '../../project-btns/edit-bug/edit-bug.component';

@Component({
  selector: 'app-project-bugs',
  imports: [
    CommonModule,
    DeleteBugComponent,
    AddBugComponent,
    EditBugComponent,
  ],
  templateUrl: './project-bugs.component.html',
  styleUrl: './project-bugs.component.css',
})
export class ProjectBugsComponent {
  bugs = [
    {
      title: 'Login button not working',
      status: 'New',
      priority: 'Low',
      assignedTo: null,
    },
    {
      title: 'Page not rendering correctly on mobile',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: null,
    },
    {
      title: 'Payment processing error',
      status: 'Resolved',
      priority: 'High',
      assignedTo: 'Kholoud',
    },
    {
      title: 'Payment processing error',
      status: 'Assigned',
      priority: 'Critical',
      assignedTo: 'Hani',
    },
    {
      title: 'Payment processing error',
      status: 'Closed',
      priority: 'High',
      assignedTo: 'Hani',
    },
    {
      title: 'Payment processing error',
      status: 'Reopened',
      priority: 'Low',
      assignedTo: null,
    },
  ];
}
