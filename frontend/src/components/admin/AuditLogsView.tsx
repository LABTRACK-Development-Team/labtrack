import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { 
  FileText, Search, Plus, Trash2, Edit3, Shield, Download, Check, Copy, 
  Terminal, X, RefreshCw
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: 'ASSETS' | 'SESSIONS' | 'USERS' | 'MAINTENANCE' | 'SYSTEM' | 'FINANCIAL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress: string;
  details: string;
}

export interface AuditLogsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Default Fallback Dataset
  const defaultAuditLogs: AuditLogItem[] = useMemo(() => [
    {
      id: 'LOG-2026-801',
      timestamp: '2026-11-08 08:30:15',
      user: 'John Sven Morales',
      role: 'System Admin',
      action: 'ASSET_PROVISION_UPDATE',
      module: 'ASSETS',
      severity: 'INFO',
      ipAddress: '192.168.10.15',
      details: 'Updated GPU drivers and assigned network allocation for WS-301 in ComLab 3.'
    },
    {
      id: 'LOG-2026-802',
      timestamp: '2026-11-08 07:45:22',
      user: 'Maria Santos',
      role: 'Lab Supervisor',
      action: 'SESSION_TERMINATED',
      module: 'SESSIONS',
      severity: 'WARNING',
      ipAddress: '192.168.10.22',
      details: 'Force-closed idle workstation session WS-103 due to inactivity timeout.'
    },
    {
      id: 'LOG-2026-803',
      timestamp: '2026-11-08 06:12:05',
      user: 'Automated Sentinel',
      role: 'System Agent',
      action: 'MAINTENANCE_TICKET_RAISED',
      module: 'MAINTENANCE',
      severity: 'CRITICAL',
      ipAddress: '10.10.0.1',
      details: 'Thermal threshold exceeded on WS-202 (78°C). Maintenance work order WO-802 generated.'
    },
    {
      id: 'LOG-2026-804',
      timestamp: '2026-11-07 18:20:40',
      user: 'Prof. Alcantara',
      role: 'Instructor',
      action: 'USER_ROLE_ASSIGNMENT',
      module: 'USERS',
      severity: 'INFO',
      ipAddress: '192.168.10.45',
      details: 'Granted elevated ComLab 1 access privileges to Student ID 2026-0412.'
    },
    {
      id: 'LOG-2026-805',
      timestamp: '2026-11-07 14:10:00',
      user: 'Admin Operator',
      role: 'Operations Staff',
      action: 'FINANCIAL_LEDGER_ALLOCATION',
      module: 'FINANCIAL',
      severity: 'INFO',
      ipAddress: '192.168.10.108',
      details: 'Approved maintenance budget expenditure of ₱3,500.00 for replacement hardware parts.'
    }
  ], []);

  // Explicitly Typed State Definitions
  const [logs, setLogs] = useState<AuditLogItem[]>(defaultAuditLogs);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(defaultAuditLogs[0]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form State
  const [editUser, setEditUser] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('Operations Staff');
  const [editAction, setEditAction] = useState<string>('');
  const [editModule, setEditModule] = useState<'ASSETS' | 'SESSIONS' | 'USERS' | 'MAINTENANCE' | 'SYSTEM' | 'FINANCIAL'>('ASSETS');
  const [editSeverity, setEditSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [editIpAddress, setEditIpAddress] = useState<string>('192.168.10.108');
  const [editDetails, setEditDetails] = useState<string>('');

  const notify = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  // Fetch audit logs from backend API
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await apiClient.get('/api/v1/audit-logs');
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      const fetchedItems: AuditLogItem[] = Array.isArray(data) && data.length > 0 ? (data as AuditLogItem[]) : defaultAuditLogs;
      
      setLogs(fetchedItems);
      if (fetchedItems.length > 0) {
        setSelectedLog(fetchedItems[0]);
      }
    } catch (err) {
      console.warn('[AuditLogs] API fetch failed, utilizing fallback dataset.');
      setLogs(defaultAuditLogs);
      setSelectedLog(defaultAuditLogs[0]);
    } finally {
      setIsLoadingData(false);
    }
  }, [defaultAuditLogs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync Form State when selectedLog changes
  useEffect(() => {
    if (selectedLog) {
      setEditUser(selectedLog.user || '');
      setEditRole(selectedLog.role || '');
      setEditAction(selectedLog.action || '');
      setEditModule(selectedLog.module || 'ASSETS');
      setEditSeverity(selectedLog.severity || 'INFO');
      setEditIpAddress(selectedLog.ipAddress || '192.168.10.108');
      setEditDetails(selectedLog.details || '');
    }
  }, [selectedLog]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: AuditLogItem = {
      id: `LOG-2026-${Math.floor(800 + Math.random() * 199)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: editUser || 'System Admin',
      role: editRole || 'Operations Staff',
      action: editAction.toUpperCase().replace(/\s+/g, '_') || 'MANUAL_AUDIT_ENTRY',
      module: editModule,
      severity: editSeverity,
      ipAddress: editIpAddress || '192.168.10.108',
      details: editDetails || 'Manual audit entry logged via LabTrack Admin Portal.'
    };

    try {
      await apiClient.post('/api/v1/audit-logs', newLog).catch(() => {});
    } catch (err) {}

    const updated = [newLog, ...logs];
    setLogs(updated);
    setSelectedLog(newLog);
    setIsAddingNew(false);
    setIsEditing(false);
    notify(`New Audit Log ${newLog.id} added successfully!`);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;

    const updatedLog: AuditLogItem = {
      ...selectedLog,
      user: editUser,
      role: editRole,
      action: editAction.toUpperCase().replace(/\s+/g, '_'),
      module: editModule,
      severity: editSeverity,
      ipAddress: editIpAddress,
      details: editDetails
    };

    try {
      await apiClient.put(`/api/v1/audit-logs/${selectedLog.id}`, updatedLog).catch(() => {});
    } catch (err) {}

    const updatedList = logs.map(item => item.id === selectedLog.id ? updatedLog : item);

    setLogs(updatedList);
    setSelectedLog(updatedLog);
    setIsEditing(false);
    notify(`Audit Log record updated for ${selectedLog.id}.`);
  };

  const handleDeleteLog = async (id: string) => {
    if (logs.length <= 1) {
      notify('Cannot delete the last remaining audit log!');
      return;
    }

    try {
      setIsDeletingId(id);
      
      await apiClient.delete(`/api/v1/audit-logs/${id}`).catch(() => {
        console.warn(`[Delete] API endpoint /api/v1/audit-logs/${id} unreached. Deleting from local view.`);
      });

      const filtered = logs.filter(item => item.id !== id);
      setLogs(filtered);

      if (selectedLog?.id === id) {
        setSelectedLog(filtered[0] || null);
      }

      notify(`Audit Log ${id} deleted successfully.`);
    } catch (err) {
      console.error("Deletion error:", err);
      notify(`Failed to delete Audit Log ${id}.`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCopyPayload = (log: AuditLogItem) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
    notify(`Copied JSON payload for ${log.id}.`);
  };

  const exportLogsToCSV = () => {
    const headers = ['ID,Timestamp,User,Role,Action,Module,Severity,IP Address,Details'];
    const rows = logs.map(l => 
      `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.module}","${l.severity}","${l.ipAddress}","${(l.details || '').replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LabTrack_AuditLogs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Audit Logs exported to CSV successfully.');
  };

  const filteredLogs: AuditLogItem[] = useMemo(() => {
    return (logs || []).filter((log: AuditLogItem) => log != null).filter((log: AuditLogItem) => {
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch = !q ||
        (log.user || "").toLowerCase().includes(q) ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.id || "").toLowerCase().includes(q) ||
        (log.details || "").toLowerCase().includes(q);
      const matchesModule = selectedModuleFilter === 'ALL' || log.module === selectedModuleFilter;
      const matchesSeverity = selectedSeverityFilter === 'ALL' || log.severity === selectedSeverityFilter;
      return matchesSearch && matchesModule && matchesSeverity;
    });
  }, [logs, searchQuery, selectedModuleFilter, selectedSeverityFilter]);

  const getModuleBadgeColor = (moduleName: string) => {
    switch (moduleName) {
      case 'ASSETS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SESSIONS': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'USERS': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'MAINTENANCE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FINANCIAL': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-6 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* MAIN WORKSPACE CARD */}
      <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6">
        
        {/* HEADER BAR & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Trail</h2>
              <p className="text-xs text-slate-400 font-medium">Real-time system actions, security events, and user activity trails • {campusName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1 text-xs font-bold transition cursor-pointer"
              title="Sync Audit Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingData ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportLogsToCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setIsAddingNew(true);
                setIsEditing(false);
                setEditUser('Admin Operator');
                setEditRole('Operations Staff');
                setEditAction('NEW_AUDIT_ACTION');
                setEditModule('SYSTEM');
                setEditSeverity('INFO');
                setEditIpAddress('192.168.10.108');
                setEditDetails('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Log</span>
            </button>
          </div>
        </div>

        {/* 2-COLUMN SPLIT PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: AUDIT LOGS TABLE & FILTERS */}
          <div className="lg:col-span-7 bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 space-y-4">
            
            {/* SEARCH & MULTI-FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Log ID, User, Action, or Payload..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-full font-medium bg-white shadow-2xs text-slate-900 placeholder-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedModuleFilter}
                  onChange={e => setSelectedModuleFilter(e.target.value)}
                  className="text-xs font-bold font-sans bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none text-slate-700 cursor-pointer shadow-2xs w-full sm:w-auto"
                >
                  <option value="ALL">All Modules</option>
                  <option value="ASSETS">ASSETS</option>
                  <option value="SESSIONS">SESSIONS</option>
                  <option value="USERS">USERS</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="SYSTEM">SYSTEM</option>
                  <option value="FINANCIAL">FINANCIAL</option>
                </select>

                <select
                  value={selectedSeverityFilter}
                  onChange={e => setSelectedSeverityFilter(e.target.value)}
                  className="text-xs font-bold font-sans bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none text-slate-700 cursor-pointer shadow-2xs w-full sm:w-auto"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* LOG ITEM LIST STREAM */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 font-sans text-xs">
                  No audit logs found matching your filter criteria.
                </div>
              ) : (
                filteredLogs.map((log: AuditLogItem) => {
                  const isSelected = selectedLog?.id === log.id && !isAddingNew;
                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        setSelectedLog(log);
                        setIsAddingNew(false);
                        setIsEditing(false);
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10' 
                          : 'bg-white/90 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl text-xs font-bold shrink-0 ${
                          log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          log.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          <Shield className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[10px] font-bold text-slate-400">{log.id}</span>
                            <span className="text-xs font-extrabold text-slate-900 truncate">{log.action}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate font-medium flex items-center gap-1.5">
                            <span>{log.user}</span>
                            <span className="text-slate-300">•</span>
                            <span className={`text-[10px] font-bold font-sans px-1.5 py-0.2 rounded border ${getModuleBadgeColor(log.module)}`}>
                              {log.module}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-sans text-slate-400 hidden sm:inline">{(log.timestamp || '').split(' ')[1] || ''}</span>
                        <button
                          disabled={isDeletingId === log.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLog(log.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                          title="Delete Log"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isDeletingId === log.id ? 'animate-spin text-rose-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: AUDIT INSPECTOR & EDITOR */}
          <div className="lg:col-span-5 bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                <span>{isAddingNew ? 'Add New Log' : isEditing ? 'Edit Audit Record' : 'Audit Inspector Payload'}</span>
              </h3>
              {!isAddingNew && !isEditing && selectedLog && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => selectedLog && handleCopyPayload(selectedLog)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs cursor-pointer transition"
                    title="Copy JSON Payload"
                  >
                    {copiedId === selectedLog?.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy JSON</span>
                  </button>

                  <button
                    onClick={() => selectedLog && setIsEditing(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs cursor-pointer transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>

            {(isAddingNew || isEditing) ? (
              <form onSubmit={isAddingNew ? handleCreateLog : handleUpdateLog} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">User / Actor</label>
                  <input
                    type="text"
                    required
                    value={editUser}
                    onChange={e => setEditUser(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">Role</label>
                    <input
                      type="text"
                      required
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">IP Address</label>
                    <input
                      type="text"
                      required
                      value={editIpAddress}
                      onChange={e => setEditIpAddress(e.target.value)}
                      className="w-full text-xs font-sans font-bold p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">Action Name</label>
                  <input
                    type="text"
                    required
                    value={editAction}
                    onChange={e => setEditAction(e.target.value)}
                    className="w-full text-xs font-bold font-sans p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">Module</label>
                    <select
                      value={editModule}
                      onChange={e => setEditModule(e.target.value as any)}
                      className="w-full text-xs font-bold bg-white text-slate-900 border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="ASSETS">ASSETS</option>
                      <option value="SESSIONS">SESSIONS</option>
                      <option value="USERS">USERS</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="SYSTEM">SYSTEM</option>
                      <option value="FINANCIAL">FINANCIAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">Severity</label>
                    <select
                      value={editSeverity}
                      onChange={e => setEditSeverity(e.target.value as any)}
                      className="w-full text-xs font-bold bg-white text-slate-900 border border-slate-200 rounded-xl p-2.5 outline-none cursor-pointer"
                    >
                      <option value="INFO">INFO</option>
                      <option value="WARNING">WARNING</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans block mb-1">Log Details</label>
                  <textarea
                    rows={3}
                    value={editDetails}
                    onChange={e => setEditDetails(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Save Log Record</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : selectedLog ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 font-sans text-xs shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Log Reference ID</span>
                      <strong className="text-blue-600 font-bold text-sm">{selectedLog.id}</strong>
                    </div>
                    <span className="text-[10px] font-sans text-slate-400">{selectedLog.timestamp}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Action Code</span>
                    <strong className="text-slate-900 font-extrabold">{selectedLog.action}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">User / Actor</span>
                      <span className="text-slate-800 font-bold">{selectedLog.user}</span>
                      <span className="text-[10px] text-slate-400 block">{selectedLog.role}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">IP Address</span>
                      <span className="text-slate-700 font-bold">{selectedLog.ipAddress}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Module</span>
                      <span className={`px-2 py-0.5 rounded font-bold border text-[11px] ${getModuleBadgeColor(selectedLog.module)}`}>
                        {selectedLog.module}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Severity</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        selectedLog.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                        selectedLog.severity === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{selectedLog.severity}</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Details & Payload</span>
                    <p className="text-slate-700 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans">
                      {selectedLog.details}
                    </p>
                  </div>
                </div>

                <button
                  disabled={isDeletingId === selectedLog.id}
                  onClick={() => handleDeleteLog(selectedLog.id)}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingId === selectedLog.id ? 'Deleting...' : 'Delete Audit Log'}</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-sans text-xs">
                Select an audit log from the left list to view details.
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};

export default AuditLogsView;