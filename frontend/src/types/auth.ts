export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT',
  ADMIN_TECHNICIAN = 'ADMIN_TECHNICIAN'
}

export interface UserProfile {
  id: string;
  username?: string;
  email?: string;
  role?: UserRole | string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  campusCode?: string;
  campus?: string;
  department?: string;
  departmentName?: string;
  isActive?: boolean;
  avatarUrl?: string;
}

export interface AuthLoginRequest {
  usernameOrEmail?: string;
  email?: string;
  username?: string;
  password?: string;
  securityPin?: string;
  pin?: string;
  role?: string;
  selectedCampus?: string;
  campusCode?: string;
  campus?: string;
}

export interface AuthRegisterRequest {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: string;
  campusCode?: string;
  campus?: string;
  idNumber?: string;
  securityPin?: string;
  selectedCampus?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  token?: string;
  user: UserProfile;
}
