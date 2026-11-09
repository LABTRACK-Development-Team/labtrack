import apiClient from '@/lib/api-client';
import React, { useEffect, useState } from 'react';
import { 
  Users, UserPlus, Shield, CheckCircle, XCircle, Search, 
  Mail, Edit3, Trash2, Key, UserCheck, Activity,
  X, Plus, AlertCircle, Sparkles, RefreshCw,
  QrCode, Clock, Calendar, LogOut, Monitor, Building
} from 'lucide-react';

export interface UserAccessManagementViewProps {
  campusName: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  campus: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface StudentQrLog {
  id: string;
  studentId: string;
  studentName: string;
  laboratoryRoom: string;
  workstation: string;
  date: string;
  timeIn: string;
  timeOut: string;
  duration: string;
  logoutType: 'AUTO_TIMEOUT' | 'MANUAL_SCAN' | 'ACTIVE' | 'ADMIN_OVERRIDE';
  status: 'COMPLETED' | 'IN_SESSION';
}

// ---- TIME FORMATTERS (aligned sa Student Page) ----
const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return 'N/A';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return 'N/A'; }
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '--:--';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return '--:--'; }
};

const formatDuration = (startIso: string | null | undefined, endIso: string | null | undefined): string => {
  if (!startIso) return 'In Session';
  try {
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : Date.now();
    if (isNaN(start)) return 'N/A';
    const secs = Math.floor((end - start) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ${secs % 60}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  } catch { return 'N/A'; }
};

// ---- AUTO-TIMEOUT CONSTANTS ----
const AUTO_TIMEOUT_SECONDS = 30; // 30s timeout per requirement

export const UserAccessManagementView: React.FC<UserAccessManagementViewProps> = ({
  campusName,
  onTriggerNotification
}) => {
  // Data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [qrLogs, setQrLogs] = useState<StudentQrLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [qrSearchQuery, setQrSearchQuery] = useState('');
  const [qrStatusFilter, setQrStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isAddQrModalOpen, setIsAddQrModalOpen] = useState(false);
  const [editingQrLog, setEditingQrLog] = useState<StudentQrLog | null>(null);
  const [deletingQrLogId, setDeletingQrLogId] = useState<string | null>(null);

  // Forms
  const [userFormData, setUserFormData] = useState({
    firstName: '', lastName: '', email: '', role: 'TECHNICIAN'
  });

  const [qrFormData, setQrFormData] = useState({
    studentId: '', studentName: '',
    laboratoryRoom: 'ComLab 1', workstation: 'PC-01',
    date: new Date().toISOString().split('T')[0],
    timeIn: '08:00 AM', timeOut: '--:--', duration: 'In Session',
    logoutType: 'ACTIVE' as StudentQrLog['logoutType'],
    status: 'IN_SESSION' as StudentQrLog['status']
  });

  // ============================================================
  // FETCH USERS
  // ============================================================
  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/v1/users');
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      const mapped: UserAccount[] = (Array.isArray(data) ? data : []).map((u: any) => ({
        id: u.id || u.userId,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown',
        email: u.email || 'no-email@jrmsu.edu.ph',
        role: (u.role || 'UNKNOWN').toUpperCase(),
        campus: u.campusName || campusName || 'Main Campus',
        status: u.isActive ? 'ACTIVE' : 'INACTIVE',
        lastActive: u.lastLoginUtc ? new Date(u.lastLoginUtc).toLocaleString() : 'Never'
      }));
      setUsers(mapped);
    } catch (err) {
      console.error('[Users] Fetch error:', err);
    }
  };

  // ============================================================
  // FETCH QR LOGS (ACTIVE + HISTORY - connected sa Student Page)
  // ============================================================
  const fetchQrLogs = async () => {
    try {
      // Step 1: Fetch BOTH active and history
      const [activeRes, historyRes] = await Promise.all([
        apiClient.get('/api/v1/pc-usage/active?pageNumber=1&pageSize=100').catch(() => null),
        apiClient.get('/api/v1/pc-usage/history?pageNumber=1&pageSize=100').catch(() => null)
      ]);

      const activeData = activeRes?.data?.data?.items || activeRes?.data?.data || activeRes?.data || [];
      const historyData = historyRes?.data?.data?.items || historyRes?.data?.data || historyRes?.data || [];

      const activeList = Array.isArray(activeData) ? activeData : [];
      const historyList = Array.isArray(historyData) ? historyData : [];

      const now = Date.now();
      let didTimeoutAny = false;
      const mapped: StudentQrLog[] = [];

      // â”€â”€â”€ Process ACTIVE sessions â”€â”€â”€
      for (const log of activeList) {
        const startIso = log.sessionStartUtc || log.startTimeUtc || log.startedAt || log.createdAtUtc;
        const startMs = startIso ? new Date(startIso).getTime() : 0;
        const elapsedSecs = startMs > 0 ? Math.floor((now - startMs) / 1000) : 0;
        const sessionId = log.sessionId || log.id;

        // Check kung >= 30s na active â†’ i-force end
        if (elapsedSecs >= AUTO_TIMEOUT_SECONDS && sessionId) {
          try {
            console.log('[AutoTimeout] Ending session', sessionId, 'after', elapsedSecs, 's');
            await apiClient.post(`/api/v1/pc-usage/end-session/${sessionId}`);
            didTimeoutAny = true;

            // Add as COMPLETED with AUTO_TIMEOUT
            mapped.push({
              id: sessionId,
              studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
              studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
              laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'N/A',
              workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'N/A',
              date: formatDate(startIso),
              timeIn: formatTime(startIso),
              timeOut: formatTime(new Date().toISOString()), // now
              duration: formatDuration(startIso, new Date().toISOString()),
              logoutType: 'AUTO_TIMEOUT',
              status: 'COMPLETED'
            });
          } catch (err) {
            console.warn('[AutoTimeout] Failed to end session:', sessionId, err);
            // Still show as active kung fail
            mapped.push({
              id: sessionId || String(Math.random()),
              studentId: log.studentId || 'N/A',
              studentName: log.studentName || log.userName || 'Unknown Student',
              laboratoryRoom: log.laboratoryName || log.labRoom || 'N/A',
              workstation: log.workstationCode || log.pcNumber || 'N/A',
              date: formatDate(startIso),
              timeIn: formatTime(startIso),
              timeOut: '--:--',
              duration: formatDuration(startIso, null),
              logoutType: 'ACTIVE',
              status: 'IN_SESSION'
            });
          }
        } else {
          // Active pa (< 30s)
          mapped.push({
            id: sessionId || String(Math.random()),
            studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
            studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
            laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'N/A',
            workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'N/A',
            date: formatDate(startIso),
            timeIn: formatTime(startIso),
            timeOut: '--:--',
            duration: formatDuration(startIso, null),
            logoutType: 'ACTIVE',
            status: 'IN_SESSION'
          });
        }
      }

      // â”€â”€â”€ Process HISTORY (completed sessions) â”€â”€â”€
      for (const log of historyList) {
        const startIso = log.sessionStartUtc || log.startTimeUtc || log.startedAt || log.createdAtUtc;
        const endIso = log.sessionEndUtc || log.endTimeUtc || log.endedAt;
        const logStatus = (log.status || '').toUpperCase();

        let logoutType: StudentQrLog['logoutType'] = 'MANUAL_SCAN';
        if (logStatus === 'AUTO_TIMEOUT') logoutType = 'AUTO_TIMEOUT';
        else if (logStatus === 'FORCED_LOGOUT' || logStatus === 'ADMIN_OVERRIDE') logoutType = 'ADMIN_OVERRIDE';

        mapped.push({
          id: log.sessionId || log.id || String(Math.random()),
          studentId: log.studentId || log.userId || log.studentNumber || 'N/A',
          studentName: log.studentName || log.userName || log.fullName || 'Unknown Student',
          laboratoryRoom: log.laboratoryName || log.labRoom || log.laboratory || 'N/A',
          workstation: log.workstationCode || log.workstationName || log.pcNumber || log.workstationNumber || 'N/A',
          date: formatDate(startIso),
          timeIn: formatTime(startIso),
          timeOut: formatTime(endIso),
          duration: formatDuration(startIso, endIso),
          logoutType,
          status: 'COMPLETED'
        });
      }

      // Sort: Active first, then by latest
      mapped.sort((a, b) => {
        if (a.status === 'IN_SESSION' && b.status !== 'IN_SESSION') return -1;
        if (a.status !== 'IN_SESSION' && b.status === 'IN_SESSION') return 1;
        return 0;
      });

      setQrLogs(mapped);
      setLastSync(new Date());

      // Kung may na-timeout, refetch after 1s to confirm
      if (didTimeoutAny) {
        setTimeout(() => fetchQrLogs(), 1000);
      }
    } catch (err) {
      console.error('[QR] Fetch error:', err);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchUsers(), fetchQrLogs()]);
    setIsLoading(false);
  };

  // ============================================================
  // LIVE SYNC: Auto-refresh every 3 seconds
  // ============================================================
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      fetchQrLogs(); // Only QR logs need frequent refresh
    }, 3000); // 3 seconds for near-real-time detection
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // USER CRUD
  // ============================================================
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.email || !userFormData.firstName) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/users', {
        firstName: userFormData.firstName.trim(),
        lastName: userFormData.lastName.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role.trim(),
        password: 'LabTrack@2026!',
        isActive: true
      });
      onTriggerNotification?.(`User ${userFormData.firstName} created successfully!`);
      setIsAddUserModalOpen(false);
      setUserFormData({ firstName: '', lastName: '', email: '', role: 'TECHNICIAN' });
      fetchUsers();
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/v1/users/${editingUser.id}`, {
        firstName: userFormData.firstName.trim(),
        lastName: userFormData.lastName.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role.trim(),
        isActive: editingUser.status === 'ACTIVE'
      });
      onTriggerNotification?.(`User updated successfully.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/users/${id}`);
      onTriggerNotification?.('User deleted.');
      setDeletingUserId(null);
      fetchUsers();
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    try {
      const newActive = currentStatus !== 'ACTIVE';
      await apiClient.patch(`/api/v1/users/${id}/status`, { isActive: newActive });
      onTriggerNotification?.(`Status updated.`);
      fetchUsers();
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUser(user);
    const parts = user.name.split(' ');
    setUserFormData({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: user.email,
      role: user.role
    });
  };

  // ============================================================
  // QR LOG CRUD
  // ============================================================
  const handleAddQrLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/pc-usage/scan-login', {
        workstationCode: qrFormData.workstation,
        laboratoryName: qrFormData.laboratoryRoom,
        studentId: qrFormData.studentId,
        studentName: qrFormData.studentName
      });
      onTriggerNotification?.(`Scan log recorded for ${qrFormData.studentName}.`);
      setIsAddQrModalOpen(false);
      setQrFormData({
        studentId: '', studentName: '',
        laboratoryRoom: 'ComLab 1', workstation: 'PC-01',
        date: new Date().toISOString().split('T')[0],
        timeIn: '08:00 AM', timeOut: '--:--', duration: 'In Session',
        logoutType: 'ACTIVE', status: 'IN_SESSION'
      });
      setTimeout(() => fetchQrLogs(), 500);
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceAutoLogout = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/pc-usage/end-session/${id}`);
      onTriggerNotification?.('Session terminated by Admin.');
      setTimeout(() => fetchQrLogs(), 500);
    } catch (err: any) {
      onTriggerNotification?.(`Failed to end session: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteQrLog = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/pc-usage/${id}`);
      onTriggerNotification?.('QR log deleted.');
      setDeletingQrLogId(null);
      setTimeout(() => fetchQrLogs(), 300);
    } catch (err: any) {
      onTriggerNotification?.(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStartEditQrLog = (log: StudentQrLog) => {
    setEditingQrLog(log);
    setQrFormData({
      studentId: log.studentId,
      studentName: log.studentName,
      laboratoryRoom: log.laboratoryRoom,
      workstation: log.workstation,
      date: log.date,
      timeIn: log.timeIn,
      timeOut: log.timeOut,
      duration: log.duration,
      logoutType: log.logoutType,
      status: log.status
    });
  };

  const handleUpdateQrLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQrLog) return;
    setEditingQrLog(null);
    onTriggerNotification?.('QR log updated (local).');
  };

  // ============================================================
  // FILTERS
  // ============================================================
  const filteredUsers = users.filter(u => {
    const q = (searchQuery || "").toLowerCase();
    const m1 = (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.id || "").toLowerCase().includes(q);
    const m2 = roleFilter === 'ALL' || u.role === roleFilter;
    const m3 = statusFilter === 'ALL' || u.status === statusFilter;
    return m1 && m2 && m3;
  });

  const filteredQrLogs = qrLogs.filter(q => {
    const s = (qrSearchQuery || "").toLowerCase();
    const m1 = (q.studentName || "").toLowerCase().includes(s) ||
               (q.studentId || "").toLowerCase().includes(s) ||
               (q.workstation || "").toLowerCase().includes(s);
    const m2 = qrStatusFilter === 'ALL' || q.status === qrStatusFilter || q.logoutType === qrStatusFilter;
    return m1 && m2;
  });

  // Metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const adminCount = users.filter(u => u.role.includes('ADMIN')).length;
  const technicianCount = users.filter(u => u.role === 'TECHNICIAN').length;
  const activeSessionsCount = qrLogs.filter(q => q.status === 'IN_SESSION').length;

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-500">

      {/* DATALISTS */}
      <datalist id="user-role-list">
        <option value="SUPER_ADMIN" />
        <option value="LAB_MANAGER" />
        <option value="TECHNICIAN" />
        <option value="INSTRUCTOR" />
      </datalist>
      <datalist id="lab-room-list">
        <option value="ComLab 1" />
        <option value="ComLab 2" />
        <option value="ComLab 3" />
        <option value="ComLab 4" />
        <option value="Multimedia Lab" />
        <option value="CISCO NetLab" />
      </datalist>
      <datalist id="workstation-list">
        <option value="PC-001" />
        <option value="PC-002" />
        <option value="PC-003" />
        <option value="PC-004" />
        <option value="PC-005" />
        <option value="PC-006" />
      </datalist>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-blue-100 flex items-center justify-between hover:scale-[1.02] transition">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Users</span>
            <h4 className="text-2xl font-black text-slate-900">{totalUsers}</h4>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1"><Sparkles className="w-3 h-3"/> Registered Accounts</span>
          </div>
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg"><Users className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-emerald-100 flex items-center justify-between hover:scale-[1.02] transition">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Users</span>
            <h4 className="text-2xl font-black text-emerald-600">{activeUsers} / {totalUsers}</h4>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> System Access Enabled</span>
          </div>
          <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg"><UserCheck className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-indigo-100 flex items-center justify-between hover:scale-[1.02] transition">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Administrators</span>
            <h4 className="text-2xl font-black text-indigo-600">{adminCount}</h4>
            <span className="text-[10px] text-indigo-600 font-bold">Full System Access</span>
          </div>
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg"><Shield className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-xl border border-amber-100 flex items-center justify-between hover:scale-[1.02] transition">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Sessions</span>
            <h4 className="text-2xl font-black text-amber-600">{activeSessionsCount}</h4>
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Live at {lastSync.toLocaleTimeString()}</span>
          </div>
          <div className="p-3.5 bg-amber-600 text-white rounded-2xl shadow-lg"><Monitor className="w-6 h-6" /></div>
        </div>
      </div>

      {/* ============================================ */}
      {/* USER ACCOUNTS SECTION */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>User Accounts & Access Control</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Manage administrator accounts, technicians, and access permissions.</p>
        </div>
        <button
          onClick={() => {
            setUserFormData({ firstName: '', lastName: '', email: '', role: 'TECHNICIAN' });
            setIsAddUserModalOpen(true);
          }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New User</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-blue-600 transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none cursor-pointer">
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="LAB_MANAGER">Lab Manager</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button onClick={fetchAll} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 border-b">
              <tr>
                <th className="p-3.5 rounded-l-2xl">User</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Campus</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right rounded-r-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading users...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {user.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${user.role.includes('ADMIN') ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">{user.campus}</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {user.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{user.lastActive}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => toggleUserStatus(user.id, user.status)} className={`px-3 py-1 font-bold text-[10px] rounded-xl transition border ${user.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}>
                          {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleStartEdit(user)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingUserId(user.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">No user accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* STUDENT QR LOGS SECTION - CONNECTED */}
      {/* ============================================ */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <span>Student Lab Attendance & PC Session Logs</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold border border-emerald-200 animate-pulse">
              LIVE
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Auto-sync every 3s. Sessions older than 30s are auto-terminated. Last sync: {lastSync.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => {
            setQrFormData({
              studentId: '', studentName: '',
              laboratoryRoom: 'ComLab 1', workstation: 'PC-001',
              date: new Date().toISOString().split('T')[0],
              timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timeOut: '--:--', duration: 'In Session',
              logoutType: 'ACTIVE', status: 'IN_SESSION'
            });
            setIsAddQrModalOpen(true);
          }}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-2 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Manual QR Entry</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID, or workstation..."
              value={qrSearchQuery}
              onChange={(e) => setQrSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={qrStatusFilter} onChange={(e) => setQrStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none cursor-pointer">
              <option value="ALL">All Logs</option>
              <option value="IN_SESSION">Active Session</option>
              <option value="COMPLETED">Completed</option>
              <option value="AUTO_TIMEOUT">Auto Timeout</option>
              <option value="ADMIN_OVERRIDE">Admin Override</option>
            </select>
            <button onClick={fetchQrLogs} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 border-b">
              <tr>
                <th className="p-3.5 rounded-l-2xl">Student</th>
                <th className="p-3.5">Lab / PC</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Time In</th>
                <th className="p-3.5">Time Out</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right rounded-r-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">Loading logs...</td></tr>
              ) : filteredQrLogs.length > 0 ? (
                filteredQrLogs.map(log => (
                  <tr key={log.id} className={`hover:bg-slate-50/60 transition ${log.status === 'IN_SESSION' ? 'bg-emerald-50/30' : ''}`}>
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{log.studentName}</div>
                      <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-0.5">
                        <QrCode className="w-3 h-3" /> {log.studentId}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{log.laboratoryRoom}</div>
                      <div className="text-[10px] text-indigo-700 font-bold mt-0.5">
                        <Monitor className="w-3 h-3 inline mr-1" /> {log.workstation}
                      </div>
                    </td>
                    <td className="p-3.5 font-sans text-slate-700">
                      <Calendar className="w-3 h-3 inline mr-1 text-slate-400" /> {log.date}
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-bold">
                        {log.timeIn}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${log.timeOut === '--:--' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {log.timeOut}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" /> {log.duration}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                        log.status === 'IN_SESSION' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' 
                          : log.logoutType === 'AUTO_TIMEOUT' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : log.logoutType === 'ADMIN_OVERRIDE'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.status === 'IN_SESSION' ? <Activity className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {log.status === 'IN_SESSION' ? 'ACTIVE' : log.logoutType === 'AUTO_TIMEOUT' ? 'AUTO TIMEOUT' : log.logoutType === 'ADMIN_OVERRIDE' ? 'FORCED LOGOUT' : 'COMPLETED'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.status === 'IN_SESSION' && (
                          <button
                            onClick={() => handleForceAutoLogout(log.id)}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-[10px] rounded-xl transition flex items-center gap-1"
                            title="Force logout session"
                          >
                            <LogOut className="w-3 h-3" /> Force Logout
                          </button>
                        )}
                        <button onClick={() => handleStartEditQrLog(log)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingQrLogId(log.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">
                  No attendance logs found. Nag-aantay sa student scan...
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-600" /> Register New User</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">First Name</label><input type="text" required value={userFormData.firstName} onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
                <div><label className="block mb-1">Last Name</label><input type="text" required value={userFormData.lastName} onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              </div>
              <div><label className="block mb-1">Email</label><input type="email" required value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              <div><label className="block mb-1">Role</label><input type="text" list="user-role-list" required value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              <p className="text-[10px] text-slate-400 italic">Default password: LabTrack@2026!</p>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Edit3 className="w-4 h-4 text-blue-600" /> Update User Account</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateUserSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">First Name</label><input type="text" required value={userFormData.firstName} onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
                <div><label className="block mb-1">Last Name</label><input type="text" required value={userFormData.lastName} onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              </div>
              <div><label className="block mb-1">Email</label><input type="email" required value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              <div><label className="block mb-1">Role</label><input type="text" list="user-role-list" required value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-3 rounded-xl outline-none focus:border-blue-600" /></div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3"><AlertCircle className="w-5 h-5" /><h3 className="font-bold text-sm text-slate-900">Delete User Account?</h3></div>
            <p className="text-xs text-slate-600 leading-relaxed">Are you sure you want to permanently delete this user? Cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeletingUserId(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleDeleteUser(deletingUserId)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg">Delete User</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD QR LOG - PURE WHITE THEME */}
      {isAddQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" /> Manual Student QR Attendance Entry
              </h3>
              <button onClick={() => setIsAddQrModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-xl transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddQrLogSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">Student ID</label><input type="text" required value={qrFormData.studentId} onChange={(e) => setQrFormData({...qrFormData, studentId: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" placeholder="e.g. 2023-IS-0142" /></div>
                <div><label className="block mb-1">Student Name</label><input type="text" required value={qrFormData.studentName} onChange={(e) => setQrFormData({...qrFormData, studentName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">Laboratory Room</label><input type="text" list="lab-room-list" required value={qrFormData.laboratoryRoom} onChange={(e) => setQrFormData({...qrFormData, laboratoryRoom: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
                <div><label className="block mb-1">Workstation</label><input type="text" list="workstation-list" required value={qrFormData.workstation} onChange={(e) => setQrFormData({...qrFormData, workstation: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div><label className="block mb-1">Date</label><input type="date" required value={qrFormData.date} onChange={(e) => setQrFormData({...qrFormData, date: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600 font-sans" /></div>
                <div><label className="block mb-1">Time In</label><input type="text" required value={qrFormData.timeIn} onChange={(e) => setQrFormData({...qrFormData, timeIn: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600 font-sans" /></div>
                <div><label className="block mb-1">Time Out</label><input type="text" value={qrFormData.timeOut} onChange={(e) => setQrFormData({...qrFormData, timeOut: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600 font-sans" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">Duration</label><input type="text" value={qrFormData.duration} onChange={(e) => setQrFormData({...qrFormData, duration: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600 font-sans" /></div>
                <div><label className="block mb-1">Status</label>
                  <select value={qrFormData.status} onChange={(e) => setQrFormData({...qrFormData, status: e.target.value as any})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none font-bold focus:border-indigo-600">
                    <option value="IN_SESSION">In Session</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div><label className="block mb-1">Logout Type</label>
                <select value={qrFormData.logoutType} onChange={(e) => setQrFormData({...qrFormData, logoutType: e.target.value as any})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none font-bold focus:border-indigo-600">
                  <option value="ACTIVE">Active (In Session)</option>
                  <option value="MANUAL_SCAN">Manual Scan (QR Out)</option>
                  <option value="AUTO_TIMEOUT">Auto Timeout</option>
                  <option value="ADMIN_OVERRIDE">Admin Override</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddQrModalOpen(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50">{isSubmitting ? 'Saving...' : 'Save Log Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QR LOG */}
      {editingQrLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Edit3 className="w-4 h-4 text-indigo-600" /> Edit QR Log</h3>
              <button onClick={() => setEditingQrLog(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateQrLogSubmit} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">Student ID</label><input type="text" value={qrFormData.studentId} onChange={(e) => setQrFormData({...qrFormData, studentId: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
                <div><label className="block mb-1">Student Name</label><input type="text" value={qrFormData.studentName} onChange={(e) => setQrFormData({...qrFormData, studentName: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block mb-1">Lab</label><input type="text" value={qrFormData.laboratoryRoom} onChange={(e) => setQrFormData({...qrFormData, laboratoryRoom: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
                <div><label className="block mb-1">Workstation</label><input type="text" value={qrFormData.workstation} onChange={(e) => setQrFormData({...qrFormData, workstation: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-900 p-2.5 rounded-xl outline-none focus:border-indigo-600" /></div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingQrLog(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE QR LOG */}
      {deletingQrLogId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3"><AlertCircle className="w-5 h-5" /><h3 className="font-bold text-sm text-slate-900">Delete QR Log?</h3></div>
            <p className="text-xs text-slate-600 leading-relaxed">Delete this attendance log? Cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeletingQrLogId(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleDeleteQrLog(deletingQrLogId)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg">Delete Log</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserAccessManagementView;
