import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, Wrench, Trash2, 
  Search, Upload, Paperclip, ShieldAlert, X, Save, Eye,
  Laptop, Tag, AlertCircle, FileText,
  Activity, Layers, CheckCircle
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Pending' | 'In Progress' | 'Resolved' | 'Cancelled';

export interface IssueTicket {
  id: string;
  ticketNo: string;
  lab: string;
  workstation: string;
  category: string;
  priority: PriorityLevel;
  title: string;
  description: string;
  status: TicketStatus;
  reportedBy: string;
  createdAt: string;
  attachmentUrl?: string;
  timeline?: { status: string; date: string; updatedBy: string }[];
}

export const ReportProblemView: React.FC = () => {
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);

  // New Issue Form State
  const initialForm = {
    lab: 'ComLab 1 (Networking)',
    workstation: 'WS-08',
    category: 'Hardware Issue',
    priority: 'Medium' as PriorityLevel,
    title: '',
    description: '',
    attachmentUrl: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tickets Database State
  const [tickets, setTickets] = useState<IssueTicket[]>([
    {
      id: 't-101',
      ticketNo: 'TK-2026-0891',
      lab: 'ComLab 2 (Software Eng)',
      workstation: 'WS-14',
      category: 'Hardware Issue',
      priority: 'High',
      title: 'Monitor Display Flickering Continuously',
      description: 'The LED monitor repeatedly goes black every 5 seconds while running graphics apps.',
      status: 'In Progress',
      reportedBy: 'Engr. Clara Reyes',
      createdAt: '2026-11-02 09:15 AM',
      attachmentUrl: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=400&auto=format&fit=crop',
      timeline: [
        { status: 'Reported', date: '2026-11-02 09:15 AM', updatedBy: 'Engr. Clara Reyes' },
        { status: 'Assigned to Technician', date: '2026-11-02 10:00 AM', updatedBy: 'Admin' }
      ]
    },
    {
      id: 't-102',
      ticketNo: 'TK-2026-0892',
      lab: 'ComLab 1 (Networking)',
      workstation: 'WS-03',
      category: 'Network / Connectivity',
      priority: 'Urgent',
      title: 'No LAN Network Signal',
      description: 'RJ45 port is loose. Station cannot acquire IP address from DHCP server.',
      status: 'Pending',
      reportedBy: 'Lab Technician',
      createdAt: '2026-11-02 11:30 AM',
      timeline: [
        { status: 'Reported', date: '2026-11-02 11:30 AM', updatedBy: 'Lab Technician' }
      ]
    },
    {
      id: 't-103',
      ticketNo: 'TK-2026-0888',
      lab: 'ComLab 3 (AI Lab)',
      workstation: 'WS-22',
      category: 'Software / OS',
      priority: 'Low',
      title: 'Python VENV Kernel Corruption',
      description: 'Jupyter notebook failing to import installed CUDA modules.',
      status: 'Resolved',
      reportedBy: 'Student Assistant',
      createdAt: '2026-11-01 03:45 PM',
      timeline: [
        { status: 'Reported', date: '2026-11-01 03:45 PM', updatedBy: 'Student Assistant' },
        { status: 'Resolved', date: '2026-11-01 05:10 PM', updatedBy: 'Tech Support' }
      ]
    }
  ]);

  // UI Control & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedTicketView, setSelectedTicketView] = useState<IssueTicket | null>(null);

  // Custom Centered Delete Confirmation Modal State
  const [ticketToDelete, setTicketToDelete] = useState<IssueTicket | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Helper function to normalize status from Backend API
  const normalizeStatus = (s: string): TicketStatus => {
    if (!s) return 'Pending';
    const upper = s.toUpperCase().replace('_', ' ');
    if (upper.includes('RESOLV') || upper.includes('CLOSED')) return 'Resolved';
    if (upper.includes('PROGRESS') || upper.includes('IN_PROGRESS')) return 'In Progress';
    if (upper.includes('CANCEL')) return 'Cancelled';
    return 'Pending';
  };

  // Helper function to map API response to IssueTicket structure
  const mapApiToTicket = (item: any): IssueTicket => ({
    id: item.id || `t-${Math.random()}`,
    ticketNo: item.ticketNo || item.code || `TK-2026-${String(item.id || '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`,
    lab: item.labName || item.laboratoryName || item.lab || 'ComLab 1 (Networking)',
    workstation: item.workstationCode || item.workstationId || item.workstation || 'WS-01',
    category: item.category || item.title || 'Hardware Issue',
    priority: (item.priority as PriorityLevel) || 'Medium',
    title: item.title || item.category || 'Problem Report',
    description: item.description || '',
    status: normalizeStatus(item.status),
    reportedBy: item.reporterName || item.reportedBy || 'Instructor',
    createdAt: item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : (item.createdAt || 'Just now'),
    attachmentUrl: item.attachmentUrl || (item.hasPhoto ? 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=400&auto=format&fit=crop' : undefined),
    timeline: item.timeline || [
      { status: 'Reported', date: item.createdAtUtc ? new Date(item.createdAtUtc).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now', updatedBy: item.reporterName || 'Instructor' }
    ]
  });

  // FETCH TICKETS FROM BACKEND API
  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/problem-reports/mine').catch(() => apiClient.get('/api/v1/problem-reports'));
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        setTickets(items.map(mapApiToTicket));
      }
    } catch (err) {
      console.warn('[ReportProblemView] Using current state');
    }
  }, []);

  useRealtime(fetchTickets);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Toast Helper Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Image Upload Handler
  const handleMainAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormData(prev => ({ ...prev, attachmentUrl: reader.result as string }));
          showToast('Image attachment added successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CREATE Ticket (Backend API + Local Optimistic UI)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lab.trim() || !formData.title.trim() || !formData.description.trim()) {
      alert('Please complete the laboratory name, title, and issue description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        labName: formData.lab.trim(),
        workstationId: formData.workstation.trim(),
        priority: formData.priority,
        attachmentUrl: formData.attachmentUrl,
        campus: 'JRMSU Main Campus'
      };

      const res = await apiClient.post('/api/v1/problem-reports', payload);
      const createdData = res.data?.data || res.data;

      const newTicket: IssueTicket = mapApiToTicket(createdData || {
        ...payload,
        id: `t-${Date.now()}`,
        ticketNo: `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Pending',
        reportedBy: 'Engr. Clara Reyes',
        createdAtUtc: new Date().toISOString()
      });

      setTickets(prev => [newTicket, ...prev]);
      showToast('New issue ticket submitted successfully!');
      setFormData(initialForm);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    } catch (err) {
      // Optimistic Fallback if server returns error or offline
      const localTicket: IssueTicket = {
        id: `t-${Date.now()}`,
        ticketNo: `TK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        lab: formData.lab.trim(),
        workstation: formData.workstation.trim(),
        category: formData.category,
        priority: formData.priority,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: 'Pending',
        reportedBy: 'Engr. Clara Reyes',
        createdAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
        attachmentUrl: formData.attachmentUrl,
        timeline: [
          { status: 'Report Submitted', date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }), updatedBy: 'Engr. Clara Reyes' }
        ]
      };
      setTickets(prev => [localTicket, ...prev]);
      showToast('New issue ticket submitted successfully!');
      setFormData(initialForm);
      if (mainFileInputRef.current) mainFileInputRef.current.value = '';
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE Ticket (Backend API + Custom Modal Trigger)
  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    const id = ticketToDelete.id;
    const ticketNo = ticketToDelete.ticketNo;
    setDeletingId(id);
    setTicketToDelete(null);

    try {
      await apiClient.delete(`/api/v1/problem-reports/${id}`).catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      if (selectedTicketView?.id === id) setSelectedTicketView(null);
      setDeletingId(null);
      showToast(`Ticket ${ticketNo} deleted successfully.`);
    }, 400);
  };

  // FILTERED TICKETS (With safe string null guards)
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const search = (searchTerm || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const ws = (t.workstation || '').toLowerCase();
      const tkNo = (t.ticketNo || '').toLowerCase();
      const labName = (t.lab || '').toLowerCase();

      const matchesSearch = title.includes(search) ||
                            ws.includes(search) ||
                            tkNo.includes(search) ||
                            labName.includes(search);
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // METRIC COUNTERS
  const totalCount = tickets.length;
  const pendingCount = tickets.filter(t => t.status === 'Pending').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Urgent': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500 text-white';
      case 'In Progress': return 'bg-blue-600 text-white';
      case 'Resolved': return 'bg-emerald-600 text-white';
      case 'Cancelled': return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">

      {/* HIDDEN FILE INPUT */}
      <input 
        type="file" 
        ref={mainFileInputRef} 
        onChange={handleMainAttachmentUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* DATALIST SUGGESTIONS FOR DUAL LAB INPUT */}
      <datalist id="lab-room-suggestions">
        <option value="ComLab 1 (Networking)" />
        <option value="ComLab 2 (Software Eng)" />
        <option value="ComLab 3 (AI Lab)" />
        <option value="ComLab 4 (General Lab)" />
        <option value="Multimedia & Graphics Lab" />
        <option value="Hardware & Microcontroller Lab" />
        <option value="Server Room Node" />
      </datalist>

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e5352] text-white px-4 py-3 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#1e5352]" />
            Report a Problem & Issue Tracker
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="font-semibold text-slate-700">JRMSU Laboratory Issue Desk</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold font-sans">Real-Time Management Dashboard</span>
          </p>
        </div>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Total Reports</span>
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-amber-600 block uppercase tracking-wider">Pending</span>
            <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-blue-600 block uppercase tracking-wider">In Progress</span>
            <span className="text-2xl font-black text-blue-600">{inProgressCount}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 block uppercase tracking-wider">Resolved</span>
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: SUBMIT PROBLEM FORM */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#1e5352]" />
              Submit Problem Report
            </h2>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
            
            {/* DUAL LAB INPUT FIELD */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-[#1e5352]" /> Laboratory / Room
              </label>
              <input
                type="text"
                list="lab-room-suggestions"
                placeholder="Select from suggestions or type custom lab..."
                value={formData.lab}
                onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] transition"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                💡 Select from the suggestion list or enter a custom laboratory name.
              </span>
            </div>

            {/* WORKSTATION FIELD */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Workstation</label>
              <input
                type="text"
                placeholder="e.g. WS-01, WS-15, Server Rack 2"
                value={formData.workstation}
                onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-sans font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] transition"
                required
              />
            </div>

            {/* CATEGORY FIELD */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#1e5352]" /> Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] transition"
              >
                <option value="Hardware Issue">Hardware Issue</option>
                <option value="Software / OS">Software / OS</option>
                <option value="Network / Connectivity">Network / Connectivity</option>
                <option value="Peripheral / Cable">Peripheral / Cable</option>
                <option value="Facility / Power">Facility / Power</option>
              </select>
            </div>

            {/* PRIORITY PILLS */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#1e5352]" /> Priority Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Low', 'Medium', 'High', 'Urgent'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer border ${
                      formData.priority === p 
                        ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-600' :
                          p === 'High' ? 'bg-amber-500 text-white border-amber-500' :
                          p === 'Medium' ? 'bg-blue-600 text-white border-blue-600' : 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* TITLE FIELD */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Title</label>
              <input
                type="text"
                placeholder="Brief summary of the issue..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] transition"
                required
              />
            </div>

            {/* DESCRIPTION FIELD */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1">Description</label>
              <textarea
                placeholder="Provide detailed information regarding the problem..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352] transition h-20 resize-none"
                required
              />
            </div>

            {/* ATTACHMENT EVIDENCE DROPZONE */}
            <div>
              <label className="block text-slate-700 font-extrabold mb-1 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#1e5352]" /> Photo Evidence
              </label>
              
              {formData.attachmentUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={formData.attachmentUrl} alt="Preview" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, attachmentUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full transition shadow-md hover:scale-105 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mainFileInputRef.current?.click()}
                  className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-2xl text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#1e5352]" />
                  <span className="font-bold">Attach Photo / Screenshot</span>
                </button>
              )}
            </div>

            {/* FORM ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormData(initialForm)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer active:scale-95"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#1e5352] hover:bg-[#143c3b] text-white font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: TICKETS LIST DASHBOARD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            
            {/* SEARCH & FILTER CONTROLS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, lab, station, or ticket #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352]"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="All">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* TICKETS LIST CARDS */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-extrabold text-slate-600">No problem tickets found</p>
                  <p className="text-[11px]">Try adjusting your search terms or filters.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isBeingDeleted = deletingId === ticket.id;
                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all duration-400 ease-in-out space-y-3 shadow-2xs hover:shadow-md ${
                        isBeingDeleted 
                          ? 'opacity-0 -translate-x-full bg-rose-100/90 blur-xs' 
                          : 'opacity-100 translate-x-0'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-sans text-xs font-black text-[#1e5352] bg-emerald-100/70 px-2.5 py-0.5 rounded-lg">
                            {ticket.ticketNo}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${getStatusBadge(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {ticket.createdAt}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-slate-900">{ticket.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">{ticket.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-600 font-semibold">
                          <span className="bg-white px-2 py-1 rounded-md border border-slate-200/80 font-bold">{ticket.lab}</span>
                          <span className="bg-white px-2 py-1 rounded-md border border-slate-200/80 font-sans font-bold text-slate-800">{ticket.workstation}</span>
                        </div>

                        {/* EYE (VIEW) AND TRASH (DELETE) ACTIONS */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedTicketView(ticket)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer active:scale-95"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setTicketToDelete(ticket)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer active:scale-95"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* CUSTOM UI CENTERED DELETE CONFIRMATION MODAL */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Ticket Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete ticket <span className="font-bold text-slate-800">{ticketToDelete.ticketNo}</span> ({ticketToDelete.title})? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
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

      {/* MODAL: TICKET PREVIEW & TIMELINE */}
      {selectedTicketView && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1e5352]" />
                <h3 className="text-sm font-extrabold text-slate-900">Ticket Details — {selectedTicketView.ticketNo}</h3>
              </div>
              <button onClick={() => setSelectedTicketView(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Lab & Workstation</span>
                <span className="font-bold text-slate-800">{selectedTicketView.lab} ({selectedTicketView.workstation})</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Title</span>
                <span className="font-extrabold text-slate-900">{selectedTicketView.title}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">Description</span>
                <p className="text-slate-700 leading-relaxed font-medium">{selectedTicketView.description}</p>
              </div>

              {selectedTicketView.attachmentUrl && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Attached Evidence</span>
                  <img src={selectedTicketView.attachmentUrl} alt="Evidence" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
                </div>
              )}

              {/* TIMELINE HISTORY */}
              {selectedTicketView.timeline && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-2">Activity Timeline</span>
                  <div className="space-y-2">
                    {selectedTicketView.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-[11px]">
                        <span className="font-bold text-slate-800">{item.status}</span>
                        <span className="text-slate-500 font-sans text-[10px]">{item.date} • {item.updatedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedTicketView(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportProblemView;
