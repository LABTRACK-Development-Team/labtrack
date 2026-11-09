import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wrench, Calendar, Clock, DollarSign, CheckCircle2, AlertCircle, 
  ChevronRight, Plus, Download, RefreshCw, X, Search, Filter,
  ShieldCheck, Cpu, HardDrive, Sparkles, Check, Trash2, ChevronLeft,
  Activity, Layers, Zap, ShieldAlert, CheckSquare, Bell, Edit3, Eye
} from 'lucide-react';

interface MaintenanceViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  lab: string;
  category: 'PREVENTIVE' | 'SOFTWARE' | 'HARDWARE' | 'CLEANING' | 'INSPECTION';
  scheduledDate: string; // YYYY-MM-DD
  cost: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  color: string;
  notes?: string;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  // Calendar Navigation State
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date(2026, 9, 1)); // October 2026
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-28');
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [inspectingTask, setInspectingTask] = useState<MaintenanceTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form State for New Task (Wala nang technician field)
  const [newTask, setNewTask] = useState<{
    title: string;
    lab: string;
    category: MaintenanceTask['category'];
    scheduledDate: string;
    cost: number;
    notes: string;
  }>({
    title: '',
    lab: '',
    category: 'PREVENTIVE',
    scheduledDate: '2026-10-29',
    cost: 1500,
    notes: ''
  });
  const [newTaskPcRange, setNewTaskPcRange] = useState<string>('');

  // Maintenance Tasks Ledger Data
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/maintenance/records');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Animated Ticker
  const [pulseActive, setPulseActive] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setPulseActive(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  // Computed Financials & Stats
  const totalCost = useMemo(() => tasks.reduce((sum, t) => sum + t.cost, 0), [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'COMPLETED').length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter(t => t.status !== 'COMPLETED').length, [tasks]);
  const hardwareCost = useMemo(() => tasks.filter(t => t.category === 'HARDWARE' || t.category === 'INSPECTION').reduce((s, t) => s + t.cost, 0), [tasks]);
  const cleaningCost = useMemo(() => tasks.filter(t => t.category === 'CLEANING').reduce((s, t) => s + t.cost, 0), [tasks]);
  const softwareCost = useMemo(() => tasks.filter(t => t.category === 'SOFTWARE' || t.category === 'PREVENTIVE').reduce((s, t) => s + t.cost, 0), [tasks]);

  // Calendar Days Calculation Engine
  const calendarDays = useMemo(() => {
    const year = activeMonthDate.getFullYear();
    const month = activeMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = [];
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      daysArray.push({
        dayNumber: day,
        dateString: `${year}-${monthStr}-${dayStr}`
      });
    }
    return daysArray;
  }, [activeMonthDate]);

  const currentMonthYearHeader = useMemo(() => {
    return activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [activeMonthDate]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = (t.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.lab || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.id || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchQuery, categoryFilter, statusFilter]);

  // --- CRUD ACTIONS --- //

  // 1. Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.lab.trim()) {
      onTriggerNotification('Paki-kumpleto ang lahat ng kinakailangang field!');
      return;
    }

    const created: MaintenanceTask = {
      id: `MNT-${Math.floor(106 + Math.random() * 900)}`,
      title: newTask.title.trim(),
      lab: newTaskPcRange.trim(),
      category: newTask.category,
      scheduledDate: newTask.scheduledDate,
      cost: Number(newTask.cost) || 1000,
      status: 'PENDING',
      color: newTask.category === 'HARDWARE' ? 'bg-amber-500' : newTask.category === 'CLEANING' ? 'bg-emerald-500' : 'bg-blue-500',
      notes: newTask.notes
    };

    setTasks(prev => [created, ...prev]);
    // Persist to backend
    apiClient.post('/api/v1/maintenance/records', {
      Title: created.title,
      Lab: created.lab,
      Category: created.category,
      Notes: created.notes || '',
      Cost: created.cost,
      ScheduledDate: created.scheduledDate,
      Status: 'PENDING'
    }).then((r: any) => console.log('[Maintenance] Saved:', r.data))
      .catch((err: any) => console.error('[Maintenance] Failed:', err?.response?.data || err?.message));
    setIsAddModalOpen(false);
    setNewTaskPcRange(''); setNewTask({ title: '', lab: '', category: 'PREVENTIVE', scheduledDate: '2026-10-29', cost: 1500, notes: '' });
    onTriggerNotification(`Naiidagdag ang Maintenance Task ${created.id} sa iskedyul!`);
  };

  // 2. Update Task
  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    onTriggerNotification(`Na-update ang Maintenance Task ${editingTask.id}!`);
    setEditingTask(null);
  };

  // 3. Toggle Status
  const handleToggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        onTriggerNotification(`Nabagong status ng Task ${id} sa ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // 4. Delete Task
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setDeletingTaskId(null);
    onTriggerNotification(`Naalis na ang Maintenance Task ${id}.`);
  };

  // 5. CSV Exporter
  const handleExportCsv = () => {
    const csvRows = [
      ['Task ID', 'Title', 'Laboratory', 'Category', 'Scheduled Date', 'Cost (PHP)', 'Status', 'Notes'],
      ...tasks.map(t => [t.id, `"${t.title}"`, `"${t.lab}"`, t.category, t.scheduledDate, t.cost, t.status, `"${t.notes || ''}"`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JRMSU_Maintenance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerNotification('Nai-export na ang Maintenance Ledger sa CSV!');
  };

  // Month Navigation
  const handlePrevMonth = () => {
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setActiveMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 animate-in fade-in duration-300 font-sans">

      {/* DUAL-MODE DATALIST ONLY FOR LAB LOCATION */}
      <datalist id="mnt-lab-list">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
        <option value="Server Room" />
        <option value="Robotics Lab" />
        <option value="Multimedia Lab" />
      </datalist>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
            <Wrench className="w-6 h-6 animate-spin duration-3000" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Maintenance & Preventive Schedule</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold transition-all duration-500 ${
                pulseActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800'
              }`}>
                 Live Synchronized
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Laboratory Preventive Tasks, Equipment Servicing Calendar & Budget Ledger  {campusName}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Maintenance Schedule</span>
        </button>
      </div>

      {/* MAIN 3-COLUMN MATRIX LAYOUT */}
      <div className="bg-slate-50/70 p-5 sm:p-6 rounded-[2rem] border border-slate-200/80 space-y-5 shadow-inner">
        
        {/* SUB-FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            {['ALL', 'PREVENTIVE', 'SOFTWARE', 'HARDWARE', 'CLEANING', 'INSPECTION'].map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl transition cursor-pointer active:scale-95 ${
                  categoryFilter === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <button 
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Log (CSV)</span>
          </button>
        </div>

        {/* 3 COLUMNS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* LEFT COLUMN: TASK LIST (4 COLS) */}
          <div className="lg:col-span-4 bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Scheduled Tasks</span>
              <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">{filteredTasks.length} Tasks</span>
            </div>
            
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedDate(task.scheduledDate)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
                      selectedDate === task.scheduledDate ? 'bg-blue-50/90 border-blue-300 shadow-md ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-extrabold text-slate-900 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ${task.color} shadow-xs`}></span>
                        <span className="truncate max-w-[150px]">{task.title}</span>
                      </span>
                      <span className="font-sans text-[10px] bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 font-bold">{task.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-0.5">
                      <span className="text-slate-700 font-bold">{task.lab}</span>
                      <span className="font-sans font-bold text-blue-600">{task.cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="font-sans font-bold uppercase text-slate-500">{task.category}</span>
                      <span className="font-sans">{task.scheduledDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">Walang nahanap na maintenance task.</div>
              )}
            </div>
          </div>

          {/* CENTER COLUMN: DYNAMIC CALENDAR GRID (5 COLS) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Interactive Servicing Calendar</span>
                <h4 className="text-base font-black text-slate-900 font-sans">{currentMonthYearHeader}</h4>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-lg cursor-pointer transition shadow-2xs" title="Previous Month">
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-lg cursor-pointer transition shadow-2xs" title="Next Month">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* MONTH DAYS GRID */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-sans font-bold">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <span key={i} className="text-[10px] text-slate-400 py-1 uppercase">{day}</span>
              ))}

              {calendarDays.map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="py-2.5"></div>;
                }

                const { dayNumber, dateString } = item;
                const dayTasks = tasks.filter(t => t.scheduledDate === dateString);
                const hasTask = dayTasks.length > 0;
                const isSelected = selectedDate === dateString;

                return (
                  <button
                    key={dateString}
                    onClick={() => setSelectedDate(dateString)}
                    className={`py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer relative group flex flex-col items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 z-10' 
                        : hasTask 
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{dayNumber}</span>
                    {hasTask && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-rose-500 animate-pulse'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>Selected Date: <strong className="font-sans text-slate-900">{selectedDate}</strong></span>
              <span className="text-blue-600 font-bold">{tasks.filter(t => t.scheduledDate === selectedDate).length} Scheduled Tasks</span>
            </div>
          </div>

          {/* RIGHT COLUMN: BUDGET & LEDGER (3 COLS) */}
          <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between min-h-[340px]">
            <div className="space-y-3.5">
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Fund Budget Ledger</span>

              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allocated Maintenance</span>
                <p className="text-2xl font-black text-emerald-400 font-sans">{totalCost.toLocaleString()}</p>
                <div className="flex justify-between text-[10px] text-slate-300 font-sans pt-1">
                  <span>{completedCount} Completed</span>
                  <span className="text-amber-400">{pendingCount} Pending</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600">Hardware & Parts</span>
                  <span className="font-sans text-rose-600 font-bold">{hardwareCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600">Routine Cleaning</span>
                  <span className="font-sans text-emerald-600 font-bold">{cleaningCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-slate-600">Software & Preventive</span>
                  <span className="font-sans text-blue-600 font-bold">{softwareCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onTriggerNotification('Nai-log na ang maintenance action sa system audit trail nang matagumpay.')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log Confirmation</span>
            </button>
          </div>

        </div>

      </div>

      {/* WORK ORDERS LEDGER TABLE */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3.5">
          <div>
            <span className="text-[10px] font-sans font-bold text-blue-600 uppercase">Work Orders Table</span>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Scheduled Work Orders Ledger & Status</span>
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search Task, Lab, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none w-48 sm:w-56 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b">
              <tr>
                <th className="p-3.5 rounded-l-xl">Task ID</th>
                <th className="p-3.5">Title & Category</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">PC Range / Workstations</th>
                <th className="p-3.5">Scheduled Date</th>
                <th className="p-3.5 text-right">Cost</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-blue-600">{t.id}</td>
                    <td className="p-3.5 font-sans">
                      <div className="font-extrabold text-slate-900">{t.title}</div>
                      <span className="text-[10px] text-slate-400 font-sans uppercase">{t.category}</span>
                    </td>
                    <td className="p-3.5 font-sans font-bold text-slate-700 font-mono text-xs">{t.lab}</td>
                    <td className="p-3.5 text-slate-600">{t.scheduledDate}</td>
                    <td className="p-3.5 text-right font-bold text-slate-900">{t.cost.toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectingTask(t)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTask(t)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t.id)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                          title="Toggle Completion Status"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTaskId(t.id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-sans ">
                    Walang nahanap na maintenance schedule batay sa iyong filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD TASK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Maintenance Schedule Task</span>
              </h4>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1.5 text-sm font-black text-slate-900">PC Range / Workstations</label>
                  <input
                    type="text"
                    value={newTaskPcRange}
                    onChange={(e) => setNewTaskPcRange(e.target.value)}
                    placeholder="e.g. PC-01 to PC-100, or PC-01, or PC-01,PC-02"
                    className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-sans text-black font-bold text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 placeholder:font-normal bg-white"
                    required
                  />
                </div>
              <div>
                <label className="block mb-1">Task Title / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Deep Cleaning & Thermal Paste"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* DUAL MODE LAB LOCATION FIELD ONLY */}
                <div>
                  <label className="block mb-1">Lab Location (Select / Type)</label>
                  <input 
                    type="text"
                    list="mnt-lab-list"
                    placeholder="e.g. ComLab 1 (ICT)"
                    value={newTask.lab}
                    onChange={(e) => setNewTask({ ...newTask, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => { const cat = e.target.value as MaintenanceTask['category']; setNewTask({ ...newTask, category: cat, cost: cat === 'CLEANING' ? 0 : newTask.cost }); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CLEANING">CLEANING</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Scheduled Date</label>
                  <input 
                    type="date" 
                    value={newTask.scheduledDate}
                    onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Estimated Cost ()</label>
                  <input 
                    type="number" 
                    value={newTask.cost}
                    onChange={(e) => setNewTask({ ...newTask, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Additional Notes</label>
                <textarea 
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Optional details or maintenance instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-normal h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TASK */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Task ({editingTask.id})</span>
              </h4>
              <button onClick={() => setEditingTask(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* DUAL MODE LAB LOCATION FIELD ONLY IN EDIT */}
                <div>
                  <label className="block mb-1">Lab Location (Select / Type)</label>
                  <input 
                    type="text"
                    list="mnt-lab-list"
                    value={editingTask.lab}
                    onChange={(e) => setEditingTask({ ...editingTask, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PREVENTIVE">PREVENTIVE</option>
                    <option value="CLEANING">CLEANING</option>
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Scheduled Date</label>
                  <input 
                    type="date" 
                    value={editingTask.scheduledDate}
                    onChange={(e) => setEditingTask({ ...editingTask, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Cost ()</label>
                <input 
                  type="number" 
                  value={editingTask.cost}
                  onChange={(e) => setEditingTask({ ...editingTask, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INSPECT TASK DETAILS */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" /> Task Details ({inspectingTask.id})
              </h4>
              <button onClick={() => setInspectingTask(null)} className="cursor-pointer text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 font-sans">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400 font-sans">Task Name:</span>
                <strong className="text-slate-900 font-sans">{inspectingTask.title}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400 font-sans">Facility:</span>
                <strong className="text-blue-600 font-sans">{inspectingTask.lab}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400 font-sans">Category:</span>
                <strong className="text-slate-800">{inspectingTask.category}</strong>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400 font-sans">Cost:</span>
                <strong className="text-emerald-600">{inspectingTask.cost.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Status:</span>
                <strong className="text-amber-600">{inspectingTask.status}</strong>
              </div>
            </div>

            <button onClick={() => setInspectingTask(null)} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md cursor-pointer">
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">Delete Maintenance Task?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete maintenance order <strong className="text-slate-900">{deletingTaskId}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeletingTaskId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteTask(deletingTaskId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaintenanceView;
