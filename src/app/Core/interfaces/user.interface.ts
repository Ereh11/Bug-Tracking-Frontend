export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles?: string[] | null;
}

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: { id: string; name: string; description: string }[];
}

export interface User {
  userId: string;
  email: string;
  roles: string[];
  token: string;
  refreshToken: string;
  expiration: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}
