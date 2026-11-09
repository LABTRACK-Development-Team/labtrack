import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  FileText, Clock, CheckCircle2, AlertTriangle, Plus, Search, Filter, 
  Trash2, Edit3, X, ChevronRight, Monitor, Wrench, Layers, Send, 
  ShieldAlert, RefreshCw, ArrowRight, UserCheck, PackageCheck, Download,
  Activity, Check, CornerDownRight, Laptop, Star, Save, Building
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

export type RequestCategory = string;
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RequestStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Approved' | 'Completed' | 'Rejected';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
}

export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface RequestItem {
  id: string;
  ticketId: string;
  title: string;
  category: RequestCategory;
  labRoom: string;
  pcNode?: string;
  requestedBy: string;
  dateSubmitted: string;
  priority: RequestPriority;
  status: RequestStatus;
  currentStep: 1 | 2 | 3 | 4;
  details: string;
  assignedTechnician?: string;
  rating?: number;
  userFeedback?: string;
  tasks: TaskItem[];
  history: ActivityLog[];
}

export const MyRequestsView: React.FC = () => {
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [inspectRequest, setInspectRequest] = useState<RequestItem | null>(null);
  
  // Dedicated Edit Modal State (CRUD Edit)
  const [editRequestModal, setEditRequestModal] = useState<RequestItem | null>(null);

  // Custom Centered Delete Confirmation Modal State
  const [requestToDelete, setRequestToDelete] = useState<RequestItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Input States for Adding New Ticket (Create) - DUAL INPUT ENABLING
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Equipment & Hardware');
  const [newLabRoom, setNewLabRoom] = useState<string>('ComLab 1 (Networking)');
  const [newPcNode, setNewPcNode] = useState<string>('PC-101');
  const [newPriority, setNewPriority] = useState<RequestPriority>('Medium');
  const [newDetails, setNewDetails] = useState<string>('');

  // Initial Requests Dataset (CRUD Enabled)
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: 'req-1',
      ticketId: 'REQ-2026-089',
      title: 'RAM & GPU Performance Upgrade Request',
      category: 'Equipment & Hardware',
      labRoom: 'ComLab 3 (AI Lab)',
      pcNode: 'PC-301',
      requestedBy: 'Juan Dela Cruz',
      dateSubmitted: '2026-11-01',
      priority: 'High',
      status: 'In Progress',
      currentStep: 3,
      details: 'Requesting 32GB DDR5 RAM upgrade and RTX 4090 driver re-installation for deep learning lab sessions.',
      assignedTechnician: 'Tech. Mark Anthony',
      tasks: [
        { id: 't1', label: 'Inspect motherboard RAM slots on PC-301', completed: true },
        { id: 't2', label: 'Install 2x16GB DDR5 memory modules', completed: true },
        { id: 't3', label: 'Run CUDA benchmark and stress test', completed: false }
      ],
      history: [
        { id: 'h1', timestamp: '2026-11-01 08:30 AM', action: 'Ticket submitted into system queue', performedBy: 'Juan Dela Cruz' },
        { id: 'h2', timestamp: '2026-11-01 10:15 AM', action: 'Request acknowledged & assigned to Tech. Mark', performedBy: 'Lab Administrator' },
        { id: 'h3', timestamp: '2026-11-02 01:00 PM', action: 'Hardware diagnostics in progress on PC-301', performedBy: 'Tech. Mark Anthony' }
      ]
    },
    {
      id: 'req-2',
      ticketId: 'REQ-2026-074',
      title: 'Cisco Packet Tracer & MATLAB License Key Activation',
      category: 'Software License',
      labRoom: 'ComLab 1 (Networking)',
      pcNode: 'All Workstations (35 PCs)',
      requestedBy: 'Engr. Arlene McCoy',
      dateSubmitted: '2026-10-28',
      priority: 'Medium',
      status: 'Completed',
      currentStep: 4,
      details: 'Annual software license activation key deployment for networking student lab sessions.',
      assignedTechnician: 'Admin Server Node',
      rating: 5,
      tasks: [
        { id: 't1', label: 'Generate annual license key bundle', completed: true },
        { id: 't2', label: 'Deploy keys via active domain controller', completed: true },
        { id: 't3', label: 'Verify workstation host compliance', completed: true }
      ],
      history: [
        { id: 'h1', timestamp: '2026-10-28 09:00 AM', action: 'License activation ticket generated', performedBy: 'Engr. Arlene McCoy' },
        { id: 'h2', timestamp: '2026-10-28 11:00 AM', action: 'Keys validated by System Admin', performedBy: 'Admin Server Node' },
        { id: 'h3', timestamp: '2026-10-29 04:30 PM', action: 'Remote deployment completed across 35 nodes', performedBy: 'Admin Server Node' }
      ]
    },
    {
      id: 'req-3',
      ticketId: 'REQ-2026-092',
      title: 'CPU Overheating & Fan Cleaning Maintenance',
      category: 'Maintenance & Repair',
      labRoom: 'ComLab 2 (Software Eng)',
      pcNode: 'PC-202',
      requestedBy: 'Maria Santos',
      dateSubmitted: '2026-11-02',
      priority: 'Urgent',
      status: 'Under Review',
      currentStep: 2,
      details: 'Workstation thermal paste replacement and cooling fan inspection. Thermal sensor reading reaching 78°C.',
      tasks: [
        { id: 't1', label: 'Check chassis fan RPM speed', completed: true },
        { id: 't2', label: 'Apply Arctic MX-4 thermal paste', completed: false }
      ],
      history: [
        { id: 'h1', timestamp: '2026-11-02 07:45 AM', action: 'Overheat warning automated alert triggered ticket', performedBy: 'LabTrack Telemetry' }
      ]
    }
  ]);

  // Helper map for backend API items
  const mapApiToRequestItem = (item: any): RequestItem => {
    const rawStatus = (item.status || '').toUpperCase();
    let status: RequestStatus = 'Submitted';
    let currentStep: 1 | 2 | 3 | 4 = 1;

    if (rawStatus.includes('RESOLV') || rawStatus.includes('COMPLET') || rawStatus.includes('APPROV')) {
      status = 'Completed';
      currentStep = 4;
    } else if (rawStatus.includes('PROGRESS')) {
      status = 'In Progress';
      currentStep = 3;
    } else if (rawStatus.includes('REVIEW')) {
      status = 'Under Review';
      currentStep = 2;
    }

    return {
      id: item.id || `req-${Math.random()}`,
      ticketId: item.ticketId || item.code || `REQ-2026-${String(item.id || '').slice(-3) || Math.floor(100 + Math.random() * 900)}`,
      title: item.title || item.category || 'Request Ticket',
      category: item.category || 'Equipment & Hardware',
      labRoom: item.labRoom || item.labName || 'ComLab 1 (Networking)',
      pcNode: item.pcNode || item.workstationId || 'PC-101',
      requestedBy: item.requestedBy || item.reporterName || 'Juan Dela Cruz',
      dateSubmitted: item.createdAtUtc ? new Date(item.createdAtUtc).toISOString().split('T')[0] : (item.dateSubmitted || '2026-11-01'),
      priority: (item.priority as RequestPriority) || 'Medium',
      status: status,
      currentStep: currentStep,
      details: item.details || item.description || '',
      assignedTechnician: item.assignedTechnician || 'Tech Support',
      tasks: item.tasks || [
        { id: 't1', label: 'Initial ticket review & laboratory assessment', completed: currentStep >= 2 }
      ],
      history: item.history || [
        { id: 'h1', timestamp: item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString() : 'Just now', action: 'Ticket submitted into system queue', performedBy: item.requestedBy || 'Juan Dela Cruz' }
      ]
    };
  };

  // FETCH REQUESTS FROM BACKEND API
  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/problem-reports/mine').catch(() => apiClient.get('/api/v1/requests/mine'));
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        setRequests(items.map(mapApiToRequestItem));
      }
    } catch (err) {
      console.warn('[MyRequestsView] Using current state');
    }
  }, []);

  useRealtime(fetchMyRequests);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Filtering Calculation with Safe string null guards
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const cat = (req.category || '').toLowerCase();
      const selCat = (selectedCategory || '').toLowerCase().trim();
      const matchesCategory = !selCat || cat.includes(selCat);
      const matchesStatus = selectedStatus === 'All' || req.status === selectedStatus;
      const matchesPriority = selectedPriority === 'All' || req.priority === selectedPriority;

      const q = (searchQuery || '').toLowerCase();
      const title = (req.title || '').toLowerCase();
      const ticketId = (req.ticketId || '').toLowerCase();
      const labRoom = (req.labRoom || '').toLowerCase();
      const details = (req.details || '').toLowerCase();

      const matchesSearch = title.includes(q) ||
                            ticketId.includes(q) ||
                            labRoom.includes(q) ||
                            details.includes(q);
      return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [requests, selectedCategory, selectedStatus, selectedPriority, searchQuery]);

  // Metric Summaries
  const metrics = useMemo(() => {
    return {
      total: requests.length,
      underReview: requests.filter(r => r.status === 'Under Review' || r.status === 'Submitted').length,
      inProgress: requests.filter(r => r.status === 'In Progress').length,
      completed: requests.filter(r => r.status === 'Completed' || r.status === 'Approved').length,
    };
  }, [requests]);

  // CRUD: CREATE
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetails.trim() || !newCategory.trim() || !newLabRoom.trim()) return;

    const payload = {
      title: newTitle.trim(),
      category: newCategory.trim(),
      labName: newLabRoom.trim(),
      workstationId: newPcNode.trim(),
      priority: newPriority,
      description: newDetails.trim(),
      campus: 'JRMSU Main Campus'
    };

    try {
      const res = await apiClient.post('/api/v1/problem-reports', payload).catch(() => apiClient.post('/api/v1/requests', payload));
      const created = res?.data?.data || res?.data;
      if (created) {
        setRequests(prev => [mapApiToRequestItem(created), ...prev]);
      } else {
        throw new Error('Fallback local create');
      }
    } catch (err) {
      const newTicket: RequestItem = {
        id: `req-${Date.now()}`,
        ticketId: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
        title: newTitle.trim(),
        category: newCategory.trim(),
        labRoom: newLabRoom.trim(),
        pcNode: newPcNode.trim(),
        requestedBy: 'Juan Dela Cruz (Current User)',
        dateSubmitted: new Date().toISOString().split('T')[0],
        priority: newPriority,
        status: 'Submitted',
        currentStep: 1,
        details: newDetails.trim(),
        tasks: [
          { id: 't1', label: 'Initial ticket review and laboratory assessment', completed: false }
        ],
        history: [
          {
            id: `h-${Date.now()}`,
            timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            action: 'Ticket submitted into system queue',
            performedBy: 'Juan Dela Cruz'
          }
        ]
      };
      setRequests(prev => [newTicket, ...prev]);
    }

    setNewTitle('');
    setNewDetails('');
    setIsAddModalOpen(false);
  };

  // CRUD: UPDATE (Save Edit Changes)
  const handleSaveEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequestModal) return;

    try {
      await apiClient.put(`/api/v1/problem-reports/${editRequestModal.id}`, {
        title: editRequestModal.title,
        category: editRequestModal.category,
        labName: editRequestModal.labRoom,
        workstationId: editRequestModal.pcNode,
        priority: editRequestModal.priority,
        description: editRequestModal.details
      }).catch(() => {});
    } catch (e) {}

    const updatedHistoryLog: ActivityLog = {
      id: `h-${Date.now()}`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      action: 'Ticket details modified by requester',
      performedBy: 'Juan Dela Cruz'
    };

    const updatedItem = {
      ...editRequestModal,
      category: editRequestModal.category.trim(),
      labRoom: editRequestModal.labRoom.trim(),
      history: [updatedHistoryLog, ...editRequestModal.history]
    };

    setRequests(requests.map(r => r.id === updatedItem.id ? updatedItem : r));
    if (inspectRequest?.id === updatedItem.id) setInspectRequest(updatedItem);
    setEditRequestModal(null);
  };

  // CRUD: DELETE (Custom Modal Trigger & Removal)
  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    const id = requestToDelete.id;
    setDeletingId(id);
    setRequestToDelete(null);

    try {
      await apiClient.delete(`/api/v1/problem-reports/${id}`).catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (inspectRequest?.id === id) setInspectRequest(null);
      if (editRequestModal?.id === id) setEditRequestModal(null);
      setDeletingId(null);
    }, 400);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Ticket ID,Title,Category,Lab Room,PC Node,Priority,Status,Step,Date Submitted"]
      .concat(requests.map(r => `${r.ticketId},"${r.title}",${r.category},${r.labRoom},${r.pcNode || 'N/A'},${r.priority},${r.status},Step ${r.currentStep},${r.dateSubmitted}`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabTrack_My_Requests.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">
      
      {/* DATALIST SUGGESTIONS FOR DUAL INPUT CATEGORY */}
      <datalist id="category-suggestions">
        <option value="Equipment & Hardware" />
        <option value="Software License" />
        <option value="Maintenance & Repair" />
        <option value="Lab Access & Schedule" />
        <option value="Network & Connectivity" />
        <option value="System Environment & OS" />
      </datalist>

      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY */}
      <datalist id="lab-room-suggestions">
        <option value="ComLab 1 (Networking)" />
        <option value="ComLab 2 (Software Eng)" />
        <option value="ComLab 3 (AI Lab)" />
        <option value="ComLab 4 (General Lab)" />
        <option value="Multimedia & Graphics Lab" />
        <option value="Server Room Node" />
      </datalist>

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#1e5352]" />
            My Ticket Requests & Tracking
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <Monitor className="w-3.5 h-3.5 text-[#1e5352]" /> JRMSU Computer Laboratory Services
            </span>
            <span>•</span>
            <span className="text-emerald-600 font-bold font-sans">Live Sync Active</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Request Ticket</span>
          </button>
        </div>
      </div>

      {/* STATS METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button 
          onClick={() => setSelectedStatus('All')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Total Tickets</span>
          <p className="text-lg font-black font-sans mt-0.5">{metrics.total} Submitted</p>
        </button>

        <button 
          onClick={() => setSelectedStatus('Under Review')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Under Review' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Under Review</span>
          <p className="text-lg font-black font-sans mt-0.5">{metrics.underReview} Pending</p>
        </button>

        <button 
          onClick={() => setSelectedStatus('In Progress')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'In Progress' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">In Progress</span>
          <p className="text-lg font-black font-sans mt-0.5">{metrics.inProgress} Active</p>
        </button>

        <button 
          onClick={() => setSelectedStatus('Completed')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Completed' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Completed</span>
          <p className="text-lg font-black font-sans mt-0.5">{metrics.completed} Done</p>
        </button>
      </div>

      {/* REQUEST PIPELINE CARD LIST */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
        
        {/* SEARCH AND DUAL FILTERS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="relative flex-1 w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, ticket ID, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* DUAL INPUT FOR CATEGORY FILTER */}
            <div className="relative">
              <input
                type="text"
                list="category-suggestions"
                placeholder="Select/Type Category..."
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1e5352] w-48"
              />
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* PRIORITY FILTER */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Urgent">Urgent Priority</option>
            </select>
          </div>
        </div>

        {/* TICKET ITEMS */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No Request Tickets Found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isBeingDeleted = deletingId === req.id;
              return (
                <div
                  key={req.id}
                  onClick={() => {
                    if (!isBeingDeleted) setInspectRequest(req);
                  }}
                  className={`bg-slate-50 hover:bg-slate-100/90 p-5 rounded-2xl border border-slate-200/80 transition-all duration-400 ease-in-out cursor-pointer space-y-4 group shadow-2xs ${
                    isBeingDeleted 
                      ? 'opacity-0 -translate-x-full bg-rose-100/90 blur-xs' 
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  {/* PIPELINE TRACKER STEP BAR */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 overflow-x-auto text-[10px] font-bold">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                      req.currentStep >= 1 ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60' : 'text-slate-400'
                    }`}>
                      <span className={`w-4 h-4 rounded-full text-center leading-4 text-[9px] ${
                        req.currentStep >= 1 ? 'bg-emerald-600 text-white font-sans' : 'bg-slate-200 text-slate-600'
                      }`}>1</span>
                      <span>Request Submitted</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                      req.currentStep >= 2 ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60' : 'text-slate-400'
                    }`}>
                      <span className={`w-4 h-4 rounded-full text-center leading-4 text-[9px] ${
                        req.currentStep >= 2 ? 'bg-emerald-600 text-white font-sans' : 'bg-slate-200 text-slate-600'
                      }`}>2</span>
                      <span>In Review</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                      req.currentStep >= 3 ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60' : 'text-slate-400'
                    }`}>
                      <span className={`w-4 h-4 rounded-full text-center leading-4 text-[9px] ${
                        req.currentStep >= 3 ? 'bg-emerald-600 text-white font-sans' : 'bg-slate-200 text-slate-600'
                      }`}>3</span>
                      <span>Processing / Action</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                      req.currentStep >= 4 ? 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60' : 'text-slate-400'
                    }`}>
                      <span className={`w-4 h-4 rounded-full text-center leading-4 text-[9px] ${
                        req.currentStep >= 4 ? 'bg-emerald-600 text-white font-sans' : 'bg-slate-200 text-slate-600'
                      }`}>4</span>
                      <span>Completed</span>
                    </div>
                  </div>

                  {/* CARD DETAILS */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-xs font-bold text-[#1e5352] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {req.ticketId}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          req.priority === 'Urgent' ? 'bg-rose-500 text-white' :
                          req.priority === 'High' ? 'bg-amber-500 text-white' :
                          req.priority === 'Medium' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                        }`}>
                          {req.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[9px] font-bold">
                          {req.category}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100/70 text-[#1e5352] rounded-md text-[9px] font-bold flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {req.labRoom}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#1e5352] transition">
                        {req.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 font-medium">{req.details}</p>
                    </div>

                    {/* DIRECT CRUD ACTION BUTTONS (EDIT & DELETE) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditRequestModal(req);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-[#1e5352] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Edit Ticket Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRequestToDelete(req);
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* CUSTOM UI CENTERED DELETE CONFIRMATION MODAL */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Ticket Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to cancel and delete request <span className="font-bold text-slate-800">{requestToDelete.ticketId}</span> ({requestToDelete.title})? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm shadow-rose-200"
              >
                Delete Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED EDIT MODAL (CRUD EDIT WITH DUAL INPUTS) */}
      {editRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEditTicket} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#1e5352]" />
                <h3 className="text-sm font-extrabold text-slate-900">Edit Ticket — {editRequestModal.ticketId}</h3>
              </div>
              <button type="button" onClick={() => setEditRequestModal(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Request Title</label>
                <input
                  type="text"
                  value={editRequestModal.title}
                  onChange={(e) => setEditRequestModal({ ...editRequestModal, title: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  required
                />
              </div>

              {/* DUAL INPUT FOR CATEGORY IN EDIT MODAL */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Category (Select or Type Custom)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="Select or type custom category..."
                  value={editRequestModal.category}
                  onChange={(e) => setEditRequestModal({ ...editRequestModal, category: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* DUAL INPUT FOR LABORATORY IN EDIT MODAL */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Laboratory Room</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Select or type lab..."
                    value={editRequestModal.labRoom}
                    onChange={(e) => setEditRequestModal({ ...editRequestModal, labRoom: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Target PC Node</label>
                  <input
                    type="text"
                    value={editRequestModal.pcNode || ''}
                    onChange={(e) => setEditRequestModal({ ...editRequestModal, pcNode: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Priority Level</label>
                <select
                  value={editRequestModal.priority}
                  onChange={(e) => setEditRequestModal({ ...editRequestModal, priority: e.target.value as any })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Details & Description</label>
                <textarea
                  value={editRequestModal.details}
                  onChange={(e) => setEditRequestModal({ ...editRequestModal, details: e.target.value })}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditRequestModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE NEW REQUEST MODAL WITH DUAL INPUTS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTicket} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Submit New Request Ticket</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Request Title</label>
                <input
                  type="text"
                  placeholder="e.g. Additional GPU Drivers / RAM Upgrade"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  required
                />
              </div>

              {/* DUAL INPUT FOR CATEGORY IN CREATE MODAL */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Category (Select or Type Custom)</label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="Select from suggestions or type custom category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 Select from the suggestion list or enter a custom category name.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* DUAL INPUT FOR TARGET LABORATORY IN CREATE MODAL */}
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Target Laboratory</label>
                  <input
                    type="text"
                    list="lab-room-suggestions"
                    placeholder="Select or type lab..."
                    value={newLabRoom}
                    onChange={(e) => setNewLabRoom(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Target PC Unit Node</label>
                  <input
                    type="text"
                    placeholder="e.g. PC-101"
                    value={newPcNode}
                    onChange={(e) => setNewPcNode(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description / Details</label>
                <textarea
                  placeholder="Provide detailed information regarding your request..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Submit Ticket</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default MyRequestsView;
