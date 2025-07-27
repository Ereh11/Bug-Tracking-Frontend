import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-filter',
  imports: [LucideAngularModule, CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
})
export class FilterComponent {
  @Output() filterChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  
  isOpen = false;
  selectedStatus = 'All status';
  searchTerm = '';
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
    
    // Emit the filter change event
    this.filterChange.emit(option);
  }

  onSearchChange() {
    // Emit search term changes with debouncing
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchChange.emit('');
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
