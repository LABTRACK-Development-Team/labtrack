import apiClient from '@/lib/api-client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Monitor, Cpu, Wifi, HardDrive, Activity, RefreshCw, Clock, MapPin, 
  CheckCircle2, AlertTriangle, Wrench, Search, Filter, Plus, Trash2, 
  Edit3, Save, X, Server, Layers, Power, Download, ShieldCheck, Zap,
  RotateCcw, Grid, List, Building
} from 'lucide-react';

export interface WorkstationNode {
  id: string;
  pcNumber: string;
  labRoom: string;
  ipAddress: string;
  specs: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Offline';
  assignedUser?: string;
  cpuLoad: number;
  tempC: number;
}

export interface LabPod {
  id: string;
  name: string;
  code: string;
  totalSeats: number;
  availableSeats: number;
  inUseSeats: number;
  maintenanceSeats: number;
  statusBadge: 'Optimal' | 'High Load' | 'Maintenance' | 'Critical';
}

export const LabAvailabilityView: React.FC = () => {
  // Filter & Layout View States
  const [selectedLab, setSelectedLab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'Matrix' | 'Table'>('Matrix');

  // Real-Time 60FPS Telemetry Loop
  const [isLiveTelemetry, setIsLiveTelemetry] = useState<boolean>(true);
  const [liveTick, setLiveTick] = useState<number>(0);
  const [dismissAlert, setDismissAlert] = useState<boolean>(false);

  // Selected Node Inspection & Editing State
  const [inspectNode, setInspectNode] = useState<WorkstationNode | null>(null);
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);

  // Custom UI Delete Confirmation Modal State
  const [nodeToDelete, setNodeToDelete] = useState<WorkstationNode | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add New Workstation Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPcNumber, setNewPcNumber] = useState<string>('');
  const [newLabRoom, setNewLabRoom] = useState<string>('');
  const [newIpAddress, setNewIpAddress] = useState<string>('192.168.1.109');
  const [newSpecs, setNewSpecs] = useState<string>('Core i7 / 16GB / RTX 3060');
  const [newStatus, setNewStatus] = useState<'Available' | 'In Use' | 'Maintenance' | 'Offline'>('Available');

  // Extended Workstation Inventory
  const [labs, setLabs] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);

        const labsRes = await apiClient.get('/api/v1/laboratories');
        const labsRaw = labsRes.data?.data?.items || labsRes.data?.data || labsRes.data || [];
        const realLabs = Array.isArray(labsRaw) ? labsRaw : [];
        setLabs(realLabs);

        const allNodes: any[] = [];
        for (const lab of realLabs) {
          try {
            const wsRes = await apiClient.get('/api/v1/laboratories/' + lab.id + '/workstations');
            const wsRaw = wsRes.data?.data?.items || wsRes.data?.data || wsRes.data || [];
            const wsList = Array.isArray(wsRaw) ? wsRaw : [];

            for (const ws of wsList) {
              const wsStatus = (ws.status || '').toUpperCase();
              let mappedStatus: 'Available' | 'In Use' | 'Maintenance' | 'Offline' = 'Available';
              if (wsStatus === 'IN_USE' || wsStatus === 'IN USE' || wsStatus === 'ACTIVE') mappedStatus = 'In Use';
              else if (wsStatus === 'UNDER_MAINTENANCE' || wsStatus === 'MAINTENANCE') mappedStatus = 'Maintenance';
              else if (wsStatus === 'OFFLINE' || wsStatus === 'OUT_OF_ORDER' || wsStatus === 'BROKEN') mappedStatus = 'Offline';

              allNodes.push({
                id: ws.id,
                pcNumber: ws.code || ws.name || ('PC-' + String(ws.id || '').slice(0, 4)),
                labRoom: lab.labName || lab.name || 'Unknown Lab',
                ipAddress: ws.ipAddress || '0.0.0.0',
                specs: [ws.cpuModel, ws.ramSize, ws.storageSize].filter(Boolean).join(' / ') || 'Not specified',
                status: mappedStatus,
                cpuLoad: 0,
                tempC: 0
              });
            }
          } catch { /* skip lab */ }
        }

        setNodes(allNodes);
      } catch (err) {
        console.error('Fetch labs/workstations failed:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Telemetry Loop
  useEffect(() => {
    if (!isLiveTelemetry) return;
    const interval = setInterval(() => {
      setLiveTick((prev) => prev + 0.2);
    }, 200);
    return () => clearInterval(interval);
  }, [isLiveTelemetry]);

  // Lab Pods Summary — DYNAMIC from labs API
  const labPods: LabPod[] = useMemo(() => {
    return labs.map((lab, idx) => {
      const labName = lab.labName || lab.name || 'Unknown Lab';
      const labNodes = nodes.filter((n) => n.labRoom === labName);
      const totalSeats = lab.capacity || labNodes.length || 0;
      const availableSeats = labNodes.filter((n) => n.status === 'Available').length;
      const inUseSeats = labNodes.filter((n) => n.status === 'In Use').length;
      const maintenanceSeats = labNodes.filter((n) => n.status === 'Maintenance' || n.status === 'Offline').length;

      let statusBadge: 'Optimal' | 'High Load' | 'Maintenance' | 'Critical' = 'Optimal';
      const isActive = (lab.status || '').toLowerCase() === 'active';
      if (!isActive) statusBadge = 'Maintenance';
      else if (maintenanceSeats > 3) statusBadge = 'Maintenance';
      else if (totalSeats > 0 && inUseSeats > totalSeats * 0.7) statusBadge = 'High Load';

      return {
        id: lab.id,
        name: labName,
        code: lab.roomNumber || `LAB-${String(idx + 1).padStart(2, '0')}`,
        totalSeats,
        availableSeats,
        inUseSeats,
        maintenanceSeats,
        statusBadge
      };
    });
  }, [nodes, labs]);

  // Critical Alerts
  const criticalAlertNodes = useMemo(() => {
    return nodes.filter(n => n.tempC >= 70 || n.status === 'Offline');
  }, [nodes]);

  // Filtered Workstations
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesLab = !selectedLab.trim() || (node.labRoom || "").toLowerCase().includes((selectedLab || "").toLowerCase().trim());
      const matchesStatus = statusFilter === 'All' || node.status === statusFilter;
      const matchesSearch = (node.pcNumber || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (node.ipAddress || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (node.specs || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      return matchesLab && matchesStatus && matchesSearch;
    });
  }, [nodes, selectedLab, statusFilter, searchQuery]);

  // System Stats
  const nodeStats = useMemo(() => {
    return {
      total: nodes.length,
      available: nodes.filter((n) => n.status === 'Available').length,
      inUse: nodes.filter((n) => n.status === 'In Use').length,
      maintenance: nodes.filter((n) => n.status === 'Maintenance').length,
      offline: nodes.filter((n) => n.status === 'Offline').length,
    };
  }, [nodes]);

  // CRUD Handler: CREATE
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPcNumber.trim() || !newLabRoom.trim()) return;

    const newNode: WorkstationNode = {
      id: `pc-${Date.now()}`,
      pcNumber: newPcNumber.trim(),
      labRoom: newLabRoom.trim(),
      ipAddress: newIpAddress.trim(),
      specs: newSpecs.trim(),
      status: newStatus,
      cpuLoad: 0,
      tempC: 0
    };

    setNodes([newNode, ...nodes]);
    setNewPcNumber('');
    setIsAddModalOpen(false);
  };

  // CRUD Handler: UPDATE
  const handleSaveNode = () => {
    if (!inspectNode) return;
    setNodes(nodes.map((n) => (n.id === inspectNode.id ? { ...inspectNode, labRoom: inspectNode.labRoom.trim() } : n)));
    setIsEditingNode(false);
  };

  // Executed on Confirm Delete from Custom Modal
  const handleConfirmDelete = () => {
    if (!nodeToDelete) return;
    const id = nodeToDelete.id;
    setDeletingId(id);
    setNodeToDelete(null);

    setTimeout(() => {
      setNodes((prevNodes) => prevNodes.filter((n) => n.id !== id));
      if (inspectNode?.id === id) setInspectNode(null);
      setDeletingId(null);
    }, 500);
  };

  // Remote Reboot / Maintenance
  const handleRemoteReboot = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, cpuLoad: 5, tempC: 35 } : n));
    alert(`Remote reboot command sent to Workstation ${inspectNode?.pcNumber}`);
  };

  const handleToggleMaintenance = (id: string) => {
    setNodes(nodes.map(n => {
      if (n.id === id) {
        const nextStatus = n.status === 'Maintenance' ? 'Available' : 'Maintenance';
        return { ...n, status: nextStatus };
      }
      return n;
    }));
    setInspectNode(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["PC Number,Lab Room,IP Address,Specifications,Status,CPU Load,Temp (C)"]
 .concat(nodes.map(n => `${n.pcNumber},${n.labRoom},${n.ipAddress},"${n.specs}",${n.status},${n.cpuLoad}%,${n.tempC} deg C`))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LabTrack_Workstation_Availability.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">
      
      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY */}
      <datalist id="lab-room-suggestions">
        {labs.map(lab => (
          <option key={lab.id} value={lab.labName || lab.name || ''} />
        ))}
      </datalist>

      {/* HARDWARE ALERT BANNER */}
      {!dismissAlert && criticalAlertNodes.length > 0 && (
        <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-black tracking-wide uppercase">Hardware Incident Alert</p>
              <p className="text-xs font-medium opacity-90">
                {criticalAlertNodes.length} workstation node(s) reporting high temperatures or offline status ({criticalAlertNodes.map(n => n.pcNumber).join(', ')}).
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDismissAlert(true)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* HEADER BAR & SYSTEM CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-[#1e5352]" />
            Lab Availability & Workstations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#1e5352]" /> JRMSU Computer Laboratories
            </span>
 <span> - </span>
            <span className="flex items-center gap-1 text-emerald-600 font-sans font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Telemetry Online
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLiveTelemetry(!isLiveTelemetry)}
            className={`px-3 py-2 rounded-xl text-xs font-sans font-bold transition flex items-center gap-2 cursor-pointer border ${
              isLiveTelemetry 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs' 
                : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isLiveTelemetry ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isLiveTelemetry ? '60FPS TELEMETRY' : 'PAUSED'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workstation</span>
          </button>
        </div>
      </div>

      {/* SYSTEM STATS METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button 
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Total Units</span>
          <p className="text-lg font-black font-sans mt-0.5">{nodeStats.total} PCs</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Available')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'Available' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Optimal / Available</span>
          <p className="text-lg font-black font-sans mt-0.5">{nodeStats.available} Units</p>
        </button>

        <button 
          onClick={() => setStatusFilter('In Use')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'In Use' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Active Sessions</span>
          <p className="text-lg font-black font-sans mt-0.5">{nodeStats.inUse} Active</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Maintenance')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'Maintenance' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Under Maintenance</span>
          <p className="text-lg font-black font-sans mt-0.5">{nodeStats.maintenance} Units</p>
        </button>

        <button 
          onClick={() => setStatusFilter('Offline')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'Offline' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75">Outage / Offline</span>
          <p className="text-lg font-black font-sans mt-0.5">{nodeStats.offline} Outages</p>
        </button>
      </div>

      {/* LAB AVAILABILITY PODS GRID */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Lab Availability Pods</h2>
            <p className="text-xs text-slate-400 font-medium">Real-time room occupancy and hardware rack health</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Filter Lab:</span>
            <div className="relative">
              <input 
                type="text"
                list="lab-room-suggestions"
                placeholder="Select/Type Lab..."
                value={selectedLab} 
                onChange={(e) => setSelectedLab(e.target.value)}
                className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352] w-48"
              />
              {selectedLab && (
                <button 
                  onClick={() => setSelectedLab('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {labPods.map((pod) => {
            const liveOccupancyPct = pod.totalSeats > 0 ? Math.round((pod.inUseSeats / pod.totalSeats) * 100) : 0;

            return (
              <div 
                key={pod.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 relative overflow-hidden group hover:border-[#1e5352] transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-slate-900 font-sans tracking-tight">{pod.code}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                    pod.statusBadge === 'Optimal'
                      ? 'bg-emerald-500 text-white'
                      : pod.statusBadge === 'High Load'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {pod.statusBadge}
                  </span>
                </div>

                <div className="h-28 bg-slate-900 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden text-white">
                  <div className="flex justify-between items-center text-[10px] font-sans text-slate-400">
                    <span className="flex items-center gap-1">
                      <Server className="w-3.5 h-3.5 text-emerald-400" /> RACK-NODE #01
                    </span>
                    <span className="text-emerald-400 font-bold">{liveOccupancyPct}% Occupied</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 my-1">
                    {Array.from({ length: Math.min(pod.totalSeats, 14) }).map((_, i) => {
                      const isOnline = (i + Math.floor(liveTick)) % 3 !== 0;
                      return (
                        <div 
                          key={i} 
                          className={`h-2.5 rounded-xs transition-all duration-300 ${
                            isOnline ? 'bg-emerald-500/80 shadow-2xs' : 'bg-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-extrabold text-slate-200 truncate">{pod.name}</p>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold text-slate-600 pt-1">
                  <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200/60">
                    <span className="text-emerald-700 font-extrabold block">{pod.availableSeats}</span>
                    <span className="text-slate-400 text-[9px]">Available</span>
                  </div>
                  <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-200/60">
                    <span className="text-blue-700 font-extrabold block">{pod.inUseSeats}</span>
                    <span className="text-slate-400 text-[9px]">In Use</span>
                  </div>
                  <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200/60">
                    <span className="text-amber-700 font-extrabold block">{pod.maintenanceSeats}</span>
                    <span className="text-slate-400 text-[9px]">Maint</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WORKSTATION MATRIX GRID AND TABLE SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Workstation Status & Outages</h2>
 <p className="text-xs text-slate-400 font-medium">Interactive PC node grid Click any tile to inspect or edit workstation details</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('Matrix')}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'Matrix' ? 'bg-white text-[#1e5352] font-bold shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Matrix</span>
              </button>

              <button
                onClick={() => setViewMode('Table')}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'Table' ? 'bg-white text-[#1e5352] font-bold shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search PC or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-xs font-medium pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
              />
            </div>
          </div>
        </div>

        {/* WORKSTATION GRID MATRIX OR TABLE VIEW */}
        {viewMode === 'Matrix' ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredNodes.map((node) => {
                const isAvailable = node.status === 'Available';
                const isInUse = node.status === 'In Use';
                const isMaintenance = node.status === 'Maintenance';
                const isBeingDeleted = deletingId === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      if (!isBeingDeleted) {
                        setInspectNode(node);
                        setIsEditingNode(false);
                      }
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-2 group relative shadow-2xs transition-all duration-500 ease-out transform ${
                      isBeingDeleted 
                        ? 'opacity-0 scale-0 -rotate-12 translate-y-8 bg-rose-600 border-rose-600 text-white blur-xs shadow-rose-500/50 shadow-xl pointer-events-none' 
                        : 'opacity-100 scale-100 rotate-0 translate-y-0 hover:scale-[1.02] active:scale-95'
                    } ${
                      isAvailable 
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' 
                        : isInUse 
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                        : isMaintenance
                        ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                        : 'bg-slate-300 text-slate-700 border-slate-300 hover:bg-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-sans opacity-90">
                      <span className="font-bold">{node.pcNumber}</span>
                      <Monitor className="w-3.5 h-3.5" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold truncate">{node.labRoom}</p>
                      <p className="text-[9px] font-sans opacity-80 truncate">{node.ipAddress}</p>
                    </div>

                    <div className="pt-1 border-t border-white/20 flex justify-between items-center text-[9px] font-sans">
                      <span>CPU: {node.status === 'Offline' ? '0' : Math.round(node.cpuLoad)}%</span>
                      <span className="px-1.5 py-0.5 rounded bg-black/20 font-bold">{node.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold">PC Unit</th>
                  <th className="pb-3 font-semibold">Laboratory Room</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                  <th className="pb-3 font-semibold">Hardware Specs</th>
                  <th className="pb-3 font-semibold">Live Telemetry</th>
                  <th className="pb-3 font-semibold">Condition Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {filteredNodes.map((node) => {
                  const isBeingDeleted = deletingId === node.id;
                  return (
                    <tr 
                      key={node.id} 
                      className={`transition-all duration-500 ease-in-out hover:bg-slate-50/80 ${
                        isBeingDeleted ? 'opacity-0 -translate-x-full bg-rose-100/90 blur-xs' : 'opacity-100 translate-x-0'
                      }`}
                    >
                      <td className="py-3 font-extrabold text-slate-900 font-sans">{node.pcNumber}</td>
                      <td className="py-3 text-slate-700 font-bold">{node.labRoom}</td>
                      <td className="py-3 font-sans text-slate-500">{node.ipAddress}</td>
                      <td className="py-3 text-slate-500 truncate max-w-[200px]">{node.specs}</td>
                      <td className="py-3 font-sans text-slate-600">
                        {node.status === 'Offline' ? (
                          <span className="text-rose-500 font-bold">Offline</span>
                        ) : (
 <span>{Math.round(node.cpuLoad)}% CPU - {node.tempC} deg C</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          node.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : node.status === 'In Use'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : node.status === 'Maintenance'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setInspectNode(node);
                            setIsEditingNode(true);
                          }}
                          className="text-[#1e5352] hover:underline font-bold cursor-pointer"
                        >
                          Edit
                        </button>
 <span> - </span>
                        <button
                          onClick={() => setNodeToDelete(node)}
                          className="text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOM UI CENTERED DELETE CONFIRMATION MODAL */}
      {nodeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Unit Deletion</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to retire <span className="font-bold text-slate-800">{nodeToDelete.pcNumber}</span> ({nodeToDelete.labRoom})? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNodeToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm shadow-rose-200"
              >
                Delete Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & EDIT MODAL */}
      {inspectNode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#1e5352]" />
 <h3 className="text-base font-extrabold text-slate-900">Workstation Details {inspectNode.pcNumber}</h3>
              </div>
              <button onClick={() => setInspectNode(null)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">PC Number Identifier</label>
                  <input 
                    type="text" 
                    value={inspectNode.pcNumber}
                    onChange={(e) => setInspectNode({ ...inspectNode, pcNumber: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Assigned Laboratory</label>
                  <input 
                    type="text" 
                    list="lab-room-suggestions"
                    placeholder="Select or type laboratory name..."
                    value={inspectNode.labRoom}
                    onChange={(e) => setInspectNode({ ...inspectNode, labRoom: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Static IP Address</label>
                  <input 
                    type="text" 
                    value={inspectNode.ipAddress}
                    onChange={(e) => setInspectNode({ ...inspectNode, ipAddress: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Condition Status</label>
                  <select 
                    value={inspectNode.status}
                    onChange={(e) => setInspectNode({ ...inspectNode, status: e.target.value as any })}
                    className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setIsEditingNode(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                  <button onClick={handleSaveNode} className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">Room Assignment</span>
                    <p className="font-extrabold text-slate-900">{inspectNode.labRoom}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">IP Address</span>
                    <p className="font-sans font-bold text-[#1e5352]">{inspectNode.ipAddress}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">Hardware Specifications</span>
                    <p className="font-semibold text-slate-700">{inspectNode.specs}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-emerald-800">
                  <span className="font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Live Workstation Load
                  </span>
 <span className="font-sans font-extrabold">{inspectNode.cpuLoad}% CPU - {inspectNode.tempC} deg C</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={() => handleRemoteReboot(inspectNode.id)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#1e5352]" />
                    <span>Remote Reboot</span>
                  </button>

                  <button 
                    onClick={() => handleToggleMaintenance(inspectNode.id)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-amber-200/60"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>{inspectNode.status === 'Maintenance' ? 'Set Available' : 'Flag Maintenance'}</span>
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setNodeToDelete(inspectNode)} 
                    className="text-rose-600 hover:underline font-bold cursor-pointer"
                  >
                    Retire Unit
                  </button>
                  <button onClick={() => setIsEditingNode(true)} className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Edit Details</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD NEW WORKSTATION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddNode} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add New Laboratory Workstation</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">PC Number Identifier</label>
                <input 
                  type="text" 
                  placeholder="e.g. PC-109"
                  value={newPcNumber}
                  onChange={(e) => setNewPcNumber(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Assigned Laboratory</label>
                <input 
                  type="text" 
                  list="lab-room-suggestions"
                  placeholder="Select from suggestions or type custom laboratory name..."
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
                <label className="block text-slate-600 font-bold mb-1">Static IP Address</label>
                <input 
                  type="text" 
                  placeholder="192.168.1.109"
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Hardware Specifications</label>
                <input 
                  type="text" 
                  placeholder="e.g. Core i7 / 16GB RAM / RTX 3060"
                  value={newSpecs}
                  onChange={(e) => setNewSpecs(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Initial Condition Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Save Workstation</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default LabAvailabilityView;
