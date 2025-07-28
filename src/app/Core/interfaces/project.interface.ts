import { BackendUser } from './user.interface';
import { BackendBug, Bug } from './bug.interface';

export interface BackendProjectData {
  projectId: string;
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  manager: BackendUser;
  users: BackendUser[];
  bugs: BackendBug[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Manager {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Manager' | 'Developer' | 'Tester' | 'Designer';
  isActive: boolean;
}

export interface ProjectData {
  info: ProjectInfo;
  manager: Manager;
  members: Member[];
  bugs: Bug[];
}

export interface CreateProjectRequest {
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  notes: string;
  joinedDate: string;
}

export interface ProjectSummary {
  projectId: string;
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  manager: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Project {
  projectId: string;
  name: string;
  description: string;
  status: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  manager?: Manager | null;
  users: BackendUser[];
  bugs: BackendBug[];
}

export interface UserProject {
  projectId: string;
  userId: string;
  notes: string;
  joinedDate: Date;
  project?: Project;
}
