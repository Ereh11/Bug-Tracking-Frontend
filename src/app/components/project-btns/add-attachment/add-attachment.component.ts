import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-attachment',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-attachment.component.html',
  styleUrl: './add-attachment.component.css',
})
export class AddAttachmentComponent {
  showAttachmentPopup = false;

  logClick() {
    console.log('Icon clicked');
    this.showAttachmentPopup = true;
  }

  cancelUploadFilePopup(): void {
    this.showAttachmentPopup = false;
  }

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  fileName = '';
  attachments: {
    file: File;
    name: string;
    preview: string | ArrayBuffer | null;
  }[] = [];

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
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
  }

  addAttachment(): void {
    if (this.selectedFile) {
      this.attachments.push({
        file: this.selectedFile,
        name: this.fileName,
        preview: this.previewUrl,
      });
      this.changeFile();
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  viewFile(fileUrl: string | ArrayBuffer | null): void {
    if (typeof fileUrl === 'string') {
      window.open(fileUrl, '_blank');
    }
  }
  resetFileInput(event: Event): void {
    (event.target as HTMLInputElement).value = '';
  }
}
