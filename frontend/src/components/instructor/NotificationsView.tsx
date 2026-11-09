import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Bell, ShieldAlert, Search, Calendar, Trash2, 
  CheckCircle2, X, Sliders, Eye, Plus, Volume2, VolumeX, ChevronLeft, 
  ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, Settings, 
  FileSpreadsheet, Building, ToggleLeft, ToggleRight, Layers, Clock, Activity, Check
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type NotificationStatus = 'Active' | 'Resolved' | 'Muted';
export type CategoryType = 'Hardware' | 'Network' | 'Software' | 'Schedule' | 'System';

export interface NotificationItem {
  id: string;
  code: string;
  lab: string;
  type: CategoryType;
  notificationTitle: string;
  details: string;
  impactedUnits: number;
  lastOccurrence: string;
  severity: SeverityLevel;
  status: NotificationStatus;
  isRead: boolean;
}

export const NotificationsView: React.FC = () => {
  // Tab State: Notifications vs Settings
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  // Date Range Filter States
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-11-02');

  // Master Notifications Dataset
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      code: 'NTF-2026-9081',
      lab: 'ComLab 1 (Networking)',
      type: 'Network',
      notificationTitle: 'DHCP IP Handshake Timeout',
      details: 'Loose RJ45 connection on station WS-03 failed DHCP acquisition.',
      impactedUnits: 1,
      lastOccurrence: 'Nov 2, 2026 | 11:30 AM',
      severity: 'Critical',
      status: 'Active',
      isRead: false
    },
    {
      id: 'notif-2',
      code: 'NTF-2026-9078',
      lab: 'ComLab 2 (Software Eng)',
      type: 'Hardware',
      notificationTitle: 'GPU Thermal Threshold Warning',
      details: 'Display flickering continuously on WS-14 under heavy rendering load.',
      impactedUnits: 3,
      lastOccurrence: 'Nov 2, 2026 | 09:15 AM',
      severity: 'High',
      status: 'Active',
      isRead: false
    },
    {
      id: 'notif-3',
      code: 'NTF-2026-9065',
      lab: 'FastAPI AI Engine',
      type: 'System',
      notificationTitle: 'Microservice High Memory Allocation',
      details: 'AI Telemetry worker memory reached 85% threshold during auto-scan.',
      impactedUnits: 32,
      lastOccurrence: 'Nov 1, 2026 | 04:20 PM',
      severity: 'Medium',
      status: 'Active',
      isRead: true
    },
    {
      id: 'notif-4',
      code: 'NTF-2026-9052',
      lab: 'ComLab 3 (AI Lab)',
      type: 'Software',
      notificationTitle: 'Python Virtual Environment Kernel Error',
      details: 'CUDA drivers failed to import in Jupyter notebook environment on WS-22.',
      impactedUnits: 1,
      lastOccurrence: 'Nov 1, 2026 | 03:45 PM',
      severity: 'Low',
      status: 'Resolved',
      isRead: true
    },
    {
      id: 'notif-5',
      code: 'NTF-2026-9040',
      lab: 'ComLab 4 (General Lab)',
      type: 'Schedule',
      notificationTitle: 'Lab Schedule Conflict Flagged',
      details: 'Overlapping room reservation detected between BSIT 2A & BSCS 3B.',
      impactedUnits: 25,
      lastOccurrence: 'Oct 30, 2026 | 02:10 PM',
      severity: 'Medium',
      status: 'Resolved',
      isRead: true
    },
    {
      id: 'notif-6',
      code: 'NTF-2026-9031',
      lab: 'JRMSU DB Core',
      type: 'System',
      notificationTitle: 'Automated Database Backup Completed',
      details: 'Daily PostgreSQL database backup archive generated successfully.',
      impactedUnits: 100,
      lastOccurrence: 'Oct 29, 2026 | 12:00 AM',
      severity: 'Low',
      status: 'Resolved',
      isRead: true
    }
  ]);

  // Search & Filter Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [labFilter, setLabFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  // Modals & UI States
  const [selectedDetailsNotif, setSelectedDetailsNotif] = useState<NotificationItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    recipientEmail: 'c.reyes@jrmsu.edu.ph',
  });

  // Create Alert Form State
  const [newAlertForm, setNewAlertForm] = useState({
    lab: 'ComLab 1 (Networking)',
    type: 'Hardware' as CategoryType,
    notificationTitle: '',
    details: '',
    impactedUnits: 1,
    severity: 'Medium' as SeverityLevel
  });

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper map from backend API to NotificationItem
  const mapApiToNotif = (item: any): NotificationItem => ({
    id: item.id || `notif-${Math.random()}`,
    code: item.code || item.ticketNo || `NTF-2026-${String(item.id || '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
    lab: item.lab || item.labName || 'ComLab 1 (Networking)',
    type: (item.type as CategoryType) || 'System',
    notificationTitle: item.notificationTitle || item.title || item.subject || 'System Alert',
    details: item.details || item.message || item.content || '',
    impactedUnits: item.impactedUnits || 1,
    lastOccurrence: item.lastOccurrence || (item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'),
    severity: (item.severity as SeverityLevel) || 'Medium',
    status: item.isRead ? 'Resolved' : (item.status || 'Active'),
    isRead: !!item.isRead
  });

  // FETCH NOTIFICATIONS FROM BACKEND API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/notifications');
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        setNotifications(items.map(mapApiToNotif));
      }
    } catch (err) {
      console.warn('[NotificationsView] Using current state');
    }
  }, []);

  useRealtime(undefined, fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // FILTERED DATA LOGIC with Safe string guards
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      const search = (searchTerm || '').toLowerCase();
      const title = (item.notificationTitle || '').toLowerCase();
      const details = (item.details || '').toLowerCase();
      const code = (item.code || '').toLowerCase();
      const lab = (item.lab || '').toLowerCase();

      const matchesSearch = title.includes(search) ||
                            details.includes(search) ||
                            code.includes(search) ||
                            lab.includes(search);

      const labF = (labFilter || '').toLowerCase().trim();
      const matchesLab = !labF || lab.includes(labF);
      const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesLab && matchesSeverity && matchesStatus;
    });
  }, [notifications, searchTerm, labFilter, severityFilter, statusFilter]);

  // PAGINATION CALCULATIONS
  const totalRows = filteredNotifications.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredNotifications.slice(startIndex, startIndex + rowsPerPage);

  // STAT COUNTERS
  const totalCount = notifications.length;
  const criticalCount = notifications.filter(n => n.severity === 'Critical').length;
  const activeCount = notifications.filter(n => n.status === 'Active').length;
  const resolvedCount = notifications.filter(n => n.status === 'Resolved').length;

  // CRUD HANDLERS
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertForm.notificationTitle.trim() || !newAlertForm.details.trim()) {
      alert('Please complete the title and details.');
      return;
    }

    const payload = {
      title: newAlertForm.notificationTitle.trim(),
      message: newAlertForm.details.trim(),
      labName: newAlertForm.lab.trim(),
      severity: newAlertForm.severity,
      type: newAlertForm.type
    };

    try {
      const res = await apiClient.post('/api/v1/notifications', payload);
      const created = res.data?.data || res.data;
      if (created) {
        setNotifications(prev => [mapApiToNotif(created), ...prev]);
      } else {
        throw new Error('Local fallback');
      }
    } catch (err) {
      const newNotification: NotificationItem = {
        id: `notif-${Date.now()}`,
        code: `NTF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        lab: newAlertForm.lab.trim(),
        type: newAlertForm.type,
        notificationTitle: newAlertForm.notificationTitle.trim(),
        details: newAlertForm.details.trim(),
        impactedUnits: Number(newAlertForm.impactedUnits) || 1,
        lastOccurrence: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        severity: newAlertForm.severity,
        status: 'Active',
        isRead: false
      };
      setNotifications(prev => [newNotification, ...prev]);
    }

    setIsCreateModalOpen(false);
    setNewAlertForm({
      lab: 'ComLab 1 (Networking)',
      type: 'Hardware',
      notificationTitle: '',
      details: '',
      impactedUnits: 1,
      severity: 'Medium'
    });
    showToast('New system alert created successfully!');
  };

  const handleToggleMute = async (id: string) => {
    try {
      await apiClient.patch(`/api/v1/notifications/${id}/read`).catch(() => {});
    } catch (e) {}

    setNotifications(notifications.map(n => {
      if (n.id === id) {
        const nextStatus: NotificationStatus = n.status === 'Muted' ? 'Active' : 'Muted';
        showToast(`Alert status changed to ${nextStatus}`);
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/notifications/${id}`).catch(() => {});
    } catch (e) {}

    setNotifications(notifications.filter(n => n.id !== id));
    setDeleteConfirmId(null);
    showToast('Notification deleted successfully!');
  };

  // CSV EXPORT
  const handleExportCSV = () => {
    const headers = ['ID,Code,Platform/Lab,Type,Title,Details,Impacted Units,Last Occurrence,Severity,Status\n'];
    const rows = filteredNotifications.map(n => 
      `"${n.id}","${n.code}","${n.lab}","${n.type}","${n.notificationTitle}","${n.details}",${n.impactedUnits},"${n.lastOccurrence}","${n.severity}","${n.status}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JRMSU_Notifications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('CSV export downloaded!');
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">

      {/* REUSABLE DATALIST FOR DUAL INPUT LAB/PLATFORM */}
      <datalist id="lab-platform-suggestions">
        <option value="ComLab 1 (Networking)" />
        <option value="ComLab 2 (Software Eng)" />
        <option value="ComLab 3 (AI Lab)" />
        <option value="ComLab 4 (General Lab)" />
        <option value="FastAPI AI Engine" />
        <option value="JRMSU DB Core" />
        <option value="Multimedia & Graphics Lab" />
      </datalist>

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e5352] text-white px-4 py-3 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#1e5352]" />
            System Notifications
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            JRMSU Laboratory Real-Time Alerts & Infrastructure Telemetry
          </p>
        </div>

        {/* DATE RANGE FILTER PICKERS */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs text-xs font-semibold">
          <Calendar className="w-4 h-4 text-[#1e5352] shrink-0" />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-slate-800 focus:outline-none"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:scale-[1.02] transition-transform duration-200">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Total Alerts</span>
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:scale-[1.02] transition-transform duration-200">
          <div>
            <span className="text-[10px] font-extrabold text-rose-600 block uppercase tracking-wider">Critical</span>
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:scale-[1.02] transition-transform duration-200">
          <div>
            <span className="text-[10px] font-extrabold text-amber-600 block uppercase tracking-wider">Active</span>
            <span className="text-2xl font-black text-amber-600">{activeCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:scale-[1.02] transition-transform duration-200">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 block uppercase tracking-wider">Resolved</span>
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-4 text-xs font-extrabold transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-[#1e5352] text-[#1e5352]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications Queue ({filteredNotifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 text-xs font-extrabold transition cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-[#1e5352] text-[#1e5352]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Alert Preferences & Settings</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: NOTIFICATIONS TABLE VIEW */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">

          {/* SEARCH & FILTER CONTROLS BAR WITH DUAL LAB INPUT */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            
            {/* SEARCH INPUT */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, details, code, or lab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352]"
              />
            </div>

            {/* DUAL PLATFORM/LAB FILTER INPUT + SEVERITY & STATUS DROPDOWNS */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* DUAL PLATFORM / LAB FILTER INPUT */}
              <div className="relative">
                <input
                  type="text"
                  list="lab-platform-suggestions"
                  placeholder="Select/Type Lab..."
                  value={labFilter}
                  onChange={(e) => setLabFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] w-44"
                />
                {labFilter && (
                  <button 
                    onClick={() => setLabFilter('')} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SEVERITY FILTER */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* STATUS FILTER */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Muted">Muted</option>
              </select>

              {/* ADD ALERT BUTTON */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-[#1e5352] hover:bg-[#143c3b] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Alert</span>
              </button>

            </div>

          </div>

          {/* MAIN NOTIFICATIONS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="p-3">Platform / Lab</th>
                  <th className="p-3">Object Type</th>
                  <th className="p-3">Notification Code & Title</th>
                  <th className="p-3">Details</th>
                  <th className="p-3 text-center">Impacted</th>
                  <th className="p-3">Last Occurrence</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <ShieldAlert className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-extrabold text-slate-600">No system notifications match your filters.</p>
                      <p className="text-[11px]">Try adjusting your search query or clear lab parameters.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition ${!item.isRead ? 'bg-emerald-50/30' : ''}`}
                    >
                      {/* PLATFORM / LAB */}
                      <td className="p-3 font-extrabold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#1e5352]" />
                          <span>{item.lab}</span>
                        </div>
                      </td>

                      {/* OBJECT TYPE */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-600 border border-slate-200/80 text-[10px]">
                          {item.type}
                        </span>
                      </td>

                      {/* CODE & TITLE */}
                      <td className="p-3">
                        <span className="font-sans text-[10px] text-[#1e5352] font-black block">{item.code}</span>
                        <span className="font-extrabold text-slate-800">{item.notificationTitle}</span>
                      </td>

                      {/* DETAILS */}
                      <td className="p-3 max-w-xs text-slate-500 truncate" title={item.details}>
                        {item.details}
                      </td>

                      {/* IMPACTED UNITS */}
                      <td className="p-3 text-center font-bold font-sans">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          {item.impactedUnits} {item.impactedUnits === 1 ? 'unit' : 'units'}
                        </span>
                      </td>

                      {/* LAST OCCURRENCE */}
                      <td className="p-3 font-sans text-[11px] text-slate-500">
                        {item.lastOccurrence}
                      </td>

                      {/* SEVERITY BADGE */}
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>

                      {/* ACTIONS ROW */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedDetailsNotif(item)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleMute(item.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              item.status === 'Muted' ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                            title={item.status === 'Muted' ? 'Unmute Alert' : 'Mute Alert'}
                          >
                            {item.status === 'Muted' ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1e5352]" />
              <span>Export CSV</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Rows per Page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <span className="font-sans">
                {totalRows > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, totalRows)} of {totalRows}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT 2: SETTINGS PANEL */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1e5352]" />
              System Notification Preferences
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure automated dispatch alerts and recipient emails</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-extrabold text-slate-800 block">Automated Email Notification Digest</span>
                <span className="text-slate-400">Send critical alerts to administrative email addresses immediately.</span>
              </div>
              <button
                onClick={() => {
                  setSettings({ ...settings, emailAlerts: !settings.emailAlerts });
                  showToast('Email preferences updated!');
                }}
                className="text-[#1e5352] cursor-pointer"
              >
                {settings.emailAlerts ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-extrabold text-slate-800 block">Real-time Browser Push Notifications</span>
                <span className="text-slate-400">Display popup toast alerts when hardware errors occur in any ComLab.</span>
              </div>
              <button
                onClick={() => {
                  setSettings({ ...settings, pushNotifications: !settings.pushNotifications });
                  showToast('Push notification preferences updated!');
                }}
                className="text-[#1e5352] cursor-pointer"
              >
                {settings.pushNotifications ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <label className="font-extrabold text-slate-800 block">Primary Administrator Email</label>
              <input
                type="email"
                value={settings.recipientEmail}
                onChange={(e) => setSettings({ ...settings, recipientEmail: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-sans text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW DETAILS */}
      {selectedDetailsNotif && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#1e5352]" />
                <h3 className="text-sm font-extrabold text-slate-900">Notification Details — {selectedDetailsNotif.code}</h3>
              </div>
              <button onClick={() => setSelectedDetailsNotif(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Platform / Lab</span>
                  <span className="font-bold text-slate-800">{selectedDetailsNotif.lab}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Object Type</span>
                  <span className="font-bold text-slate-800">{selectedDetailsNotif.type}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Title</span>
                <span className="font-extrabold text-slate-900">{selectedDetailsNotif.notificationTitle}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Details</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedDetailsNotif.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Severity</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getSeverityBadge(selectedDetailsNotif.severity)}`}>
                    {selectedDetailsNotif.severity}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Last Occurrence</span>
                  <span className="font-sans font-bold text-slate-800">{selectedDetailsNotif.lastOccurrence}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedDetailsNotif(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE NEW ALERT WITH DUAL LAB INPUT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateNotification} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Create System Alert</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* DUAL LAB INPUT IN CREATE MODAL */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Platform / Laboratory</label>
                <input
                  type="text"
                  list="lab-platform-suggestions"
                  placeholder="Select from suggestions or type custom name..."
                  value={newAlertForm.lab}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, lab: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 Select from suggestions or type a custom platform/lab name.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alert Title</label>
                <input
                  type="text"
                  placeholder="e.g. Switch Port Malfunction..."
                  value={newAlertForm.notificationTitle}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, notificationTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-extrabold text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Details & Description</label>
                <textarea
                  placeholder="Describe the system event or hardware alert..."
                  value={newAlertForm.details}
                  onChange={(e) => setNewAlertForm({ ...newAlertForm, details: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Impacted Units</label>
                  <input
                    type="number"
                    min={1}
                    value={newAlertForm.impactedUnits}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, impactedUnits: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Severity</label>
                  <select
                    value={newAlertForm.severity}
                    onChange={(e) => setNewAlertForm({ ...newAlertForm, severity: e.target.value as SeverityLevel })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Create Alert</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-slate-600">Are you sure you want to permanently delete this system alert?</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
              <button onClick={() => handleDeleteNotification(deleteConfirmId)} className="px-4 py-2 bg-rose-600 text-white text-xs font-bold cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationsView;
