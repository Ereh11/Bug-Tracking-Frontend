import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectDetailsService } from '../../../Core/Services/project-details.service';
import { environment } from '../../../../environments/environment';
import { UploadAttachmentResponse, Bug, BugAttachment, BugDetailsResponse } from '../../../Core/interfaces';

@Component({
  selector: 'app-add-attachment',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-attachment.component.html',
  styleUrl: './add-attachment.component.css',
})
export class AddAttachmentComponent {
  @Input() bug!: Bug;
  
  showAttachmentPopup = false;
  isUploading = false;
  isLoadingAttachments = false;
  uploadError: string | null = null;

  // Existing attachments from backend
  existingAttachments: BugAttachment[] = [];
  
  // Newly uploaded attachments (for UI display only)
  newAttachments: {
    file: File;
    name: string;
    preview: string | ArrayBuffer | null;
  }[] = [];

  constructor(private projectDetailsService: ProjectDetailsService) {}

  logClick() {
    console.log('Icon clicked');
    this.showAttachmentPopup = true;
    this.loadExistingAttachments();
  }

  cancelUploadFilePopup(): void {
    this.showAttachmentPopup = false;
  }

  loadExistingAttachments(): void {
    if (!this.bug) return;
    
    this.isLoadingAttachments = true;
    this.projectDetailsService.getBugDetails(this.bug.id)
      .subscribe({
        next: (response: BugDetailsResponse) => {
          this.isLoadingAttachments = false;
          if (response.success) {
            this.existingAttachments = response.data.attachments || [];
          } else {
            console.error('Failed to load attachments:', response.message);
          }
        },
        error: (error) => {
          this.isLoadingAttachments = false;
          console.error('Error loading attachments:', error);
        }
      });
  }

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  fileName = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'File size cannot exceed 5MB';
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/', // Any image type
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      const isAllowed = allowedTypes.some(type => 
        type.endsWith('/') ? file.type.startsWith(type) : file.type === type
      );

      if (!isAllowed) {
        this.uploadError = 'Only images, PDFs, Word documents, Excel files, and text files are allowed';
        return;
      }

      this.uploadError = null;
      this.selectedFile = file;
      this.fileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result as ArrayBuffer], {
          type: file.type,
        });
        this.previewUrl = URL.createObjectURL(blob);
      };

      reader.readAsArrayBuffer(file);
    }
  }

  changeFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.fileName = '';
    this.uploadError = null;
  }

  addAttachment(): void {
    if (!this.selectedFile || !this.bug) {
      return;
    }

    this.isUploading = true;
    this.uploadError = null;

    this.projectDetailsService.uploadAttachment(this.bug.id, this.selectedFile)
      .subscribe({
        next: (response: UploadAttachmentResponse) => {
          this.isUploading = false;
          if (response.success) {
            // Add to new attachments array for UI display
            this.newAttachments.push({
              file: this.selectedFile!,
              name: this.fileName,
              preview: this.previewUrl,
            });
            this.changeFile();
            console.log('File uploaded successfully:', response.message);
            // Refresh existing attachments to show the newly uploaded file
            this.loadExistingAttachments();
          } else {
            this.uploadError = response.message || 'Upload failed';
          }
        },
        error: (error) => {
          this.isUploading = false;
          console.error('Upload error:', error);
          this.uploadError = error.error?.message || error.message || 'Upload failed';
        }
      });
  }

  removeAttachment(index: number): void {
    this.newAttachments.splice(index, 1);
  }

  viewFile(fileUrl: string | ArrayBuffer | null): void {
    if (typeof fileUrl === 'string') {
      window.open(fileUrl, '_blank');
    }
  }

  viewExistingFile(attachment: BugAttachment): void {
    // Create a full URL for the attachment
    const fileUrl = `${environment.fileServerUrl}${attachment.filePath}`;
    window.open(fileUrl, '_blank');
  }

  formatFileSize(bytes: number): string {
    return (bytes / 1000).toFixed(2);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      case 'txt':
        return 'fa-file-text';
      default:
        return 'fa-file';
    }
  }
  resetFileInput(event: Event): void {
    (event.target as HTMLInputElement).value = '';
  }
}
