import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-ticket',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ticket.component.html',
  styleUrl: './add-ticket.component.css',
})
export class AddTicketComponent {
  showCommentPopup = false;
  newComment = '';
  comments: any[] = [];

  user = {
    name: 'John Smith',
    color: 'bg-primary',
  };

  toggleCommentPopup() {
    this.showCommentPopup = !this.showCommentPopup;
  }

  addComment() {
    if (!this.newComment.trim()) return;

    this.comments.push({
      name: this.user.name,
      color: this.user.color,
      text: this.newComment.trim(),
      date: new Date(),
    });

    this.newComment = '';
  }
}
