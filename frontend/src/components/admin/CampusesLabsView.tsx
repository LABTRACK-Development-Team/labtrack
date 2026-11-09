import apiClient from '@/lib/api-client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building, Globe, Layers, Thermometer, Zap, Search, X, 
  Radio, Plus, Edit3, Trash2, ShieldAlert, MapPin, Info
} from 'lucide-react';

export interface LabInfo {
  id: string;
  name: string;
  pcCount: number;
  location: string;
  ipRange: string;
  switchTag: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER';
  temp?: string;
  powerKw?: string;
}

interface CampusesLabsViewProps {
  selectedCampus: string;
  campusInfo?: any;
  triggerNotification?: (msg: string) => void;
  onUpdateCampusLabs?: (campusName: string, updatedLabs: LabInfo[]) => void;
}

const defaultJrmsuCampusDatabase: Record<string, {
  fullName: string;
  locationAddress: string;
  gpsCoords: string;
  labs: LabInfo[];
}> = {
  'Dapitan Main Campus': {
    fullName: 'JRMSU Dapitan Main Campus',
    locationAddress: 'Gov. Guading Adaza Street, Santa Cruz, Dapitan City, Zamboanga del Norte',
    gpsCoords: '8.6564 N, 123.4228 E',
    labs: [
      { id: 'DAP-LAB-1', name: 'ComLab 1 (College of Computing)', pcCount: 40, location: '2nd Floor', ipRange: '192.168.0.1 - 40', switchTag: 'SW-DAP-01', status: 'OPERATIONAL', temp: '21.5Â°C', powerKw: '3.5' },
      { id: 'DAP-LAB-2', name: 'ComLab 2 (Multimedia Lab)', pcCount: 35, location: '3rd Floor', ipRange: '192.168.0.41 - 75', switchTag: 'SW-DAP-02', status: 'OPERATIONAL', temp: '21.5Â°C', powerKw: '3.5' },
      { id: 'DAP-LAB-3', name: 'ComLab 3 (General Lab)', pcCount: 30, location: 'Ground Floor', ipRange: '192.168.0.76 - 105', switchTag: 'SW-DAP-03', status: 'OPERATIONAL', temp: '22.0Â°C', powerKw: '3.2' }
    ]
  },
  'Dapitan Campus': {
    fullName: 'JRMSU Dapitan Main Campus',
    locationAddress: 'Gov. Guading Adaza Street, Santa Cruz, Dapitan City, Zamboanga del Norte',
    gpsCoords: '8.6564 N, 123.4228 E',
    labs: [
      { id: 'DAP-LAB-1', name: 'ComLab 1 (College of Computing)', pcCount: 40, location: '2nd Floor', ipRange: '192.168.0.1 - 40', switchTag: 'SW-DAP-01', status: 'OPERATIONAL', temp: '21.5Â°C', powerKw: '3.5' }
    ]
  },
  'Dipolog Campus': {
    fullName: 'JRMSU Dipolog Campus',
    locationAddress: 'General Luna Street, Turno, Dipolog City, Zamboanga del Norte',
    gpsCoords: '8.5833 N, 123.3417 E',
    labs: [
      { id: 'DIP-LAB-1', name: 'ComLab 1', pcCount: 30, location: 'Academic Building - 2nd Floor', ipRange: '192.168.20.1 - 30', switchTag: 'SW-DIP-01', status: 'OPERATIONAL', temp: '21.8Â°C', powerKw: '3.9' },
      { id: 'DIP-LAB-2', name: 'ComLab 2', pcCount: 25, location: 'Ground Floor', ipRange: '192.168.20.31 - 55', switchTag: 'SW-DIP-02', status: 'UNDER_MAINTENANCE', temp: '24.4Â°C', powerKw: '3.5' }
    ]
  },
  'Katipunan Campus': {
    fullName: 'JRMSU Katipunan Campus',
    locationAddress: 'National Highway, Barangay Dos, Katipunan, Zamboanga del Norte',
    gpsCoords: '8.5167 N, 123.2833 E',
    labs: [
      { id: 'KAT-LAB-1', name: 'ComLab 1', pcCount: 25, location: 'Room 102', ipRange: '192.168.30.1 - 25', switchTag: 'SW-KAT-01', status: 'OPERATIONAL', temp: '22.1Â°C', powerKw: '3.4' }
    ]
  },
  'Tampilisan Campus': {
    fullName: 'JRMSU Tampilisan Campus',
    locationAddress: 'Z.N.A.C. Road, Tampilisan, Zamboanga del Norte',
    gpsCoords: '7.9667 N, 122.6667 E',
    labs: [
      { id: 'TAM-LAB-1', name: 'ComLab 1', pcCount: 25, location: 'Administration Building - 2nd Floor', ipRange: '192.168.40.1 - 25', switchTag: 'SW-TAM-01', status: 'OPERATIONAL', temp: '21.0Â°C', powerKw: '3.6' }
    ]
  },
  'Siocon Campus': {
    fullName: 'JRMSU Siocon Campus',
    locationAddress: 'Siocon, Zamboanga del Norte',
    gpsCoords: '7.0333 N, 122.1333 E',
    labs: [
      { id: 'SIO-LAB-1', name: 'ComLab 1', pcCount: 20, location: 'Main Academic Wing - Room 3', ipRange: '192.168.50.1 - 20', switchTag: 'SW-SIO-01', status: 'OPERATIONAL', temp: '22.2Â°C', powerKw: '3.0' }
    ]
  }
};

export const CampusesLabsView: React.FC<CampusesLabsViewProps> = ({
  selectedCampus,
  campusInfo,
  triggerNotification = () => {},
  onUpdateCampusLabs
}) => {
  const [showNodeLines, setShowNodeLines] = useState(true);
  const [showHvacOverlay, setShowHvacOverlay] = useState(true);
  const [showPowerGrid, setShowPowerGrid] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('ALL');

  const [campusDb, setCampusDb] = useState(defaultJrmsuCampusDatabase);
  const [localLabs, setLocalLabs] = useState<LabInfo[]>([]);

  // Campus key lookup normalization
  const getNormalizedCampusKey = useCallback((targetCampus: string) => {
    if (campusDb[targetCampus]) return targetCampus;
    const match = Object.keys(campusDb).find(
      key => (key || "").toLowerCase().includes((targetCampus || "").toLowerCase()) || (targetCampus || "").toLowerCase().includes((key || "").toLowerCase())
    );
    return match || 'Dapitan Main Campus';
  }, [campusDb]);

  const activeCampusKey = getNormalizedCampusKey(selectedCampus);

  // Initial Sync from props or local Database state ONLY when selectedCampus changes
  useEffect(() => {
    if (campusInfo?.labs && Array.isArray(campusInfo.labs) && campusInfo.labs.length > 0) {
      setLocalLabs(campusInfo.labs);
    } else {
      const existing = campusDb[activeCampusKey]?.labs || [];
      setLocalLabs(existing);
    }
  }, [selectedCampus, campusInfo?.labs, activeCampusKey]);

  // Backend API Fallback Hook
  useEffect(() => {
    apiClient.get('/api/v1/laboratories')
      .then((res: any) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const mapped: LabInfo[] = data.map((l: any, idx: number) => ({
            id: l.id || `LAB-${idx + 1}`,
            name: l.name || `ComLab ${idx + 1}`,
            pcCount: l.capacity || 25,
            location: [l.building, l.roomNumber].filter(Boolean).join(' ') || 'Academic Building',
            ipRange: l.ipRange || `192.168.10.${idx * 30 + 1} - ${idx * 30 + 30}`,
            switchTag: l.switchTag || `SW-CORE-0${idx + 1}`,
            status: l.isActive ? 'OPERATIONAL' : 'UNDER_MAINTENANCE',
            temp: '21.5Â°C',
            powerKw: '3.5'
          }));

          setLocalLabs(mapped);
          setCampusDb(prev => ({
            ...prev,
            [activeCampusKey]: { ...prev[activeCampusKey], labs: mapped }
          }));
        }
      })
      .catch(() => {});
  }, [activeCampusKey]);

  const activeCampusMeta = campusDb[activeCampusKey] || {
    fullName: `JRMSU ${selectedCampus}`,
    locationAddress: 'Gov. Guading Adaza Street, Santa Cruz, Dapitan City, Zamboanga del Norte',
    gpsCoords: '8.6564 N, 123.4228 E',
    labs: localLabs
  };

  const [selectedLabModal, setSelectedLabModal] = useState<LabInfo | null>(null);
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabInfo | null>(null);
  const [deletingLabId, setDeletingLabId] = useState<string | null>(null);

  // Form States
  const [formLabId, setFormLabId] = useState('');
  const [formLabName, setFormLabName] = useState('');
  const [formPcCount, setFormPcCount] = useState<number>(30);
  const [formLocation, setFormLocation] = useState('');
  const [formIpRange, setFormIpRange] = useState('');
  const [formSwitchTag, setFormSwitchTag] = useState('');
  const [formStatus, setFormStatus] = useState<'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('OPERATIONAL');

  const filteredLabs = localLabs.filter(lab => {
    const query = (searchQuery || "").toLowerCase();
    const matchesSearch = (lab.name || '').toLowerCase().includes(query) ||
                          (lab.id || '').toLowerCase().includes(query) ||
                          (lab.location || '').toLowerCase().includes(query) ||
                          (lab.switchTag || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || lab.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetFormFields = () => {
    setFormLabId('');
    setFormLabName('');
    setFormPcCount(30);
    setFormLocation('');
    setFormIpRange('');
    setFormSwitchTag('');
    setFormStatus('OPERATIONAL');
  };

  // Helper for applying CRUD state updates cleanly
  const commitStateUpdates = (updatedList: LabInfo[]) => {
    setLocalLabs(updatedList);
    setCampusDb(prev => ({
      ...prev,
      [activeCampusKey]: {
        ...(prev[activeCampusKey] || {
          fullName: `JRMSU ${selectedCampus}`,
          locationAddress: 'Campus Main Grounds',
          gpsCoords: '8.6500 N, 123.4200 E'
        }),
        labs: updatedList
      }
    }));

    if (onUpdateCampusLabs) {
      onUpdateCampusLabs(selectedCampus, updatedList);
    }
  };

  // Dynamic Topology Coordinates
  const getLabNodeX = (index: number, total: number) => {
    if (total <= 1) return 200;
    const startX = 50;
    const endX = 350;
    return Math.round(startX + (index * (endX - startX)) / (total - 1));
  };

  // Dynamic Grid Box Layout Calculation
  const getFloorPlanBoxCoords = (index: number, total: number) => {
    const cols = total <= 2 ? total : total <= 6 ? 3 : 4;
    const rows = Math.ceil(total / cols);

    const containerW = 370;
    const containerH = 170;
    const startX = 15;
    const startY = 15;
    const gapX = 10;
    const gapY = 10;

    const boxW = (containerW - (cols - 1) * gapX) / cols;
    const boxH = (containerH - (rows - 1) * gapY) / rows;

    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: startX + col * (boxW + gapX),
      y: startY + row * (boxH + gapY),
      width: boxW,
      height: boxH
    };
  };

  // 1. ADD LABORATORY
  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = formLabId.trim().toUpperCase();
    const newName = formLabName.trim();

    if (!newId || !newName) {
      triggerNotification('Please specify a valid Room ID and Name.');
      return;
    }

    if (localLabs.some(l => l.id === newId)) {
      triggerNotification(`Laboratory ID "${newId}" already exists!`);
      return;
    }

    const newLab: LabInfo = {
      id: newId,
      name: newName,
      pcCount: Number(formPcCount) || 30,
      location: formLocation.trim() || 'Academic Building',
      ipRange: formIpRange.trim() || '192.168.0.1 - 30',
      switchTag: formSwitchTag.trim().toUpperCase() || 'SW-DAP-01',
      status: formStatus,
      temp: '21.5Â°C',
      powerKw: '3.5'
    };

    const updated = [...localLabs, newLab];
    commitStateUpdates(updated);
    setIsAddLabOpen(false);
    resetFormFields();
    triggerNotification(`Added new laboratory "${newLab.name}" (${newLab.id}).`);
  };

  // OPEN EDIT MODAL
  const handleOpenEditModal = (lab: LabInfo) => {
    setEditingLab(lab);
    setFormLabId(lab.id);
    setFormLabName(lab.name);
    setFormPcCount(lab.pcCount);
    setFormLocation(lab.location);
    setFormIpRange(lab.ipRange);
    setFormSwitchTag(lab.switchTag);
    setFormStatus(lab.status);
  };

  // 2. EDIT LABORATORY
  const handleUpdateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab) return;

    const newId = formLabId.trim().toUpperCase();
    const newName = formLabName.trim();

    if (!newId || !newName) {
      triggerNotification('Room ID and Name cannot be empty.');
      return;
    }

    if (newId !== editingLab.id && localLabs.some(l => l.id === newId)) {
      triggerNotification(`Laboratory ID "${newId}" already exists!`);
      return;
    }

    const updatedList = localLabs.map(lab => {
      if (lab.id === editingLab.id) {
        return {
          ...lab,
          id: newId,
          name: newName,
          pcCount: Number(formPcCount) || lab.pcCount,
          location: formLocation.trim() || lab.location,
          ipRange: formIpRange.trim() || lab.ipRange,
          switchTag: formSwitchTag.trim().toUpperCase() || lab.switchTag,
          status: formStatus
        };
      }
      return lab;
    });

    commitStateUpdates(updatedList);

    if (selectedLabModal?.id === editingLab.id) {
      const activeObj = updatedList.find(l => l.id === newId);
      if (activeObj) setSelectedLabModal(activeObj);
    }

    setEditingLab(null);
    resetFormFields();
    triggerNotification(`Successfully updated "${newName}".`);
  };

  // 3. DELETE LABORATORY
  const handleDeleteLabConfirm = () => {
    if (!deletingLabId) return;

    const updatedList = localLabs.filter(l => l.id !== deletingLabId);
    commitStateUpdates(updatedList);

    if (selectedLabModal?.id === deletingLabId) {
      setSelectedLabModal(null);
    }

    triggerNotification(`Laboratory ${deletingLabId} deleted.`);
    setDeletingLabId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* WRAPPER CARD */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Campuses & Labs Topology</span>
                <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                  SCOPE: {selectedCampus}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="font-extrabold text-slate-800">{activeCampusMeta.fullName}</span>
                <span className="text-slate-300">•</span>
                <span>{activeCampusMeta.locationAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              type="button"
              onClick={() => {
                resetFormFields();
                setFormLabId(`DAP-LAB-${localLabs.length + 1}`);
                setFormLabName(`ComLab ${localLabs.length + 1}`);
                setFormIpRange(`192.168.0.${localLabs.length * 35 + 1} - ${localLabs.length * 35 + 35}`);
                setFormSwitchTag(`SW-DAP-0${localLabs.length + 1}`);
                setIsAddLabOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Laboratory
            </button>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 shadow-inner">
              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showNodeLines ? 'bg-white text-blue-700 shadow-xs border border-blue-200' : 'text-slate-500'}`}>
                <Radio className={`w-3.5 h-3.5 ${showNodeLines ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                <span>Node Lines</span>
                <input type="checkbox" checked={showNodeLines} onChange={(e) => setShowNodeLines(e.target.checked)} className="sr-only" />
              </label>

              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showHvacOverlay ? 'bg-white text-cyan-700 shadow-xs border border-cyan-200' : 'text-slate-500'}`}>
                <Thermometer className={`w-3.5 h-3.5 ${showHvacOverlay ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span>HVAC Overlay</span>
                <input type="checkbox" checked={showHvacOverlay} onChange={(e) => setShowHvacOverlay(e.target.checked)} className="sr-only" />
              </label>

              <label className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl transition cursor-pointer ${showPowerGrid ? 'bg-white text-amber-700 shadow-xs border border-amber-200' : 'text-slate-500'}`}>
                <Zap className={`w-3.5 h-3.5 ${showPowerGrid ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Power Grid</span>
                <input type="checkbox" checked={showPowerGrid} onChange={(e) => setShowPowerGrid(e.target.checked)} className="sr-only" />
              </label>
            </div>
          </div>
        </div>

        {/* DYNAMIC TOPOLOGY GRAPHS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CORE GATEWAY TOPOLOGY GRAPH */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
              <span className="font-extrabold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>Core Gateway Topology Graph</span>
              </span>
              <span className="font-sans text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                10Gbps Trunk
              </span>
            </div>

            <div className="h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full text-slate-600" viewBox="0 0 400 200" fill="none">
                
                {showPowerGrid && (
                  <>
                    <path d="M 20 180 L 380 180" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
                    <text x="25" y="175" fill="#f59e0b" fontSize="8" fontFamily="monospace">AC Main Bus (220V 60Hz)</text>
                  </>
                )}

                {showNodeLines && (
                  <path d="M 60 40 L 200 40" stroke="#3b82f6" strokeWidth="2.5" className="animate-pulse" />
                )}

                <g className="cursor-pointer">
                  <circle cx="60" cy="40" r="8" fill="#3b82f6" />
                  <circle cx="60" cy="40" r="12" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                  <text x="60" y="22" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">Main Gateway</text>
                  <text x="60" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">10.0.0.1</text>
                </g>

                <g className="cursor-pointer">
                  <circle cx="200" cy="40" r="8" fill="#10b981" />
                  <text x="200" y="22" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">Core Switch A</text>
                  <text x="200" y="58" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">{selectedCampus}</text>
                </g>

                {localLabs.map((lab, idx) => {
                  const nodeX = getLabNodeX(idx, localLabs.length);
                  const nodeY = 125;
                  const cleanLabTitle = lab.name.split('(')[0].trim() || lab.id;
                  const labIp = (lab.ipRange || '192.168.0.1').split('-')[0].trim();

                  return (
                    <g 
                      key={lab.id} 
                      className="cursor-pointer group hover:opacity-100" 
                      onClick={() => setSelectedLabModal(lab)}
                    >
                      {showNodeLines && (
                        <path 
                          d={`M 200 40 L ${nodeX} ${nodeY}`} 
                          stroke={lab.status === 'OPERATIONAL' ? "#3b82f6" : "#f59e0b"} 
                          strokeWidth="2" 
                          strokeDasharray={lab.status === 'OPERATIONAL' ? "none" : "4 4"}
                          opacity="0.8" 
                        />
                      )}

                      {showHvacOverlay && (
                        <circle cx={nodeX} cy={nodeY} r="16" fill={lab.status === 'OPERATIONAL' ? "#06b6d4" : "#f59e0b"} opacity="0.15" className="animate-ping" />
                      )}

                      <circle 
                        cx={nodeX} 
                        cy={nodeY} 
                        r="7" 
                        fill={lab.status === 'OPERATIONAL' ? '#10b981' : lab.status === 'UNDER_MAINTENANCE' ? '#f59e0b' : '#ef4444'} 
                      />

                      <text x={nodeX} y={nodeY + 18} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold">
                        {cleanLabTitle}
                      </text>
                      <text x={nodeX} y={nodeY + 28} textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="monospace">
                        {labIp}
                      </text>
                    </g>
                  );
                })}

              </svg>

              <div className="absolute bottom-2 right-3 text-[9px] font-sans text-slate-400">
                Scope: <span className="text-emerald-400 font-bold">{selectedCampus}</span>
              </div>
            </div>
          </div>

          {/* FLOOR PLAN WORKSTATION LAYOUT */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5">
              <span className="font-extrabold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Floor Plan Workstation Layout</span>
              </span>
              <span className="font-sans text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {localLabs.length} Rooms Active
              </span>
            </div>

            <div className="h-64 bg-slate-950/80 rounded-xl border border-slate-800/80 p-3 relative flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full text-slate-600" viewBox="0 0 400 200" fill="none">
                
                {localLabs.length > 0 ? (
                  localLabs.map((lab, idx) => {
                    const { x, y, width, height } = getFloorPlanBoxCoords(idx, localLabs.length);
                    const isMaint = lab.status === 'UNDER_MAINTENANCE';
                    const isOutOfOrder = lab.status === 'OUT_OF_ORDER';
                    const titleText = lab.name.split('(')[0].trim() || lab.id;

                    return (
                      <g 
                        key={lab.id} 
                        className="cursor-pointer hover:opacity-90 transition"
                        onClick={() => setSelectedLabModal(lab)}
                      >
                        <rect 
                          x={x} 
                          y={y} 
                          width={width} 
                          height={height} 
                          rx="8" 
                          fill="#0f172a" 
                          stroke={isMaint ? "#f59e0b" : isOutOfOrder ? "#ef4444" : "#334155"} 
                          strokeWidth="2" 
                        />

                        {showHvacOverlay && (
                          <rect 
                            x={x + 3} 
                            y={y + 3} 
                            width={width - 6} 
                            height={height - 6} 
                            rx="6" 
                            fill={isMaint ? "#f59e0b" : "#06b6d4"} 
                            opacity="0.08" 
                          />
                        )}

                        {showPowerGrid && (
                          <line 
                            x1={x} 
                            y1={y + height / 2} 
                            x2={x + width} 
                            y2={y + height / 2} 
                            stroke="#f59e0b" 
                            strokeWidth="1" 
                            strokeDasharray="3 3" 
                            opacity="0.6"
                          />
                        )}

                        <text 
                          x={x + width / 2} 
                          y={y + height / 2 - 6} 
                          textAnchor="middle" 
                          fill="#f8fafc" 
                          fontSize={localLabs.length > 4 ? 9 : 11} 
                          fontWeight="bold"
                        >
                          {titleText}
                        </text>

                        <text 
                          x={x + width / 2} 
                          y={y + height / 2 + 8} 
                          textAnchor="middle" 
                          fill="#94a3b8" 
                          fontSize={localLabs.length > 4 ? 8 : 9} 
                          fontFamily="monospace"
                        >
                          ({lab.pcCount} PCs)
                        </text>

                        {showHvacOverlay && height > 50 && (
                          <text 
                            x={x + width / 2} 
                            y={y + height / 2 + 22} 
                            textAnchor="middle" 
                            fill={isMaint ? "#f59e0b" : "#06b6d4"} 
                            fontSize={8} 
                            fontWeight="bold"
                          >
                            {isMaint ? '[!] HVAC Check' : (lab.temp || '21.5Â°C')}
                          </text>
                        )}
                      </g>
                    );
                  })
                ) : (
                  <text x="200" y="105" textAnchor="middle" fill="#64748b" fontSize="12">
                    No active rooms registered for {selectedCampus}
                  </text>
                )}

              </svg>

              <div className="absolute bottom-2 left-3 text-[9px] font-sans text-slate-400">
                Click any room to inspect floor plan topology
              </div>
            </div>
          </div>

        </div>

        {/* LABORATORY INVENTORY TABLE */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Laboratory Inventory & Ledger</h4>
              <span className="text-xs text-slate-400 font-medium">Manage rooms, subnets, and switch tags for {selectedCampus}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl text-[11px] font-bold border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  All ({localLabs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('OPERATIONAL')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'OPERATIONAL' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Operational
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('UNDER_MAINTENANCE')}
                  className={`px-3 py-1 rounded-xl transition cursor-pointer ${statusFilter === 'UNDER_MAINTENANCE' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Maintenance
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search Room, ID, or Switch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-56 font-medium shadow-xs bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Campus Node & Room</th>
                  <th className="p-3.5">Switch Tag / Subnet Scope</th>
                  <th className="p-3.5">Capacity / Online</th>
                  <th className="p-3.5">HVAC / Power</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {filteredLabs.length > 0 ? (
                  filteredLabs.map((lab) => {
                    const activeCount = Math.round(lab.pcCount * 0.95);
                    return (
                      <tr key={lab.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setSelectedLabModal(lab)}>
                        <td className="p-3.5 font-bold text-slate-900 font-sans">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-600 shrink-0" />
                            <div>
                              <span>{lab.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">{lab.id} • {lab.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-sans text-slate-600">
                          <div className="text-[11px] font-bold text-slate-800">{lab.switchTag}</div>
                          <div className="text-[10px] text-slate-400">{lab.ipRange}</div>
                        </td>
                        <td className="p-3.5 font-sans">
                          <div className="font-bold text-slate-800">{lab.pcCount} Seats</div>
                          <div className="text-emerald-600 text-[10px] font-bold">{activeCount} Online</div>
                        </td>
                        <td className="p-3.5 font-sans text-slate-600">
                          <span className="text-cyan-600 font-bold">{lab.temp || '21.5Â°C'}</span> | <span className="text-amber-600 font-bold">{lab.powerKw || '3.5'} kW</span>
                        </td>
                        <td className="p-3.5">
                          {lab.status === 'OPERATIONAL' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                              Operational
                            </span>
                          )}
                          {lab.status === 'UNDER_MAINTENANCE' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px]">
                              Maintenance
                            </span>
                          )}
                          {lab.status === 'OUT_OF_ORDER' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[10px]">
                              Out of Order
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              type="button"
                              onClick={() => setSelectedLabModal(lab)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-bold transition cursor-pointer active:scale-95"
                            >
                              Inspect
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleOpenEditModal(lab)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer active:scale-95"
                              title="Edit Laboratory"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setDeletingLabId(lab.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer active:scale-95"
                              title="Delete Laboratory"
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
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No laboratories found matching criteria for {selectedCampus}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD LABORATORY */}
      {isAddLabOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Add New Laboratory</span>
              </h3>
              <button type="button" onClick={() => { setIsAddLabOpen(false); resetFormFields(); }} className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratory Room Tag / ID</label>
                <input 
                  type="text" 
                  value={formLabId} 
                  onChange={(e) => setFormLabId(e.target.value)} 
                  placeholder="e.g. DAP-LAB-4" 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Room Name</label>
                <input 
                  type="text" 
                  value={formLabName} 
                  onChange={(e) => setFormLabName(e.target.value)} 
                  placeholder="e.g. ComLab 4 (AI Systems)" 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PC Capacity Seats</label>
                  <input 
                    type="number" 
                    value={formPcCount} 
                    onChange={(e) => setFormPcCount(Number(e.target.value))} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={formStatus} 
                    onChange={(e: any) => setFormStatus(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Building / Location</label>
                <input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)} 
                  placeholder="e.g. 2nd Floor" 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Subnet Range</label>
                  <input 
                    type="text" 
                    value={formIpRange} 
                    onChange={(e) => setFormIpRange(e.target.value)} 
                    placeholder="e.g. 192.168.0.1 - 35" 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Switch Port Tag</label>
                  <input 
                    type="text" 
                    value={formSwitchTag} 
                    onChange={(e) => setFormSwitchTag(e.target.value)} 
                    placeholder="e.g. SW-DAP-04" 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsAddLabOpen(false); resetFormFields(); }} 
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Save Laboratory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT LABORATORY METADATA */}
      {editingLab && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Edit Laboratory Metadata</span>
              </h3>
              <button type="button" onClick={() => { setEditingLab(null); resetFormFields(); }} className="p-1 hover:bg-slate-100 rounded-xl cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateLab} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratory Room Tag / ID</label>
                <input 
                  type="text" 
                  value={formLabId} 
                  onChange={(e) => setFormLabId(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Room Name</label>
                <input 
                  type="text" 
                  value={formLabName} 
                  onChange={(e) => setFormLabName(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PC Capacity Seats</label>
                  <input 
                    type="number" 
                    value={formPcCount} 
                    onChange={(e) => setFormPcCount(Number(e.target.value))} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={formStatus} 
                    onChange={(e: any) => setFormStatus(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="OPERATIONAL">OPERATIONAL</option>
                    <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Building / Location</label>
                <input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)} 
                  className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IP Subnet Range</label>
                  <input 
                    type="text" 
                    value={formIpRange} 
                    onChange={(e) => setFormIpRange(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Switch Port Tag</label>
                  <input 
                    type="text" 
                    value={formSwitchTag} 
                    onChange={(e) => setFormSwitchTag(e.target.value)} 
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-sans text-slate-900 outline-none focus:border-blue-500 shadow-xs" 
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setEditingLab(null); resetFormFields(); }} 
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingLabId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Delete Room {deletingLabId}?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Are you sure you want to delete this laboratory? All associated topology and telemetry data will be permanently removed from inventory.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setDeletingLabId(null)} 
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer transition active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteLabConfirm} 
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer transition active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ROOM TOPOLOGY INSPECTOR */}
      {selectedLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-lg w-full space-y-5 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedLabModal.name}</h3>
                  <span className="text-xs text-slate-400 font-sans">{selectedLabModal.id} • {selectedLabModal.location}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedLabModal(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block">Switch Port Tag</span>
                  <span className="font-extrabold font-sans text-blue-600 text-sm">{selectedLabModal.switchTag || ' - '}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold block">Subnet Range</span>
                  <span className="font-extrabold font-sans text-slate-800 text-sm">{selectedLabModal.ipRange || ' - '}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 font-sans">
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                  <span>ENVIRONMENTAL TELEMETRY</span>
                  <span className="text-emerald-400 font-bold">LIVE FEED</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">HVAC Temp</span>
                    <strong className="text-cyan-400 text-xs">{selectedLabModal.temp || '21.5Â°C'}</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">UPS Load</span>
                    <strong className="text-amber-400 text-xs">{selectedLabModal.powerKw || '3.5'} kW</strong>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">Battery Health</span>
                    <strong className="text-emerald-400 text-xs">100% Nominal</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/60 flex items-start gap-2.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  All {selectedLabModal.pcCount} workstations in this room are currently monitored via the JRMSU LabTrack monitoring daemon under <strong className="font-bold">{selectedCampus}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedLabModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition cursor-pointer active:scale-95"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CampusesLabsView;

