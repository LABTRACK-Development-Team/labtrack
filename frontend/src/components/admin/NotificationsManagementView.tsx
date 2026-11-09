import apiClient from '@/lib/api-client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle2, Info, ShieldAlert, Send, Trash2, 
  Filter, BarChart3, Plus, X, Clock, Radio, Megaphone, CheckSquare, 
  Square, RefreshCw, Search, Sparkles, AlertOctagon, Eye, Sliders, Shield,
  FileText, Volume2, VolumeX, Edit, Server, Signal, Cpu, Layers
} from 'lucide-react';

export interface NotificationsManagementViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface AlertItem {
  id: string;
  title: string;
  count: string;
  category: string;
  categoryLabel: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS';
  time: string;
  lab: string;
  msg: string;
  isRead: boolean;
}

export const NotificationsManagementView: React.FC<NotificationsManagementViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification
}) => {
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());
  const [barSeries, setBarSeries] = useState([25, 45, 60, 35, 80, 50, 95]);
  const [isDndActive, setIsDndActive] = useState(false);
  const [liveToastAlert, setLiveToastAlert] = useState<string | null>(null);

  const [categories, setCategories] = useState({
    documents: true,
    dnd: true,
    hardware: true,
    desktopFleet: true,
    userLog: true,
    security: true,
    network: true
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS'>('ALL');

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [selectedAlertModal, setSelectedAlertModal] = useState<AlertItem | null>(null);

  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchMsg, setDispatchMsg] = useState('');
  const [dispatchSeverity, setDispatchSeverity] = useState<'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'SUCCESS'>('CRITICAL');
  const [dispatchCategory, setDispatchCategory] = useState<string>('hardware');
  const [dispatchTargetLab, setDispatchTargetLab] = useState('All Labs');

  const getCategoryLabel = (cat: string): string => {
    const c = String(cat || '').toLowerCase();
    if (c.includes('doc') || c.includes('report')) return 'Document & Report Logs';
    if (c.includes('dnd') || c.includes('trap')) return 'Trap / DND Alerts';
    if (c.includes('fleet') || c.includes('desktop')) return 'Desktop Fleet';
    if (c.includes('user') || c.includes('session')) return 'User Session Log';
    if (c.includes('sec') || c.includes('breach')) return 'Security Breaches';
    if (c.includes('net') || c.includes('tele')) return 'Network Telemetry';
    if (c.includes('hard')) return 'Hardware Faults';
    return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'General Alert';
  };

  const defaultAlerts: AlertItem[] = useMemo(() => [
    {
      id: 'ALT-101',
      title: 'DHCP IP Handshake Timeout',
      count: '1,024',
      category: 'network',
      categoryLabel: 'Network Telemetry',
      severity: 'CRITICAL',
      time: '05:15 AM',
      lab: 'ComLab 1 (Networking)',
      msg: 'Loose RJ45 LAN connector detected at WS-03. Automatic diagnostic initiated.',
      isRead: false
    },
    {
      id: 'ALT-102',
      title: 'GPU Thermal Threshold Exceeded',
      count: '450',
      category: 'hardware',
      categoryLabel: 'Hardware Faults',
      severity: 'WARNING',
      time: '05:00 AM',
      lab: 'ComLab 2 (Software Eng)',
      msg: 'Thermal sensor reading reaching 78°C on station PC-202 during rendering session.',
      isRead: false
    },
    {
      id: 'ALT-103',
      title: 'CUDA Driver Synchronization Complete',
      count: '1,200',
      category: 'desktopFleet',
      categoryLabel: 'Desktop Fleet',
      severity: 'INFO',
      time: '04:30 AM',
      lab: 'ComLab 3 (AI Lab)',
      msg: 'Jupyter Notebook CUDA v12.4 kernel updated across 25 workstation nodes.',
      isRead: true
    },
    {
      id: 'ALT-104',
      title: 'PostgreSQL Database Automated Backup',
      count: '3,500',
      category: 'documents',
      categoryLabel: 'Document & Report Logs',
      severity: 'INFO',
      time: '04:00 AM',
      lab: 'JRMSU DB Core',
      msg: 'Daily database backup archive generated successfully with 100% integrity check.',
      isRead: true
    }
  ], []);

  const [alertsList, setAlertsList] = useState<AlertItem[]>(defaultAlerts);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const mapApiToAlertItem = useCallback((item: any, index: number): AlertItem => {
    const rawCat = String(item.category || item.type || 'hardware');
    const catLabel = getCategoryLabel(rawCat);

    const rawSev = String(item.severity || '').toUpperCase();
    let severity: AlertItem['severity'] = 'INFO';
    if (rawSev.includes('CRIT')) severity = 'CRITICAL';
    else if (rawSev.includes('HIGH')) severity = 'HIGH';
    else if (rawSev.includes('WARN') || rawSev.includes('MED')) severity = 'WARNING';
    else if (rawSev.includes('SUCC') || rawSev.includes('OK') || rawSev.includes('DONE') || rawSev.includes('COMPLET')) severity = 'SUCCESS';

    return {
      id: item.id || `ALT-${100 + index}`,
      title: item.title || item.notificationTitle || item.subject || 'System Broadcast Alert',
      count: item.count || (item.impactedUnits ? `${item.impactedUnits}` : '1,000'),
      category: rawCat.toLowerCase(),
      categoryLabel: catLabel,
      severity: severity,
      time: item.time || (item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'),
      lab: item.lab || item.labName || 'All Labs',
      msg: item.msg || item.details || item.message || item.description || 'System telemetry notification event.',
      isRead: !!item.isRead
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const res = await apiClient.get('/api/v1/notifications').catch(() => apiClient.get('/api/v1/admin/notifications'));
      const data = res?.data?.data?.items || res?.data?.data || res?.data || [];
      const itemsArray = Array.isArray(data) ? data : [];
      
      if (itemsArray.length > 0) {
        setAlertsList(itemsArray.map((item, idx) => mapApiToAlertItem(item, idx)));
      } else {
        setAlertsList(defaultAlerts);
      }
    } catch (err) {
      console.warn("Using dynamic fallback notifications dataset:", err);
      setAlertsList(defaultAlerts);
    } finally {
      setIsLoadingData(false);
    }
  }, [defaultAlerts, mapApiToAlertItem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const ticker = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
      setBarSeries(prev => [...prev.slice(1), Math.floor(30 + Math.random() * 65)]);
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  const triggerToast = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  const toggleCat = (key: keyof typeof categories) => {
    setCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchMsg.trim()) return;

    const catLabel = getCategoryLabel(dispatchCategory);

    const newAlert: AlertItem = {
      id: `ALT-${Math.floor(Math.random() * 899) + 100}`,
      title: dispatchTitle.trim(),
      count: '1,000',
      category: dispatchCategory.toLowerCase(),
      categoryLabel: catLabel,
      severity: dispatchSeverity,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lab: dispatchTargetLab.trim(),
      msg: dispatchMsg.trim(),
      isRead: false
    };

    setAlertsList(prev => [newAlert, ...prev]);
    setIsDispatchModalOpen(false);

    if (!isDndActive) {
      setLiveToastAlert(newAlert.title);
      setTimeout(() => setLiveToastAlert(null), 3500);
    }

    resetFormFields();
    triggerToast(`Broadcast Alert Dispatched: "${newAlert.title}"`);
  };

  const handleOpenEditModal = (alert: AlertItem) => {
    setEditingAlert(alert);
    setDispatchTitle(alert.title);
    setDispatchMsg(alert.msg);
    setDispatchSeverity(alert.severity);
    setDispatchCategory(alert.category);
    setDispatchTargetLab(alert.lab || 'All Labs');
  };

  const handleUpdateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert) return;

    const catLabel = getCategoryLabel(dispatchCategory);

    setAlertsList(prev => prev.map(a => {
      if (a.id === editingAlert.id) {
        return {
          ...a,
          title: dispatchTitle.trim(),
          msg: dispatchMsg.trim(),
          severity: dispatchSeverity,
          category: dispatchCategory.toLowerCase(),
          categoryLabel: catLabel,
          lab: dispatchTargetLab.trim()
        };
      }
      return a;
    }));

    setEditingAlert(null);
    resetFormFields();
    triggerToast(`Updated Alert: "${dispatchTitle}"`);
  };

  const handleToggleRead = (id: string) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
  };

  const handleMarkAllRead = () => {
    setAlertsList(prev => prev.map(a => ({ ...a, isRead: true })));
    triggerToast('All notifications marked as read.');
  };

  const handleDeleteAlert = (id: string, title: string) => {
    setAlertsList(prev => prev.filter(a => a.id !== id));
    setSelectedAlertModal(null);
    triggerToast(`Dismissed alert: "${title}"`);
  };

  const handlePurge = () => {
    setAlertsList([]);
    triggerToast('Notification Desk purged.');
  };

  const resetFormFields = () => {
    setDispatchTitle('');
    setDispatchMsg('');
    setDispatchSeverity('CRITICAL');
    setDispatchCategory('hardware');
    setDispatchTargetLab('All Labs');
  };

  const filteredAlerts = useMemo(() => {
    return alertsList.filter(a => {
      const catLower = (a.category || '').toLowerCase();
      const isKnown =
        catLower.includes('doc') || catLower.includes('dnd') || catLower.includes('hard') ||
        catLower.includes('fleet') || catLower.includes('user') || catLower.includes('sec') ||
        catLower.includes('net');

      const knownMatch =
        (catLower.includes('doc') && categories.documents) ||
        (catLower.includes('dnd') && categories.dnd) ||
        (catLower.includes('hard') && categories.hardware) ||
        (catLower.includes('fleet') && categories.desktopFleet) ||
        (catLower.includes('user') && categories.userLog) ||
        (catLower.includes('sec') && categories.security) ||
        (catLower.includes('net') && categories.network);

      const matchesCategory = isKnown ? knownMatch : true;

      const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch = !q || 
        (a.title || "").toLowerCase().includes(q) || 
        (a.msg || "").toLowerCase().includes(q) ||
        (a.lab || "").toLowerCase().includes(q);

      return matchesCategory && matchesSeverity && matchesSearch;
    });
  }, [alertsList, categories, severityFilter, searchQuery]);

  const notifSuccess = 75;

  return (
    <div className="space-y-6 font-sans text-slate-800 animate-in fade-in duration-300 relative">
      
      {liveToastAlert && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between transition-all animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span className="text-xs font-black tracking-wide font-sans">NEW NOTIFICATION: {liveToastAlert}</span>
          </div>
          <button onClick={() => setLiveToastAlert(null)} className="text-[10px] bg-white/20 hover:bg-white/30 font-sans px-2.5 py-0.5 rounded-full font-bold cursor-pointer">Close</button>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
              Notification Desk
            </h2>
            <span className="text-xs text-slate-400">Live Telemetry & Emergency Alert Dispatcher for {campusName}</span>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs font-bold">
            <button
              onClick={() => {
                setIsDndActive(!isDndActive);
                triggerToast(isDndActive ? 'Audible notifications enabled.' : 'DND Silent mode enabled.');
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isDndActive ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isDndActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
              <span>{isDndActive ? 'DND Active' : 'Audible'}</span>
            </button>

            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer"
              title="Refresh Telemetry Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-2xl text-slate-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{liveClock}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          <div className="lg:col-span-5 bg-slate-50/60 p-5 rounded-3xl border border-slate-200/80 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans">
                  Priority Notifications
                </h3>
                <span className="text-[10px] font-sans font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  {filteredAlerts.length} Active
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter notifications..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200/80 rounded-xl outline-none focus:border-blue-500 w-full font-medium bg-white"
                  />
                </div>
                <select
                  value={severityFilter}
                  onChange={e => setSeverityFilter(e.target.value as any)}
                  className="col-span-4 text-[11px] border border-slate-200/80 rounded-xl px-2 py-1.5 font-bold outline-none bg-white text-slate-700 shadow-xs cursor-pointer"
                >
                  <option value="ALL">All Priority</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 hover:scale-[1.01] ${
                        alert.isRead ? 'bg-white/60 border-slate-200/60 opacity-75' : 'bg-white border-blue-200 shadow-xs hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setSelectedAlertModal(alert)}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 ${
                          alert.category === 'documents' ? 'bg-emerald-600' : alert.severity === 'CRITICAL' ? 'bg-blue-600' : 'bg-indigo-600'
                        }`}>
                          {alert.category === 'documents' ? <FileText className="w-4 h-4" /> : alert.title.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{alert.title}</h4>
                            {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>}
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans block">{alert.time} • {alert.lab}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-sans font-extrabold text-slate-800 text-xs pr-1">{alert.count}</span>
                        <button onClick={() => handleOpenEditModal(alert)} className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 cursor-pointer" title="Edit Alert">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAlert(alert.id, alert.title)} className="p-1 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer" title="Dismiss">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-500 text-xs font-bold">No matching notifications.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSeverityFilter('ALL');
                        setCategories({ documents: true, dnd: true, hardware: true, desktopFleet: true, userLog: true, security: true, network: true });
                        setAlertsList(defaultAlerts);
                      }}
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-bold rounded-lg hover:bg-blue-100 cursor-pointer"
                    >
                      Reset Filters & Restore
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/80">
              <button onClick={handleMarkAllRead} className="py-2 px-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200 transition cursor-pointer text-center">Mark Read</button>
              <button onClick={() => setIsDispatchModalOpen(true)} className="py-2 px-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200 transition cursor-pointer text-center">Dispatch Alert</button>
              <button onClick={() => setSearchQuery('')} className="py-2 px-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] rounded-xl border border-slate-200 transition cursor-pointer text-center">Filter</button>
              <button onClick={() => setIsDispatchModalOpen(true)} className="py-2 px-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px] rounded-xl border border-blue-200 transition cursor-pointer text-center">Broadcast</button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="bg-slate-50/60 p-5 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="border-b border-slate-200/80 pb-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans">
                  Incident Frequency
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                <div>
                  <span className="text-slate-400 block">Peak Release</span>
                  <strong className="text-slate-800 font-bold">95 Alerts</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Average</span>
                  <strong className="text-slate-800 font-bold">42 / hr</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Document Logs</span>
                  <strong className="text-emerald-600 font-bold">100% Synced</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Peak</span>
                  <strong className="text-blue-600 font-bold">{notifSuccess}%</strong>
                </div>
              </div>

              <div className="h-32 w-full bg-white rounded-2xl border border-slate-200/80 p-3 flex items-end justify-between gap-2">
                {barSeries.map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-500/80 hover:bg-blue-600 rounded-t transition-all duration-500" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => setIsDispatchModalOpen(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Trigger Broadcast</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-50/60 p-5 rounded-3xl border border-slate-200/80 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans">
                  Categories
                </h3>
                <Filter className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="space-y-2.5 text-xs font-bold text-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.documents} onChange={() => toggleCat('documents')} className="w-4 h-4 accent-blue-600" />
                  <span className="text-emerald-700 font-extrabold">Document & Report Logs</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.dnd} onChange={() => toggleCat('dnd')} className="w-4 h-4 accent-blue-600" />
                  <span>Trap / DND Alerts</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.hardware} onChange={() => toggleCat('hardware')} className="w-4 h-4 accent-blue-600" />
                  <span>Hardware Faults</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.desktopFleet} onChange={() => toggleCat('desktopFleet')} className="w-4 h-4 accent-blue-600" />
                  <span>Desktop Fleet</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.userLog} onChange={() => toggleCat('userLog')} className="w-4 h-4 accent-blue-600" />
                  <span>User Session Log</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.security} onChange={() => toggleCat('security')} className="w-4 h-4 accent-blue-600" />
                  <span>Security Breaches</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={categories.network} onChange={() => toggleCat('network')} className="w-4 h-4 accent-blue-600" />
                  <span>Network Telemetry</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button onClick={() => setIsDispatchModalOpen(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95">
                <Send className="w-3.5 h-3.5" />
                <span>Start Broadcast</span>
              </button>
              <button onClick={handlePurge} className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 transition cursor-pointer text-center">
                Purge Desk
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* DISPATCH MODAL */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 border-2 border-white ring-4 ring-slate-900/20">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" /> Dispatch System Broadcast
              </h3>
              <button onClick={() => setIsDispatchModalOpen(false)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Alert Title</label>
                <input type="text" value={dispatchTitle} onChange={e => setDispatchTitle(e.target.value)} required placeholder="e.g. Scheduled System Maintenance" className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Severity</label>
                  <select value={dispatchSeverity} onChange={e => setDispatchSeverity(e.target.value as any)} className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none font-bold cursor-pointer">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Category (type or select)</label>
                  <input
                    type="text"
                    list="dispatch-category-list"
                    value={dispatchCategory}
                    onChange={e => setDispatchCategory(e.target.value)}
                    placeholder="e.g. hardware, network"
                    required
                    className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                  <datalist id="dispatch-category-list">
                    <option value="documents">Document Log</option>
                    <option value="dnd">Trap / DND</option>
                    <option value="hardware">Hardware</option>
                    <option value="desktopFleet">Desktop Fleet</option>
                    <option value="userLog">User Session</option>
                    <option value="security">Security</option>
                    <option value="network">Network</option>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-800">Message</label>
                <textarea rows={3} value={dispatchMsg} onChange={e => setDispatchMsg(e.target.value)} required placeholder="Broadcast message content..." className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md">Dispatch</button>
                <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="px-4 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-2xl text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 border-2 border-white ring-4 ring-slate-900/20">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-blue-600">
                <Edit className="w-4 h-4" /> Edit Pending Alert Broadcast
              </h3>
              <button onClick={() => setEditingAlert(null)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            <form onSubmit={handleUpdateAlert} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-800">Alert Title</label>
                <input type="text" value={dispatchTitle} onChange={e => setDispatchTitle(e.target.value)} required className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Severity</label>
                  <select value={dispatchSeverity} onChange={e => setDispatchSeverity(e.target.value as any)} className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none font-bold cursor-pointer">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-800">Category (type or select)</label>
                  <input
                    type="text"
                    list="edit-category-list"
                    value={dispatchCategory}
                    onChange={e => setDispatchCategory(e.target.value)}
                    placeholder="e.g. hardware, network"
                    required
                    className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                  <datalist id="edit-category-list">
                    <option value="documents">Document Log</option>
                    <option value="dnd">Trap / DND</option>
                    <option value="hardware">Hardware</option>
                    <option value="desktopFleet">Desktop Fleet</option>
                    <option value="userLog">User Session</option>
                    <option value="security">Security</option>
                    <option value="network">Network</option>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-800">Target Lab</label>
                <input type="text" value={dispatchTargetLab} onChange={e => setDispatchTargetLab(e.target.value)} required className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-800">Message Content</label>
                <textarea rows={3} value={dispatchMsg} onChange={e => setDispatchMsg(e.target.value)} required className="w-full bg-white text-slate-900 border border-slate-300 p-2.5 rounded-xl outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md">Save Changes</button>
                <button type="button" onClick={() => setEditingAlert(null)} className="px-4 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-2xl text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {selectedAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 border-2 border-white ring-4 ring-slate-900/20">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" /> Alert Details
              </h3>
              <button onClick={() => setSelectedAlertModal(null)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            <div className="space-y-2 text-xs font-sans bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div><span className="text-slate-400">Title:</span> <strong className="text-slate-900">{selectedAlertModal.title}</strong></div>
              <div><span className="text-slate-400">Severity:</span> <strong className="text-blue-600">{selectedAlertModal.severity}</strong></div>
              <div><span className="text-slate-400">Category:</span> <strong className="text-slate-900">{selectedAlertModal.categoryLabel}</strong></div>
              <div><span className="text-slate-400">Target Lab:</span> <strong className="text-slate-900">{selectedAlertModal.lab}</strong></div>
              <div><span className="text-slate-400">Time:</span> <strong className="text-slate-900">{selectedAlertModal.time}</strong></div>
              <div className="pt-2 border-t mt-2"><span className="text-slate-400 block mb-1">Message:</span> <p className="text-slate-800 font-sans">{selectedAlertModal.msg}</p></div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => { handleToggleRead(selectedAlertModal.id); setSelectedAlertModal(null); }} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md">
                {selectedAlertModal.isRead ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button onClick={() => handleDeleteAlert(selectedAlertModal.id, selectedAlertModal.title)} className="px-4 bg-rose-50 text-rose-600 font-bold py-2.5 rounded-2xl text-xs">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NotificationsManagementView;