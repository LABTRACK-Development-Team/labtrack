

export enum UserRole {
  ADMIN_TECHNICIAN = 'ADMIN_TECHNICIAN',
  Admin = 'ADMIN',
  Instructor = 'INSTRUCTOR',
  Student = 'STUDENT',
}

export enum JRMSUCampus {
  Dapitan = 'DAPITAN',
  Dipolog = 'DIPOLOG',
  Katipunan = 'KATIPUNAN',
  Tampilisan = 'TAMPILISAN',
  Siocon = 'SIOCON',
}

export enum AssetStatus {
  Working = 'WORKING',
  Operational = 'OPERATIONAL',
  UnderMaintenance = 'UNDER_MAINTENANCE',
  ForRepair = 'FOR_REPAIR',
  InRepair = 'IN_REPAIR',
  ForReplacement = 'FOR_REPLACEMENT',
  Retired = 'RETIRED',
}

export enum SessionStatus {
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
  AutoExpired = 'AUTO_EXPIRED',
  TimedOut = 'TIMED_OUT',
  Terminated = 'TERMINATED',
}

export enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Suspended = 'SUSPENDED',
}

export enum TicketStatus {
  Open = 'OPEN',
  Assigned = 'ASSIGNED',
  InRepair = 'IN_REPAIR',
  Testing = 'TESTING',
  Resolved = 'RESOLVED',
  OnHold = 'ON_HOLD',
}


export enum AssetCategory {
  Desktop = 'DESKTOP',
  Laptop = 'LAPTOP',
  Printer = 'PRINTER',
  Network = 'NETWORK',
  Peripheral = 'PERIPHERAL',
  Other = 'OTHER',
}

export const JRMSU_CAMPUSES = [
  { value: JRMSUCampus.Dapitan, label: 'Dapitan Main Campus' },
  { value: JRMSUCampus.Dipolog, label: 'Dipolog Campus' },
  { value: JRMSUCampus.Katipunan, label: 'Katipunan Campus' },
  { value: JRMSUCampus.Tampilisan, label: 'Tampilisan Campus' },
  { value: JRMSUCampus.Siocon, label: 'Siocon Campus' },
] as const;

// ===== NEW: top-level export " kailangan ng hooks/use-campus.ts =====
export const DEFAULT_CAMPUS: JRMSUCampus = JRMSUCampus.Dapitan;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    STUDENT_PIN: '/api/v1/auth/student-pin',
    REFRESH: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/revoke-token',
    PROFILE: '/api/v1/auth/me',
    UPDATE_PIN: '/api/v1/auth/security-pin',
    // NEW
    REGISTER: '/api/v1/auth/register',
    VERIFY_PIN: '/api/v1/auth/verify-pin',
  },
  QR: {
    VERIFY_LAB: '/api/v1/qr/verify-lab',
    CHECKIN: '/api/v1/qr/checkin',
    CHECKOUT: '/api/v1/qr/checkout',
  },
  HEARTBEAT: {
    PING: '/api/v1/session/heartbeat',
  },
  ASSETS: {
    LIST: '/api/v1/assets',
    
    BASE: '/api/v1/assets',
    DETAILS: (id: string) => `/api/v1/assets/${id}`,
    WORKSTATIONS: '/api/v1/assets/workstations',
    MAINTENANCE_LOGS: '/api/v1/assets/maintenance',
    // NEW
    GENERATE_QR: '/api/v1/assets/generate-qr',
  },
  ATTENDANCE: {
    ACTIVE_SESSIONS: '/api/v1/attendance/active-sessions',
    HISTORY: '/api/v1/attendance/history',
    EXPORT: '/api/v1/attendance/export',
    // NEW
    LOGS: '/api/v1/attendance/logs',
    GENERATE_QR: '/api/v1/attendance/generate-qr',
  },
  
  MAINTENANCE: {
    SCHEDULES: '/api/v1/maintenance/schedules',
    REPORTS: '/api/v1/maintenance/reports',
    TICKETS: '/api/v1/maintenance/tickets',
  },
  
  INSTRUCTOR: {
    CLASS_MATRIX: '/api/v1/instructor/class-matrix',
    RESERVATIONS: '/api/v1/instructor/reservations',
    ATTENDANCE_LOGS: '/api/v1/instructor/attendance-logs',
  },
  
  STUDENT: {
    HEARTBEAT: '/api/v1/student/heartbeat',
    SCAN_LOGIN: '/api/v1/student/scan-login',
    ISSUE_REPORT: '/api/v1/student/issue-report',
  },
  
  TELEMETRY: {
    LOGS: '/api/v1/telemetry/logs',
  },
  
  DAMAGE: {
    ATTRIBUTE: '/api/v1/damage/attribute',
    TRUST_SCORE: '/api/v1/damage/trust-score',
  },
  FORENSICS: {
    CHAIN_OF_CUSTODY: (workstationId: string) =>
      `/api/v1/forensics/chain-of-custody/${workstationId}`,
    TELEMETRY_LOGS: (workstationId: string) =>
      `/api/v1/forensics/telemetry/${workstationId}`,
    ATTRIBUTE_DAMAGE: '/api/v1/forensics/attribute-damage',
  },
  AI: {
    CHAT: '/api/v1/ai/chat',
    
    CHAT_QUERY: '/api/v1/ai/chat/query',
    DAMAGE_ESTIMATE: '/api/v1/ai/damage-estimate',
  },
} as const;

export const SIGNALR_HUBS = {
  LAB_TRACK: '/hubs/labtrack',
  SESSION: '/hubs/session',
  AI_CHAT: '/hubs/aichat',
} as const;

export const SYSTEM_CONFIG = {
  HEARTBEAT_INTERVAL_MS: 30000,
  SESSION_TIMEOUT_MINUTES: 120,
  SECURITY_PIN_LENGTH: 6,
  DEFAULT_CAMPUS: JRMSUCampus.Dapitan,
} as const;