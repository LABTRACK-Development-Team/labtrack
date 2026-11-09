import apiClient from '@/lib/api-client';
import React, { useEffect,  useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle2, 
  XCircle, AlertCircle, Plus, Search, Filter, Trash2, Edit3, X, 
  ChevronLeft, ChevronRight, Check, FileText, Activity, ShieldAlert,
  Tag, Layers, Sparkles, Grid, List, RefreshCw
} from 'lucide-react';

export interface ReservationItem {
  id: string;
  title: string;
  labRoom: string;
  reservedBy: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'In Progress';
  pcsReserved: number;
}

export const ReservationsView: React.FC = () => {
  // Filter & Search States
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'Calendar' | 'Agenda'>('Calendar');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [inspectReservation, setInspectReservation] = useState<ReservationItem | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Custom Centered Delete Modal State
  const [reservationToDelete, setReservationToDelete] = useState<ReservationItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Input States for Adding Reservation
  const [newTitle, setNewTitle] = useState<string>('');
  const [newLabRoom, setNewLabRoom] = useState<string>('ComLab 1 (Networking)');
  const [newReservedBy, setNewReservedBy] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState<string>('08:00 AM');
  const [newEndTime, setNewEndTime] = useState<string>('10:00 AM');
  const [newPurpose, setNewPurpose] = useState<string>('CS 101 Hands-on Laboratory Class');
  const [newPcsReserved, setNewPcsReserved] = useState<number>(30);

  // Initial Sample Reservations Data
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // âœ… DYNAMIC LABS FROM API
  const [labs, setLabs] = useState<any[]>([]);

  // âœ… LIVE CLOCK
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await apiClient.get('/api/v1/laboratories');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        const arr = Array.isArray(data) ? data : [];
        console.log('[Reservations] Labs loaded:', arr.length, arr.map((l: any) => l.labName || l.name));
        setLabs(arr);
      } catch (err) {
        console.error('Fetch labs failed:', err);
      }
    };
    fetchLabs();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/reservations');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Active Laboratory Tag Filters — dynamic from API
  const [labTags, setLabTags] = useState<{ id: string; name: string; active: boolean }[]>([]);

  // Sync labTags whenever labs change
  useEffect(() => {
    if (labs.length > 0) {
      setLabTags(prev => labs.map(lab => {
        const labName = lab.labName || lab.name || 'Unknown Lab';
        const existing = prev.find(t => t.id === lab.id);
        return {
          id: lab.id,
          name: labName,
          active: existing ? existing.active : true
        };
      }));
    }
  }, [labs]);

  const toggleTag = (id: string) => {
    setLabTags(labTags.map(tag => tag.id === id ? { ...tag, active: !tag.active } : tag));
  };

  // Filtered Reservations List
  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      const matchesLab = !selectedLabFilter.trim() || (item.labRoom || "").toLowerCase().includes((selectedLabFilter || "").toLowerCase().trim());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDate = !selectedDateFilter || item.date === selectedDateFilter;
      const matchesSearch = (item.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (item.reservedBy || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (item.labRoom || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      return matchesLab && matchesStatus && matchesSearch && matchesDate;
    });
  }, [reservations, selectedLabFilter, statusFilter, searchQuery, selectedDateFilter]);

  // CRUD: CREATE
    const parseTimeTo24 = (timeStr: string): string => {
    const parts = timeStr.trim().split(' ');
    const timePart = parts[0];
    const period = (parts[1] || 'AM').toUpperCase();
    const [h, m] = timePart.split(':').map(Number);
    let hour24 = h;
    if (period === 'PM' && h !== 12) hour24 = h + 12;
    if (period === 'AM' && h === 12) hour24 = 0;
    return String(hour24).padStart(2, '0') + ':' + String(m || 0).padStart(2, '0') + ':00';
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReservedBy.trim()) return;

    const startDateTime = newDate + 'T' + parseTimeTo24(newStartTime);
    const endDateTime = newDate + 'T' + parseTimeTo24(newEndTime);

    const matchedLab = labs.find((l: any) => {
      const labName = (l.name || l.labName || l.code || '').toString().trim().toLowerCase();
      const target = newLabRoom.trim().toLowerCase();
      return labName === target || labName.includes(target) || target.includes(labName);
    });
    const matchedLabId = matchedLab?.id || matchedLab?.labId || matchedLab?.Id || null;

    const newItem: ReservationItem = {
      id: 'res-' + Date.now(),
      title: newTitle.trim(),
      labRoom: newLabRoom.trim(),
      reservedBy: newReservedBy.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      purpose: newPurpose,
      status: 'Pending',
      pcsReserved: Number(newPcsReserved)
    };

    setReservations([newItem, ...reservations]);
    setNewTitle('');
    setNewReservedBy('');
    setIsAddModalOpen(false);

    if (!matchedLabId) {
      console.warn('[Reservations] Lab not matched:', newLabRoom, '- Available:', labs.map((l: any) => l.name || l.labName));
      return;
    }

    try {
      const resp = await apiClient.post('/api/v1/reservations', {
        labId: matchedLabId,
        purpose: newTitle.trim() + ' - ' + newPurpose,
        startTime: startDateTime,
        endTime: endDateTime
      });
      console.log('[Reservations] âœ… Saved to backend:', resp.data);
    } catch (err: any) {
      console.error('[Reservations] âŒ Backend save failed:', err?.response?.data || err?.message || err);
    }
  };

  // CRUD: UPDATE
  const handleSaveEdit = () => {
    if (!inspectReservation) return;
    setReservations(reservations.map(r => r.id === inspectReservation.id ? inspectReservation : r));
    setIsEditing(false);
  };

  const handleUpdateStatus = (id: string, newStatus: ReservationItem['status']) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (inspectReservation?.id === id) {
      setInspectReservation({ ...inspectReservation, status: newStatus });
    }
  };

  // CRUD: DELETE (Custom Modal Trigger & Smooth Removal)
  const handleConfirmDelete = () => {
    if (!reservationToDelete) return;
    const id = reservationToDelete.id;
    setDeletingId(id);
    setReservationToDelete(null);

    setTimeout(() => {
      setReservations((prev) => prev.filter((r) => r.id !== id));
      if (inspectReservation?.id === id) setInspectReservation(null);
      setDeletingId(null);
    }, 400);
  };

  // Days Grid Generator for Interactive Calendar Grid View
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayReservations = reservations.filter(r => r.date === formattedDate);
      return { dayNum, formattedDate, count: dayReservations.length, hasReservation: dayReservations.length > 0 };
    });
  }, [reservations]);

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">
      
      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY — dynamic from API */}
      <datalist id="lab-room-suggestions">
        {labs.map(lab => (
          <option key={lab.id} value={lab.labName || lab.name || ''} />
        ))}
      </datalist>

      {/* HEADER BAR & SYSTEM CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#1e5352]" />
            Lab Reservations & Schedules
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#1e5352]" /> JRMSU Laboratory Management System
            </span>
 <span> - </span>
            <span className="text-emerald-600 font-bold font-sans">Live Sync Active</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveViewTab('Calendar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'Calendar' ? 'bg-[#1e5352] text-white font-bold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Calendar Grid</span>
            </button>
            <button
              onClick={() => setActiveViewTab('Agenda')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'Agenda' ? 'bg-[#1e5352] text-white font-bold shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda List</span>
            </button>
          </div>

          {/* Add Reservation Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: TODAY'S RESERVATIONS & METRICS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Today's Lab Overview</h2>
                <p className="text-xs text-slate-400 font-medium">Active schedules and room readiness status</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-sans font-bold">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

                        {/* Metric Cards Grid — DYNAMIC from labs API */}
            <div className="grid grid-cols-2 gap-3">
              {labs.length > 0 ? labs.slice(0, 4).map((lab) => {
                const labName = lab.labName || lab.name || 'Unknown Lab';
                const labCapacity = lab.capacity || 0;
                const labStatus = (lab.status || 'Inactive').toLowerCase();
                const isActive = labStatus === 'active';

                const todayStr = new Date().toISOString().split('T')[0];
                const todayRes = reservations.filter(r =>
                  (r.labRoom === labName || r.laboratoryName === labName || r.lab === labName) &&
                  (r.date === todayStr || (r.startTimeUtc && r.startTimeUtc.startsWith(todayStr)))
                );
                const nextRes = todayRes[0];

                const statusBadge = isActive
                  ? { text: 'Active', color: 'bg-emerald-500' }
                  : { text: 'Inactive', color: 'bg-slate-500' };

                return (
                  <div key={lab.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 hover:border-[#1e5352] transition">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate max-w-[100px]" title={labName}>
                        {labName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 truncate" title={nextRes?.title || ''}>
                        {nextRes ? (nextRes.title || 'Reservation') : 'No reservations today'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {nextRes
                          ? `${nextRes.startTime || (nextRes.startTimeUtc ? new Date(nextRes.startTimeUtc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--')} - ${nextRes.endTime || (nextRes.endTimeUtc ? new Date(nextRes.endTimeUtc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--')}`
                          : 'Available all day'}
                      </p>
                    </div>
                    <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-600 font-sans">
                      <span>{labCapacity} PCs</span>
                      <span className={nextRes ? 'text-blue-600 font-bold' : (isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 font-bold')}>
                        {nextRes ? (nextRes.status || 'Scheduled') : (isActive ? 'Ready' : 'Offline')}
                      </span>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-2 flex items-center justify-center py-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing laboratory data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Metrics Row */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-800">Approved</p>
                <p className="text-base font-black text-emerald-700 font-sans">
                  {reservations.filter(r => r.status === 'Approved' || r.status === 'In Progress').length}
                </p>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-800">Pending</p>
                <p className="text-base font-black text-amber-700 font-sans">
                  {reservations.filter(r => r.status === 'Pending').length}
                </p>
              </div>

              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-[10px] font-bold text-rose-800">Rejected</p>
                <p className="text-base font-black text-rose-700 font-sans">
                  {reservations.filter(r => r.status === 'Rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CALENDAR & AGENDA SCHEDULER (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
            
            {/* Header Controls & Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Calendar + Agenda</h2>
                <p className="text-xs text-slate-400 font-medium">Interactive timetable and laboratory room reservations</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search schedule..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  />
                </div>

                {/* DUAL INPUT FOR FILTERING LABS */}
                <div className="relative">
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Filter by Lab..."
                    value={selectedLabFilter}
                    onChange={(e) => setSelectedLabFilter(e.target.value)}
                    className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none w-36"
                  />
                  {selectedLabFilter && (
                    <button 
                      onClick={() => setSelectedLabFilter('')} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* Room Tags */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Labs:</span>
              {labTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                    tag.active 
                      ? 'bg-[#1e5352] text-white border-[#1e5352] shadow-2xs' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{tag.name}</span>
                  {tag.active && <X className="w-3 h-3 text-white/80" />}
                </button>
              ))}
            </div>

            {/* TAB RENDER: CALENDAR MONTHLY GRID OR AGENDA LIST */}
            {activeViewTab === 'Calendar' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (item.hasReservation) {
                          setSelectedDateFilter(selectedDateFilter === item.formattedDate ? null : item.formattedDate);
                          setActiveViewTab('Agenda');
                        }
                      }}
                      className={`h-14 p-1.5 rounded-xl border transition flex flex-col justify-between cursor-pointer ${
                        item.hasReservation 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-extrabold hover:bg-emerald-100' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <span className="text-[10px] font-sans">{item.dayNum}</span>
                      {item.hasReservation && (
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-sans">
                            {item.count}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateFilter && (
                  <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                    <span>Filtering by Date: <strong>{selectedDateFilter}</strong></span>
                    <button onClick={() => setSelectedDateFilter(null)} className="text-emerald-700 hover:underline font-bold cursor-pointer">
                      Clear Date Filter
                    </button>
                  </div>
                )}

                {filteredReservations.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No Reservations Found</p>
                    <p className="text-[11px] text-slate-400">Adjust your search parameters or laboratory filters.</p>
                  </div>
                ) : (
                  filteredReservations.map((res) => {
                    const isBeingDeleted = deletingId === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => {
                          if (!isBeingDeleted) {
                            setInspectReservation(res);
                            setIsEditing(false);
                          }
                        }}
                        className={`p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all duration-400 ease-in-out cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group ${
                          isBeingDeleted 
                            ? 'opacity-0 -translate-x-full bg-rose-100/90 blur-xs' 
                            : 'opacity-100 translate-x-0'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              res.status === 'In Progress' ? 'bg-emerald-500 text-white' :
                              res.status === 'Approved' ? 'bg-blue-600 text-white' :
                              res.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                            }`}>
                              {res.status}
                            </span>
                            <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-[#1e5352] transition">
                              {res.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-slate-700 font-bold">
                              <MapPin className="w-3 h-3 text-[#1e5352]" /> {res.labRoom}
                            </span>
 <span> - </span>
                            <span className="flex items-center gap-1 font-sans">
                              <Clock className="w-3 h-3 text-slate-400" /> {res.startTime} - {res.endTime}
                            </span>
 <span> - </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> {res.reservedBy}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="px-2.5 py-1 bg-white rounded-xl border border-slate-200 text-[10px] font-sans font-bold text-slate-600">
                            {res.pcsReserved} PCs
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReservationToDelete(res);
                            }}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* CUSTOM UI CENTERED DELETE CONFIRMATION MODAL */}
      {reservationToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Schedule Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to cancel and remove <span className="font-bold text-slate-800">{reservationToDelete.title}</span> ({reservationToDelete.labRoom})? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReservationToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm shadow-rose-200"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & EDIT RESERVATION MODAL */}
      {inspectReservation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#1e5352]" />
                <h3 className="text-sm font-extrabold text-slate-900">Reservation Details</h3>
              </div>
              <button onClick={() => setInspectReservation(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Reservation Title</label>
                  <input
                    type="text"
                    value={inspectReservation.title}
                    onChange={(e) => setInspectReservation({ ...inspectReservation, title: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  />
                </div>

                {/* DUAL INPUT FOR EDITING LABORATORY */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assigned Laboratory</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Select or type laboratory name..."
                    value={inspectReservation.labRoom}
                    onChange={(e) => setInspectReservation({ ...inspectReservation, labRoom: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Reserved By</label>
                  <input
                    type="text"
                    value={inspectReservation.reservedBy}
                    onChange={(e) => setInspectReservation({ ...inspectReservation, reservedBy: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Status</label>
                  <select
                    value={inspectReservation.status}
                    onChange={(e) => setInspectReservation({ ...inspectReservation, status: e.target.value as any })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-sm">{inspectReservation.title}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectReservation.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      inspectReservation.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {inspectReservation.status}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{inspectReservation.purpose}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Laboratory</span>
                    <span className="font-bold">{inspectReservation.labRoom}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block">Instructor / User</span>
                    <span className="font-bold">{inspectReservation.reservedBy}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Schedule Time</span>
                    <span className="font-sans font-bold text-[#1e5352]">{inspectReservation.startTime} - {inspectReservation.endTime}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleUpdateStatus(inspectReservation.id, 'Approved')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(inspectReservation.id, 'Rejected')}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setReservationToDelete(inspectReservation)} 
                    className="text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Cancel Reservation
                  </button>
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Edit Details</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW RESERVATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddReservation} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add Laboratory Reservation</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Reservation Title / Event</label>
                <input
                  type="text"
                  placeholder="e.g. CS101 Practical Exam"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  required
                />
              </div>

              {/* DUAL INPUT FOR ADDING LABORATORY */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Assigned Laboratory Room</label>
                <input
                  type="text"
                  list="lab-room-suggestions"
                  placeholder="Select from suggestions or type custom lab..."
                  value={newLabRoom}
                  onChange={(e) => setNewLabRoom(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  [TIP] Select from the suggestion list or enter a custom laboratory name.
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Instructor / Reserved By</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Ricardo Dalisay"
                  value={newReservedBy}
                  onChange={(e) => setNewReservedBy(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-sans focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">End Time</label>
                  <input
                    type="text"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-sans focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Purpose / Notes</label>
                <textarea
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Submit Reservation</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default ReservationsView;
