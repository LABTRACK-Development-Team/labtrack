import apiClient from '@/lib/api-client';
import React, { useEffect,  useState, useMemo } from 'react';
import { 
  AlertCircle, ShieldAlert, CheckCircle2, Clock, Wrench, 
  Search, Plus, Zap, Check, Trash2, 
  Printer, ShieldCheck, Flame, Laptop, X, Edit3, Download,
  Activity, RefreshCw, Building
} from 'lucide-react';

interface IssueServiceDeskViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface ServiceTicket {
  id: string;
  lab: string;
  workstation: string;
  reportedBy: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'POWER' | 'PERIPHERAL';
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdDate: string;
  slaDeadline: string;
  resolutionTime?: string;
  comments?: { id: string; author: string; text: string; time: string }[];
}

export const IssueServiceDeskView: React.FC<IssueServiceDeskViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  // SEARCH & FILTER STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [labFilter, setLabFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // MODAL STATES
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<ServiceTicket | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // NEW TICKET FORM STATE
  const [newTicket, setNewTicket] = useState({
    lab: 'ComLab 1 (ICT)',
    workstation: '',
    reportedBy: '',
    category: 'HARDWARE' as ServiceTicket['category'],
    priority: 'HIGH' as ServiceTicket['priority'],
    description: ''
  });

  // INITIAL SERVICE DESK TICKETS LEDGER DATA
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Helper: get current logged-in user info
  const getCurrentUser = (): any => {
    try {
      const raw = sessionStorage.getItem('labtrack_user') || localStorage.getItem('labtrack_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Helper: fetch laboratories for GUID lookup
  const [laboratoryMap, setLaboratoryMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadLabs = async () => {
      try {
        const resp = await apiClient.get('/api/v1/laboratories');
        const data = resp.data?.data || resp.data;
        const items = Array.isArray(data) ? data : (data?.items || []);
        const map: Record<string, string> = {};
        items.forEach((lab: any) => {
          if (lab.id && lab.name) {
            map[(lab.name || "").toLowerCase()] = lab.id;
            map[(lab.name || "").toLowerCase().replace(/\s*\([^)]*\)/g, '').trim()] = lab.id;
          }
        });
        setLaboratoryMap(map);
        console.log('[IssueDesk] Loaded lab lookup:', Object.keys(map).length, 'labs');
      } catch (err: any) {
        console.warn('[IssueDesk] Failed to load labs:', err?.response?.status);
      }
    };
    loadLabs();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/problem-reports');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        const arr = Array.isArray(data) ? data : [];
        const mapStatus = (s: string): string => {
          const u = (s || '').toUpperCase();
          if (u === 'REPORTED' || u === 'SUBMITTED' || u === 'PENDING' || u === 'OPEN') return 'OPEN';
          if (u === 'IN_PROGRESS' || u === 'UNDER_REVIEW' || u === 'UNDERREVIEW') return 'IN_PROGRESS';
          if (u === 'RESOLVED' || u === 'COMPLETED' || u === 'CLOSED') return 'RESOLVED';
          return 'OPEN';
        };
        setTickets(arr.map((item: any) => ({
          id: item.id || '',
          ticketNo: 'TK-' + String(item.id || '').slice(0, 8).toUpperCase(),
          workstation: item.workstationNumber || 'N/A',
          lab: item.labName || 'N/A',
          description: item.description || '',
          reportedBy: item.reportedByName || 'Unknown',
          createdDate: item.reportedAt ? new Date(item.reportedAt).toLocaleString() : 'N/A',
          category: item.category || 'GENERAL',
          priority: (item.priority || 'MEDIUM').toUpperCase(),
          status: mapStatus(item.status),
          slaDeadline: 'N/A',
          comments: []
        })));
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // COMPUTED METRICS
  const totalTickets = tickets.length;
  const criticalCount = useMemo(() => tickets.filter(t => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length, [tickets]);
  const inProgressCount = useMemo(() => tickets.filter(t => t.status === 'IN_PROGRESS').length, [tickets]);
  const resolvedCount = useMemo(() => tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, [tickets]);

  // FILTERED TICKETS ENGINE
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesQuery = (t.id || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                           (t.workstation || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                           (t.lab || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                           (t.description || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                           (t.reportedBy || "").toLowerCase().includes((searchQuery || "").toLowerCase());

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesLab = labFilter === 'ALL' || (t.lab || "").toLowerCase().includes((labFilter || "").toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;

      return matchesQuery && matchesPriority && matchesStatus && matchesLab && matchesCategory;
    });
  }, [tickets, searchQuery, priorityFilter, statusFilter, labFilter, categoryFilter]);

  // HANDLER: SUBMIT NEW TICKET
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.lab.trim() || !newTicket.workstation.trim() || !newTicket.reportedBy.trim() || !newTicket.description.trim()) {
      onTriggerNotification('Paki-kumpleto ang lahat ng kinakailangang field!');
      return;
    }

    // Map frontend fields -> backend CreateProblemReportDto
    const currentUser = getCurrentUser();
    const userId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
    const labKey = newTicket.lab.trim().toLowerCase();
    const laboratoryId = laboratoryMap[labKey] || laboratoryMap[labKey.replace(/\s*\([^)]*\)/g, '').trim()] || '00000000-0000-0000-0000-000000000000';

    // Map priority -> severity (backend uses Severity)
    const severityMap: Record<string, string> = {
      'CRITICAL': 'Critical',
      'HIGH': 'High',
      'MEDIUM': 'Medium',
      'LOW': 'Low'
    };
    const severity = severityMap[newTicket.priority] || 'Medium';

    // Generate title from description
    const title = newTicket.description.trim().slice(0, 100) || 'Issue Report';

    let created: ServiceTicket = {
      id: `TICK-${Math.floor(905 + Math.random() * 95)}`,
      lab: newTicket.lab.trim(),
      workstation: newTicket.workstation.trim().toUpperCase(),
      reportedBy: newTicket.reportedBy.trim(),
      category: newTicket.category,
      description: newTicket.description.trim(),
      priority: newTicket.priority,
      status: 'OPEN',
      createdDate: 'Just now',
      slaDeadline: newTicket.priority === 'CRITICAL' ? '30 mins target' : '4 hrs target',
      comments: []
    };

    try {
      const payload = {
        reportedByUserId: userId,
        reporterId: userId,
        laboratoryId: laboratoryId,
        workstationId: newTicket.workstation.trim() || null,
        laboratoryName: newTicket.lab.trim() || null,
        priority: newTicket.priority.toUpperCase(),
        assetId: null,
        title: title,
        category: newTicket.category,
        severity: severity,
        description: newTicket.description.trim(),
        stepsToReproduce: null,
        attachmentUrl: null,
        reportedAtUtc: new Date().toISOString()
      };
      console.log('[IssueDesk] POST payload:', payload);

      const resp = await apiClient.post('/api/v1/problem-reports', payload);
      const backendRec = resp.data?.data || resp.data;
      if (backendRec && backendRec.id) {
        created = { ...created, id: String(backendRec.id) };
        console.log('[IssueDesk] Created OK, backend id:', backendRec.id);
      }
    } catch (err: any) {
      console.error('[IssueDesk] POST failed:', err?.response?.status, err?.response?.data);
      const errMsg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Unknown error';
      onTriggerNotification(`Hindi na-save sa server: ${errMsg}. Local lang ang ticket.`);
    }

    setTickets(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewTicket({
      lab: 'ComLab 1 (ICT)',
      workstation: '',
      reportedBy: '',
      category: 'HARDWARE',
      priority: 'HIGH',
      description: ''
    });

    onTriggerNotification(`Nai-post ang bagong Service Ticket #${created.id} para sa ${created.workstation}!`);
  };

  // HANDLER: SAVE EDIT TICKET
  const handleSaveEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    try {
      await apiClient.patch(`/api/v1/problem-reports/${editingTicket.id}/status`, {
        status: editingTicket.status
      });
    } catch (err: any) {
      console.warn('[IssueServiceDesk] PATCH save-edit failed (applying locally):', err?.response?.status);
    }

    setTickets(prev => prev.map(t => t.id === editingTicket.id ? editingTicket : t));
    
    if (selectedTicketDetails?.id === editingTicket.id) {
      setSelectedTicketDetails(editingTicket);
    }

    onTriggerNotification(`Na-update ang detalye ng Ticket #${editingTicket.id}!`);
    setEditingTicket(null);
  };

  // HANDLER: UPDATE TICKET STATUS
  const handleUpdateStatus = async (id: string, nextStatus: ServiceTicket['status']) => {
    // Map frontend status -> backend Status string
    const statusMap: Record<string, string> = {
      'OPEN': 'Open',
      'IN_PROGRESS': 'InProgress',
      'PENDING': 'Pending',
      'RESOLVED': 'Resolved',
      'CLOSED': 'Closed',
      'REJECTED': 'Rejected'
    };
    const backendStatus = statusMap[String(nextStatus).toUpperCase()] || String(nextStatus);

    try {
      await apiClient.patch(`/api/v1/problem-reports/${id}/status`, {
        status: backendStatus
      });
      console.log('[IssueDesk] PATCH status OK:', backendStatus);
    } catch (err: any) {
      console.warn('[IssueDesk] PATCH status failed:', err?.response?.status, err?.response?.data);
    }

    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: nextStatus,
          slaDeadline: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'Resolved' : t.slaDeadline,
          resolutionTime: nextStatus === 'RESOLVED' ? 'Resolved just now' : t.resolutionTime
        };
      }
      return t;
    }));

    if (selectedTicketDetails && selectedTicketDetails.id === id) {
      setSelectedTicketDetails(prev => prev ? { 
        ...prev, 
        status: nextStatus, 
        slaDeadline: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'Resolved' : prev.slaDeadline 
      } : null);
    }

    onTriggerNotification(`Nabagong status ng Ticket ${id} sa ${nextStatus.replace('_', ' ')}.`);
  };

  // HANDLER: ESCALATE ISSUE
  const handleEscalateTicket = (id: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          priority: 'CRITICAL',
          slaDeadline: '15 mins URGENT'
        };
      }
      return t;
    }));

    if (selectedTicketDetails && selectedTicketDetails.id === id) {
      setSelectedTicketDetails(prev => prev ? { ...prev, priority: 'CRITICAL', slaDeadline: '15 mins URGENT' } : null);
    }

    onTriggerNotification(` Nai-ESCALATE ang Ticket #${id} bilang CRITICAL PRIORITY!`);
  };

  // HANDLER: ADD COMMENT
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTicketDetails) return;

    const newComment = {
      id: `C-${Date.now()}`,
      author: 'Admin Operator',
      text: newCommentText.trim(),
      time: 'Just now'
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicketDetails.id) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicketDetails(prev => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : null);
    setNewCommentText('');
    onTriggerNotification(`Naidagdag ang komento sa Ticket #${selectedTicketDetails.id}.`);
  };

  // HANDLER: DELETE TICKET
  const handleDeleteTicket = async (id: string) => {
    if (window.confirm(`Sigurado ka bang nais mong burahin ang Ticket ${id}?`)) {
      try {
        await apiClient.delete(`/api/v1/problem-reports/${id}`);
      } catch (err: any) {
        console.warn('[IssueServiceDesk] DELETE failed (removing locally):', err?.response?.status);
      }
      setTickets(prev => prev.filter(t => t.id !== id));
      if (selectedTicketDetails?.id === id) setSelectedTicketDetails(null);
      onTriggerNotification(`Naalis na ang Ticket ${id}.`);
    }
  };

  // HANDLER: EXPORT TO CSV
  const handleExportCsv = () => {
    const csvRows = [
      ['Ticket ID', 'Lab Location', 'Workstation Tag', 'Reported By', 'Category', 'Priority', 'Status', 'SLA Deadline', 'Description'],
      ...tickets.map(t => [t.id, `"${t.lab}"`, t.workstation, `"${t.reportedBy}"`, t.category, t.priority, t.status, `"${t.slaDeadline}"`, `"${t.description.replace(/"/g, '""')}"`])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JRMSU_ServiceDesk_Tickets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerNotification('Nai-export na ang Service Desk Ticket Queue sa CSV!');
  };

  // HANDLER: PRINT SERVICE REPORT
  const handlePrintReport = () => {
    window.print();
  };

  // PRIORITY BADGE COLOR MAPPER
  const getPriorityBadgeClass = (priority: ServiceTicket['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-600 text-white font-extrabold shadow-xs animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 text-white font-extrabold shadow-xs';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
      case 'LOW':
        return 'bg-teal-600 text-white font-bold shadow-xs';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 animate-in fade-in duration-300">

      {/* DUAL-MODE DATALIST SUGGESTIONS FOR LAB LOCATION */}
      <datalist id="lab-location-list">
        <option value="ComLab 1 (ICT)" />
        <option value="ComLab 2 (Multimedia)" />
        <option value="ComLab 3 (Engineering)" />
        <option value="Server Room" />
        <option value="Multimedia Lab" />
        <option value="Robotics Lab" />
      </datalist>

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #servicedesk-printable, #servicedesk-printable * {
            visibility: visible !important;
          }
          #servicedesk-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div id="servicedesk-printable" className="space-y-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Wrench className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Issues & Service Desk Operations</h3>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-sans font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-600" /> {criticalCount} Critical Open
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Laboratory Fault Dispatch, SLA Control & Incident Resolution Stream  {campusName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Export CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Print Incident Report"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Report</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>File New Ticket</span>
            </button>
          </div>
        </div>

        {/* TOP KPI METRICS DASHBOARD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Filed</span>
            <p className="text-2xl font-black text-slate-900 font-sans">{totalTickets}</p>
            <span className="text-[10px] text-blue-600 font-bold">Live Stream Queue</span>
          </div>

          <div className="bg-red-50/60 p-4 rounded-2xl border border-red-200/80 space-y-1">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Critical Open</span>
            <p className="text-2xl font-black text-red-600 font-sans">{criticalCount}</p>
            <span className="text-[10px] text-red-600 font-bold">Urgent Dispatch</span>
          </div>

          <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Progress</span>
            <p className="text-2xl font-black text-amber-700 font-sans">{inProgressCount}</p>
            <span className="text-[10px] text-amber-600 font-bold">Under Inspection</span>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
            <p className="text-2xl font-black text-emerald-600 font-sans">{resolvedCount}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Operational State</span>
          </div>
        </div>

        {/* SERVICE DESK TICKET MATRIX TABLE CARD */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4">
            <div>
              <span className="text-[10px] font-sans font-bold text-blue-600 uppercase">Live Service Queue</span>
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Inspection & Dispatch Action Matrix</span>
              </h4>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-wrap items-center gap-2 no-print">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Search Tag, Lab, Details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none w-44 sm:w-52 focus:border-blue-500"
                />
              </div>

              <select
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Labs</option>
                <option value="ComLab 1">ComLab 1</option>
                <option value="ComLab 2">ComLab 2</option>
                <option value="ComLab 3">ComLab 3</option>
                <option value="Server Room">Server Room</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="NETWORK">Network</option>
                <option value="POWER">Power</option>
                <option value="PERIPHERAL">Peripheral</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* MAIN TICKETS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b">
                <tr>
                  <th className="p-3">Ticket ID</th>
                  <th className="p-3">Location & Workstation</th>
                  <th className="p-3">Fault Details & Reporter</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">SLA Target</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-sans font-bold text-blue-600">{ticket.id}</td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block font-sans">{ticket.workstation}</span>
                          <span className="text-[10px] text-blue-600 font-bold block">{ticket.lab}</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-800 font-semibold line-clamp-1">{ticket.description}</p>
                        <span className="text-[10px] text-slate-400 font-sans block">By: {ticket.reportedBy}  {ticket.createdDate}</span>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-xl text-[10px] uppercase font-bold inline-block ${getPriorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-[11px] text-slate-600 font-bold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {ticket.slaDeadline}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ticket.status === 'RESOLVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : ticket.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedTicketDetails(ticket)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            View
                          </button>

                          <button
                            onClick={() => setEditingTicket(ticket)}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            title="Edit Ticket Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {ticket.priority !== 'CRITICAL' && ticket.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleEscalateTicket(ticket.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                              title="Escalate Issue to Critical"
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(ticket.id, ticket.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED')}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${ticket.status === 'RESOLVED' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            title={ticket.status === 'RESOLVED' ? 'Reopen Ticket' : 'Mark Resolved'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                      Walang nahanap na service desk ticket batay sa napiling filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* NEW SERVICE TICKET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>File Service / Fault Ticket</span>
              </h4>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs font-bold text-slate-700">
              
              <div className="grid grid-cols-2 gap-3">
                {/* DUAL-MODE LAB LOCATION FIELD (SELECT OR TYPE FREELY) */}
                <div>
                  <label className="block mb-1">Laboratory Location (Select / Type)</label>
                  <input 
                    type="text"
                    list="lab-location-list"
                    placeholder="e.g. ComLab 1 (ICT)"
                    value={newTicket.lab}
                    onChange={(e) => setNewTicket({ ...newTicket, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Workstation / Asset Tag</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PC-008, MON-012"
                    value={newTicket.workstation}
                    onChange={(e) => setNewTicket({ ...newTicket, workstation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-sans font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as ServiceTicket['category'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  >
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="NETWORK">NETWORK</option>
                    <option value="POWER">POWER</option>
                    <option value="PERIPHERAL">PERIPHERAL</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Priority Target</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as ServiceTicket['priority'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-rose-600 font-extrabold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Reported By (User / Reporter Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Student Name"
                  value={newTicket.reportedBy}
                  onChange={(e) => setNewTicket({ ...newTicket, reportedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Fault Description / Issue Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe hardware behavior, screen glitches, short circuits..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-medium"
                  required
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
                  Dispatch Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE TICKET MODAL */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Service Ticket ({editingTicket.id})</span>
              </h4>
              <button 
                onClick={() => setEditingTicket(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTicket} className="space-y-3 text-xs font-bold text-slate-700">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Laboratory Location</label>
                  <input 
                    type="text" 
                    list="lab-location-list"
                    value={editingTicket.lab}
                    onChange={(e) => setEditingTicket({ ...editingTicket, lab: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1">Workstation Tag</label>
                  <input 
                    type="text" 
                    value={editingTicket.workstation}
                    onChange={(e) => setEditingTicket({ ...editingTicket, workstation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Priority</label>
                  <select
                    value={editingTicket.priority}
                    onChange={(e) => setEditingTicket({ ...editingTicket, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Status</label>
                  <select
                    value={editingTicket.status}
                    onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1">Reported By</label>
                <input 
                  type="text" 
                  value={editingTicket.reportedBy}
                  onChange={(e) => setEditingTicket({ ...editingTicket, reportedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
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

      {/* TICKET DETAILS & ACTIVITY COMMENTS MODAL */}
      {selectedTicketDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-sans font-bold text-blue-600">{selectedTicketDetails.id}</span>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>Workstation Fault Detail ({selectedTicketDetails.workstation})</span>
                </h4>
              </div>
              <button 
                onClick={() => setSelectedTicketDetails(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Priority Target</span>
                  <span className={`px-3 py-1 rounded-xl text-[11px] font-black inline-block ${getPriorityBadgeClass(selectedTicketDetails.priority)}`}>
                    {selectedTicketDetails.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Laboratory Location</span>
                  <strong className="text-blue-600 font-bold text-xs">{selectedTicketDetails.lab}</strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">REPORTED BY</span>
                <strong className="text-slate-900">{selectedTicketDetails.reportedBy}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">ISSUE DESCRIPTION</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold mt-1">
                  {selectedTicketDetails.description}
                </p>
              </div>

              {/* COMMENTS & INSPECTION ACTIVITY STREAM */}
              <div className="space-y-2 pt-2 border-t">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Inspection Activity & Admin Log</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedTicketDetails.comments && selectedTicketDetails.comments.length > 0 ? (
                    selectedTicketDetails.comments.map(c => (
                      <div key={c.id} className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <strong className="text-blue-700">{c.author}</strong>
                          <span className="text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-slate-800 text-[11px]">{c.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-[11px]">No log entries filed yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add admin notes..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Post
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTicketDetails.id, 'IN_PROGRESS')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  In Progress
                </button>

                <button
                  onClick={() => handleUpdateStatus(selectedTicketDetails.id, 'RESOLVED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Resolve Ticket
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default IssueServiceDeskView;
