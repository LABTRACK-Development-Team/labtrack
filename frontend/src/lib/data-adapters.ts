import { apiClient } from './api-client';

// Map Admin & Instructor Endpoint Calls
export const LabTrackService = {
  // Laboratories & Campuses
  getLaboratories: async () => {
    const res = await apiClient.get('/api/v1/laboratories');
    return res.data?.data || res.data;
  },
  
  // Assets & Workstations
  getAssets: async () => {
    const res = await apiClient.get('/api/v1/assets');
    return res.data?.data || res.data;
  },
  
  // Problem Reports (Issues)
  getProblemReports: async (mineOnly = false) => {
    const endpoint = mineOnly ? '/api/v1/problem-reports/mine' : '/api/v1/problem-reports';
    const res = await apiClient.get(endpoint);
    return res.data?.data || res.data;
  },

  updateReportStatus: async (reportId: string, status: string, notes?: string) => {
    const res = await apiClient.patch(`/api/v1/problem-reports/${reportId}/status`, { status, notes });
    return res.data?.data || res.data;
  },

  // Reservations
  getReservations: async () => {
    const res = await apiClient.get('/api/v1/reservations');
    return res.data?.data || res.data;
  },

  createReservation: async (data: any) => {
    const res = await apiClient.post('/api/v1/reservations', data);
    return res.data?.data || res.data;
  },

  updateReservationStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/api/v1/reservations/${id}/status`, { status });
    return res.data?.data || res.data;
  },

  // Active PC Sessions
  getActiveSessions: async () => {
    const res = await apiClient.get('/api/v1/pc-usage/active?pageNumber=1&pageSize=1000');
    return res.data?.data?.items || res.data?.data || res.data;
  },

  // Maintenance Records
  getMaintenanceRecords: async (mineOnly = false) => {
    const endpoint = mineOnly ? '/api/v1/maintenance/records?mine=true' : '/api/v1/maintenance/records';
    const res = await apiClient.get(endpoint);
    return res.data?.data || res.data;
  },

  // Profile
  getCurrentUser: async () => {
    const res = await apiClient.get('/api/v1/users/me');
    return res.data?.data || res.data;
  },

  updateCurrentUser: async (data: any) => {
    const res = await apiClient.put('/api/v1/users/me', data);
    return res.data?.data || res.data;
  }
};
