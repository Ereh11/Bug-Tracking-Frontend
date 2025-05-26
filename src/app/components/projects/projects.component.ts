import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectComponent } from './project/project.component';
import { PaginationComponent } from './pagination/pagination.component';
import { UserRoleComponent } from './user-role/user-role.component';
import { AddBtnComponent } from './add-btn/add-btn.component';
import { FilterComponent } from './filter/filter.component';

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
  isOpen = false;
  selectedStatus = 'All status';
  @ViewChild('dropdownWrapper') dropdownRef!: ElementRef;
  statusOptions = [
    'All status',
    'Completed',
    'In Progress',
    'Planning',
    'On Hold',
    'Cancelled',
  ];

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectStatus(option: string) {
    this.selectedStatus = option;
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (
      this.isOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.isOpen = false;
    }
  }
}
