import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tv, Power, Search, Plus, X, Laptop, Wifi, 
  AlertTriangle, Lock, Unlock, Activity, ShieldAlert, 
  Radio, Cpu, HardDrive, Filter, Gauge, RefreshCw
} from 'lucide-react';

interface SessionsManagementViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface ActiveSessionRecord {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: string;
  department: string;
  pcId: string;
  labName: string;
  ipAddress: string;
  macAddress: string;
  startTime: string;
  durationMinutes: number;
  bandwidthMb: number;
  cpuUsage: number;
  ramUsage: number;
  status: 'RUNNING' | 'LOCKED' | 'FLAGGED';
}

export const SessionsManagementView: React.FC<SessionsManagementViewProps> = ({
  campusName = '',
  onTriggerNotification
}) => {
  // Live Clock & Telemetry Simulation Engine (SignalR / WebSockets)
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
      setSessions(prevSessions => 
        prevSessions.map(s => s.status === 'RUNNING' ? {
          ...s,
          durationMinutes: s.durationMinutes + 1,
          bandwidthMb: s.bandwidthMb + Math.floor(Math.random() * 6) + 2,
          cpuUsage: Math.min(99, Math.max(12, s.cpuUsage + Math.floor(Math.random() * 11) - 5)),
          ramUsage: Math.min(95, Math.max(30, s.ramUsage + Math.floor(Math.random() * 5) - 2))
        } : s)
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // -----------------------------------------------------------------
  // DYNAMIC SESSIONS STATE DATA (C# .NET API & SQL LabTrack Schema)
  // -----------------------------------------------------------------
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/pc-usage/active');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [labFilter, setLabFilter] = useState<string>('ALL');

  // Modal Dialog Controls
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isEmergencyBulkOpen, setIsEmergencyBulkOpen] = useState(false);
  const [selectedSessionForTerminate, setSelectedSessionForTerminate] = useState<ActiveSessionRecord | null>(null);
  const [inspectingSession, setInspectingSession] = useState<ActiveSessionRecord | null>(null);

  // Form State
  const [sessionForm, setSessionForm] = useState({ 
    userName: '', 
    pcId: 'PC-001', 
    labName: 'ComLab 1', 
    department: 'BSIT' 
  });

  const notify = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  const formatDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m}m`;
  };

  const formatBandwidth = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb} MB`;
  };

  // -----------------------------------------------------------------
  // SESSION ACTIONS (C# API DISPATCHERS)
  // -----------------------------------------------------------------

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.userName.trim()) return;

    const randomNodeNum = Math.floor(Math.random() * 200) + 10;
    const newSession: ActiveSessionRecord = {
      sessionId: `SES-${Math.floor(Math.random() * 8000) + 1000}`,
      userId: `USR-${Math.floor(Math.random() * 800) + 100}`,
      userName: sessionForm.userName.trim(),
      userRole: `${sessionForm.department.trim()} Student`,
      department: sessionForm.department.trim(),
      pcId: sessionForm.pcId.trim().toUpperCase(),
      labName: sessionForm.labName.trim(),
      ipAddress: `192.168.10.${randomNodeNum}`,
      macAddress: `00:1A:2B:3C:4D:${randomNodeNum.toString(16).padStart(2, '0').toUpperCase()}`,
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 1,
      bandwidthMb: 12,
      cpuUsage: Math.floor(15 + Math.random() * 30),
      ramUsage: Math.floor(30 + Math.random() * 25),
      status: 'RUNNING'
    };

    setSessions([newSession, ...sessions]);
    setIsNewSessionModalOpen(false);
    setSessionForm({ userName: '', pcId: 'PC-001', labName: 'ComLab 1', department: 'BSIT' });
    notify(`Workstation Session ${newSession.sessionId} launched on ${newSession.pcId}!`);
  };

  const handleToggleLockSession = (session: ActiveSessionRecord) => {
    const nextStatus = session.status === 'LOCKED' ? 'RUNNING' : 'LOCKED';
    setSessions(prev => prev.map(s => s.sessionId === session.sessionId ? { ...s, status: nextStatus } : s));
    notify(`Session ${session.sessionId} (${session.pcId}) status set to ${nextStatus}`);
  };

  const handleTerminateConfirm = () => {
    if (!selectedSessionForTerminate) return;
    setSessions(prev => prev.filter(s => s.sessionId !== selectedSessionForTerminate.sessionId));
    notify(`Session ${selectedSessionForTerminate.sessionId} on ${selectedSessionForTerminate.pcId} terminated successfully.`);
    setSelectedSessionForTerminate(null);
  };

  const handleBulkTerminateAll = () => {
    const count = sessions.length;
    setSessions([]);
    setIsEmergencyBulkOpen(false);
    notify(`Emergency Dispatch: All ${count} active workstation sessions terminated.`);
  };

  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(s => s != null).filter(s => {
      const matchesSearch = ((s.userName || "") + "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            ((s.pcId || "") + "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            ((s.labName || "") + "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            ((s.sessionId || "") + "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            ((s.ipAddress || "") + "").toLowerCase().includes((searchQuery || "").toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesLab = labFilter === 'ALL' || s.labName === labFilter;
      return matchesSearch && matchesStatus && matchesLab;
    });
  }, [sessions, searchQuery, statusFilter, labFilter]);

  const activeSessionsCount = sessions.filter(s => s.status === 'RUNNING').length;
  const flaggedSessionsCount = sessions.filter(s => s.status === 'FLAGGED').length;
  const totalBandwidthUsedMb = sessions.reduce((sum, s) => sum + s.bandwidthMb, 0);

  return (
    <div className="space-y-6 text-slate-800 font-sans animate-in fade-in duration-300">
      
      {/* DUAL MODE DATALISTS FOR WORKSTATION NODE & LAB ROOM ONLY */}
      <datalist id="pc-node-list">
        <option value="PC-001" />
        <option value="PC-002" />
        <option value="PC-003" />
        <option value="PC-004" />
        <option value="PC-005" />
        <option value="PC-012" />
        <option value="PC-015" />
        <option value="PC-020" />
      </datalist>

      <datalist id="lab-room-list">
        <option value="ComLab 1" />
        <option value="ComLab 2" />
        <option value="ComLab 3" />
        <option value="Mac Laboratory" />
        <option value="Multimedia Lab" />
      </datalist>

      {/* HEADER & SIGNALR TELEMETRY INDICATOR */}
      <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-sans font-bold text-[10px] border border-emerald-200/80 flex items-center gap-1.5 shadow-xs">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>SignalR Telemetry Bus Active</span>
            </span>
            <span className="text-slate-300"></span>
            <span className="text-xs font-sans font-bold text-slate-500">{liveClock}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Tv className="w-6 h-6 text-blue-600" />
            <span>Workstation Sessions Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time workstation stream, node telemetry, and session lock controls for {campusName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button 
            onClick={() => setIsNewSessionModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Launch Session
          </button>
          <button 
            onClick={() => setIsEmergencyBulkOpen(true)}
            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Emergency Lockout / Terminate All"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Emergency Bulk Terminate</span>
          </button>
        </div>
      </div>

      {/* WORKSTATION KPI TELEMETRY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 space-y-2 hover:border-emerald-300 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Sessions</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition border border-emerald-100 shadow-xs">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-600 font-sans">{activeSessionsCount}</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block"> Real-time Online Streams</span>
        </div>

        <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 space-y-2 hover:border-blue-300 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Bandwidth</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition border border-blue-100 shadow-xs">
              <Wifi className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-blue-600 font-sans">{formatBandwidth(totalBandwidthUsedMb)}</h3>
          <span className="text-[10px] text-blue-500 font-bold block">Aggregated Telemetry Data</span>
        </div>

        <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 space-y-2 hover:border-amber-300 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Active Nodes</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition border border-amber-100 shadow-xs">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-900 font-sans">{sessions.length}</h3>
          <span className="text-[10px] text-slate-400 font-bold block">Occupied Lab Stations</span>
        </div>

        <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-3xl shadow-xl border border-white/60 space-y-2 hover:border-rose-300 transition-all group">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Security Flagged</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition border border-rose-100 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-rose-600 font-sans">{flaggedSessionsCount}</h3>
          <span className="text-[10px] text-rose-500 font-bold block">High CPU / Memory Overloads</span>
        </div>
      </div>

      {/* WORKSTATION SESSIONS PANEL & FILTERS */}
      <div className="bg-white/95 backdrop-blur-2xl p-6 sm:p-7 rounded-3xl shadow-xl border border-white/60 space-y-5">
        
        {/* CONTROL TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Workstation Sessions</h3>
              <p className="text-xs text-slate-400">Live system status and real-time node telemetry stream</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 text-xs w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search Session, PC, User, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full font-semibold text-slate-900 placeholder-slate-400"
              />
            </div>

            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Laboratories</option>
              <option value="ComLab 1">ComLab 1</option>
              <option value="ComLab 2">ComLab 2</option>
              <option value="ComLab 3">ComLab 3</option>
            </select>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-[11px] font-bold">
              {['ALL', 'RUNNING', 'LOCKED', 'FLAGGED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${statusFilter === st ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WORKSTATION SESSIONS TELEMETRY TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-1">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="p-3.5">Session & Active Student</th>
                <th className="p-3.5">Workstation Node</th>
                <th className="p-3.5">Hardware Load (CPU / RAM)</th>
                <th className="p-3.5">Active Duration</th>
                <th className="p-3.5">Bandwidth Consumed</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-medium">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((ses) => (
                  <tr key={ses.sessionId} className="hover:bg-white transition group">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {ses.status === 'RUNNING' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>}
                        {ses.status === 'LOCKED' && <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>}
                        {ses.status === 'FLAGGED' && <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>}
                        <span className="font-extrabold text-slate-900">{ses.userName}</span>
                        <span className="text-[10px] font-sans text-slate-400">({ses.userRole})</span>
                      </div>
                      <div className="text-[10px] font-sans text-blue-600 block mt-0.5">
                        {ses.sessionId}  IP: {ses.ipAddress}
                      </div>
                    </td>

                    <td className="p-3.5 font-sans font-bold text-slate-800">
                      {ses.pcId} <span className="text-[10px] font-normal text-slate-500">({ses.labName})</span>
                    </td>

                    <td className="p-3.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${ses.cpuUsage > 80 ? 'text-rose-600' : 'text-slate-700'}`}>
                          CPU {ses.cpuUsage}%
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[11px] font-bold text-slate-700">
                          RAM {ses.ramUsage}%
                        </span>
                      </div>
                      <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${ses.cpuUsage > 80 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                          style={{ width: `${ses.cpuUsage}%` }}
                        ></div>
                      </div>
                    </td>

                    <td className="p-3.5 font-sans text-slate-700 font-bold">{formatDuration(ses.durationMinutes)}</td>

                    <td className="p-3.5 font-sans font-bold text-emerald-600">{formatBandwidth(ses.bandwidthMb)}</td>

                    <td className="p-3.5">
                      {ses.status === 'RUNNING' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-bold text-[10px]">Active</span>}
                      {ses.status === 'LOCKED' && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-bold text-[10px]">Locked</span>}
                      {ses.status === 'FLAGGED' && <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full font-bold text-[10px]">Flagged</span>}
                    </td>

                    <td className="p-3.5 text-right space-x-2">
                      <button 
                        onClick={() => handleToggleLockSession(ses)}
                        className="text-amber-600 hover:underline font-bold cursor-pointer"
                      >
                        {ses.status === 'LOCKED' ? 'Unlock' : 'Lock'}
                      </button>
                      <button 
                        onClick={() => setInspectingSession(ses)}
                        className="text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button 
                        onClick={() => setSelectedSessionForTerminate(ses)}
                        className="text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        Terminate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No active workstation sessions found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: LAUNCH WORKSTATION SESSION */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-600" /> Launch Workstation Session
              </h3>
              <button onClick={() => setIsNewSessionModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Student / User Name</label>
                <input 
                  type="text" 
                  value={sessionForm.userName} 
                  onChange={(e) => setSessionForm({ ...sessionForm, userName: e.target.value })} 
                  placeholder="e.g. Student Name" 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl font-semibold outline-none focus:border-emerald-500 placeholder-slate-400" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* DUAL MODE WORKSTATION NODE INPUT */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Workstation Node (Select / Type)</label>
                  <input 
                    type="text"
                    list="pc-node-list"
                    value={sessionForm.pcId} 
                    onChange={(e) => setSessionForm({ ...sessionForm, pcId: e.target.value })}
                    placeholder="Select or type PC..."
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none font-sans font-bold focus:border-emerald-500 placeholder-slate-400"
                    required
                  />
                </div>

                {/* DUAL MODE LABORATORY ROOM INPUT */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700">Laboratory Room (Select / Type)</label>
                  <input 
                    type="text"
                    list="lab-room-list"
                    value={sessionForm.labName} 
                    onChange={(e) => setSessionForm({ ...sessionForm, labName: e.target.value })}
                    placeholder="Select or type Lab..."
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none font-bold focus:border-emerald-500 placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700">Department / Program</label>
                <input 
                  type="text" 
                  value={sessionForm.department} 
                  onChange={(e) => setSessionForm({ ...sessionForm, department: e.target.value })} 
                  placeholder="e.g. BSIT / BSCS" 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl font-medium outline-none focus:border-emerald-500 placeholder-slate-400" 
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 cursor-pointer transition">
                  Launch Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TERMINATE CONFIRMATION */}
      {selectedSessionForTerminate && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Power className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Terminate Active Session?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Force disconnect <strong className="text-slate-900">{selectedSessionForTerminate.userName}</strong> on workstation <strong className="font-sans text-slate-900">{selectedSessionForTerminate.pcId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedSessionForTerminate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleTerminateConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/30 cursor-pointer"
              >
                Terminate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SESSION TELEMETRY INSPECTION */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Tv className="w-4 h-4 text-blue-600" /> Telemetry Inspector ({inspectingSession.sessionId})
              </h3>
              <button onClick={() => setInspectingSession(null)} className="cursor-pointer text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 font-sans text-slate-900">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Session ID:</span>
                <strong className="text-blue-600">{inspectingSession.sessionId}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Active Student:</span>
                <strong className="text-slate-900 font-sans">{inspectingSession.userName}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Workstation Node:</span>
                <strong className="text-slate-900">{inspectingSession.pcId} ({inspectingSession.labName})</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Subnet IP Address:</span>
                <strong className="text-slate-700">{inspectingSession.ipAddress}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">MAC Hardware Addr:</span>
                <strong className="text-slate-700">{inspectingSession.macAddress}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Active Duration:</span>
                <strong className="text-emerald-600">{formatDuration(inspectingSession.durationMinutes)}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Bandwidth Consumed:</span>
                <strong className="text-emerald-600">{formatBandwidth(inspectingSession.bandwidthMb)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hardware Telemetry:</span>
                <strong className="text-indigo-600">CPU {inspectingSession.cpuUsage}% | RAM {inspectingSession.ramUsage}%</strong>
              </div>
            </div>

            <button onClick={() => setInspectingSession(null)} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md cursor-pointer">
              Close Telemetry Inspector
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: EMERGENCY BULK ACTION */}
      {isEmergencyBulkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base text-rose-600">Bulk Terminate All Sessions?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Emergency Action: This will immediately disconnect all <strong className="text-slate-900">{sessions.length} active workstation sessions</strong> across all computer laboratories.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsEmergencyBulkOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkTerminateAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/30 cursor-pointer"
              >
                Execute Bulk Terminate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionsManagementView;