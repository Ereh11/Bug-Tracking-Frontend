import { Component, OnInit, OnDestroy } from '@angular/core';
import { DeleteMemberComponent } from '../../project-btns/delete-member/delete-member.component';
import { AddMemberComponent } from '../../project-btns/add-member/add-member.component';
import { ProjectDetailsService, Member } from '../../../Core/Services/project-details.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, DeleteMemberComponent, AddMemberComponent],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.css',
})
export class ProjectMembersComponent implements OnInit, OnDestroy {
  members: Member[] = [];
  manager: Member | null = null;
  private subscription!: Subscription;

  constructor(private projectDetailsService: ProjectDetailsService) {}

  ngOnInit(): void {
    this.subscription = this.projectDetailsService.projectData$.subscribe(
      data => {
        if (data) {
          this.members = data.members;
          // Find manager (assuming manager has role 'Manager')
          this.manager = data.members.find(member => member.role === 'Manager') || null;
        } else {
          this.members = [];
          this.manager = null;
        }
      }
    );
  }

  get regularMembers(): Member[] {
    // Filter out the manager from regular members
    return this.members.filter(member => member.role !== 'Manager');
  }

  addMemberToProject(userId: string) {
    // The member has already been added via the API call in add-member component
    // Just log for confirmation - the project data will be refreshed automatically
    console.log('Member added to project:', userId);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}