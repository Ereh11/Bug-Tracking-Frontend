import { Component } from '@angular/core';
import { DeleteMemberComponent } from '../../project-btns/delete-member/delete-member.component';
import { AddMemberComponent } from '../../project-btns/add-member/add-member.component';

@Component({
  selector: 'app-project-members',
  imports: [DeleteMemberComponent, AddMemberComponent],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.css',
})
export class ProjectMembersComponent {
  managerName = 'Manager Name';
  managerEmail = 'manager@example.com';
}
