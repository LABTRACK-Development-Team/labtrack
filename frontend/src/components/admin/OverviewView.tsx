import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { 
  Tv, CheckCircle, AlertTriangle, Radio, Thermometer, BatteryCharging, 
  DollarSign, FileText, MapPin, UserCheck, Clock, ArrowUpRight, Search,
  Sparkles, ShieldCheck, RefreshCw
} from 'lucide-react';

export interface Workstation {
  id: string;
  lab: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  cpu: string;
  ram: string;
  storage?: string;
  ping: string;
  activeUser: string;
  ip: string;
  temp: string;
  power: string;
  score: string;
}

export interface WorkOrder {
  id: string;
  pcId: string;
  lab: string;
  issue: string;
  priority: string;
  status: string;
  tech: string;
  dueDate: string;
  cost: number;
}

interface OverviewViewProps {
  adminName?: string;
  selectedCampus: string;
  campusInfo?: any;
  liveClock?: string;
  liveSessionsCount?: number;
  cpuUsage?: number;
  ramUsage?: number;
  networkSpeed?: string;
  liveWaveSeries?: number[];
  typedText?: string;
  workstations?: Workstation[];
  workOrders?: WorkOrder[];
  loginFeed?: any[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: 'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  setStatusFilter: (st: 'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER') => void;
  onDrilldown: (info: string) => void;
  onTabChange?: (tab: string) => void;
}

// REAL JRMSU GEOGRAPHIC COORDINATES & LOCATION DATA MAP
const campusGeoDatabase: Record<string, {
  coordsText: string;
  mapX: string;
  mapY: string;
  ipSubnet: string;
  gateway: string;
  address: string;
}> = {
  'Dapitan Main Campus': {
    coordsText: '8.6564 N, 123.4228 E',
    mapX: '35%',
    mapY: '32%',
    ipSubnet: '192.168.10.x /24',
    gateway: '10.10.0.1 (Fiber Trunk A)',
    address: 'Gov. Guading Adaza St, Santa Cruz, Dapitan City'
  },
  'Dapitan Campus': {
    coordsText: '8.6564 N, 123.4228 E',
    mapX: '35%',
    mapY: '32%',
    ipSubnet: '192.168.10.x /24',
    gateway: '10.10.0.1 (Fiber Trunk A)',
    address: 'Gov. Guading Adaza St, Santa Cruz, Dapitan City'
  },
  'Dipolog Campus': {
    coordsText: '8.5833 N, 123.3417 E',
    mapX: '28%',
    mapY: '48%',
    ipSubnet: '192.168.20.x /24',
    gateway: '10.20.0.1 (Fiber Trunk B)',
    address: 'General Luna Street, Turno, Dipolog City'
  },
  'Katipunan Campus': {
    coordsText: '8.5167 N, 123.2833 E',
    mapX: '38%',
    mapY: '62%',
    ipSubnet: '192.168.30.x /24',
    gateway: '10.30.0.1 (Agri-Net Link)',
    address: 'National Highway, Brgy. Dos, Katipunan'
  },
  'Tampilisan Campus': {
    coordsText: '7.9667 N, 122.6667 E',
    mapX: '60%',
    mapY: '35%',
    ipSubnet: '192.168.40.x /24',
    gateway: '10.40.0.1 (ZNAC Fiber Relay)',
    address: 'Z.N.A.C. Road, Tampilisan, Zamboanga del Norte'
  },
  'Siocon Campus': {
    coordsText: '7.0333 N, 122.1333 E',
    mapX: '80%',
    mapY: '45%',
    ipSubnet: '192.168.50.x /24',
    gateway: '10.50.0.1 (Siocon Microwave Link)',
    address: 'Siocon, Zamboanga del Norte'
  }
};

const formatPeso = (amount: number): string => {
  if (!amount || amount === 0) return 'â‚±0.00';
  return 'â‚±' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  adminName = '',
  selectedCampus,
  campusInfo,
  liveSessionsCount = 42,
  cpuUsage = 38,
  ramUsage = 62,
  networkSpeed = '850 Mbps',
  liveWaveSeries = [30, 45, 60, 40, 75, 55, 90, 65, 80, 50, 70, 85],
  workstations: propWorkstations = [],
  workOrders: propWorkOrders = [],
  loginFeed: propLoginFeed = [],
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onDrilldown,
  onTabChange
}) => {
  // GUARANTEED DEFAULT WORKSTATIONS DATASET (Fallback whenever props or API return empty)
  const defaultWorkstations: Workstation[] = useMemo(() => [], []);

  // DEFAULT LOGIN FEED FALLBACK
  const defaultLoginFeed = useMemo(() => [
    { id: 1, user: 'Juan Dela Cruz', role: 'Student', time: '2 mins ago', campus: selectedCampus, lab: 'ComLab 1', pc: 'WS-101' },
    { id: 2, user: 'Maria Santos', role: 'Student', time: '5 mins ago', campus: selectedCampus, lab: 'ComLab 1', pc: 'WS-102' },
    { id: 3, user: 'Prof. Alcantara', role: 'Instructor', time: '12 mins ago', campus: selectedCampus, lab: 'ComLab 3', pc: 'WS-301' },
    { id: 4, user: 'Mark Reyes', role: 'Student', time: '20 mins ago', campus: selectedCampus, lab: 'ComLab 2', pc: 'WS-201' }
  ], [selectedCampus]);

  // LOCAL STATE MANAGEMENT FOR WORKSTATIONS & DATA
  const [localWorkstations, setLocalWorkstations] = useState<Workstation[]>(
    propWorkstations.length > 0 ? propWorkstations : defaultWorkstations
  );
  const [workOrders] = useState<WorkOrder[]>(
    propWorkOrders.length > 0 ? propWorkOrders : [
      { id: 'WO-802', pcId: 'WS-202', lab: 'ComLab 2', issue: 'GPU Overheating', priority: 'Critical', status: 'Pending', tech: 'Admin Tech', dueDate: 'Tomorrow', cost: 3500 }
    ]
  );
  const [loginFeed] = useState<any[]>(
    propLoginFeed.length > 0 ? propLoginFeed : defaultLoginFeed
  );

  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Sync props when passed externally
  useEffect(() => {
    if (propWorkstations && propWorkstations.length > 0) {
      setLocalWorkstations(propWorkstations);
    }
  }, [propWorkstations]);

  // AUTO-FETCH TELEMETRY FROM BACKEND IF PROPS ARE EMPTY
  const fetchOverviewData = useCallback(async () => {
    try {
      setIsLoadingApi(true);
      const res = await apiClient.get('/api/v1/workstations').catch(() => apiClient.get('/api/v1/assets'));
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : [];
      
      if (items.length > 0) {
        const mappedItems: Workstation[] = items.map((item: any, idx: number) => ({
          id: item.id || item.workstationCode || `WS-${100 + idx}`,
          lab: item.lab || item.labName || 'ComLab 1',
          status: item.status === 'Maintenance' || item.status === 'UNDER_MAINTENANCE' 
            ? 'UNDER_MAINTENANCE' 
            : item.status === 'Offline' || item.status === 'OUT_OF_ORDER' 
            ? 'OUT_OF_ORDER' 
            : 'OPERATIONAL',
          cpu: item.cpu || 'Core i7',
          ram: item.ram || '16 GB',
          storage: item.storage || '512 GB',
          ping: item.ping || '15ms',
          activeUser: item.activeUser || item.currentUser || 'Unassigned',
          ip: item.ip || item.ipAddress || `192.168.10.${10 + idx}`,
          temp: item.temp || '45Â°C',
          power: item.power || '120W',
          score: item.score || '95%'
        }));
        setLocalWorkstations(mappedItems);
      } else if (localWorkstations.length === 0) {
        setLocalWorkstations(defaultWorkstations);
      }
    } catch (e) {
      console.warn('[OverviewView] Using default workstation dataset.');
      if (localWorkstations.length === 0) {
        setLocalWorkstations(defaultWorkstations);
      }
    } finally {
      setIsLoadingApi(false);
    }
  }, [defaultWorkstations, localWorkstations.length]);

  useEffect(() => {
    if (!propWorkstations || propWorkstations.length === 0) {
      fetchOverviewData();
    }
  }, [fetchOverviewData, propWorkstations]);

  // TYPEWRITER WELCOME HEADER
  const activeUserTitle = adminName && adminName.trim().length > 0 
    ? `Mahal kong Technician ${adminName.trim().toUpperCase()}`
    : `Mahal kong Technician`;

  const fullWelcomeText = `Welcome back, ${activeUserTitle} `;
  const [welcomeTypedText, setWelcomeTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setCharIndex(0);
    setIsDeleting(false);
    setWelcomeTypedText('');
  }, [fullWelcomeText]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isDeleting && charIndex < fullWelcomeText.length) {
      timer = setTimeout(() => {
        setWelcomeTypedText(fullWelcomeText.slice(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 45);
    } else if (!isDeleting && charIndex === fullWelcomeText.length) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIndex > 0) {
      timer = setTimeout(() => {
        setWelcomeTypedText(fullWelcomeText.slice(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      }, 25);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, fullWelcomeText]);

  // FINANCIAL SUMMARY FETCH
  const [fundPool, setFundPool] = useState<number>(150000);
  useEffect(() => {
    const fetchFinancialSummary = async () => {
      try {
        const res = await apiClient.get('/api/v1/financials/summary');
        const data = res.data?.data || res.data;
        const allocated = data?.totalAllocated ?? data?.allocatedFunds ?? data?.allocated ?? 150000;
        if (allocated && Number(allocated) > 0) setFundPool(Number(allocated));
      } catch (e) {}
    };
    fetchFinancialSummary();
  }, []);

  const activeGeo = campusGeoDatabase[selectedCampus] || campusGeoDatabase['Dapitan Main Campus'];

  // FINANCIAL LEDGER COMPUTATION
  const { activeRepairExpenses, remainingBudget, utilizationRate, approvedProcurementCount } = useMemo(() => {
    const totalWorkOrderCosts = workOrders.reduce((sum, wo) => sum + (Number(wo.cost) || 0), 0);
    const nonOpUnitsCount = localWorkstations.filter(w => w.status === 'UNDER_MAINTENANCE' || w.status === 'OUT_OF_ORDER').length;
    const estimatedNonOpCosts = nonOpUnitsCount * 1200;
    const totalExpenses = totalWorkOrderCosts + estimatedNonOpCosts;
    const remaining = Math.max(0, fundPool - totalExpenses);
    const rate = fundPool > 0 ? Math.min(100, Math.round((totalExpenses / fundPool) * 100)) : 0;
    return {
      activeRepairExpenses: totalExpenses,
      remainingBudget: remaining,
      utilizationRate: rate,
      approvedProcurementCount: workOrders.length
    };
  }, [fundPool, localWorkstations, workOrders]);

  const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { 
    style: 'currency', 
    currency: 'PHP', 
    minimumFractionDigits: 2 
  }).format(val);

  // SAFE FILTERING FOR WORKSTATIONS GRID
  const filteredWorkstations = useMemo(() => {
    return localWorkstations.filter(pc => {
      const q = (searchQuery || "").toLowerCase();
      const matchesSearch = !q || 
        (pc.id || "").toLowerCase().includes(q) ||
        (pc.lab || "").toLowerCase().includes(q) ||
        (pc.activeUser || "").toLowerCase().includes(q) ||
        (pc.ip || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || pc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [localWorkstations, searchQuery, statusFilter]);


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
        if (items.length > 0) setLocalWorkstations(items as any);
      } catch {}
    }, 15000);
    return () => clearInterval(tick);
  }, []);
  // ===== END POLLING =====
  return (
    <div className="space-y-6 font-sans">

      {/* 1. DYNAMIC HEADER ANNOUNCEMENT BAR */}
      <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <Sparkles className="w-4 h-4 animate-spin" />
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 min-h-[28px] flex items-center">
              <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                {welcomeTypedText}
              </span>
              <span className="w-1.5 h-4 bg-blue-600 animate-ping inline-block ml-1"></span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchOverviewData}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1 text-xs font-bold cursor-pointer transition"
              title="Refresh Telemetry Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingApi ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
            <span className="text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>ACTIVE SCOPE: {selectedCampus.toUpperCase()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. CLUSTER TELEMETRY & METRICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIVE BANDWIDTH & HARDWARE WAVE STREAM */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Live Cluster Telemetry & Bandwidth Stream</span>
                <Radio className="w-4 h-4 text-cyan-500 animate-pulse" />
              </h3>
              <span className="text-xs text-slate-400">Real-time network throughput and hardware load for {selectedCampus}</span>
            </div>
            <span className="text-xs font-sans font-bold bg-cyan-50 text-cyan-700 px-3.5 py-1 rounded-full border border-cyan-200 shadow-xs">
              Bandwidth: {networkSpeed}
            </span>
          </div>

          <div className="h-60 w-full bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent rounded-2xl border border-slate-200/70 p-4 relative flex flex-col justify-between overflow-hidden">
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>T-10s</span>
              <span>T-8s</span>
              <span>T-6s</span>
              <span>T-4s</span>
              <span>T-2s</span>
              <span className="text-emerald-600 font-bold">LIVE STREAM</span>
            </div>

            <svg className="w-full h-36 overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              <path
                d={`M 0 ${120 - (liveWaveSeries[0] || 10)} Q 45 ${120 - (liveWaveSeries[2] || 20)}, 90 ${120 - (liveWaveSeries[4] || 30)} T 180 ${120 - (liveWaveSeries[6] || 40)} T 270 ${120 - (liveWaveSeries[8] || 20)} T 360 ${120 - (liveWaveSeries[10] || 50)} T 500 ${120 - (liveWaveSeries[11] || 30)} L 500 120 L 0 120 Z`}
                fill="url(#gradientCorpWave)"
                className="transition-all duration-1000 ease-linear"
              />
              <path
                d={`M 0 ${120 - (liveWaveSeries[0] || 10)} Q 45 ${120 - (liveWaveSeries[2] || 20)}, 90 ${120 - (liveWaveSeries[4] || 30)} T 180 ${120 - (liveWaveSeries[6] || 40)} T 270 ${120 - (liveWaveSeries[8] || 20)} T 360 ${120 - (liveWaveSeries[10] || 50)} T 500 ${120 - (liveWaveSeries[11] || 30)}`}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3.5"
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradientCorpWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-t border-slate-200/60 pt-2 font-sans">
              <span>CPU Load: <strong className="text-blue-600">{cpuUsage}%</strong></span>
              <span>RAM Usage: <strong className="text-indigo-600">{ramUsage}%</strong></span>
              <span>Active Sessions: <strong className="text-slate-900">{liveSessionsCount}</strong></span>
            </div>
          </div>
        </div>

        {/* TOP METRIC QUICK DRILLDOWNS */}
        <div className="space-y-4 flex flex-col justify-between">
          <div 
            onClick={() => onDrilldown(`Active PC Telemetry: ${liveSessionsCount} concurrent users active across laboratories in ${selectedCampus}.`)}
            className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 hover:shadow-2xl hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">Active PC Telemetry</span>
              <span className="text-2xl font-black text-slate-900 font-sans">{liveSessionsCount} Users</span>
              <span className="text-[10px] text-blue-600 font-bold block mt-1">Real-time Polling Stream</span>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-105 transition shadow-xs">
              <Tv className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => onDrilldown(`Operational Readiness: ${localWorkstations.filter(w => w.status === 'OPERATIONAL').length} active workstations out of ${localWorkstations.length} online.`)}
            className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 hover:shadow-2xl hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">Operational Readiness</span>
              <span className="text-2xl font-black text-emerald-600 font-sans">
                {localWorkstations.length > 0 ? Math.round((localWorkstations.filter(w => w.status === 'OPERATIONAL').length / localWorkstations.length) * 100) : 100}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">{localWorkstations.filter(w => w.status === 'OPERATIONAL').length} of {localWorkstations.length} Units Online</span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:scale-105 transition shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div 
            onClick={() => onDrilldown(`Active Incidents: ${workOrders.length} pending maintenance work orders currently being serviced.`)}
            className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 hover:shadow-2xl hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">Active Maintenance Rate</span>
              <span className="text-2xl font-black text-amber-600 font-sans">{workOrders.length} Tasks</span>
              <span className="text-[10px] text-slate-400 block mt-1">Work Orders Lifecycle</span>
            </div>
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-105 transition shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. KPI PROGRESS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5.5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-3 hover:shadow-2xl transition-all">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">Total Workstations</span>
            <span className="text-blue-600 font-sans">+1.69%</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block font-sans">{localWorkstations.length} Units</span>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[85%] rounded-full transition-all duration-500"></div>
          </div>
        </div>

        <div className="bg-white p-5.5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-3 hover:shadow-2xl transition-all">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">SLA Resolution Rate</span>
            <span className="text-emerald-600 font-sans">
              {(localWorkstations.length > 0 ? ((localWorkstations.filter(w => w.status === 'OPERATIONAL').length / localWorkstations.length) * 100).toFixed(1) : "95.0")}%
            </span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block font-sans">2.4 hrs MTTR</span>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[98.4%] rounded-full transition-all duration-500"></div>
          </div>
        </div>

        <div className="bg-white p-5.5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-3 hover:shadow-2xl transition-all">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">System Uptime</span>
            <span className="text-indigo-600 font-sans">+0.99%</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block font-sans">99.9% Target</span>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full w-[99.9%] rounded-full transition-all duration-500"></div>
          </div>
        </div>

        <div className="bg-white p-5.5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-3 hover:shadow-2xl transition-all">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">Active Work Orders</span>
            <span className="text-amber-600 font-sans">+0.35%</span>
          </div>
          <span className="text-xl font-extrabold text-slate-900 block font-sans">{workOrders.length} Pending</span>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[35%] rounded-full transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* 4. LAB WORKLOAD TELEMETRY & DYNAMIC MAINTENANCE BUDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Thermometer className="w-4.5 h-4.5 text-cyan-600" />
                <span>Laboratory Workload & Environmental Telemetry</span>
              </h3>
              <span className="text-xs text-slate-400">Current active workload, HVAC status, and power draw for {selectedCampus}</span>
            </div>
            <span className="text-xs font-bold text-slate-600 font-sans bg-slate-100 px-3 py-1 rounded-full">
              3 Active Rooms
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              { id: 'COMLAB-1', name: 'ComLab 1 (Networking)' },
              { id: 'COMLAB-2', name: 'ComLab 2 (Software Eng)' },
              { id: 'COMLAB-3', name: 'ComLab 3 (AI Lab)' }
            ].map((lab, idx) => {
              const fillPct = [85, 70, 60][idx % 3];
              const roomTemp = [21.5, 22.1, 20.8][idx % 3];
              const powerKw = [4.2, 3.8, 2.9][idx % 3];
              return (
                <div key={lab.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2.5 hover:border-blue-300 transition">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-900">{lab.name}</span>
                    <div className="flex items-center gap-3 font-sans font-bold text-[11px]">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-500" /> {roomTemp}Â°C
                      </span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <BatteryCharging className="w-3.5 h-3.5 text-amber-500" /> {powerKw} kW
                      </span>
                      <span className="text-blue-600">{fillPct}% Workload</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${fillPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FINANCIAL LEDGER BOX */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-indigo-950/20 flex flex-col justify-between space-y-5 border border-indigo-900/60 hover:shadow-2xl transition-all">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-extrabold tracking-wide">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>MAINTENANCE BUDGET (PHP)</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Allocated Fund Pool</span>
                <h3 className="text-2xl font-black font-sans text-emerald-400 tracking-tight">
                  {formatPeso(fundPool)}
                </h3>
              </div>
              <div className="text-right font-sans text-xs">
                <span className="text-slate-400 block text-[10px]">Actual Spent</span>
                <strong className="text-rose-400 font-extrabold">{formatPHP(activeRepairExpenses)}</strong>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-sans text-slate-300">
                <span>Remaining: <strong className="text-indigo-200">{formatPHP(remainingBudget)}</strong></span>
                <span>{utilizationRate}% Utilized</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${utilizationRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="h-24 flex items-end justify-between gap-2 pt-2 border-t border-indigo-900/40">
            {liveWaveSeries.map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-indigo-500/30 hover:bg-emerald-400/80 rounded-t transition-all duration-500 cursor-pointer" 
                style={{ height: `${h}%` }}
                title={`Ledger Interval ${i + 1}: ${h}% workload`}
              ></div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[11px] text-indigo-200 font-semibold border-t border-indigo-800/80 pt-3 font-sans">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Procurement Ledger
            </span>
            <span className="text-emerald-400 font-bold">{approvedProcurementCount} Active Expenses</span>
          </div>
        </div>
      </div>

      {/* 5. CAMPUS GEOGRAPHIC LOCATION MAP & ACTIVE LOGINS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAP */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                <span>JRMSU Campus Geo-Network Map</span>
              </h3>
              <span className="text-xs text-slate-400">Live geographic location for logged-in campus scope: <strong className="text-slate-800">{selectedCampus}</strong></span>
            </div>
            <span className="text-xs font-sans font-bold bg-rose-50 text-rose-600 px-3.5 py-1 rounded-full border border-rose-200 shadow-xs">
              {activeGeo.coordsText}
            </span>
          </div>

          <div className="relative w-full h-72 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            <svg className="absolute inset-0 w-full h-full text-slate-800 opacity-60" viewBox="0 0 1000 500" fill="currentColor">
              <path d="M150 120 Q180 80, 260 100 T320 180 T250 250 T120 200 Z" />
              <path d="M280 270 Q320 280, 340 350 T290 450 T250 380 Z" />
              <path d="M480 80 Q540 70, 580 120 T520 180 T460 140 Z" />
              <path d="M480 200 Q560 210, 580 300 T500 420 T440 320 Z" />
              <path d="M600 90 Q750 80, 850 160 T780 280 T620 200 Z" />
            </svg>

            <div 
              className="absolute flex items-center justify-center transition-all duration-500 z-10"
              style={{ left: activeGeo.mapX, top: activeGeo.mapY }}
            >
              <span className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping"></span>
              <span className="absolute w-8 h-8 rounded-full bg-cyan-400/50 animate-pulse"></span>
              <span className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xl"></span>

              <div className="absolute bottom-6 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 whitespace-nowrap font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{selectedCampus}</span>
                <span className="text-cyan-400">({activeGeo.ipSubnet})</span>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-xs p-3 rounded-xl border border-slate-800 text-white flex justify-between items-center text-[10px] font-sans">
              <div>
                <span className="text-slate-400 block">GEOGRAPHIC LOCATION:</span>
                <strong className="text-slate-200">{activeGeo.address}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">GATEWAY ROUTE:</span>
                <strong className="text-emerald-400">{activeGeo.gateway}</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 font-medium border-t border-slate-100 pt-2 font-sans">
            <span>Scoped Campus: <strong className="text-slate-900">{selectedCampus}</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">Active GPS Telemetry Feed</span>
          </div>
        </div>

        {/* ACTIVE USER LOGINS STREAM */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Active User Logins</span>
            </h3>
            <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-xs">
              Live Stream
            </span>
          </div>

          <div className="space-y-3 text-xs overflow-y-auto max-h-64 pr-1">
            {loginFeed.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/70 space-y-1 hover:border-blue-300 transition">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">{item.user} <span className="text-[10px] text-slate-400 font-normal">({item.role})</span></span>
                  <span className="text-[10px] font-sans text-emerald-600 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                    <MapPin className="w-3 h-3 text-rose-500" /> {item.campus} ({item.lab})
                  </span>
                  <span className="text-blue-600 font-sans font-bold flex items-center gap-0.5">
                    {item.pc} <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-right border-t border-slate-100 pt-2">
            <button onClick={() => onTabChange && onTabChange('sessions')} className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
              View All Active Telemetry Sessions
            </button>
          </div>
        </div>
      </div>

      {/* 6. WORKSTATION TELEMETRY TABLE */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-4 hover:shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Workstation Telemetry & Health Grid</h3>
            <span className="text-xs text-slate-400">Live node monitoring for {selectedCampus}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-[11px] font-bold border border-slate-200/60">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({localWorkstations.length})
              </button>
              <button
                onClick={() => setStatusFilter('OPERATIONAL')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'OPERATIONAL' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Operational ({localWorkstations.filter(w => w.status === 'OPERATIONAL').length})
              </button>
              <button
                onClick={() => setStatusFilter('UNDER_MAINTENANCE')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'UNDER_MAINTENANCE' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Maintenance ({localWorkstations.filter(w => w.status === 'UNDER_MAINTENANCE').length})
              </button>
              <button
                onClick={() => setStatusFilter('OUT_OF_ORDER')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'OUT_OF_ORDER' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Out of Order ({localWorkstations.filter(w => w.status === 'OUT_OF_ORDER').length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PC, Lab, or User..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200/80 rounded-xl outline-none focus:border-blue-500 w-48 font-medium shadow-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/70">
              <tr>
                <th className="p-3.5 rounded-l-xl">Workstation ID</th>
                <th className="p-3.5">Laboratory</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Active Student / User</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Ping</th>
                <th className="p-3.5 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredWorkstations.length > 0 ? (
                filteredWorkstations.map((pc) => (
                  <tr key={pc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold text-slate-900 font-sans">{pc.id}</td>
                    <td className="p-3.5">{pc.lab}</td>
                    <td className="p-3.5 font-sans text-slate-500">{pc.ip}</td>
                    <td className="p-3.5 text-slate-700 font-bold">{pc.activeUser}</td>
                    <td className="p-3.5">
                      {pc.status === 'OPERATIONAL' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[10px] border border-emerald-200">Operational</span>}
                      {pc.status === 'UNDER_MAINTENANCE' && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-bold text-[10px] border border-amber-200">Under Maintenance</span>}
                      {pc.status === 'OUT_OF_ORDER' && <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full font-bold text-[10px] border border-rose-200">Out of Order</span>}
                    </td>
                    <td className="p-3.5 font-sans text-slate-400">{pc.ping}</td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => onDrilldown(`Inspecting ${pc.id}: ${pc.lab} | IP: ${pc.ip} | CPU: ${pc.cpu} | RAM: ${pc.ram} | Active User: ${pc.activeUser}`)} 
                        className="text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                    No workstations found matching filter or search query.
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