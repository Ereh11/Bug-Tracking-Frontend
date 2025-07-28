export interface BackendBug {
  id: string;
  title: string;
  description: string;
  status: number;
  priority: number;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened' | 'Assigned';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string | null;
}

export interface BugAssignee {
  bugId: string;
  userId: string;
  assignedDate: string;
}

export interface ChangeAssignmentDto {
  olduserid: string | null;
  newuserid: string | null;
  assigneddate: string;
}

export interface UpdateBugRequest {
  title: string;
  description: string;
  status: number;
  priority: number;
  changeassignmentdto: ChangeAssignmentDto;
}

export interface UpdateBugResponse {
  success: boolean;
  message: string;
  errors: any;
}

export interface DeleteBugResponse {
  success: boolean;
  message: string;
  errors: any;
}

export interface AssignBugRequest {
  userid: string;
  assigneddate: string;
}

export interface BugDetailsResponse {
  data: {
    id: string;
    title: string;
    description: string;
    status: number;
    priority: number;
    project: {
      projectId: string;
      name: string;
    };
    attachments: BugAttachment[];
    bugAssignmentUser: Array<{
      userName: string;
    }>;
  };
  success: boolean;
  message: string;
  errors: any;
}

export interface BugAttachment {
  attachmentId: string;
  fileName: string;
  filePath: string;
  createdDate: string;
}

export interface UploadAttachmentResponse {
  success: boolean;
  message: string;
  errors: any;
}
