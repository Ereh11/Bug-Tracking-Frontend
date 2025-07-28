import { Component, OnInit, OnDestroy } from '@angular/core';
import { EditManagerComponent } from '../../project-btns/edit-manager/edit-manager.component';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { Manager } from '../../../Core/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-project-manager',
  imports: [EditManagerComponent],
  templateUrl: './project-manager.component.html',
  styleUrl: './project-manager.component.css',
})
export class ProjectManagerComponent implements OnInit, OnDestroy {
  manager: Manager | null = null;
  private subscription!: Subscription;

  constructor(private projectDetailsService: ProjectDetailsService) {}

  ngOnInit(): void {
    this.subscription = this.projectDetailsService.projectData$.subscribe(
      data => {
        this.manager = data?.manager || null;
      }
    );
  }

  // Getters for template compatibility
  get managerName(): string {
    return this.manager?.name || 'Manager Name';
  }

  get managerEmail(): string {
    return this.manager?.email || 'manager@example.com';
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}