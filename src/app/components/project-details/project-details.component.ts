import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectInfoComponent } from './project-info/project-info.component';
import { ProjectManagerComponent } from './project-manager/project-manager.component';
import { ProjectMembersComponent } from './project-members/project-members.component';
import { ProjectBugsComponent } from './project-bugs/project-bugs.component';
import { ProjectDetailsService } from '../../Core/Services/project-details.service';
import { Subscription } from 'rxjs';

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
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private projectDetailsService: ProjectDetailsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Add global error handler for debugging
    const originalHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error caught:', { message, source, lineno, colno, error });
      if (originalHandler) {
        return originalHandler(message, source, lineno, colno, error);
      }
      return false;
    };

    // Subscribe to loading state
    this.subscriptions.push(
      this.projectDetailsService.loading$.subscribe(loading => {
        this.loading = loading;
        console.log('Loading state changed:', loading);
      })
    );

    // Subscribe to error state
    this.subscriptions.push(
      this.projectDetailsService.error$.subscribe(error => {
        this.error = error;
        console.log('Error state changed:', error);
      })
    );

    // Load project data based on route parameter
    const projectId = this.route.snapshot.paramMap.get('id');
    console.log('Project ID from route:', projectId);
    if (projectId) {
      this.subscriptions.push(
        this.projectDetailsService.loadProject(projectId).subscribe({
          next: (data) => {
            console.log('Project loaded successfully:', data);
          },
          error: (error) => {
            console.error('Failed to load project:', error);
          }
        })
      );
    } else {
      console.error('No project ID found in route');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.projectDetailsService.clearProject();
  }
}