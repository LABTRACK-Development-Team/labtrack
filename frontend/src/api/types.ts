export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type UserRole = 'TECHNICIAN' | 'INSTRUCTOR' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  requiresMfa: boolean;
}

export interface LoginRequest {
  email: string;
  passwordHash: string;
  mfaCode?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export type AssetStatus = 'Available' | 'In Use' | 'Under Maintenance' | 'Decommissioned' | 'RESOURCE_LOCKED';

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  serialNumber: string;
  status: AssetStatus;
  location: string;
  xmin: number;
  createdAt: string;
}

export interface QrCheckInRequest {
  qrToken: string;
  workstationId: string;
  idempotencyKey: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Pending Parts' | 'Resolved' | 'Closed';

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  reportedByUserId: string;
  assignedTechnicianId?: string;
  issueDescription: string;
  priority: TicketPriority;
  status: TicketStatus;
  sparePartsUsed?: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface WorkstationTelemetry {
  workstationId: string;
  pcName: string;
  ipAddress: string;
  macAddress: string;
  cpuUsagePercentage: number;
  ramUsagePercentage: number;
  diskUsagePercentage: number;
  isOnline: boolean;
  lastHeartbeat: string;
}

export interface LabReservation {
  id: string;
  labRoomId: string;
  instructorId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  isConfirmed: boolean;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityName: string;
  entityId: string;
  previousHash: string;
  currentHash: string;
  timestamp: string;
}

export interface AiDiagnosticQuery {
  prompt: string;
  assetContextId?: string;
}

export interface AiDiagnosticResponse {
  answer: string;
  confidenceScore: number;
  sourceDocuments: string[];
}