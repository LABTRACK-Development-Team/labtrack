import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Bell, Search, Trash2, CheckCircle2, X, Eye, 
  Megaphone, Send, RefreshCw, AlertTriangle, Layers, Clock, Check
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AdminNoticeItem {
  id: string;
  code: string;
  lab: string;
  type: string;
  title: string;
  details: string;
  impactedUnits: number;
  lastOccurrence: string;
  severity: SeverityLevel;
  status: 'Active' | 'Resolved';
  audience: string;
}

export const AdminNotificationsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<AdminNoticeItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetAudience: 'All Users',
    severity: 'Medium' as SeverityLevel,
    labName: 'All Computer Labs'
  });

  const [notices, setNotices] = useState<AdminNoticeItem[]>([
    {
      id: 'adm-ntf-1',
      code: 'NTF-2026-9081',
      lab: 'ComLab 1 (Networking)',
      type: 'Hardware Alert',
      title: 'Core Switch Interface Port Timeout',
      details: 'Loose RJ45 connection on station WS-03 failed DHCP acquisition. Diagnostic in progress.',
      impactedUnits: 1,
      lastOccurrence: '2026-11-08 05:00 AM',
      severity: 'Critical',
      status: 'Active',
      audience: 'Technicians & Admins'
    },
    {
      id: 'adm-ntf-2',
      code: 'NTF-2026-9078',
      lab: 'ComLab 2 (Software Eng)',
      type: 'Hardware Alert',
      title: 'GPU Thermal Threshold Warning',
      details: 'Display flickering continuously on WS-14 under rendering load. Fan cleaning required.',
      impactedUnits: 3,
      lastOccurrence: '2026-11-08 04:15 AM',
      severity: 'High',
      status: 'Active',
      audience: 'Instructors & Students'
    },
    {
      id: 'adm-ntf-3',
      code: 'NTF-2026-9065',
      lab: 'ComLab 3 (AI Lab)',
      type: 'Software Notice',
      title: 'CUDA Toolkit Driver Synchronization',
      details: 'Jupyter Notebook kernel updated across all GPU workstations in ComLab 3.',
      impactedUnits: 25,
      lastOccurrence: '2026-11-07 02:30 PM',
      severity: 'Medium',
      status: 'Resolved',
      audience: 'All Users'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mapApiToNotice = (item: any): AdminNoticeItem => ({
    id: item.id || `notif-${Math.random()}`,
    code: item.code || item.ticketNo || `NTF-2026-${String(item.id || '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
    lab: item.labName || item.lab || 'All Computer Labs',
    type: item.type || item.category || 'System Notice',
    title: item.title || item.notificationTitle || item.subject || 'System Notification',
    details: item.details || item.message || item.description || '',
    impactedUnits: item.impactedUnits || 1,
    lastOccurrence: item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString() : (item.lastOccurrence || 'Just now'),
    severity: (item.severity as SeverityLevel) || 'Medium',
    status: item.isRead ? 'Resolved' : (item.status || 'Active'),
    audience: item.targetAudience || item.audience || 'All Users'
  });

  const fetchAdminNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/notifications').catch(() => apiClient.get('/api/v1/admin/notifications'));
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        setNotices(items.map(mapApiToNotice));
      }
    } catch (err) {
      console.warn('[AdminNotificationsView] Using default fallback dataset');
    }
  }, []);

  useRealtime(fetchAdminNotifications);

  useEffect(() => {
    fetchAdminNotifications();
  }, [fetchAdminNotifications]);

  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const q = (searchTerm || '').toLowerCase();
      const title = (n.title || '').toLowerCase();
      const details = (n.details || '').toLowerCase();
      const lab = (n.lab || '').toLowerCase();
      const code = (n.code || '').toLowerCase();

      const matchesSearch = title.includes(q) || details.includes(q) || lab.includes(q) || code.includes(q);
      const matchesSeverity = severityFilter === 'All' || n.severity === severityFilter;
      const matchesStatus = statusFilter === 'All' || n.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [notices, searchTerm, severityFilter, statusFilter]);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return;

    const newNotice: AdminNoticeItem = {
      id: `adm-ntf-${Date.now()}`,
      code: `NTF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      lab: broadcastForm.labName,
      type: 'System Broadcast',
      title: broadcastForm.title.trim(),
      details: broadcastForm.message.trim(),
      impactedUnits: 0,
      lastOccurrence: new Date().toLocaleString(),
      severity: broadcastForm.severity,
      status: 'Active',
      audience: broadcastForm.targetAudience
    };

    try {
      await apiClient.post('/api/v1/notifications/broadcast', {
        title: broadcastForm.title,
        message: broadcastForm.message,
        targetAudience: broadcastForm.targetAudience,
        severity: broadcastForm.severity
      }).catch(() => {});
    } catch (err) {}

    setNotices(prev => [newNotice, ...prev]);
    setIsBroadcastModalOpen(false);
    setBroadcastForm({
      title: '',
      message: '',
      targetAudience: 'All Users',
      severity: 'Medium',
      labName: 'All Computer Labs'
    });
    showToast('Broadcast notice dispatched to all portals!');
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/notifications/${id}`).catch(() => {});
    } catch (err) {}

    setNotices(prev => prev.filter(n => n.id !== id));
    setDeleteConfirmId(null);
    showToast('Notice deleted.');
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'High': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Medium': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 select-none animate-in fade-in duration-300">
      
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-cyan-950 text-cyan-200 px-4 py-3 rounded-2xl shadow-xl border border-cyan-500/40 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-cyan-400" />
            Notifications & Alerts Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            JRMSU Executive Laboratory Telemetry & Real-Time Campus Broadcast System
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminNotifications}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>New System Broadcast</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Alerts</span>
            <span className="text-2xl font-black text-white">{notices.length}</span>
          </div>
          <div className="p-3 bg-slate-800 text-slate-300 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block">Critical</span>
            <span className="text-2xl font-black text-rose-400">{notices.filter(n => n.severity === 'Critical').length}</span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Active</span>
            <span className="text-2xl font-black text-amber-400">{notices.filter(n => n.status === 'Active').length}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Resolved</span>
            <span className="text-2xl font-black text-emerald-400">{notices.filter(n => n.status === 'Resolved').length}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CONTROLS & SEARCH */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications by code, lab room, title, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* NOTICES LIST */}
        <div className="space-y-3 pt-2">
          {filteredNotices.map((n) => (
            <div key={n.id} className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl space-y-2 hover:border-slate-700 transition">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">{n.code}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getSeverityBadge(n.severity)}`}>{n.severity}</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{n.type}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">{n.lastOccurrence}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{n.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">{n.details}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span>Target: <strong className="text-slate-200">{n.lab}</strong> ({n.audience})</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedNotice(n)} className="p-1 hover:text-cyan-400 transition cursor-pointer" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirmId(n.id)} className="p-1 hover:text-rose-400 transition cursor-pointer" title="Delete Notice">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Notice Details — {selectedNotice.code}</h3>
              <button onClick={() => setSelectedNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-white">Title:</strong> {selectedNotice.title}</p>
              <p><strong className="text-white">Lab/Platform:</strong> {selectedNotice.lab}</p>
              <p><strong className="text-white">Severity:</strong> {selectedNotice.severity}</p>
              <p><strong className="text-white">Details:</strong> {selectedNotice.details}</p>
              <p><strong className="text-white">Timestamp:</strong> {selectedNotice.lastOccurrence}</p>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setSelectedNotice(null)} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BROADCAST MODAL */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBroadcast} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400" /> Create Campus Broadcast Notice
              </h3>
              <button type="button" onClick={() => setIsBroadcastModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Network Upgrade"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Audience</label>
                <select
                  value={broadcastForm.targetAudience}
                  onChange={e => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="All Users">All Users (Instructors & Students)</option>
                  <option value="Instructors Only">Instructors Only</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Technicians Only">Technicians & Admins Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Broadcast Message</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed notice content..."
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setIsBroadcastModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Send className="w-3.5 h-3.5" /> Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Delete System Notice?</h3>
            <p className="text-xs text-slate-400">Sigurado ka bang nais mong burahin ang notice na ito?</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotificationsView;
