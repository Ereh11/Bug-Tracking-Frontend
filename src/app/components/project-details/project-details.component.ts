import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-project-details',
  imports: [CommonModule],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css',
})
export class ProjectDetailsComponent {
  managerName = 'Manager Name';
  managerEmail = 'manager@example.com';
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
