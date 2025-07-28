import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectComponent } from './project/project.component';
import { PaginationComponent } from './pagination/pagination.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { AddBtnComponent } from './add-btn/add-btn.component';
import { FilterComponent } from './filter/filter.component';
import { PaginatedResponse } from '../../Core/interfaces';

@Component({
  selector: 'app-projects',
  imports: [
    LucideAngularModule,
    CommonModule,
    ProjectComponent,
    PaginationComponent,
    UserRoleComponent,
    AddBtnComponent,
    FilterComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  @ViewChild(ProjectComponent) projectComponent!: ProjectComponent;
  @ViewChild(FilterComponent) filterComponent!: FilterComponent;
  
  currentFilter = 'All status'; // Track current filter
  currentSearch = ''; // Track current search term
  
  // Pagination properties
  currentPage = 1;
  pageSize = 8;
  paginationInfo: PaginatedResponse<any> | null = null;
  
  @ViewChild('dropdownWrapper') dropdownRef!: ElementRef;
  statusOptions = [
    'All status',
    'Completed',
    'In Progress',
    'Planning',
    'On Hold',
    'Cancelled',
  ];

  // Handle filter change from filter component
  onFilterChange(filterStatus: string) {
    this.currentFilter = filterStatus;
    this.currentPage = 1; // Reset to first page when filtering
    
    // Apply filter to project component
    if (this.projectComponent) {
      this.projectComponent.applyFilters(filterStatus, this.currentSearch);
    }
  }

  // Handle search change from filter component
  onSearchChange(searchTerm: string) {
    this.currentSearch = searchTerm;
    this.currentPage = 1; // Reset to first page when searching
    
    // Apply search to project component
    if (this.projectComponent) {
      this.projectComponent.applyFilters(this.currentFilter, searchTerm);
    }
  }

  // Handle pagination change from pagination component
  onPageChange(page: number) {
    this.currentPage = page;
    // Apply current filter and search when changing pages
    if (this.projectComponent) {
      this.projectComponent.loadFilteredProjects(this.currentFilter, this.currentSearch, page);
    }
  }

  // Handle pagination info update from project component
  onPaginationChange(paginationInfo: PaginatedResponse<any>) {
    this.paginationInfo = paginationInfo;
  }

  // Handle project creation - reset to first page and reload
  onProjectCreated() {
    this.currentPage = 1;
    // Trigger reload of projects in the project component
    if (this.projectComponent) {
      this.projectComponent.onProjectCreated();
    }
  }
}