import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { 
  QrCode, Printer, Search, Sparkles, 
  ExternalLink, Trash2, Edit3, RefreshCw, X,
  Scan, Settings2, Monitor, Layers, ShieldCheck
} from 'lucide-react';

interface QrNodeItem {
  id: string;
  lab: string;
  pcRange: string;
  customTitle: string;
  targetUrl: string;
  createdAt: string;
  schedule?: string;
}

interface QrManagementViewProps {
  campusName?: string;
  workstations?: Array<{ id: string; lab: string; ip: string; status: string }>;
  onTriggerNotification?: (msg: string) => void;
}

export const QrManagementView: React.FC<QrManagementViewProps> = ({
  campusName = '',
  onTriggerNotification = () => {}
}) => {

  // AUTO-FIX: getBaseUrl helper (used by normalizeStudentUrl)
  const [resolvedBaseUrl, setResolvedBaseUrl] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          setResolvedBaseUrl(window.location.origin);
          return;
        }
        const res = await apiClient.get('/api/v1/system/network').catch(() => null);
        const data = (res as any)?.data?.data || (res as any)?.data || {};
        const primaryIp = data?.primaryIp || (Array.isArray(data?.ipAddresses) ? data.ipAddresses[0] : null);
        if (primaryIp) {
          const port = window.location.port || '3000';
          setResolvedBaseUrl(`http://${primaryIp}:${port}`);
          console.log('[QR] Auto-detected network IP:', primaryIp, '->', `http://${primaryIp}:${port}`);
        } else {
          setResolvedBaseUrl(window.location.origin);
        }
      } catch {
        setResolvedBaseUrl(window.location.origin);
      }
    })();
  }, []);

  const getBaseUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return resolvedBaseUrl || window.location.origin;
  };

  const parseCapacityFromRange = (range: string): number => {
    if (!range) return 40;
    const matches = range.match(/(\d+)/g);
    if (matches && matches.length > 0) {
      const last = matches[matches.length - 1];
      const num = parseInt(last, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    const numOnly = parseInt(range, 10);
    if (!isNaN(numOnly) && numOnly > 0) return numOnly;
    return 40;
  };

    // Normalize student URL: ensures http:// prefix + trims lab param
  const normalizeStudentUrl = (rawUrl: string): string => {
    if (!rawUrl) return "";
    let url = String(rawUrl).trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "http://" + url;
    }
    
    // FORCE current host & protocol (para kahit lumang QR na may labtrack.jrmsu.edu.ph, magiging local IP)
    try {
      const u = new URL(url);
      if (typeof window !== "undefined") {
        const base = new URL(getBaseUrl());
        u.protocol = base.protocol;
        u.host = base.host;
      }
      url = u.toString();
    } catch (e) {}
    
    // Trim lab param
    url = url.replace(/([?&]lab=)([^&]*)/g, function(_m, p, v) {
      try { return p + encodeURIComponent(decodeURIComponent(v).trim()); }
      catch { return p + v; }
    });
    return url;
  };
const getAbsoluteStudentUrl = (labName: string, schedule = '', capacity: number = 40) => {
  // ALWAYS use window.location.origin - auto-reflects current URL
  const baseUrl = window.location.origin;
    
    let url = `${baseUrl}/student?lab=${encodeURIComponent(labName.trim())}&capacity=${capacity}`;
    if (schedule) url += `&schedule=${encodeURIComponent(schedule)}`;
    return url;
  };

  const DEFAULT_POSTER_TITLE = 'JRMSU LabTrack Student Access & Workstation Portal';

  const [qrNodes, setQrNodes] = useState<QrNodeItem[]>([]);

  useEffect(() => {
    const STORAGE_KEY = 'labtrack_qr_nodes';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQrNodes(parsed);
          return;
        }
      } catch (e) {}
    }
    const defaultRange = 'PC-001 to PC-061';
    const defaultCapacity = parseCapacityFromRange(defaultRange);
    const defaults: QrNodeItem[] = [
      {
        id: 'QR-LAB-001',
        lab: 'ComLab 1 (ICT)',
        pcRange: defaultRange,
        customTitle: DEFAULT_POSTER_TITLE,
        targetUrl: getAbsoluteStudentUrl('ComLab 1 (ICT)', 'MWF 8-10AM', defaultCapacity),
        createdAt: new Date().toLocaleDateString(),
        schedule: 'MWF 8-10AM'
      }
    ];
    setQrNodes(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, []);

  useEffect(() => {
    if (qrNodes.length > 0) {
      localStorage.setItem('labtrack_qr_nodes', JSON.stringify(qrNodes));
    }
  }, [qrNodes]);

  const [newLab, setNewLab] = useState('ComLab 1 (ICT)');
  const [newPcRange, setNewPcRange] = useState('PC-001 to PC-061');
  const [newSchedule, setNewSchedule] = useState('MWF 8-10AM');
  const [newCustomTitle, setNewCustomTitle] = useState(DEFAULT_POSTER_TITLE);
  const [newCustomUrl, setNewCustomUrl] = useState('');

  const [editingNode, setEditingNode] = useState<QrNodeItem | null>(null);
  const [editLab, setEditLab] = useState('');
  const [editPcRange, setEditPcRange] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editCustomTitle, setEditCustomTitle] = useState('');
  const [editCustomUrl, setEditCustomUrl] = useState('');

  const [singlePrintNode, setSinglePrintNode] = useState<QrNodeItem | null>(null);
  const [deletingNode, setDeletingNode] = useState<QrNodeItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const handleCreateQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLab.trim()) return;

    const isDuplicate = qrNodes.some(node => 
      node.lab.trim().toLowerCase() === newLab.trim().toLowerCase() && 
      (node.schedule || '').trim().toLowerCase() === newSchedule.trim().toLowerCase()
    );

    if (isDuplicate) {
      onTriggerNotification(`ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Duplicate! May existing QR na para sa ${newLab} (${newSchedule}).`);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    const progressTimer = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 95;
        }
        return prev + 15;
      });
    }, 180);

    setTimeout(() => {
      clearInterval(progressTimer);
      setGenerationProgress(100);

      const capacity = parseCapacityFromRange(newPcRange);
      let computedUrl = newCustomUrl.trim() ? newCustomUrl.trim() : getAbsoluteStudentUrl(newLab.trim(), newSchedule, capacity);
      if (newSchedule && !computedUrl.includes('schedule=')) {
        computedUrl += (computedUrl.includes('?') ? '&' : '?') + `schedule=${encodeURIComponent(newSchedule)}`;
      }

      const newNode: QrNodeItem = {
        id: `QR-LAB-${Date.now()}`,
        lab: newLab.trim(),
        pcRange: newPcRange.trim() || 'PC-001 to PC-061',
        schedule: newSchedule.trim() || 'General',
        customTitle: newCustomTitle.trim() || DEFAULT_POSTER_TITLE,
        targetUrl: computedUrl,
        createdAt: new Date().toLocaleDateString()
      };
      
      setQrNodes(prev => [newNode, ...prev]);
      onTriggerNotification(`Naka-generate ng bagong QR para sa ${newNode.lab}!`);
      setNewCustomUrl('');
      setIsGenerating(false);
      setGenerationProgress(0);
    }, 1500);
  };

  const executeDelete = () => {
    if (!deletingNode) return;
    setQrNodes(prev => prev.filter(item => item.id !== deletingNode.id));
    onTriggerNotification(`Nabura na ang QR Code ng ${deletingNode.lab}.`);
    setDeletingNode(null);
  };

  const handleOpenEditModal = (node: QrNodeItem) => {
    setEditingNode(node);
    setEditLab(node.lab);
    setEditPcRange(node.pcRange);
    setEditSchedule(node.schedule || '');
    setEditCustomTitle(node.customTitle || DEFAULT_POSTER_TITLE);
    setEditCustomUrl(node.targetUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    setQrNodes(prev => prev.map(item => {
      if (item.id === editingNode.id) {
        const newUrl = editCustomUrl.trim() || getAbsoluteStudentUrl(editLab.trim(), editSchedule, parseCapacityFromRange(editPcRange));
        return {
          ...item,
          lab: editLab.trim(),
          pcRange: editPcRange.trim(),
          schedule: editSchedule.trim(),
          customTitle: editCustomTitle.trim() || DEFAULT_POSTER_TITLE,
          targetUrl: newUrl
        };
      }
      return item;
    }));

    onTriggerNotification(`Na-update na ang QR details ng ${editLab}!`);
    setEditingNode(null);
  };

  const handlePrintSingle = (node: QrNodeItem) => {
    setSinglePrintNode(node);
    setTimeout(() => {
      window.print();
      setSinglePrintNode(null);
    }, 200);
  };

  const handlePrintAll = () => {
    setSinglePrintNode(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredNodes = qrNodes.filter(node => {
    return (node.lab || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
           (node.pcRange || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
           (node.customTitle || "").toLowerCase().includes((searchQuery || "").toLowerCase());
  });

  const printTargetList = singlePrintNode ? [singlePrintNode] : filteredNodes;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <style>{`
        @media print {
          @page {
            margin: 0mm !important;
            size: auto !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #qr-printable-area, #qr-printable-area * {
            visibility: visible !important;
          }
          #qr-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 20px !important;
            padding: 20px !important;
            background: white !important;
            margin: 0 auto !important;
          }
          .poster-card {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 3px solid #1e3a8a !important;
            background: #0b2545 !important;
            color: white !important;
            width: 290px !important;
            max-width: 290px !important;
            margin: 0 auto !important;
            padding: 16px !important;
            border-radius: 20px !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5 no-print">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Master Laboratory QR Studio</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-sans rounded-full font-bold">LabTrack Portal Sync</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Automatic Workstation Routing - Single Lab Master Poster - Scannable Direct Student Redirect
              </p>
            </div>
          </div>

          <button
            onClick={handlePrintAll}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer flex items-center gap-2 active:scale-95 transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" /> Print All Lab Posters
          </button>
        </div>

        <form onSubmit={handleCreateQr} className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Generate Master Laboratory QR Poster</span>
            </span>
            <span className="text-[11px] font-sans font-bold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-updates if Lab exists
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Assigned Laboratory</label>
              <input type="text" value={newLab} onChange={(e) => setNewLab(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-700 outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Workstation Range</label>
              <input type="text" value={newPcRange} onChange={(e) => setNewPcRange(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Schedule (Days/Time)</label>
              <input type="text" value={newSchedule} onChange={(e) => setNewSchedule(e.target.value)} placeholder="MWF 8-10AM" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Custom Poster Title</label>
              <input type="text" value={newCustomTitle} onChange={(e) => setNewCustomTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Target URL</label>
              <input type="text" value={newCustomUrl} onChange={(e) => setNewCustomUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Single Master QR covers all workstations in the laboratory automatically.</span>
            </p>
            <button type="submit" disabled={isGenerating} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50">
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              <span>{isGenerating ? 'Encoding Master QR...' : 'Generate Lab QR Poster'}</span>
            </button>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-0.5">
          <div className="relative flex-1 sm:max-w-md w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Laboratory Name, Workstation Range, or Title..." className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 w-full" />
          </div>
          <span className="text-xs font-sans font-bold text-slate-500 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>{filteredNodes.length} Active Master Laboratory Posters</span>
          </span>
        </div>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 no-print">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden border border-slate-100">
            <div className="w-28 h-28 bg-slate-900 rounded-2xl mx-auto relative overflow-hidden flex items-center justify-center border-4 border-blue-500/30">
              <QrCode className="w-16 h-16 text-slate-700 opacity-40" />
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] transition-all ease-linear" style={{ top: `${generationProgress}%` }}></div>
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">Encoding Master Laboratory QR Code</h4>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Linking Workstations and Schedule...</p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${generationProgress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <div id="qr-printable-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {printTargetList.map(node => {
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(normalizeStudentUrl(node.targetUrl))}&margin=8`;

          return (
            <div 
              key={node.id} 
              className="poster-card bg-gradient-to-b from-[#0b2545] via-[#134074] to-[#0b2545] text-white p-4.5 rounded-3xl shadow-lg border-4 border-[#1e3a8a] relative flex flex-col items-center justify-between min-h-[380px] max-w-[290px] text-center overflow-hidden group hover:scale-[1.01] transition-all duration-300 mx-auto w-full"
            >
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10 no-print">
                <button onClick={() => handleOpenEditModal(node)} className="p-1.5 bg-white/10 hover:bg-white/30 text-white rounded-xl backdrop-blur-md border border-white/20 transition cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeletingNode(node)} className="p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>

              <div className="space-y-1 flex flex-col items-center pt-0.5">
                <img src="/assets/images/jrmsu.jpg" alt="Logo" className="w-11 h-11 object-contain mb-0.5 drop-shadow-md" />
                <h4 className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-200">Jose Rizal Memorial State University</h4>
                <h2 className="text-lg font-black tracking-tight text-white uppercase drop-shadow">SCAN HERE</h2>
              </div>

              <div className="w-full bg-white/95 text-[#0b2545] py-2 px-2.5 rounded-2xl shadow-sm border border-slate-200 my-1.5">
                <h5 className="font-extrabold text-[10.5px] leading-snug tracking-tight">{node.customTitle || DEFAULT_POSTER_TITLE}</h5>
                <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap print:hidden">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-lg text-[10px] font-extrabold">{node.lab}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[9.5px] font-sans font-bold">{node.pcRange}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-bold">{parseCapacityFromRange(node.pcRange)} PCs</span>
                  {node.schedule && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[9.5px] font-sans font-bold">{node.schedule}</span>}
                </div>
              </div>

              <div className="p-2 bg-white rounded-2xl shadow-md border border-slate-100 my-1 group-hover:scale-105 transition-transform duration-300">
                <img src={qrImageUrl} alt={`Master QR Code for ${node.lab}`} className="w-32 h-32 object-contain rounded-lg mx-auto" loading="lazy" />
              </div>

              <div className="w-full pt-2 border-t border-white/20 flex flex-col items-center gap-1.5">
                <div className="bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-white/30 text-[9.5px] font-sans text-emerald-300 font-bold truncate max-w-full print:hidden no-print">
                  Link: {normalizeStudentUrl(node.targetUrl)}
                </div>
                <div className="flex items-center justify-between w-full pt-0.5 gap-2 no-print">
                  <button onClick={() => handlePrintSingle(node)} className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-[10.5px] flex items-center gap-1 transition cursor-pointer shadow" title="Print Master Lab Poster">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <a href={normalizeStudentUrl(node.targetUrl)} target="_blank" rel="noreferrer" className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-[#0b2545] rounded-xl font-extrabold text-[10.5px] flex items-center gap-1 transition shadow cursor-pointer ml-auto" title="Test QR Redirect to Student Portal">
                    <ExternalLink className="w-3.5 h-3.5" /> Test Portal
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT MODAL Ã¢â‚¬â€ Clean White/Blue Redesign */}
      {editingNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/30">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm tracking-tight">
                    Edit QR Poster
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Update laboratory details &amp; portal link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingNode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-500" />
                  Assigned Laboratory
                </label>
                <input
                  type="text"
                  value={editLab}
                  onChange={(e) => setEditLab(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="e.g. ComLab 1 (ICT)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Workstation Range
                  </label>
                  <input
                    type="text"
                    value={editPcRange}
                    onChange={(e) => setEditPcRange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-sans outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    placeholder="PC-001 to PC-061"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Schedule
                  </label>
                  <input
                    type="text"
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    placeholder="MWF 8-10AM"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-500" />
                  Custom Poster Title
                </label>
                <textarea
                  value={editCustomTitle}
                  onChange={(e) => setEditCustomTitle(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-none"
                  placeholder="JRMSU LabTrack Student Access & Workstation Portal"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  Target Portal URL
                </label>
                <input
                  type="text"
                  value={editCustomUrl}
                  onChange={(e) => setEditCustomUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-sans text-[11px] text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  placeholder="https://..."
                  required
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 flex gap-2.5 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE MODAL */}
      {deletingNode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Delete QR Poster?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sigurado ka bang gusto mong burahin ang QR para sa <br/>
                <span className="font-extrabold text-slate-800 text-sm mt-1 inline-block bg-slate-100 px-2 py-0.5 rounded-md">{deletingNode.lab}</span>
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingNode(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition shadow-lg shadow-rose-200 active:scale-95">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QrManagementView;