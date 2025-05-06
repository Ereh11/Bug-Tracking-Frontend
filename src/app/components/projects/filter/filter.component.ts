import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-filter',
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
})
export class FilterComponent {
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
