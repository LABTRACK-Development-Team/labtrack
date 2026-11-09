import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { 
  Monitor, Cpu, Wifi, HardDrive, Activity, TrendingUp, TrendingDown, 
  ChevronDown, PieChart, Plus, Trash2, RefreshCw, Clock, MapPin, 
  CheckCircle2, AlertTriangle, Wrench, BookOpen, Users, ShieldCheck,
  Edit3, X, Save, Search, Filter, Layers, Server
} from 'lucide-react';

export interface OverviewViewProps {
  instructorName?: string;
  selectedCampus?: string;
  liveClock?: string;
  myClasses?: any[];
  labAvailability?: any[];
  reservations?: any[];
  myRequests?: any[];
  [key: string]: any;
}

interface LabResourceItem {
  id: string;
  code: string;
  name: string;
  location: string;
  category: string;
  status: 'Optimal' | 'Maintenance' | 'In Use';
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  instructorName = "Faculty Instructor",
  selectedCampus = "JRMSU Dapitan Main Campus",
  liveClock: initialLiveClock,
  myClasses = [],
  labAvailability = [],
  reservations = [],
  myRequests = []
}) => {
  // Filter & Timeframe States
  const [reportTimeframe, setReportTimeframe] = useState<string>('Monthly');
  const [pieTimeframe, setPieTimeframe] = useState<string>('This Month');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(6);
  const [hoveredPieSegment, setHoveredPieSegment] = useState<string | null>(null);

  // Table Search and Status Filter
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableStatusFilter, setTableStatusFilter] = useState<string>('All');

  // Real-Time Telemetry Engine (1-second update interval)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [clock, setClock] = useState<string>(initialLiveClock || new Date().toLocaleTimeString());
  const [liveTick, setLiveTick] = useState<number>(0);

  // Live Clock Sync
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-Time Dynamic Animation Ticker
  useEffect(() => {
    if (!isAutoRefreshing) return;
    const interval = setInterval(() => {
      setLiveTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isAutoRefreshing]);

  // LabTrack Inventory State (Full CRUD)
  const [resourceList, setResourceList] = useState<LabResourceItem[]>([
    { id: '1', code: '#PC-101', name: 'High-End AI Workstation', location: 'ComLab 1 (Networking)', category: 'Core i7 / RTX 3060', status: 'Optimal' },
    { id: '2', code: '#NET-204', name: 'Cisco Managed Switch 24-Port', location: 'ComLab 2 (Software Eng)', category: 'Network Hardware', status: 'Optimal' },
    { id: '3', code: '#PC-309', name: 'Multimedia Editing Rig', location: 'ComLab 3 (AI & Multimedia)', category: 'Ryzen 7 / 32GB RAM', status: 'Maintenance' },
    { id: '4', code: '#SRV-401', name: 'Laboratory Local Server Host', location: 'ComLab 4 (General Lab)', category: 'Server Node', status: 'In Use' },
    { id: '5', code: '#PC-108', name: 'Development Node Alpha', location: 'ComLab 1 (Networking)', category: 'Core i5 / 16GB RAM', status: 'Optimal' },
  ]);

  // Add Resource Form State
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemLocation, setNewItemLocation] = useState<string>('ComLab 1 (Networking)');
  const [newItemCategory, setNewItemCategory] = useState<string>('Workstation PC');
  const [newItemStatus, setNewItemStatus] = useState<'Optimal' | 'Maintenance' | 'In Use'>('Optimal');

  // Edit Resource State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'Optimal' | 'Maintenance' | 'In Use'>('Optimal');

  // DYNAMIC RESOURCE ALLOCATION MATH (CALCULATES DIRECTLY FROM RESOURCE LIST)
  const labDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'ComLab 1': 0,
      'ComLab 2': 0,
      'ComLab 3': 0,
      'ComLab 4': 0,
    };

    resourceList.forEach((r) => {
      if (r.location.includes('ComLab 1')) counts['ComLab 1']++;
      else if (r.location.includes('ComLab 2')) counts['ComLab 2']++;
      else if (r.location.includes('ComLab 3')) counts['ComLab 3']++;
      else if (r.location.includes('ComLab 4')) counts['ComLab 4']++;
    });

    const total = resourceList.length || 1;
    const p1 = Math.round((counts['ComLab 1'] / total) * 100);
    const p2 = Math.round((counts['ComLab 2'] / total) * 100);
    const p3 = Math.round((counts['ComLab 3'] / total) * 100);
    const p4 = Math.max(0, 100 - (p1 + p2 + p3)); // ensure exact 100% total

    return { p1, p2, p3, p4, counts, total };
  }, [resourceList]);

  // CRUD Handlers
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: LabResourceItem = {
      id: Date.now().toString(),
      code: `#DEV-${Math.floor(100 + Math.random() * 900)}`,
      name: newItemName,
      location: newItemLocation,
      category: newItemCategory,
      status: newItemStatus,
    };

    setResourceList([newItem, ...resourceList]);
    setNewItemName('');
    setIsAddingItem(false);
  };

  const handleStartEdit = (item: LabResourceItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditLocation(item.location);
    setEditCategory(item.category);
    setEditStatus(item.status);
  };

  const handleSaveEdit = (id: string) => {
    setResourceList(resourceList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          name: editName,
          location: editLocation,
          category: editCategory,
          status: editStatus,
        };
      }
      return item;
    }));
    setEditingId(null);
  };

  const handleDeleteResource = (id: string) => {
    setResourceList(resourceList.filter((item) => item.id !== id));
  };

  // Quick Table Filtering
  const filteredResources = useMemo(() => {
    return resourceList.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(tableSearch.toLowerCase()) || 
                            item.code.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            item.location.toLowerCase().includes(tableSearch.toLowerCase());
      const matchesStatus = tableStatusFilter === 'All' || item.status === tableStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [resourceList, tableSearch, tableStatusFilter]);

  // Quick Status Counts for UI Analytics Header Pills
  const statusCounts = useMemo(() => {
    return {
      total: resourceList.length,
      optimal: resourceList.filter(r => r.status === 'Optimal').length,
      inUse: resourceList.filter(r => r.status === 'In Use').length,
      maintenance: resourceList.filter(r => r.status === 'Maintenance').length,
    };
  }, [resourceList]);

  // Dynamic Telemetry Wave Data Math
  const telemetryMonthlyData = useMemo(() => {
    const shift = liveTick % 6;
    return [
      { month: 'Jan', val: 35 },
      { month: 'Feb', val: 40 + shift },
      { month: 'Mar', val: 32 },
      { month: 'Apr', val: 50 - shift },
      { month: 'May', val: 43 },
      { month: 'Jun', val: 58 + shift },
      { month: 'Jul', val: 35 + (shift * 2) },
      { month: 'Aug', val: 51 - shift },
      { month: 'Sep', val: 42 },
      { month: 'Oct', val: 42 + shift },
      { month: 'Nov', val: 50 },
      { month: 'Dec', val: 40 + shift },
    ];
  }, [liveTick]);

  // Clean Dynamic Smooth SVG Area Curve Math
  const waveSvgPath = useMemo(() => {
    const s1 = (liveTick * 18) % 70;
    const s2 = (liveTick * 24) % 60;
    return `M 0 ${85 + s1 / 4} L 45 ${70 - s2 / 3} L 90 ${95 + s1 / 3} L 135 ${60 - s2 / 4} L 180 ${80 + s1 / 2} L 225 ${30 + s2 / 3} L 270 ${85 - s1 / 3} L 315 ${45 + s2 / 2} L 360 ${70 - s1 / 4} L 405 ${70 + s2 / 3} L 450 ${55 - s1 / 2} L 495 ${85 + s2 / 4} L 540 ${85 - s1 / 3}`;
  }, [liveTick]);


  // ===== AUTO-FIX: Fetch labs + workstations =====
  useEffect(() => {
    (async () => {
      try {
        const labResp = await apiClient.get('/api/v1/laboratories').catch(() => null);
        const labs = labResp?.data?.data?.items || labResp?.data?.data || labResp?.data || [];
        const labArr = Array.isArray(labs) ? labs : [];
        const items: any[] = [];
        for (const lab of labArr) {
          try {
            const wsResp = await apiClient.get(`/api/v1/laboratories/${lab.id}/workstations`).catch(() => null);
            const wss = wsResp?.data?.data?.items || wsResp?.data?.data || wsResp?.data || [];
            for (const w of (Array.isArray(wss) ? wss : [])) {
              items.push({
                id: w.code || w.name || w.id,
                name: w.name || w.code || 'Workstation',
                location: lab.name || 'Unknown',
                category: 'Workstation PC',
                status: (w.status || '').toUpperCase().includes('MAINT')
                  ? 'Maintenance'
                  : (w.status || '').toUpperCase().includes('AVAIL') ? 'Optimal' : 'In Use'
              });
            }
          } catch {}
        }
        if (items.length > 0) setResourceList(items as any);
        console.log('[Overview] loaded', items.length, 'resources from', labArr.length, 'labs');
      } catch (err) {
        console.warn('[Overview] fetch failed:', (err as any)?.response?.status);
      }
    })();
  }, []);
  // ===== END AUTO-FIX =====


  // ===== POLLING: Refresh every 15s to keep dashboard dynamic =====
  useEffect(() => {
    const tick = setInterval(async () => {
      try {
        const labResp = await apiClient.get('/api/v1/laboratories').catch(() => null);
        const labs = labResp?.data?.data?.items || labResp?.data?.data || labResp?.data || [];
        const labArr = Array.isArray(labs) ? labs : [];
        const items: any[] = [];
        for (const lab of labArr) {
          try {
            const wsResp = await apiClient.get('/api/v1/laboratories/' + lab.id + '/workstations').catch(() => null);
            const wss = wsResp?.data?.data?.items || wsResp?.data?.data || wsResp?.data || [];
            for (const w of (Array.isArray(wss) ? wss : [])) {
              items.push({
                id: w.code || w.name || w.id,
                name: w.name || w.code || 'Workstation',
                location: lab.name || 'Unknown',
                category: 'Workstation PC',
                status: (w.status || '').toUpperCase().includes('MAINT') ? 'Maintenance'
                      : (w.status || '').toUpperCase().includes('AVAIL') ? 'Optimal' : 'In Use'
              });
            }
          } catch {}
        }
        if (items.length > 0) setResourceList(items as any);
      } catch {}
    }, 15000);
    return () => clearInterval(tick);
  }, []);
  // ===== END POLLING =====
  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300">
      
      {/* DASHBOARD HEADER & LIVE TELEMETRY SWITCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#1e5352]" /> {selectedCampus}
            </span>
            <span>â€¢</span>
            <span className="flex items-center gap-1 text-[#1e5352] font-sans font-bold">
              <Clock className="w-3.5 h-3.5" /> {clock}
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
          className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold transition flex items-center gap-2 cursor-pointer border ${
            isAutoRefreshing 
              ? 'bg-[#1e5352]/10 text-[#1e5352] border-[#1e5352]/30 shadow-2xs' 
              : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin text-[#1e5352]' : ''}`} />
          <span>{isAutoRefreshing ? 'LIVE TELEMETRY ON' : 'TELEMETRY PAUSED'}</span>
        </button>
      </div>

      {/* ROW 1: 4 METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Card 1: Active Lab Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8c6239]/15 flex items-center justify-center text-[#8c6239]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Active Lab Sessions</span>
              <p className="text-xl font-black text-slate-900 font-sans tracking-tight">
                {myClasses.length > 0 ? myClasses.length : '12 Classes'}
              </p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              +15% Increase <TrendingUp className="w-3 h-3" />
            </span>
            <span>from last week</span>
          </p>
        </div>

        {/* Card 2: PC Workstations Online */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2e5b88]/15 flex items-center justify-center text-[#2e5b88]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">PC Workstations Online</span>
              <p className="text-xl font-black text-slate-900 font-sans tracking-tight">
                {138 + (liveTick % 5)} / 150 PCs
              </p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              92% Operational <CheckCircle2 className="w-3 h-3" />
            </span>
            <span>live status</span>
          </p>
        </div>

        {/* Card 3: Network Throughput */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7c3a85]/15 flex items-center justify-center text-[#7c3a85]">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">System Network Traffic</span>
              <p className="text-xl font-black text-slate-900 font-sans tracking-tight">
                {(4.2 + ((liveTick % 8) * 0.1)).toFixed(1)} Gbps
              </p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              +20% Load <TrendingUp className="w-3 h-3" />
            </span>
            <span>peak class hours</span>
          </p>
        </div>

        {/* Card 4: Hardware Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3f3878]/15 flex items-center justify-center text-[#3f3878]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Maintenance Tickets</span>
              <p className="text-xl font-black text-slate-900 font-sans tracking-tight">
                {statusCounts.maintenance} Active
              </p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              -10% Downtime <TrendingDown className="w-3 h-3" />
            </span>
            <span>resolved quickly</span>
          </p>
        </div>

      </div>

      {/* ROW 2: ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* LEFT (2 COLS): LAB SYSTEM TELEMETRY REPORT */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Lab System Telemetry Report</h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time workstation utilization & network bandwidth</p>
            </div>
            <div className="relative">
              <select 
                value={reportTimeframe} 
                onChange={(e) => setReportTimeframe(e.target.value)}
                className="text-xs font-semibold text-slate-500 bg-transparent pr-5 appearance-none cursor-pointer focus:outline-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="h-64 relative pt-6">
            <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between text-[10px] font-sans text-slate-300 pointer-events-none">
              <div className="flex items-center gap-2"><span className="w-6 text-right">100%</span><div className="w-full border-b border-slate-100" /></div>
              <div className="flex items-center gap-2"><span className="w-6 text-right">80%</span><div className="w-full border-b border-slate-100" /></div>
              <div className="flex items-center gap-2"><span className="w-6 text-right">60%</span><div className="w-full border-b border-slate-100" /></div>
              <div className="flex items-center gap-2"><span className="w-6 text-right">40%</span><div className="w-full border-b border-slate-100" /></div>
              <div className="flex items-center gap-2"><span className="w-6 text-right">20%</span><div className="w-full border-b border-slate-100" /></div>
              <div className="flex items-center gap-2"><span className="w-6 text-right">0%</span><div className="w-full border-b border-slate-100" /></div>
            </div>

            {hoveredPoint !== null && (
              <div className="absolute top-2 left-1/2 -translate-x-12 z-20 bg-[#1e5352] text-white p-2.5 rounded-xl shadow-lg text-[10px] font-sans space-y-0.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <p className="text-slate-300 font-medium">Jul Live Peak</p>
                <p className="font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Active PC Load
                </p>
                <p className="text-xs font-black font-sans">92.4% Occupancy</p>
              </div>
            )}

            <div className="w-full h-48 pl-8 pr-2 relative z-10">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 550 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="labTelemetryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e5352" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1e5352" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path 
                  d={`${waveSvgPath} L 540 140 L 0 140 Z`} 
                  fill="url(#labTelemetryGradient)" 
                  className="transition-all duration-700 ease-in-out"
                />

                <path 
                  d={waveSvgPath} 
                  fill="none" 
                  stroke="#1e5352" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700 ease-in-out"
                />

                <circle cx="315" cy="45" r="4" fill="#ffffff" stroke="#1e5352" strokeWidth="3" />
              </svg>
            </div>

            <div className="flex justify-between pl-8 pr-2 text-[10px] font-semibold text-slate-400 mt-2">
              {telemetryMonthlyData.map((m, idx) => (
                <span key={idx} className="cursor-pointer hover:text-[#1e5352] transition" onMouseEnter={() => setHoveredPoint(idx)}>
                  {m.month}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT (1 COL): FULLY DYNAMIC RESOURCE ALLOCATION PIE / DONUT CHART */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Resource Allocation</h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time assets per ComLab</p>
            </div>
            <div className="relative">
              <select 
                value={pieTimeframe} 
                onChange={(e) => setPieTimeframe(e.target.value)}
                className="text-xs font-semibold text-slate-500 bg-transparent pr-5 appearance-none cursor-pointer focus:outline-none"
              >
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* DYNAMIC SVG DONUT CHART (REACTS TO TABLE CRUD) */}
          <div className="flex items-center justify-center my-2 relative">
            <div className="w-40 h-40 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* ComLab 1 Segment */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" stroke="#1d8282" strokeWidth="3.8" 
                  strokeDasharray={`${labDistribution.p1} ${100 - labDistribution.p1}`} 
                  strokeDashoffset="0"
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 1')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                />
                {/* ComLab 2 Segment */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" stroke="#36b8b0" strokeWidth="3.8" 
                  strokeDasharray={`${labDistribution.p2} ${100 - labDistribution.p2}`} 
                  strokeDashoffset={`-${labDistribution.p1}`}
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 2')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                />
                {/* ComLab 3 Segment */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" stroke="#7ee0d6" strokeWidth="3.8" 
                  strokeDasharray={`${labDistribution.p3} ${100 - labDistribution.p3}`} 
                  strokeDashoffset={`-${labDistribution.p1 + labDistribution.p2}`}
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 3')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                />
                {/* ComLab 4 Segment */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" stroke="#c3f2ee" strokeWidth="3.8" 
                  strokeDasharray={`${labDistribution.p4} ${100 - labDistribution.p4}`} 
                  strokeDashoffset={`-${labDistribution.p1 + labDistribution.p2 + labDistribution.p3}`}
                  className="transition-all duration-500 cursor-pointer hover:opacity-80"
                  onMouseEnter={() => setHoveredPieSegment('ComLab 4')}
                  onMouseLeave={() => setHoveredPieSegment(null)}
                />
              </svg>
              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xs font-bold text-slate-800">{labDistribution.total}</span>
                <span className="text-[9px] text-slate-400 font-medium">Assets</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC LEGENDS WITH REAL-TIME PERCENTAGES */}
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[11px] font-semibold text-slate-600 border-t border-slate-50 pt-3">
            <div className={`flex items-center gap-2 p-1 rounded-lg transition ${hoveredPieSegment === 'ComLab 1' ? 'bg-slate-100' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d8282]"></span>
              <span>ComLab 1 ({labDistribution.p1}%)</span>
            </div>
            <div className={`flex items-center gap-2 p-1 rounded-lg transition ${hoveredPieSegment === 'ComLab 2' ? 'bg-slate-100' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#36b8b0]"></span>
              <span>ComLab 2 ({labDistribution.p2}%)</span>
            </div>
            <div className={`flex items-center gap-2 p-1 rounded-lg transition ${hoveredPieSegment === 'ComLab 3' ? 'bg-slate-100' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#7ee0d6]"></span>
              <span>ComLab 3 ({labDistribution.p3}%)</span>
            </div>
            <div className={`flex items-center gap-2 p-1 rounded-lg transition ${hoveredPieSegment === 'ComLab 4' ? 'bg-slate-100' : ''}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-[#c3f2ee]"></span>
              <span>ComLab 4 ({labDistribution.p4}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: LABTRACK EQUIPMENT DATA TABLE WITH QUICK STAT BADGES & EDIT HIGHLIGHT FIX */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-5">
        
        {/* HEADER WITH SEARCH & QUICK ANALYTICS PILLS */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Laboratory Equipment & Workstations</h3>
            <p className="text-[11px] text-slate-400 font-medium">Tracked hardware assets and network node health</p>
          </div>

          {/* Quick Analytics Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold">
            <button 
              onClick={() => setTableStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                tableStatusFilter === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({statusCounts.total})
            </button>
            <button 
              onClick={() => setTableStatusFilter('Optimal')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                tableStatusFilter === 'Optimal' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Optimal ({statusCounts.optimal})
            </button>
            <button 
              onClick={() => setTableStatusFilter('In Use')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                tableStatusFilter === 'In Use' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              In Use ({statusCounts.inUse})
            </button>
            <button 
              onClick={() => setTableStatusFilter('Maintenance')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                tableStatusFilter === 'Maintenance' ? 'bg-amber-600 text-white border-amber-600' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Maintenance ({statusCounts.maintenance})
            </button>
          </div>
        </div>

        {/* SEARCH & ADD ACTION BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search equipment, ID or lab..." 
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-slate-50 text-xs font-medium pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
            />
          </div>

          <button 
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="w-full sm:w-auto px-4 py-2 bg-[#eef7f6] hover:bg-[#1e5352] text-[#1e5352] hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Equipment</span>
          </button>
        </div>

        {/* ADD EQUIPMENT FORM */}
        {isAddingItem && (
          <form onSubmit={handleAddResource} className="p-4 bg-[#f4f8f7] rounded-xl border border-[#1e5352]/20 space-y-3 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-slate-800">Add New Laboratory Resource</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input 
                type="text" 
                placeholder="Equipment Name (e.g. Cisco Router)" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none"
                required
              />
              <select 
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value)}
                className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700"
              >
                <option value="ComLab 1 (Networking)">ComLab 1 (Networking)</option>
                <option value="ComLab 2 (Software Eng)">ComLab 2 (Software Eng)</option>
                <option value="ComLab 3 (AI & Multimedia)">ComLab 3 (AI & Multimedia)</option>
                <option value="ComLab 4 (General Lab)">ComLab 4 (General Lab)</option>
              </select>
              <input 
                type="text" 
                placeholder="Specs / Category" 
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none"
              />
              <select 
                value={newItemStatus}
                onChange={(e) => setNewItemStatus(e.target.value as any)}
                className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700"
              >
                <option value="Optimal">Optimal</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                type="button" 
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-3 py-1.5 bg-[#1e5352] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Save Resource
              </button>
            </div>
          </form>
        )}

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-semibold">Equipment Name</th>
                <th className="pb-3 font-semibold">Device ID</th>
                <th className="pb-3 font-semibold">Laboratory Location</th>
                <th className="pb-3 font-semibold">Specifications / Type</th>
                <th className="pb-3 font-semibold">Condition Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {filteredResources.length > 0 ? (
                filteredResources.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`transition-all ${
                      editingId === item.id 
                        ? 'bg-emerald-50/60 border-l-4 border-l-[#1e5352]' // Clean Soft Emerald Highlight (No Brown!)
                        : 'group hover:bg-slate-50/70'
                    }`}
                  >
                    {editingId === item.id ? (
                      <>
                        <td className="py-2.5 pl-3 pr-2">
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-[#1e5352] text-xs font-bold focus:outline-none shadow-2xs"
                          />
                        </td>
                        <td className="py-2.5 font-sans text-slate-500 font-bold">{item.code}</td>
                        <td className="py-2.5 pr-2">
                          <select 
                            value={editLocation} 
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:outline-none"
                          >
                            <option value="ComLab 1 (Networking)">ComLab 1 (Networking)</option>
                            <option value="ComLab 2 (Software Eng)">ComLab 2 (Software Eng)</option>
                            <option value="ComLab 3 (AI & Multimedia)">ComLab 3 (AI & Multimedia)</option>
                            <option value="ComLab 4 (General Lab)">ComLab 4 (General Lab)</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="text" 
                            value={editCategory} 
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <select 
                            value={editStatus} 
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:outline-none"
                          >
                            <option value="Optimal">Optimal</option>
                            <option value="In Use">In Use</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td className="py-2.5 text-right pr-3 font-medium space-x-2">
                          <button 
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-3 py-1.5 bg-[#1e5352] text-white rounded-lg text-xs font-bold hover:bg-[#143c3b] cursor-pointer shadow-2xs"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3.5 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3.5 font-sans text-slate-500">{item.code}</td>
                        <td className="py-3.5 text-slate-600">{item.location}</td>
                        <td className="py-3.5 text-slate-500">{item.category}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            item.status === 'Optimal' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.status === 'In Use'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-medium text-slate-400 space-x-2">
                          <button 
                            onClick={() => handleStartEdit(item)}
                            className="hover:text-slate-700 transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <span>â€¢</span>
                          <button 
                            onClick={() => handleDeleteResource(item.id)}
                            className="hover:text-rose-600 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No equipment found matching "{tableSearch}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default OverviewView;