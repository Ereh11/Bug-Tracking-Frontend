import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatedResponse } from '../../../Core/interfaces';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnChanges {
  @Input() paginationInfo: PaginatedResponse<any> | null = null;
  @Output() pageChange = new EventEmitter<number>();

  currentPage: number = 1;
  totalPages: number = 1;
  hasNextPage: boolean = false;
  hasPreviousPage: boolean = false;
  visiblePages: number[] = [];

  // Add Math to make it available in template
  Math = Math;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['paginationInfo'] && this.paginationInfo) {
      this.currentPage = this.paginationInfo.pageNumber;
      this.totalPages = this.paginationInfo.totalPages;
      this.hasNextPage = this.paginationInfo.hasNextPage || this.currentPage < this.totalPages;
      this.hasPreviousPage = this.paginationInfo.hasPreviousPage || this.currentPage > 1;
      this.updateVisiblePages();
    }
  }

  updateVisiblePages() {
    this.visiblePages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.visiblePages.push(i);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToPreviousPage() {
    if (this.hasPreviousPage) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage() {
    if (this.hasNextPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToFirstPage() {
    if (this.currentPage !== 1) {
      this.goToPage(1);
    }
  }

  goToLastPage() {
    if (this.currentPage !== this.totalPages) {
      this.goToPage(this.totalPages);
    }
  }
}