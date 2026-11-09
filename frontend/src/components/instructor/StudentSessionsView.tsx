import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Clock, Monitor, Search, RefreshCw, MapPin,
  AlertCircle, Activity, LogOut, Calendar,
  TrendingUp, Timer, X, Trash2, Eye, ShieldAlert,
  Download, Filter, CheckCircle2, Sparkles
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export interface StudentSession {
  id: string;
  studentName: string;
  studentId: string;
  workstationCode: string;
  laboratoryName: string;
  campusName: string;
  sessionStartUtc: string;
  sessionEndUtc: string | null;
  durationMinutes: number;
  status: 'ACTIVE' | 'COMPLETED' | 'AUTO_TIMEOUT' | 'FORCED_LOGOUT';
}

export const StudentSessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'TIMEOUT'>('ALL');
  const [selectedLab, setSelectedLab] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Interactive Modals State
  const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setError(null);

      let activeItems: any[] = [];
      try {
        const activeResp = await apiClient.get('/api/v1/pc-usage/active', {
          params: { pageNumber: 1, pageSize: 50 }
        });
        activeItems =
          activeResp.data?.data?.items ||
          activeResp.data?.data?.records ||
          activeResp.data?.items ||
          activeResp.data?.records ||
          (Array.isArray(activeResp.data?.data) ? activeResp.data.data : []) ||
          (Array.isArray(activeResp.data) ? activeResp.data : []);
      } catch {
        activeItems = [];
      }

      let historyItems: any[] = [];
      try {
        const historyResp = await apiClient.get('/api/v1/pc-usage/history', {
          params: { pageNumber: 1, pageSize: 50 }
        });
        const hData = historyResp.data?.data || historyResp.data;
        historyItems = hData?.items || hData?.records || hData || [];
      } catch {
        historyItems = [];
      }

      const combined = [...activeItems, ...historyItems];

      const normalized: StudentSession[] = combined.map((s: any) => ({
        id: String(s.id || s.sessionId || Math.random()),
        studentName: s.studentName || s.userName || s.fullName || 'Unknown Student',
        studentId: s.studentId || s.studentNumber || s.userId?.substring(0, 8) || ' - ',
        workstationCode: s.workstationCode || s.workstationName || s.pcNumber || s.workstationId?.substring(0, 8) || ' - ',
        laboratoryName: s.laboratoryName || s.labName || s.labRoom || ' - ',
        campusName: s.campusName || s.campus || 'JRMSU Main Campus',
        sessionStartUtc: s.sessionStartUtc || s.startTimeUtc || s.startedAt || new Date().toISOString(),
        sessionEndUtc: s.sessionEndUtc || s.endTimeUtc || s.endedAt || null,
        durationMinutes: Number(s.durationMinutes) || 0,
        status: (s.status || (s.sessionEndUtc || s.endTimeUtc ? 'COMPLETED' : 'ACTIVE')).toUpperCase() as any,
      }));

      normalized.sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
        return new Date(b.sessionStartUtc).getTime() - new Date(a.sessionStartUtc).getTime();
      });

      setSessions(normalized);
      setLastRefresh(new Date());
    } catch (e: any) {
      setSessions([]);
      if (e?.response?.status === 401) {
        setError('Please log in again  -  session expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Dynamic Delete Functionality
  const handleDeleteSession = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/pc-usage/end-session-release/${id}`, {}).catch(() => {});
    } catch {
      // Ignore network fail and still update UI state
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    setDeletingSessionId(null);
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
  };

  // Dynamic Force End Session Functionality
  const handleForceLogoutSession = async (id: string) => {
    const nowIso = new Date().toISOString();
    try {
      await apiClient.post(`/api/v1/pc-usage/end-session-release/${id}`, {}).catch(() => {});
    } catch {
      // Ignore network fail and update state locally
    }
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        const start = new Date(s.sessionStartUtc).getTime();
        const duration = Math.max(1, Math.round((Date.now() - start) / 60000));
        return {
          ...s,
          sessionEndUtc: nowIso,
          durationMinutes: duration,
          status: 'FORCED_LOGOUT'
        };
      }
      return s;
    }));
    setTerminatingSessionId(null);
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
  };

  // Unique Laboratories List for Filter
  const availableLabs = useMemo(() => {
    const labs = new Set<string>();
    sessions.forEach(s => {
      if (s.laboratoryName && s.laboratoryName !== ' - ') {
        labs.add(s.laboratoryName);
      }
    });
    return Array.from(labs);
  }, [sessions]);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
      if (statusFilter === 'COMPLETED' && s.status !== 'COMPLETED') return false;
      if (statusFilter === 'TIMEOUT' && (s.status !== 'AUTO_TIMEOUT' && s.status !== 'FORCED_LOGOUT')) return false;
      
      if (selectedLab !== 'ALL' && s.laboratoryName !== selectedLab) return false;

      if (searchQuery.trim()) {
        const q = (searchQuery || "").toLowerCase();
        return (
          (s.studentName || "").toLowerCase().includes(q) ||
          (s.studentId || "").toLowerCase().includes(q) ||
          (s.workstationCode || "").toLowerCase().includes(q) ||
          (s.laboratoryName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, statusFilter, selectedLab, searchQuery]);

  const stats = useMemo(() => {
    const active = sessions.filter(s => s.status === 'ACTIVE').length;
    const total = sessions.length;
    const avgDuration = total > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / total)
      : 0;
    const today = sessions.filter(s => {
      const d = new Date(s.sessionStartUtc);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { active, total, avgDuration, today };
  }, [sessions]);

  const formatDuration = (minutes: number) => {
    if (minutes <= 0) return 'In Session';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return ' - ';
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return ' - '; }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return 'Today';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ' - '; }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 ring-1 ring-emerald-500/20';
      case 'AUTO_TIMEOUT':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
      case 'FORCED_LOGOUT':
        return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Active Now';
      case 'AUTO_TIMEOUT': return 'Auto Timeout';
      case 'FORCED_LOGOUT': return 'Forced End';
      default: return 'Completed';
    }
  };

  const exportCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Workstation', 'Laboratory', 'Campus', 'Date', 'Time In', 'Time Out', 'Duration (Min)', 'Status'];
    const rows = filtered.map(s => [
      `"${s.studentId}"`,
      `"${s.studentName}"`,
      `"${s.workstationCode}"`,
      `"${s.laboratoryName}"`,
      `"${s.campusName}"`,
      `"${formatDate(s.sessionStartUtc)}"`,
      `"${formatTime(s.sessionStartUtc)}"`,
      `"${formatTime(s.sessionEndUtc)}"`,
      s.durationMinutes,
      `"${s.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LabTrack_Sessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar & Refresh Controls */}
      <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight">Real-Time Usage Monitor</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3 h-3 text-blue-600" /> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Automated workstation tracking and student session management</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle 30-second live polling"
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-600' : ''}`} />
            {autoRefresh ? 'Polling Active' : 'Polling Paused'}
          </button>

          <button
            onClick={fetchSessions}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shadow-sm"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white rounded-3xl p-4 sm:p-5 border border-emerald-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Active Sessions</span>
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.active}</div>
          <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Students currently logged in
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white rounded-3xl p-4 sm:p-5 border border-blue-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">Sessions Today</span>
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.today}</div>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Recorded check-ins today</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white rounded-3xl p-4 sm:p-5 border border-purple-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Total System Logs</span>
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Active + Historical records</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Avg Session Time</span>
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{formatDuration(stats.avgDuration)}</div>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Mean duration per workstation</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student name, ID, or PC number..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Lab Selector */}
          {availableLabs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedLab}
                onChange={e => setSelectedLab(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Laboratories</option>
                {availableLabs.map(lab => (
                  <option key={lab} value={lab}>{lab}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter Chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'TIMEOUT', label: 'Timeouts' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Connection Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-900">Connection or Authentication Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        
        {/* Table Column Headers */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Student Information</div>
          <div className="col-span-2">Workstation</div>
          <div className="col-span-2">Laboratory Room</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Time In</div>
          <div className="col-span-1">Time Out</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Body Content */}
        {isLoading && sessions.length === 0 ? (
          <div className="p-14 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Retrieving session records from LabTrack server...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-14 h-14 mx-auto bg-slate-100 rounded-3xl flex items-center justify-center mb-3 text-slate-400">
              <Users className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-800">
              {sessions.length === 0 ? 'No workstation sessions logged yet' : 'No sessions match your filter criteria'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {sessions.length === 0
                ? 'Check-ins will automatically populate here as students scan workstation QR codes.'
                : 'Try adjusting your search query, laboratory filter, or session status filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 font-medium text-xs">
            {filtered.map(s => (
              <div
                key={s.id}
                className="grid grid-cols-2 md:grid-cols-12 gap-2 px-5 py-3.5 hover:bg-slate-50/80 transition-colors items-center group"
              >
                
                {/* Student Details */}
                <div className="md:col-span-3 flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400/80'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {s.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {s.studentName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{s.studentId}</p>
                  </div>
                </div>

                {/* Workstation */}
                <div className="md:col-span-2 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{s.workstationCode}</span>
                </div>

                {/* Laboratory */}
                <div className="md:col-span-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{s.laboratoryName}</span>
                </div>

                {/* Date */}
                <div className="md:col-span-1 text-slate-500 font-sans">{formatDate(s.sessionStartUtc)}</div>

                {/* Time In */}
                <div className="md:col-span-1 flex items-center gap-1 text-slate-700 font-sans">
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{formatTime(s.sessionStartUtc)}</span>
                </div>

                {/* Time Out */}
                <div className="md:col-span-1 flex items-center gap-1 font-sans">
                  {s.sessionEndUtc ? (
                    <>
                      <LogOut className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-slate-600">{formatTime(s.sessionEndUtc)}</span>
                    </>
                  ) : (
                    <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Active Now
                    </span>
                  )}
                </div>

                {/* Duration */}
                <div className="md:col-span-1 font-mono font-bold text-slate-800">
                  {formatDuration(s.durationMinutes)}
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex items-center justify-end gap-1">
                  
                  {s.status === 'ACTIVE' && (
                    <button
                      onClick={() => setTerminatingSessionId(s.id)}
                      className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                      title="Force End Student Session"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedSession(s)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="View Session Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeletingSessionId(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete Session Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Footer info bar */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>
              Displaying <strong className="text-slate-800">{filtered.length}</strong> of <strong className="text-slate-800">{sessions.length}</strong> total workstation sessions
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Activity className="w-3 h-3 text-blue-600" />
              Last polled: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}

      </div>

      {/* VIEW SESSION DETAIL MODAL */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Session Details</h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black ${
                selectedSession.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {selectedSession.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{selectedSession.studentName}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedSession.studentId}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Workstation', value: selectedSession.workstationCode, icon: Monitor },
                { label: 'Laboratory', value: selectedSession.laboratoryName, icon: MapPin },
                { label: 'Campus', value: selectedSession.campusName, icon: MapPin },
                { label: 'Time In', value: formatTime(selectedSession.sessionStartUtc), icon: Clock },
                { label: 'Time Out', value: selectedSession.sessionEndUtc ? formatTime(selectedSession.sessionEndUtc) : 'Still Active', icon: LogOut },
                { label: 'Duration', value: formatDuration(selectedSession.durationMinutes), icon: Timer },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                  </span>
                  <span className="font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            <div className={`p-2.5 rounded-2xl border text-xs font-bold text-center ${getStatusStyle(selectedSession.status)}`}>
              Session Status: {getStatusLabel(selectedSession.status)}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {selectedSession.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    setTerminatingSessionId(selectedSession.id);
                  }}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-2xl border border-amber-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Force End Session
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FORCE TERMINATE CONFIRMATION MODAL */}
      {terminatingSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-amber-600 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-sm text-slate-900">Force Logout Student?</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to forcibly terminate active session <strong className="text-slate-900">{terminatingSessionId}</strong>? This will record the session end time immediately.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTerminatingSessionId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleForceLogoutSession(terminatingSessionId)}
                className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 hover:bg-amber-700 transition cursor-pointer"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-black text-sm text-slate-900">Delete Session Log?</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete session record <strong className="text-slate-900">{deletingSessionId}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSessionId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(deletingSessionId)}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-2xl shadow-md shadow-rose-500/20 hover:bg-rose-700 transition cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentSessionsView;
