import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { 
  Activity, TrendingUp, Tv, Calendar, Plus, Menu as MenuIcon, 
  Search, Printer, QrCode, Edit3, Trash2, ShieldAlert, Cpu, HardDrive, 
  Monitor, RefreshCw, X, Building2, User, Clock
} from 'lucide-react';

export interface Workstation {
  id: string;
  lab: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  cpu: string;
  ram: string;
  storage: string;
  ping: string;
  activeUser: string;
  ip: string;
  temp: string;
  power: string;
  score: string;
  scheduleDay?: string;
  scheduleTime?: string;
}

export interface DeskScheduleSlot {
  id: string;
  pcId: string;
  lab?: string;
  user: string;
  day: string;
  time?: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
}

interface AssetsWorkstationDeskViewProps {
  selectedCampus: string;
  campusInfo: any;
  workstations: Workstation[];
  setWorkstations?: React.Dispatch<React.SetStateAction<Workstation[]>>;
  selectedAssetCard: Workstation | null;
  setSelectedAssetCard: (pc: Workstation) => void;
  deskSchedules: DeskScheduleSlot[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setIsAddAssetOpen: (open: boolean) => void;
  setIsQrModalOpen: (open: boolean) => void;
  setIsScheduleModalOpen?: (open: boolean) => void;
  onDrilldown: (info: string) => void;
  triggerNotification: (msg: string) => void;
}

export const AssetsWorkstationDeskView: React.FC<AssetsWorkstationDeskViewProps> = ({
  selectedCampus,
  campusInfo,
  workstations = [],
  setWorkstations,
  selectedAssetCard,
  setSelectedAssetCard,
  deskSchedules = [],
  searchQuery,
  setSearchQuery,
  setIsAddAssetOpen,
  setIsQrModalOpen,
  onDrilldown,
  triggerNotification
}) => {
  const [selectedCalendarDay, setSelectedCalendarDay] = useState('ALL');

  // NOTE: Data comes from props (workstations) - parent AdminDashboardView fetches it
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('ALL');

  // Dynamic Recorded Schedules State
  const [localSchedules, setLocalSchedules] = useState<DeskScheduleSlot[]>([]);

  // ===== SCHEDULE PERSISTENCE: Load from localStorage =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem('labtrack_desk_schedules');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLocalSchedules(parsed as any);
        }
      }
    } catch {}
  }, []);
  // ===== END LOAD =====

  // ===== SCHEDULE PERSISTENCE: Save to localStorage on change =====
  useEffect(() => {
    try {
      if (localSchedules.length > 0) {
        localStorage.setItem('labtrack_desk_schedules', JSON.stringify(localSchedules));
      }
    } catch {}
  }, [localSchedules]);
  // ===== END SAVE =====

  useEffect(() => {
    if (deskSchedules && deskSchedules.length > 0 && localSchedules.length === 0) {
      setLocalSchedules(deskSchedules);
    }
  }, [deskSchedules]);

  // Local CRUD Modal States
  const [editingAsset, setEditingAsset] = useState<Workstation | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);

  // Form State para sa Edit Asset Modal
  const [editNodeId, setEditNodeId] = useState('');
  const [editLab, setEditLab] = useState('');
  const [editStatus, setEditStatus] = useState<'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('OPERATIONAL');
  const [editCpu, setEditCpu] = useState('');
  const [editRam, setEditRam] = useState('');
  const [editStorage, setEditStorage] = useState('');
  const [editActiveUser, setEditActiveUser] = useState('');
  const [editSchedDay, setEditSchedDay] = useState('Mon');
  const [editSchedTime, setEditSchedTime] = useState('08:00 - 10:00 AM');

  // Form State para sa Add Schedule Modal
  const [newSchedPcId, setNewSchedPcId] = useState('');
  const [newSchedLab, setNewSchedLab] = useState('');
  const [newSchedUser, setNewSchedUser] = useState('');
  const [newSchedDay, setNewSchedDay] = useState('Mon');
  const [newSchedTime, setNewSchedTime] = useState('08:00 - 10:00 AM');
  const [newSchedStatus, setNewSchedStatus] = useState<'Approved' | 'Pending' | 'Rejected' | 'In Progress'>('Pending');

  // Inventory Filtering
  const filteredWorkstations = workstations.filter(pc => {
    const query = (searchQuery || '').toLowerCase();
    const pcId = (pc.id || '').toLowerCase();
    const pcLab = (pc.lab || '').toLowerCase();
    const pcUser = (pc.activeUser || '').toLowerCase();
    const pcIp = (pc.ip || '').toLowerCase();

    const matchesSearch = pcId.includes(query) ||
                          pcLab.includes(query) ||
                          pcUser.includes(query) ||
                          pcIp.includes(query);
    const matchesStatus = statusFilter === 'ALL' || pc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open Edit Asset Modal
  const handleOpenEditModal = (pc: Workstation) => {
    setEditingAsset(pc);
    setEditNodeId(pc.id);
    setEditLab(pc.lab);
    setEditStatus(pc.status);
    setEditCpu(pc.cpu);
    setEditRam(pc.ram);
    setEditStorage(pc.storage || '512GB NVMe SSD');
    setEditActiveUser(pc.activeUser || 'None');
    setEditSchedDay(pc.scheduleDay || 'Mon');
    setEditSchedTime(pc.scheduleTime || '08:00 - 10:00 AM');
  };

  // Update Asset Handler
  const handleUpdateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    const formattedNodeId = editNodeId.trim().toUpperCase();
    const formattedLab = editLab.trim();

    const updatedList = workstations.map(pc => {
      if (pc.id === editingAsset.id) {
        return {
          ...pc,
          id: formattedNodeId,
          lab: formattedLab,
          status: editStatus,
          cpu: editCpu,
          ram: editRam,
          storage: editStorage,
          activeUser: editActiveUser,
          scheduleDay: editSchedDay,
          scheduleTime: editSchedTime
        };
      }
      return pc;
    });

    if (setWorkstations) setWorkstations(updatedList);

    // Sync schedule record if exists
    setLocalSchedules(prev => prev.map(s => {
      if (s.pcId === editingAsset.id) {
        return {
          ...s,
          pcId: formattedNodeId,
          user: editActiveUser,
          day: editSchedDay,
          time: editSchedTime
        };
      }
      return s;
    }));

    if (selectedAssetCard?.id === editingAsset.id) {
      setSelectedAssetCard({
        ...selectedAssetCard,
        id: formattedNodeId,
        lab: formattedLab,
        status: editStatus,
        cpu: editCpu,
        ram: editRam,
        storage: editStorage,
        activeUser: editActiveUser,
        scheduleDay: editSchedDay,
        scheduleTime: editSchedTime
      });
    }

    triggerNotification(`Workstation Node ${formattedNodeId} updated successfully.`);
    setEditingAsset(null);
  };

  // Delete Asset Handler
  const handleDeleteAssetConfirm = () => {
    if (!deletingAssetId) return;

    const remaining = workstations.filter(pc => pc.id !== deletingAssetId);
    if (setWorkstations) setWorkstations(remaining);

    // Remove from local schedules
    setLocalSchedules(prev => prev.filter(s => s.pcId !== deletingAssetId));

    triggerNotification(`Workstation ${deletingAssetId} removed from inventory.`);

    if (selectedAssetCard?.id === deletingAssetId && remaining.length > 0) {
      setSelectedAssetCard(remaining[0]);
    }

    setDeletingAssetId(null);
  };

  // Create & Record Schedule Slot Handler
  const handleCreateScheduleSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedPcId.trim() || !newSchedUser.trim()) {
      triggerNotification('Please complete all schedule details!');
      return;
    }
    // Add Schedule: validate + normalize
    const normalizedTime = (newSchedTime || '').trim();
    if (!normalizedTime) {
      triggerNotification('Time slot is required!');
      return;
    }
    const normalizedUser = (newSchedUser || '').trim();
    const normalizedPcId = (newSchedPcId || '').trim().toUpperCase();

    const createdSlot: DeskScheduleSlot = {
      id: `SCH-${Math.floor(1000 + Math.random() * 9000)}`,
      pcId: newSchedPcId.trim().toUpperCase(),
      lab: newSchedLab.trim() || 'ComLab 1 (ICT)',
      user: newSchedUser.trim(),
      day: newSchedDay,
      time: newSchedTime,
      status: newSchedStatus
    };

    setLocalSchedules(prev => [createdSlot, ...prev]);

    // Update matching workstation schedule info if exists
    if (setWorkstations) {
      setWorkstations(prev => prev.map(pc => {
        if (pc.id.toUpperCase() === createdSlot.pcId) {
          return {
            ...pc,
            activeUser: createdSlot.user,
            scheduleDay: createdSlot.day,
            scheduleTime: createdSlot.time
          };
        }
        return pc;
      }));
    }

    setIsAddScheduleModalOpen(false);

    // Reset Form
    setNewSchedPcId('');
    setNewSchedLab('');
    setNewSchedUser('');
    setNewSchedDay('Mon');
    setNewSchedTime('08:00 - 10:00 AM');
    setNewSchedStatus('Pending');

    triggerNotification(`Reservation recorded for ${createdSlot.pcId} on ${createdSlot.day} (${createdSlot.time})!`);
  };

  // Delete Schedule Slot Handler
  const handleDeleteScheduleSlot = (slotId: string, pcId: string) => {
    setLocalSchedules(prev => prev.filter(s => s.id !== slotId));
    triggerNotification(`Schedule slot ${slotId} for ${pcId} removed.`);
  };


  // ===== AUTO-FIX: Fetch workstations =====
  useEffect(() => {
    (async () => {
      try {
        const labResp = await apiClient.get('/api/v1/laboratories');
        const labs = labResp.data?.data?.items || labResp.data?.data || labResp.data || [];
        const labArr = Array.isArray(labs) ? labs : [];
        const all: any[] = [];
        for (const lab of labArr) {
          try {
            const wsResp = await apiClient.get(`/api/v1/laboratories/${lab.id}/workstations`);
            const wss = wsResp.data?.data?.items || wsResp.data?.data || wsResp.data || [];
            for (const w of (Array.isArray(wss) ? wss : [])) {
              all.push({
                id: w.code || w.name || w.id,
                lab: lab.name || 'Unknown',
                status: (w.status || '').toUpperCase().includes('MAINT') ? 'UNDER_MAINTENANCE'
                      : (w.status || '').toUpperCase().includes('OUT') ? 'OUT_OF_ORDER' : 'OPERATIONAL',
                cpu: w.cpuModel || 'N/A', ram: w.ramSize || 'N/A', storage: w.storageSize || 'N/A',
                ping: '0ms', activeUser: 'None', ip: w.ipAddress || 'N/A', temp: 'N/A', power: 'On'
              });
            }
          } catch {}
        }
        if (all.length > 0 && setWorkstations) setWorkstations(all as any);
        console.log('[Assets] loaded', all.length, 'workstations from', labArr.length, 'labs');
      } catch (err) {
        console.warn('[Assets] fetch failed:', (err as any)?.response?.status);
      }
    })();
  }, []);
  // ===== END AUTO-FIX =====

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* DATALISTS */}
      <datalist id="workstation-node-datalist">
        {workstations.map((w) => (
          <option key={w.id} value={w.id}>
 {w.id} {w.lab} ({w.status})
          </option>
        ))}
      </datalist>

      <datalist id="laboratory-location-datalist">
        {campusInfo?.labs?.map((lab: any) => (
          <option key={lab.id || lab.name} value={lab.name} />
        )) || (
          <>
            <option value="ComLab 1 (ICT)" />
            <option value="ComLab 2 (Multimedia)" />
            <option value="ComLab 3 (Engineering)" />
            <option value="Server Room" />
            <option value="Robotics Lab" />
          </>
        )}
      </datalist>

      {/* MAIN CONTAINER */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6 relative">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Monitor className="w-6 h-6 text-blue-600 animate-pulse" />
              <span>Assets / Workstation Desk</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time hardware telemetry, asset CRUD management, and dynamic lab booking schedule for {selectedCampus}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => triggerNotification('Telemetry feeds refreshed.')} 
              className="p-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 hover:rotate-180 transition-all duration-500 cursor-pointer active:scale-95 shadow-xs"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => triggerNotification('Workstation desk view active')} 
              className="p-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* WORKSTATION CARDS & SCHEDULE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Workstation Nodes */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Featured Workstation Nodes</span>
            {workstations.slice(0, 3).map((pc, idx) => (
              <div 
                key={pc.id} 
                onClick={() => setSelectedAssetCard(pc)}
                className={`p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-between gap-3 ${
                  selectedAssetCard?.id === pc.id 
                    ? 'bg-blue-50/80 border-blue-400 shadow-md ring-2 ring-blue-400/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-blue-600 transition-transform duration-300 hover:scale-110">
                    {idx === 0 && <Activity className="w-6 h-6" />}
                    {idx === 1 && <TrendingUp className="w-6 h-6 text-emerald-600" />}
                    {idx === 2 && <Tv className="w-6 h-6 text-indigo-600" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm font-sans">{pc.id}</h4>
                      <span className="text-[10px] text-slate-400 font-bold">({pc.lab})</span>
                    </div>
                    <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: pc.score || '85%' }}
                      ></div>
                    </div>
 <span className="text-[10px] text-slate-500 block font-sans">CPU: {pc.cpu} RAM: {pc.ram}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white font-sans font-bold text-[10px] rounded-full shadow-xs">
                    +{pc.score || '85%'}
                  </span>
 <span className="text-[10px] font-bold text-emerald-600 font-sans">{pc.temp || '42C'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Calendar Box */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 space-y-4 relative flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:shadow-md">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-xs text-slate-900">Workstation Reservation Schedule</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {localSchedules.length} Recorded
                </span>
              </div>
            </div>

            {/* Days Filter Tabs */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold">
              <button
                onClick={() => setSelectedCalendarDay('ALL')}
                className={`py-1.5 rounded-xl transition-all duration-200 cursor-pointer font-sans active:scale-95 ${
                  selectedCalendarDay === 'ALL' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                All
              </button>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedCalendarDay(day)}
                  className={`py-1.5 rounded-xl transition-all duration-200 cursor-pointer font-sans active:scale-95 ${
                    selectedCalendarDay === day 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Calendar Grid Display */}
            <div className="grid grid-cols-6 gap-2 h-44 border border-slate-200 rounded-2xl bg-slate-50/50 p-2 shadow-inner overflow-hidden">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                const daySlots = localSchedules.filter(s => s.day === day);
                return (
                  <div key={day} className="border-r border-slate-200/60 last:border-none p-1 space-y-1.5 overflow-y-auto">
                    <span className="text-[9px] font-extrabold text-slate-400 block text-center uppercase tracking-wider font-sans">{day}</span>
                    {daySlots.length > 0 ? (
                      daySlots.map(slot => (
                        <div 
                          key={slot.id} 
                          className={`p-1.5 rounded-xl text-[9px] font-sans font-bold leading-tight transition-all duration-200 hover:scale-105 relative group shadow-xs ${
                            slot.status === 'Approved' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : slot.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : slot.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{slot.pcId}</span>
                            <button 
                              onClick={() => handleDeleteScheduleSlot(slot.id, slot.pcId)}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 transition cursor-pointer"
                              title="Delete Schedule"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <div className="text-[8px] font-normal truncate mt-0.5 text-slate-600">{slot.user}</div>
                          {slot.time && <div className="text-[7.5px] font-semibold text-blue-600 mt-0.5">{slot.time}</div>}
                        </div>
                      ))
                    ) : (
                      <div className="h-28 flex items-center justify-center text-[9px] text-slate-300 font-sans ">
                        Free
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADD SCHEDULE BUTTON & METRICS */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-sans font-semibold">
                  Showing: {selectedCalendarDay === 'ALL' ? 'All Days' : `${selectedCalendarDay} Only`} ({localSchedules.length} slots)
                </span>
              </div>
              <button 
                onClick={() => setIsAddScheduleModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add Schedule
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH, FILTERS & WORKSTATION INVENTORY TABLE (EXACT MATCH IN SCREENSHOT WITH INTEGRATED SCHEDULE) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Live Search Input */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 flex-1 focus-within:border-blue-500 transition-colors shadow-xs">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input 
                type="text" 
                placeholder="Search Workstation Tag, Laboratory, IP Address, or Active User..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold outline-none w-full text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Status Filters */}
            <div className="flex items-center bg-slate-50 p-1 rounded-2xl text-[11px] font-bold border border-slate-200">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({workstations.length})
              </button>
              <button
                onClick={() => setStatusFilter('OPERATIONAL')}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${statusFilter === 'OPERATIONAL' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Operational
              </button>
              <button
                onClick={() => setStatusFilter('UNDER_MAINTENANCE')}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${statusFilter === 'UNDER_MAINTENANCE' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Maintenance
              </button>
              <button
                onClick={() => setStatusFilter('OUT_OF_ORDER')}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${statusFilter === 'OUT_OF_ORDER' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Out of Order
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAddAssetOpen(true)} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register Asset
              </button>
              <button 
                onClick={() => setIsQrModalOpen(true)} 
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200 active:scale-95 flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4 text-blue-600" /> Print QR Tags
              </button>
            </div>
          </div>

          {/* Inventory Table with Direct Schedule Integration */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">ASSET TAG / NODE</th>
                  <th className="p-3.5">ASSIGNED LAB</th>
                  <th className="p-3.5">IP ADDRESS</th>
                  <th className="p-3.5">SPECS (CPU / RAM)</th>
                  <th className="p-3.5">STATUS</th>
                  <th className="p-3.5">ACTIVE USER</th>
                  <th className="p-3.5">SCHEDULE SLOT</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {filteredWorkstations.length > 0 ? (
                  filteredWorkstations.map(pc => {
                    const matchedSched = localSchedules.find(s => s.pcId.toUpperCase() === pc.id.toUpperCase());
                    return (
                      <tr 
                        key={pc.id} 
                        className={`hover:bg-slate-50/80 transition-all duration-200 cursor-pointer ${selectedAssetCard?.id === pc.id ? 'bg-blue-50/40' : ''}`} 
                        onClick={() => setSelectedAssetCard(pc)}
                      >
                        <td className="p-3.5 font-bold font-sans text-blue-600 flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{pc.id}</span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{pc.lab}</td>
                        <td className="p-3.5 font-sans text-slate-500">{pc.ip}</td>
                        <td className="p-3.5 font-sans text-slate-600">{pc.cpu} / {pc.ram}</td>
                        <td className="p-3.5">
                          {pc.status === 'OPERATIONAL' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full font-bold text-[10px]">
                              Operational
                            </span>
                          )}
                          {pc.status === 'UNDER_MAINTENANCE' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-bold text-[10px]">
                              Maintenance
                            </span>
                          )}
                          {pc.status === 'OUT_OF_ORDER' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full font-bold text-[10px]">
                              Out of Order
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-700 font-bold">{pc.activeUser || 'None'}</td>
                        <td className="p-3.5 font-sans">
                          {matchedSched || pc.scheduleDay ? (
                            <span className="text-slate-800 font-bold text-[11px] block">
                              {matchedSched?.day || pc.scheduleDay} ({matchedSched?.time || pc.scheduleTime || '08:00 - 10:00 AM'})
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[11px]">Unscheduled</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => onDrilldown(`Timeline for ${pc.id}: Provisioned Oct 2025. Health Score: ${pc.score || '90%'}. IP: ${pc.ip}`)} 
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition-all cursor-pointer active:scale-95"
                              title="Inspect Details"
                            >
                              Inspect
                            </button>
                            <button 
                              onClick={() => handleOpenEditModal(pc)} 
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer active:scale-95"
                              title="Edit Workstation & Schedule"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeletingAssetId(pc.id)} 
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer active:scale-95"
                              title="Delete Asset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-medium ">
                      No workstations found matching your query or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: EDIT WORKSTATION & SCHEDULE METADATA */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Workstation & Schedule</span>
              </h3>
              <button onClick={() => setEditingAsset(null)} className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" /> Workstation Node Tag
                </label>
                <input 
                  type="text" 
                  list="workstation-node-datalist"
                  value={editNodeId} 
                  onChange={(e) => setEditNodeId(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. PC-001"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Assigned Laboratory
                </label>
                <input 
                  type="text" 
                  list="laboratory-location-datalist"
                  value={editLab} 
                  onChange={(e) => setEditLab(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. ComLab 1 (ICT)"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Active User / Assigned Class
                </label>
                <input 
                  type="text" 
                  value={editActiveUser} 
                  onChange={(e) => setEditActiveUser(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. Student Name or CS-101"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Schedule Day</label>
                  <select 
                    value={editSchedDay} 
                    onChange={(e) => setEditSchedDay(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Schedule Time Slot</label>
                  <select 
                    value={editSchedTime} 
                    onChange={(e) => setEditSchedTime(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="08:00 - 10:00 AM">08:00 - 10:00 AM</option>
                    <option value="10:00 - 12:00 PM">10:00 - 12:00 PM</option>
                    <option value="01:00 - 03:00 PM">01:00 - 03:00 PM</option>
                    <option value="03:00 - 05:00 PM">03:00 - 05:00 PM</option>
                    <option value="05:00 - 07:00 PM">05:00 - 07:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e: any) => setEditStatus(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                >
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                  <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" /> CPU Spec
                  </label>
                  <input 
                    type="text" 
                    value={editCpu} 
                    onChange={(e) => setEditCpu(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RAM Capacity</label>
                  <input 
                    type="text" 
                    value={editRam} 
                    onChange={(e) => setEditRam(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" /> Storage Drive
                </label>
                <input 
                  type="text" 
                  value={editStorage} 
                  onChange={(e) => setEditStorage(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingAsset(null)} 
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE ASSET */}
      {deletingAssetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Delete Workstation Node {deletingAssetId}?</h3>
              <p className="text-xs text-slate-500 mt-1">This action cannot be undone. All telemetry metrics for this unit will be permanently removed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingAssetId(null)} 
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAssetConfirm} 
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD SCHEDULE SLOT */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Add Reservation / Schedule Slot</span>
              </h3>
              <button 
                onClick={() => setIsAddScheduleModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateScheduleSlot} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" /> Workstation Node Tag
                </label>
                <input 
                  type="text" 
                  list="workstation-node-datalist"
                  value={newSchedPcId} 
                  onChange={(e) => setNewSchedPcId(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. PC-001"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Assigned Laboratory
                </label>
                <input 
                  type="text" 
                  list="laboratory-location-datalist"
                  value={newSchedLab} 
                  onChange={(e) => setNewSchedLab(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. ComLab 1 (ICT)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> User / Class / Reservation Name
                </label>
                <input 
                  type="text" 
                  value={newSchedUser} 
                  onChange={(e) => setNewSchedUser(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  placeholder="e.g. CS-101 Lab Class or Staff Name"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select 
                    value={newSchedDay} 
                    onChange={(e) => setNewSchedDay(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    list="sched-time-datalist"
                    value={newSchedTime}
                    onChange={(e) => setNewSchedTime(e.target.value)}
                    placeholder="e.g. 08:00 - 10:00 AM or 07:30 - 09:30"
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs"
                    required
                  />
                  <datalist id="sched-time-datalist">
                    <option value="08:00 - 10:00 AM" />
                    <option value="10:00 - 12:00 PM" />
                    <option value="01:00 - 03:00 PM" />
                    <option value="03:00 - 05:00 PM" />
                    <option value="05:00 - 07:00 PM" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slot Status</label>
                <select 
                    value={newSchedStatus} 
                    onChange={(e: any) => setNewSchedStatus(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="In Progress">In Progress</option>
                  </select>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddScheduleModalOpen(false)} 
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95"
                >
                  Record Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssetsWorkstationDeskView;