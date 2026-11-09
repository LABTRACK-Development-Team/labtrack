import apiClient from '@/lib/api-client';
import React, { useEffect,  useState, useMemo } from 'react';
import { 
  ArrowRightLeft, Plus, Search, Filter, CheckCircle2, Clock, 
  ArrowRight, Box, RefreshCw, X, Check, Truck, Trash2, Edit3,
  Eye, Sparkles, History, MapPin, ChevronRight, Menu as MenuIcon,
  QrCode, XCircle, SlidersHorizontal, PieChart, BarChart3, TrendingUp,
  AlertTriangle, Layers, Activity
} from 'lucide-react';

interface InventoryTransferViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

interface TransferLog {
  timestamp: string;
  action: string;
  actor: string;
}

interface TransferRecord {
  id: string;
  assetTag: string;
  assetName: string;
  category: string;
  sourceLab: string;
  targetLab: string;
  requestedBy: string;
  approvedBy: string;
  date: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';
  remarks: string;
  logs: TransferLog[];
}

export const InventoryTransferView: React.FC<InventoryTransferViewProps> = ({ 
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification 
}) => {
  // SEARCH & FILTER DYNAMIC STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // MODAL STATES FOR INTERACTIVE CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferRecord | null>(null);
  const [deletingTransferId, setDeletingTransferId] = useState<string | null>(null);
  const [inspectModalTransfer, setInspectModalTransfer] = useState<TransferRecord | null>(null);

  // REAL DYNAMIC REACT STATE FOR TRANSFERS
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/assets');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setTransfers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // FORM INPUT BINDINGS
  const [formData, setFormData] = useState({
    assetTag: '',
    assetName: '',
    category: 'Workstation Node',
    sourceLab: 'ComLab 1',
    targetLab: 'ComLab 2',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    remarks: ''
  });

  const notify = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  const resetForm = () => {
    setFormData({
      assetTag: '',
      assetName: '',
      category: 'Workstation Node',
      sourceLab: 'ComLab 1',
      targetLab: 'ComLab 2',
      priority: 'MEDIUM',
      remarks: ''
    });
  };

  // 1. CREATE OPERATION
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetTag.trim() || !formData.assetName.trim()) return;

    const nowStr = new Date().toLocaleString('en-US', { hour12: true });
    const newEntry: TransferRecord = {
      id: `TRF-2026-00${transfers.length + 1}`,
      assetTag: formData.assetTag.toUpperCase().trim(),
      assetName: formData.assetName.trim(),
      category: formData.category.trim(),
      sourceLab: formData.sourceLab.trim(),
      targetLab: formData.targetLab.trim(),
      requestedBy: 'Admin User',
      approvedBy: 'Pending Authorization',
      date: new Date().toISOString().split('T')[0],
      priority: formData.priority,
      status: 'PENDING',
      remarks: formData.remarks.trim() || 'Inter-laboratory asset relocation order.',
      logs: [
        { timestamp: nowStr, action: 'Transfer Order Created', actor: 'Admin User' }
      ]
    };

    setTransfers([newEntry, ...transfers]);
    setIsCreateModalOpen(false);
    resetForm();
    notify(`Transfer Order ${newEntry.id} created successfully!`);
  };

  // 2. UPDATE / EDIT OPERATION
  const openEditModal = (record: TransferRecord) => {
    setEditingTransfer(record);
    setFormData({
      assetTag: record.assetTag,
      assetName: record.assetName,
      category: record.category,
      sourceLab: record.sourceLab,
      targetLab: record.targetLab,
      priority: record.priority,
      remarks: record.remarks
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;

    const nowStr = new Date().toLocaleString('en-US', { hour12: true });

    setTransfers(prev => prev.map(t => {
      if (t.id === editingTransfer.id) {
        return {
          ...t,
          assetTag: formData.assetTag.toUpperCase().trim(),
          assetName: formData.assetName.trim(),
          category: formData.category.trim(),
          sourceLab: formData.sourceLab.trim(),
          targetLab: formData.targetLab.trim(),
          priority: formData.priority,
          remarks: formData.remarks.trim(),
          logs: [...t.logs, { timestamp: nowStr, action: 'Transfer Order Details Updated', actor: 'Admin User' }]
        };
      }
      return t;
    }));

    setEditingTransfer(null);
    resetForm();
    notify(`Transfer Order ${editingTransfer.id} updated successfully!`);
  };

  // 3. DELETE OPERATION
  const handleDeleteConfirm = () => {
    if (!deletingTransferId) return;
    setTransfers(prev => prev.filter(t => t.id !== deletingTransferId));
    notify(`Transfer Order ${deletingTransferId} removed from inventory ledger.`);
    setDeletingTransferId(null);
  };

  // 4. QUICK STATUS TRANSITION (DISPATCH / CONFIRM / REJECT)
  const handleUpdateStatus = (id: string, newStatus: 'COMPLETED' | 'IN_TRANSIT' | 'REJECTED') => {
    const nowStr = new Date().toLocaleString('en-US', { hour12: true });
    
    setTransfers(prev => prev.map(t => {
      if (t.id === id) {
        let actionMsg = 'Status Updated';
        if (newStatus === 'IN_TRANSIT') actionMsg = 'Asset Dispatched & In Transit';
        if (newStatus === 'COMPLETED') actionMsg = 'Delivery Confirmed at Destination';
        if (newStatus === 'REJECTED') actionMsg = 'Transfer Request Rejected';

        return {
          ...t,
          status: newStatus,
          approvedBy: 'Admin Supervisor',
          logs: [...t.logs, { timestamp: nowStr, action: actionMsg, actor: 'Admin Supervisor' }]
        };
      }
      return t;
    }));

    notify(`Transfer ${id} updated to ${newStatus.replace('_', ' ')}`);
  };

  // DYNAMIC COMPUTED METRICS
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchesSearch = (t.assetTag || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.assetName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.id || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.sourceLab || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (t.targetLab || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [transfers, searchQuery, statusFilter, categoryFilter]);

  const totalOrdersToShip = transfers.filter(t => t.status === 'PENDING').length;
  const overdueShipments = transfers.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const inTransitCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;

  // DYNAMIC CATEGORY PERCENTAGES
  const nodeCount = transfers.filter(t => t.category === 'Workstation Node').length;
  const memoryCount = transfers.filter(t => t.category === 'Memory & Components').length;
  const displayCount = transfers.filter(t => t.category === 'Display & Monitors').length;
  const totalCount = transfers.length || 1;

  const nodePct = Math.round((nodeCount / totalCount) * 100);
  const memoryPct = Math.round((memoryCount / totalCount) * 100);
  const displayPct = Math.round((displayCount / totalCount) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* DUAL MODE DATALISTS FOR CATEGORY AND LABORATORIES */}
      <datalist id="trf-lab-options">
        <option value="ComLab 1" />
        <option value="ComLab 1 (Main)" />
        <option value="ComLab 2" />
        <option value="ComLab 2 (Annex)" />
        <option value="ComLab 3" />
        <option value="Storage Depot A" />
        <option value="Storage Depot B" />
        <option value="Maintenance Bay" />
        <option value="Server Room" />
      </datalist>

      <datalist id="trf-category-options">
        <option value="Workstation Node" />
        <option value="Memory & Components" />
        <option value="Display & Monitors" />
        <option value="Networking Equipment" />
        <option value="Peripherals & Accessories" />
        <option value="Server Hardware" />
      </datalist>

      {/* ANALYTICS BOARD & KPI SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT VOLUME & KPI METRICS */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Shipping & Logistics Volume</h3>
              <p className="text-xs text-slate-400">Real-time inter-laboratory dispatch metrics for {campusName}</p>
            </div>
            <span className="text-[10px] font-sans font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/80 shadow-xs">
              LIVE SYSTEM LEDGER
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 hover:border-amber-300 transition">
              <span className="text-[11px] font-extrabold text-slate-400 block">Orders to Ship</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rotate-45 bg-amber-500 rounded-xs"></span>
                <span className="text-2xl font-black text-slate-900 font-sans">{totalOrdersToShip}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 hover:border-rose-300 transition">
              <span className="text-[11px] font-extrabold text-slate-400 block">Priority Alerts</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-2xl font-black text-rose-600 font-sans">{overdueShipments}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 hover:border-blue-300 transition">
              <span className="text-[11px] font-extrabold text-slate-400 block">In Transit</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rotate-45 bg-blue-500 rounded-xs animate-spin"></span>
                <span className="text-2xl font-black text-blue-600 font-sans">{inTransitCount}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1 hover:border-emerald-300 transition">
              <span className="text-[11px] font-extrabold text-slate-400 block">Completed</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-2xl font-black text-emerald-600 font-sans">{completedCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>KPIs - Monthly Logistics Performance</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="p-2.5">Metric</th>
                    <th className="p-2.5">This Month</th>
                    <th className="p-2.5">Past Month</th>
                    <th className="p-2.5 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-extrabold text-slate-900 font-sans">Transfer Fulfillment</td>
                    <td className="p-2.5">98.2%</td>
                    <td className="p-2.5 text-slate-400">95.4%</td>
                    <td className="p-2.5 text-right font-bold text-slate-400">—</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-extrabold text-slate-900 font-sans">Avg Delivery Speed</td>
                    <td className="p-2.5">1.4 Days</td>
                    <td className="p-2.5 text-slate-400">1.8 Days</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">-0.4 Days</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-extrabold text-slate-900 font-sans">Hardware Verification Rate</td>
                    <td className="p-2.5">100.0%</td>
                    <td className="p-2.5 text-slate-400">99.1%</td>
                    <td className="p-2.5 text-right font-bold text-slate-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT CATEGORY DISTRIBUTION CHART */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Inventory Category Distribution</span>
              </h3>
              <span className="text-[10px] font-sans text-slate-400 font-bold">ASSET CLASSES</span>
            </div>

            <div className="p-4 flex items-center justify-center gap-6 my-2">
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-emerald-500 to-indigo-600 flex items-center justify-center shadow-inner animate-pulse">
                <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
                  <span className="text-[9px] font-sans font-bold text-slate-400">TOTAL</span>
                  <span className="text-lg font-black text-slate-900 font-sans">{transfers.length}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-semibold flex-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Workstations</span>
                  <strong className="font-sans text-slate-900">{nodePct}%</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> RAM Modules</span>
                  <strong className="font-sans text-slate-900">{memoryPct}%</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Displays</span>
                  <strong className="font-sans text-slate-900">{displayPct}%</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-indigo-900 space-y-1 text-xs">
            <span className="font-extrabold flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-4 h-4" /> Real-time Inventory Routing Sync
            </span>
            <p className="text-[11px] text-indigo-800/80 leading-relaxed">
              Updating transfer orders instantly adjusts laboratory inventory ledger status across campus subnets.
            </p>
          </div>
        </div>

      </div>

      {/* TRANSFER LIST & CRUD ACTIONS CONTAINER */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Active Transfer Orders & Routing</h2>
              <p className="text-xs text-slate-400">Manage equipment movement, edit specifications, and verify deliveries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Request New Transfer
            </button>
            <button className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-slate-700 transition cursor-pointer">
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 text-xs w-full sm:w-80 shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search Transfer ID, Asset Tag, or Lab..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full font-semibold text-slate-900 placeholder-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              {['ALL', 'PENDING', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${statusFilter === st ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DYNAMIC ITEM CARDS */}
        <div className="space-y-3">
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((item) => (
              <div 
                key={item.id} 
                className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                
                {/* ICON & ROUTE */}
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl font-bold shadow-xs shrink-0 ${
                    item.status === 'COMPLETED' ? 'bg-emerald-600 text-white' :
                    item.status === 'IN_TRANSIT' ? 'bg-amber-500 text-white' :
                    item.status === 'PENDING' ? 'bg-blue-600 text-white' :
                    'bg-rose-500 text-white'
                  }`}>
                    {item.status === 'IN_TRANSIT' ? <Truck className="w-5 h-5 animate-pulse" /> : <Box className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.assetName}</h4>
                      <span className="font-sans text-[10px] text-blue-600 bg-blue-50 font-bold px-2 py-0.5 rounded-md border border-blue-200/80">{item.id}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({item.assetTag})</span>
                      {item.status === 'IN_TRANSIT' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">{item.sourceLab}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">{item.targetLab}</span>
                      <span className="text-slate-300"></span>
                      <span className="font-sans text-[11px] text-slate-400">{item.date}</span>
                    </div>
                  </div>
                </div>

                {/* CRUD ACTIONS & VIEW STATUS BUTTON */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  
                  <button 
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer border border-slate-200"
                    title="Edit Order Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => setDeletingTransferId(item.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer border border-rose-200"
                    title="Delete Transfer Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {item.status === 'PENDING' && (
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'IN_TRANSIT')}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                    >
                      Dispatch
                    </button>
                  )}

                  {item.status === 'IN_TRANSIT' && (
                    <button 
                      onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm Arrival
                    </button>
                  )}

                  <button 
                    onClick={() => setInspectModalTransfer(item)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>View Status</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No transfer records match the current filter or search query.
            </div>
          )}
        </div>

      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" /> Request New Asset Transfer
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs text-slate-800 font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Asset Tag / ID</label>
                  <input 
                    type="text" 
                    value={formData.assetTag} 
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })} 
                    placeholder="e.g. PC-008" 
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl font-sans outline-none focus:border-blue-600 font-bold placeholder-slate-400" 
                    required 
                  />
                </div>
                
                {/* DUAL MODE CATEGORY INPUT */}
                <div>
                  <label className="block mb-1 text-slate-700">Asset Category (Select / Type)</label>
                  <input 
                    type="text"
                    list="trf-category-options"
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Select or type category..."
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Asset Description / Name</label>
                <input 
                  type="text" 
                  value={formData.assetName} 
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })} 
                  placeholder="e.g. Workstation PC i7 16GB RAM" 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium placeholder-slate-400" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* DUAL MODE SOURCE LAB INPUT */}
                <div>
                  <label className="block mb-1 text-slate-700">Source Laboratory (Select / Type)</label>
                  <input 
                    type="text"
                    list="trf-lab-options"
                    value={formData.sourceLab} 
                    onChange={(e) => setFormData({ ...formData, sourceLab: e.target.value })}
                    placeholder="Select or type source lab..."
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold placeholder-slate-400"
                    required
                  />
                </div>

                {/* DUAL MODE TARGET LAB INPUT */}
                <div>
                  <label className="block mb-1 text-slate-700">Target Destination (Select / Type)</label>
                  <input 
                    type="text"
                    list="trf-lab-options"
                    value={formData.targetLab} 
                    onChange={(e) => setFormData({ ...formData, targetLab: e.target.value })}
                    placeholder="Select or type target lab..."
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Priority Level</label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold cursor-pointer"
                >
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Remarks</label>
                <textarea 
                  rows={2}
                  value={formData.remarks} 
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
                  placeholder="Reason for transferring..." 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium placeholder-slate-400" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-2xl shadow-md transition cursor-pointer active:scale-95"
              >
                Submit Transfer Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" /> Edit Order: {editingTransfer.id}
              </h3>
              <button onClick={() => setEditingTransfer(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs text-slate-800 font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Asset Tag</label>
                  <input 
                    type="text" 
                    value={formData.assetTag} 
                    onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })} 
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl font-sans outline-none focus:border-blue-600 font-bold" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-slate-700">Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold cursor-pointer"
                  >
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              {/* DUAL MODE CATEGORY INPUT */}
              <div>
                <label className="block mb-1 text-slate-700">Asset Category (Select / Type)</label>
                <input 
                  type="text"
                  list="trf-category-options"
                  value={formData.category} 
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Asset Description</label>
                <input 
                  type="text" 
                  value={formData.assetName} 
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })} 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* DUAL MODE SOURCE LAB INPUT */}
                <div>
                  <label className="block mb-1 text-slate-700">Source Laboratory (Select / Type)</label>
                  <input 
                    type="text"
                    list="trf-lab-options"
                    value={formData.sourceLab} 
                    onChange={(e) => setFormData({ ...formData, sourceLab: e.target.value })}
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>

                {/* DUAL MODE TARGET LAB INPUT */}
                <div>
                  <label className="block mb-1 text-slate-700">Target Destination (Select / Type)</label>
                  <input 
                    type="text"
                    list="trf-lab-options"
                    value={formData.targetLab} 
                    onChange={(e) => setFormData({ ...formData, targetLab: e.target.value })}
                    className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-700">Remarks</label>
                <textarea 
                  rows={2}
                  value={formData.remarks} 
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
                  className="w-full bg-white text-slate-900 border border-slate-200 p-2.5 rounded-xl outline-none focus:border-blue-600 font-medium" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-2xl shadow-md transition cursor-pointer active:scale-95"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingTransferId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Confirm Delete</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete order <strong className="font-sans text-slate-900">{deletingTransferId}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeletingTransferId(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl cursor-pointer hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-2xl shadow cursor-pointer hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TIMELINE MODAL */}
      {inspectModalTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" /> Transfer Timeline
              </h3>
              <button onClick={() => setInspectModalTransfer(null)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border text-xs space-y-1">
              <div className="flex justify-between font-sans font-bold text-blue-600">
                <span>{inspectModalTransfer.id}</span>
                <span>{inspectModalTransfer.assetTag}</span>
              </div>
              <p className="font-extrabold text-slate-900">{inspectModalTransfer.assetName}</p>
              <p className="text-slate-500">{inspectModalTransfer.remarks}</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Audit Log</h4>
              <div className="space-y-2 border-l-2 border-blue-200 pl-3 ml-1">
                {(inspectModalTransfer.logs || []).map((log, i) => (
                  <div key={i} className="relative space-y-0.5">
                    <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                    <p className="font-bold text-slate-900">{log.action}</p>
                    <p className="text-[10px] text-slate-500 font-sans">{log.actor}  {log.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setInspectModalTransfer(null)} 
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-2xl text-xs shadow cursor-pointer hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryTransferView;
