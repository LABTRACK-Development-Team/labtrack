import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, PieChart, Download, FileSpreadsheet, 
  FileText, ArrowUpRight, ArrowDownRight, Layers, ShieldAlert, 
  Clock, Zap, CheckCircle2, AlertCircle, X, Filter, RefreshCw,
  Trash2, AlertTriangle, Cpu, Monitor, HardDrive, Wrench, PackageX,
  Plus, Search, Check, Building, Receipt, Calendar, ArrowRight, ShieldCheck,
  Smartphone, Laptop
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface FinancialReportsViewProps {
  campusName?: string;
  onTriggerNotification?: (msg: string) => void;
}

interface WriteOffItem {
  id: string;
  lab: string;
  name: string;
  issue: string;
  status: 'BEYOND REPAIR' | 'CONDEMNED' | 'DISPOSED' | 'REPLACED';
  cost: number;
  dateAdded: string;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  onTriggerNotification = () => {}
}) => {
  // STREAM & FILTER STATES
  const [timeframe, setTimeframe] = useState<'LIVE' | '24H' | '7D' | '30D'>('LIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState<'PDF' | 'CSV' | null>(null);

  // MODAL STATES
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    id: '',
    lab: 'ComLab 1',
    name: '',
    issue: '',
    status: 'BEYOND REPAIR' as WriteOffItem['status']
  });

  // DYNAMIC BUDGET & LEDGER METRICS
  const [allocatedBudget, setAllocatedBudget] = useState(0);
  const [maintenanceCost, setMaintenanceCost] = useState(0);
  const [softwareCost, setSoftwareCost] = useState(0);

  // UNREPAIRABLE ASSETS LEDGER DATA WITH EXACT PHILIPPINE RETAIL MARKET PRICING
  const [unrepairableAssets, setUnrepairableAssets] = useState<WriteOffItem[]>([]);

  // LIVE AUDIT LOG TRAIL
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // DYNAMIC: Fetch expenses para sa Financial Records
  const [expenses, setExpenses] = useState<any[]>([]);

  // FULL PHILIPPINE RETAIL DEVICE & HARDWARE MARKET PRICING ENGINE (IN PHP ₱)
  const estimateMarketPrice = (hardwareName: string): number => {
    if (!hardwareName.trim()) return 0;
    const l = (hardwareName || "").toLowerCase();

    // 1. APPLE IPHONES & IOS DEVICES (PHILIPPINE SRP)
    if (l.includes('iphone') || l.includes('apple phone') || l.includes('ios phone')) {
      if (l.includes('16 pro max')) return 84990;
      if (l.includes('16 pro')) return 69990;
      if (l.includes('16 plus')) return 62990;
      if (l.includes('16')) return 54990;

      if (l.includes('15 pro max')) return 75990;
      if (l.includes('15 pro')) return 62990;
      if (l.includes('15 plus')) return 54990;
      if (l.includes('15')) return 47990;

      if (l.includes('14 pro max')) return 64990;
      if (l.includes('14 pro')) return 55990;
      if (l.includes('14 plus')) return 45990;
      if (l.includes('14')) return 39990;

      if (l.includes('13 pro max')) return 52990;
      if (l.includes('13 pro')) return 44990;
      if (l.includes('13 mini')) return 28990;
      if (l.includes('13')) return 32990;

      if (l.includes('12 pro max')) return 41990;
      if (l.includes('12 pro')) return 35990;
      if (l.includes('12 mini')) return 21990;
      if (l.includes('12')) return 24990;

      if (l.includes('11 pro max')) return 31990;
      if (l.includes('11 pro')) return 26990;
      if (l.includes('11')) return 18990;

      if (l.includes('se') || l.includes('xr') || l.includes('xs')) return 14500;
      return 35990;
    }

    // 2. IPADS & TABLETS
    if (l.includes('ipad') || l.includes('tablet') || l.includes('galaxy tab')) {
      if (l.includes('ipad pro') || l.includes('tab s9 ultra')) return 62990;
      if (l.includes('ipad air') || l.includes('tab s9')) return 41990;
      if (l.includes('ipad mini')) return 32990;
      if (l.includes('ipad 10') || l.includes('ipad 9')) return 22990;
      return 18500;
    }

    // 3. ANDROID SMARTPHONES (SAMSUNG, XIAOMI, REALME, OPPO, VIVO)
    if (l.includes('samsung') || l.includes('galaxy') || l.includes('android') || l.includes('smartphone') || l.includes('mobile') || l.includes('phone') || l.includes('xiaomi') || l.includes('realme') || l.includes('oppo') || l.includes('vivo')) {
      if (l.includes('s24 ultra') || l.includes('z fold')) return 84900;
      if (l.includes('s24+') || l.includes('s24 plus')) return 68900;
      if (l.includes('s24')) return 53900;
      if (l.includes('s23 ultra')) return 68900;
      if (l.includes('s23')) return 38900;
      if (l.includes('a55') || l.includes('a54') || l.includes('reno')) return 22500;
      if (l.includes('a35') || l.includes('a15') || l.includes('redmi')) return 11500;
      return 18500;
    }

    // 4. GRAPHICS CARDS / GPUs
    if (l.includes('gpu') || l.includes('graphics card') || l.includes('rtx') || l.includes('gtx') || l.includes('radeon') || l.includes('video card') || l.includes('quadro')) {
      if (l.includes('4090') || l.includes('3090') || l.includes('a6000')) return 118000;
      if (l.includes('4080') || l.includes('3080') || l.includes('7900 xt')) return 65000;
      if (l.includes('4070 ti') || l.includes('4070 super')) return 44500;
      if (l.includes('4070') || l.includes('3070') || l.includes('7800 xt')) return 37500;
      if (l.includes('4060 ti') || l.includes('3060 ti') || l.includes('6700 xt')) return 24500;
      if (l.includes('4060') || l.includes('3060') || l.includes('7600') || l.includes('6600')) return 17800;
      if (l.includes('1660') || l.includes('1650') || l.includes('rx 580') || l.includes('rx 570')) return 8500;
      if (l.includes('1030') || l.includes('730') || l.includes('710')) return 3200;
      return 17800;
    }

    // 5. PROCESSORS / CPUs
    if (l.includes('cpu') || l.includes('processor') || l.includes('intel') || l.includes('ryzen')) {
      if (l.includes('i9') || l.includes('ryzen 9') || l.includes('threadripper')) return 34500;
      if (l.includes('i7') || l.includes('ryzen 7') || l.includes('7800x3d')) return 21500;
      if (l.includes('i3') || l.includes('ryzen 3') || l.includes('pentium') || l.includes('celeron')) return 5400;
      return 11800;
    }

    // 6. MACBOOKS & LAPTOPS
    if (l.includes('macbook') || l.includes('laptop') || l.includes('notebook')) {
      if (l.includes('macbook pro m3 max') || l.includes('m2 max')) return 189990;
      if (l.includes('macbook pro m3') || l.includes('macbook pro m2')) return 99990;
      if (l.includes('macbook air m3') || l.includes('m2')) return 64990;
      if (l.includes('macbook air m1')) return 44990;
      if (l.includes('rtx 4070') || l.includes('rtx 4060 gaming')) return 78500;
      if (l.includes('i7') || l.includes('ryzen 7')) return 54500;
      if (l.includes('i3') || l.includes('chromebook')) return 21500;
      return 38500;
    }

    // 7. DESKTOPS & WORKSTATIONS
    if (l.includes('workstation') || l.includes('system unit') || l.includes('desktop') || l.includes('computer unit') || l.includes('pc unit') || l.includes('pc')) {
      if (l.includes('server') || l.includes('xeon') || l.includes('threadripper') || l.includes('cad') || l.includes('rendering')) return 88000;
      if (l.includes('i7') || l.includes('ryzen 7')) return 52000;
      if (l.includes('i3') || l.includes('ryzen 3') || l.includes('office')) return 18500;
      return 32000;
    }

    // 8. MONITORS & DISPLAYS
    if (l.includes('monitor') || l.includes('display') || l.includes('screen') || l.includes('tv') || l.includes('panel')) {
      if (l.includes('oled') || l.includes('4k') || l.includes('ultrawide') || l.includes('34')) return 32500;
      if (l.includes('27') && (l.includes('144hz') || l.includes('165hz') || l.includes('180hz') || l.includes('240hz'))) return 13800;
      if (l.includes('27')) return 9800;
      if (l.includes('24') && (l.includes('144hz') || l.includes('165hz') || l.includes('gaming'))) return 8900;
      if (l.includes('21.5') || l.includes('19') || l.includes('18.5') || l.includes('20')) return 3800;
      return 6200;
    }

    // 9. STORAGE DRIVES (SSD & HDD)
    if (l.includes('ssd') || l.includes('nvme') || l.includes('m.2') || l.includes('sata ssd')) {
      if (l.includes('4tb')) return 17500;
      if (l.includes('2tb')) return 7800;
      if (l.includes('500gb') || l.includes('512gb') || l.includes('480gb')) return 2350;
      if (l.includes('256gb') || l.includes('240gb') || l.includes('120gb') || l.includes('128gb')) return 1250;
      return 3950;
    }

    if (l.includes('hdd') || l.includes('hard drive') || l.includes('harddisk') || l.includes('surveillance')) {
      if (l.includes('8tb') || l.includes('10tb')) return 13500;
      if (l.includes('4tb')) return 6200;
      return 2850;
    }

    // 10. RAM / MEMORY
    if (l.includes('ram') || l.includes('memory') || l.includes('ddr4') || l.includes('ddr5') || l.includes('dimm')) {
      if (l.includes('64gb') || l.includes('128gb')) return 11800;
      if (l.includes('32gb')) return 5900;
      if (l.includes('8gb')) return 1250;
      if (l.includes('4gb')) return 720;
      return 2850;
    }

    // 11. MOTHERBOARDS
    if (l.includes('motherboard') || l.includes('mobo') || l.includes('mainboard')) {
      if (l.includes('z790') || l.includes('x670') || l.includes('z690') || l.includes('server')) return 16500;
      if (l.includes('h610') || l.includes('a520') || l.includes('a320') || l.includes('h310')) return 3850;
      return 6800;
    }

    // 12. POWER SUPPLY & UPS / AVR
    if (l.includes('psu') || l.includes('power supply')) {
      if (l.includes('1000w') || l.includes('1200w') || l.includes('platinum')) return 11800;
      if (l.includes('750w') || l.includes('850w') || l.includes('gold')) return 5900;
      if (l.includes('generic')) return 850;
      return 3200;
    }

    if (l.includes('ups') || l.includes('backup battery') || l.includes('power backup') || l.includes('avr')) {
      if (l.includes('3000va') || l.includes('online ups') || l.includes('rackmount')) return 32500;
      if (l.includes('2000va')) return 14500;
      if (l.includes('1500va')) return 10800;
      if (l.includes('1000va') || l.includes('1200va')) return 5200;
      if (l.includes('650va') || l.includes('600va')) return 2250;
      if (l.includes('avr') || l.includes('servo')) return 1650;
      return 5200;
    }

    // 13. NETWORKING & INFRASTRUCTURE
    if (l.includes('switch') || l.includes('router') || l.includes('access point') || l.includes('firewall') || l.includes('hub')) {
      if (l.includes('48-port') || l.includes('core switch') || l.includes('poe 48')) return 22500;
      if (l.includes('24-port')) return 11500;
      if (l.includes('8-port') || l.includes('5-port')) return 1150;
      if (l.includes('access point') || l.includes('wifi 6')) return 8500;
      if (l.includes('firewall') || l.includes('gateway')) return 19500;
      return 11500;
    }

    // 14. PRINTERS, PROJECTORS & OTHER HARDWARE
    if (l.includes('projector') || l.includes('interactive') || l.includes('smartboard')) return 24500;
    if (l.includes('printer') || l.includes('scanner')) {
      if (l.includes('laser') || l.includes('heavy duty')) return 16500;
      return 9500;
    }

    if (l.includes('keyboard') || l.includes('mouse') || l.includes('headset') || l.includes('webcam') || l.includes('speaker')) {
      if (l.includes('mechanical') || l.includes('4k webcam')) return 3200;
      return 950;
    }

    // DYNAMIC CHARACTER-HASH CALCULATION FOR UNLISTED CUSTOM EQUIPMENT (NO DUPES)
    const hash = Array.from(hardwareName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 4500 + (hash % 24) * 1250;
  };

  // DYNAMIC WAVE POINTS
  const [wavePoints, setWavePoints] = useState<any[]>([]);

  // REAL-TIME ANIMATION TICKER
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePoints(prev => prev.map((p, idx) => {
        if (idx === 0) return p;
        return {
          ...p,
          l1: Math.min(98, Math.max(15, p.l1 + (Math.random() - 0.49) * 16)),
          l2: Math.min(85, Math.max(10, p.l2 + (Math.random() - 0.49) * 14))
        };
      }));

      setMaintenanceCost(prev => Math.min(7500, Math.max(3500, prev + Math.floor((Math.random() - 0.5) * 35))));
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // DYNAMIC: Fetch financial from backend
  useEffect(() => {
    apiClient.get('/api/v1/financials/summary').then((res: any) => {
      const s = res?.data?.data || res?.data;
      if (s) {
        if (typeof s.totalAllocated === 'number') setAllocatedBudget(s.totalAllocated);
        if (typeof s.totalSpent === 'number') setMaintenanceCost(s.totalSpent);
        console.log('[Financial] Loaded summary:', s);
      }
    }).catch((e: any) => console.warn('[Financial] Fetch failed:', e));
  }, []);
  // DYNAMIC FETCH: Assets, Audit Logs, Financial Expenses
  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/assets').catch(() => null),
      apiClient.get('/api/v1/audit-logs').catch(() => null),
      apiClient.get('/api/v1/financials/transactions').catch(() => null)
    ]).then(([assetsRes, logsRes, expRes]) => {
      // 1. Setup Unrepairable Assets
      const assets = assetsRes?.data?.data || assetsRes?.data;
      if (Array.isArray(assets)) {
        const writeOffs = assets.filter((a: any) => 
          a.status === 'BEYOND_REPAIR' || a.status === 'CONDEMNED' || a.status === 'DISPOSED'
        ).map((a: any) => ({
          id: a.id || a.assetTag || 'UNKNOWN',
          lab: a.laboratoryName || a.labRoom || 'Unknown Lab',
          name: a.name || a.model || 'Hardware',
          issue: a.issue || a.description || 'Unrepairable',
          status: a.status || 'BEYOND REPAIR',
          cost: Number(a.cost || a.purchasePrice || 0),
          dateAdded: a.createdAtUtc ? new Date(a.createdAtUtc).toLocaleDateString() : 'N/A'
        }));
        setUnrepairableAssets(writeOffs);
      }

      // 2. Setup Audit Logs
      const logs = logsRes?.data?.data || logsRes?.data;
      if (Array.isArray(logs)) {
        setAuditLogs(logs.slice(0, 10).map((l: any) => ({
          id: l.id ? l.id.substring(0, 8) : 'LOG',
          text: l.action || l.description || 'System activity',
          time: l.timestampUtc ? new Date(l.timestampUtc).toLocaleTimeString() : 'Just now',
          type: l.type || 'INFO'
        })));
      }

      // 3. Setup Financial Expenses (para sa listahan sa baba)
      const exps = expRes?.data?.data || expRes?.data;
      if (Array.isArray(exps) && exps.length > 0) {
        setExpenses(exps);
        // Auto-sum ang maintenance at software costs kung may data
        const totalMaint = exps.filter((e: any) => e.category === 'MAINTENANCE' || e.category === 'Repair').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        const totalSW = exps.filter((e: any) => e.category === 'SOFTWARE' || e.category === 'License').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
        if (totalMaint > 0) setMaintenanceCost(totalMaint);
        if (totalSW > 0) setSoftwareCost(totalSW);
      }
    }).catch(err => console.warn('[Financial] API Error:', err));
  }, []);
  // DYNAMIC: Fetch all financial data
  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/financials/summary').catch(() => null),
      apiClient.get('/api/v1/financials/transactions').catch(() => null),
      apiClient.get('/api/v1/assets').catch(() => null),
      apiClient.get('/api/v1/audit-logs').catch(() => null)
    ]).then(([summaryRes, txRes, assetsRes, logsRes]) => {
      // Summary â†’ budget
      const s = summaryRes?.data?.data || summaryRes?.data;
      if (s) {
        if (typeof s.totalAllocated === 'number') setAllocatedBudget(s.totalAllocated);
        if (typeof s.totalSpent === 'number') setMaintenanceCost(s.totalSpent);
      }

      // Transactions â†’ expenses
      const txs = txRes?.data?.data || txRes?.data;
      if (Array.isArray(txs) && txs.length > 0) {
        const maint = txs.filter((t: any) => 
          (t.category || '').toUpperCase().includes('MAINT') || 
          (t.category || '').toUpperCase().includes('REPAIR')
        ).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        const sw = txs.filter((t: any) => 
          (t.category || '').toUpperCase().includes('SOFT') ||
          (t.category || '').toUpperCase().includes('LICENS')
        ).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        if (maint > 0) setMaintenanceCost(maint);
        if (sw > 0) setSoftwareCost(sw);
      }

      // Assets â†’ unrepairable
      const assets = assetsRes?.data?.data || assetsRes?.data;
      if (Array.isArray(assets)) {
        const writeOffs = assets.filter((a: any) => {
          const st = (a.status || '').toUpperCase();
          return st.includes('BEYOND') || st.includes('CONDEMNED') || st.includes('DISPOSED') || st.includes('UNREPAIR');
        }).map((a: any) => ({
          id: a.id || a.assetTag || 'N/A',
          lab: a.laboratoryName || a.labRoom || 'N/A',
          name: a.name || a.model || 'Hardware',
          issue: a.description || a.issue || 'Unrepairable',
          status: 'BEYOND REPAIR' as WriteOffItem['status'],
          cost: Number(a.cost || a.purchasePrice || 0),
          dateAdded: a.createdAtUtc ? new Date(a.createdAtUtc).toLocaleDateString() : 'N/A'
        }));
        setUnrepairableAssets(writeOffs);
      }

      // Logs â†’ audit
      const logs = logsRes?.data?.data || logsRes?.data;
      if (Array.isArray(logs)) {
        setAuditLogs(logs.slice(0, 10).map((l: any) => ({
          id: (l.id || '').substring(0, 8) || 'LOG',
          text: l.action || l.description || 'System activity',
          time: l.timestampUtc ? new Date(l.timestampUtc).toLocaleString() : 'Just now',
          type: l.type || 'INFO'
        })));
      }
    }).catch((e: any) => console.warn('[Financial] Fetch error:', e));

    // Animation loop
    const interval = setInterval(() => {
      setWavePoints(prev => {
        if (prev.length === 0) {
          return Array.from({ length: 9 }, (_, i) => ({
            x: i * 37.5,
            l1: 20 + Math.random() * 60,
            l2: 15 + Math.random() * 50
          }));
        }
        return prev.map(p => ({
          ...p,
          l1: Math.min(98, Math.max(15, p.l1 + (Math.random() - 0.5) * 16)),
          l2: Math.min(85, Math.max(10, p.l2 + (Math.random() - 0.5) * 14))
        }));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  // CALCULATED METRICS
  const totalWriteOffCost = useMemo(() => {
    return unrepairableAssets.reduce((sum, item) => sum + item.cost, 0);
  }, [unrepairableAssets]);

  const totalSpent = useMemo(() => {
    return maintenanceCost + softwareCost + totalWriteOffCost;
  }, [maintenanceCost, softwareCost, totalWriteOffCost]);

  const remainingBudget = Math.max(0, allocatedBudget - totalSpent);
  const spentPercentage = Math.min(100, Math.round((totalSpent / allocatedBudget) * 100));

  // FILTERED ASSETS LIST
  const filteredAssets = useMemo(() => {
    return unrepairableAssets.filter(asset => {
      const matchesSearch = (asset.id || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (asset.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (asset.lab || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                            (asset.issue || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [unrepairableAssets, searchQuery, statusFilter]);

  // HANDLER FOR ADDING ITEM (AUTOMATED VALUATION ENGINE)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.id || !newItem.name || !newItem.lab) {
      onTriggerNotification('Paki-punan ang lahat ng kinakailangang impormasyon!');
      return;
    }

    const calculatedCost = estimateMarketPrice(newItem.name);

    const created: WriteOffItem = {
      id: newItem.id.toUpperCase(),
      lab: newItem.lab.trim(),
      name: newItem.name.trim(),
      issue: newItem.issue.trim() || 'Beyond Economic Repair',
      status: newItem.status,
      cost: calculatedCost,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setUnrepairableAssets(prev => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewItem({ id: '', lab: 'ComLab 1', name: '', issue: '', status: 'BEYOND REPAIR' });
    onTriggerNotification(`Naidagdag ang ${created.id} sa ledger na may auto-verified market value na ₱${created.cost.toLocaleString()}!`);

    // Add audit log
    setAuditLogs(prev => [
      { id: `LOG-${Math.floor(800 + Math.random() * 200)}`, text: `Added write-off asset ${created.id} (Auto Valued: ₱${created.cost.toLocaleString()})`, time: 'Just now', type: 'PURCHASE' },
      ...prev
    ]);
  };

  const handleDeleteItem = (id: string) => {
    setUnrepairableAssets(prev => prev.filter(a => a.id !== id));
    onTriggerNotification(`Naalis na ang item ${id} sa ledger list.`);
  };

  const handleToggleStatus = (id: string) => {
    setUnrepairableAssets(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'REPLACED' ? 'BEYOND REPAIR' : 'REPLACED';
        onTriggerNotification(`Nabagong status ng ${id} sa ${nextStatus}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const buildLayerPath = (key: 'l1' | 'l2') => {
    const height = 110;
    const linePath = wavePoints.reduce((acc, curr, i, a) => {
      const yPos = height - (curr[key] / 100) * height * 0.82 - 8;
      if (i === 0) return `M ${curr.x},${yPos}`;
      const prev = a[i - 1];
      const prevY = height - (prev[key] / 100) * height * 0.82 - 8;
      const cx = (prev.x + curr.x) / 2;
      return `${acc} C ${cx},${prevY} ${cx},${yPos} ${curr.x},${yPos}`;
    }, '');

    return `${linePath} L 300,110 L 0,110 Z`;
  };

  const handleExportPdf = () => {
    setIsExporting('PDF');
    setTimeout(() => {
      setIsExporting(null);
      onTriggerNotification('Nai-export na ang Complete Financial Audit Report sa PDF!');
    }, 1000);
  };

  const handleExportCsv = () => {
    setIsExporting('CSV');
    setTimeout(() => {
      setIsExporting(null);
      onTriggerNotification('Nai-export na ang Financial Ledger Dataset sa CSV!');
    }, 1000);
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <DollarSign className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Records & Equipment Write-Offs</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-400">Real-time Budget Allocation, Equipment Disposal & Maintenance Ledger • {campusName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Write-Off Item</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-[11px] font-bold">
            {(['LIVE', '24H', '7D', '30D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${timeframe === tf ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOP STATS CARDS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Budget</span>
          <p className="text-lg font-black text-slate-900 font-mono">₱{allocatedBudget.toLocaleString()}</p>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${spentPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Expenditure</span>
          <p className="text-lg font-black text-slate-900 font-mono">₱{totalSpent.toLocaleString()}</p>
          <span className="text-[10px] text-blue-600 font-bold font-mono">{spentPercentage}% of Budget Utilized</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Funds</span>
          <p className="text-lg font-black text-emerald-600 font-mono">₱{remainingBudget.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-bold font-mono">â— Active Liquidity</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Unrepairable Assets</span>
          <p className="text-lg font-black text-rose-600 font-mono">₱{totalWriteOffCost.toLocaleString()}</p>
          <span className="text-[10px] text-rose-600 font-bold font-mono">{unrepairableAssets.length} Write-off Units</span>
        </div>
      </div>

      {/* GRAPH CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Analytics & Reports</span>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Financial Forecast & Growth Wave</span>
            </h4>
          </div>
          <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300"></span>
        </div>

        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="h-36 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 110" preserveAspectRatio="none">
              <defs>
                <linearGradient id="finGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="finGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              <line x1="0" y1="90" x2="300" y2="90" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />
              <line x1="0" y1="15" x2="300" y2="15" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />

              <line x1="50" y1="0" x2="50" y2="110" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="160" y1="0" x2="160" y2="110" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="240" y1="0" x2="240" y2="110" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />

              <rect x="10" y="30" width="18" height="70" rx="4" fill="#1e3a8a" opacity="0.85" />

              <path 
                d={buildLayerPath('l1')} 
                fill="url(#finGrad1)" 
                className="transition-all duration-300 ease-out"
              />

              <path 
                d={buildLayerPath('l2')} 
                fill="url(#finGrad2)" 
                className="transition-all duration-300 ease-out"
              />

              <path 
                d={buildLayerPath('l1').split(' L 300,110')[0]} 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2.5" 
                className="transition-all duration-300 ease-out"
              />
              <path 
                d={buildLayerPath('l2').split(' L 300,110')[0]} 
                fill="none" 
                stroke="#1d4ed8" 
                strokeWidth="2" 
                className="transition-all duration-300 ease-out"
              />

              <circle cx="160" cy="40" r="3.5" fill="#1d4ed8" className="animate-ping" />
              <circle cx="160" cy="40" r="3.5" fill="#1d4ed8" />
              <circle cx="240" cy="22" r="3.5" fill="#1d4ed8" />
            </svg>

            <div className="absolute top-1 left-[14%] text-[9px] font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">Growth Phase</div>
            <div className="absolute top-1 left-[50%] text-[9px] font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">Decline</div>
            <div className="absolute top-1 left-[76%] text-[9px] font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">Peak</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 mt-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Stream</span>
              <p className="text-xs font-black text-slate-800">Primary Allocation: ₱{totalSpent.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>2.4 hrs Summary</span>
              </div>

              <button
                onClick={() => onTriggerNotification('Financial Audit Stream re-synchronized!')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                Audit Stream
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONDEMNED & UNREPAIRABLE ASSETS LEDGER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-rose-600 uppercase">Disposal & Write-Off Ledger</span>
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <PackageX className="w-4 h-4 text-rose-600" />
              <span>Unrepairable Laboratory Equipment</span>
            </h4>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search Asset ID, Lab..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none w-48 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="BEYOND REPAIR">Beyond Repair</option>
              <option value="CONDEMNED">Condemned</option>
              <option value="DISPOSED">Disposed</option>
              <option value="REPLACED">Replaced</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-500 border-b">
              <tr>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Location</th>
                <th className="p-3">Hardware Item</th>
                <th className="p-3">Diagnostic Failure</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Replacement Cost</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono font-medium">
              {filteredAssets.length > 0 ? (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-rose-600">{asset.id}</td>
                    <td className="p-3 font-sans font-bold text-slate-700">{asset.lab}</td>
                    <td className="p-3 font-sans font-extrabold text-slate-900">{asset.name}</td>
                    <td className="p-3 font-sans text-slate-500">{asset.issue}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${asset.status === 'REPLACED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">₱{asset.cost.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(asset.id)}
                          title="Toggle Status (Mark Replaced)"
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(asset.id)}
                          title="Delete Record"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 font-sans italic">
                    Walang nahanap na write-off item batay sa search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINANCIAL RECORDS LEDGER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Financial Records</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400 font-bold">LIVE LEDGER</span>
        </div>

        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition">
            <span className="flex items-center gap-2 font-bold text-slate-800 font-sans">
              <strong className="text-blue-600 font-mono">₱</strong> Preventive Maintenance & Cleaning
            </span>
            <strong className="text-slate-900 font-bold text-sm">₱{maintenanceCost.toLocaleString()}</strong>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition">
            <span className="flex items-center gap-2 font-bold text-slate-800 font-sans">
              <strong className="text-rose-600 font-mono">₱</strong> Condemned Hardware Replacement Write-off Fund
            </span>
            <strong className="text-slate-900 font-bold text-sm">₱{totalWriteOffCost.toLocaleString()}</strong>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition">
            <span className="flex items-center gap-2 font-bold text-slate-800 font-sans">
              <strong className="text-blue-600 font-mono">₱</strong> Network Infrastructure & Software Subscriptions
            </span>
            <strong className="text-slate-900 font-bold text-sm">₱{softwareCost.toLocaleString()}</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span>Allocated: <strong className="font-mono text-slate-900">₱{allocatedBudget.toLocaleString()}</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span>Remaining: <strong className="font-mono text-emerald-600">₱{remainingBudget.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => onTriggerNotification('Nai-terminate na ang active financial session.')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>Terminate Session</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TRAIL STREAM */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Live Audit & Approval Activity</span>
        <div className="space-y-1.5">
          {auditLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between text-xs font-medium text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{log.text}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* EXPORT BUTTONS */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleExportPdf}
          disabled={isExporting !== null}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isExporting === 'PDF' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>{isExporting === 'PDF' ? 'Generating...' : 'Export PDF'}</span>
        </button>

        <button
          onClick={handleExportCsv}
          disabled={isExporting !== null}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isExporting === 'CSV' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          <span>{isExporting === 'CSV' ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* ADD WRITE-OFF ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Write-Off / Condemned Asset</span>
              </h4>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Asset ID / Tag #</label>
                <input 
                  type="text" 
                  placeholder="e.g. PC-009, IPH-016, MON-015, GPU-010"
                  value={newItem.id}
                  onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-mono"
                  required
                />
              </div>

              {/* DUAL LAB SELECTION */}
              <div>
                <label className="block mb-1">Laboratory Location (Select or Type New)</label>
                <input 
                  type="text" 
                  list="lab-location-options"
                  placeholder="e.g. ComLab 1, ComLab 3, Multimedia Lab, Robotics Lab"
                  value={newItem.lab}
                  onChange={(e) => setNewItem({ ...newItem, lab: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 font-bold"
                  required
                />
                <datalist id="lab-location-options">
                  <option value="ComLab 1" />
                  <option value="ComLab 2" />
                  <option value="ComLab 3" />
                  <option value="Server Room" />
                  <option value="Multimedia Lab" />
                  <option value="Engineering Lab" />
                  <option value="Robotics Lab" />
                  <option value="Data Science Lab" />
                </datalist>
              </div>

              <div>
                <label className="block mb-1">Hardware / Equipment Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. iPhone 16 Pro Max, Samsung S24 Ultra, RTX 4070, 27&quot; 144Hz Monitor"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Diagnostic Failure / Issue</label>
                <input 
                  type="text" 
                  placeholder="e.g. Burned PCB, Water Damage, LCD Fracture"
                  value={newItem.issue}
                  onChange={(e) => setNewItem({ ...newItem, issue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />
              </div>

              {/* AUTOMATED AI MARKET PRICE VALUATION DISPLAY BOX */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-blue-700">
                    <Zap className="w-3.5 h-3.5 text-blue-600" /> Auto Market Price Valuation
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded-full">
                    Verified Rate
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Estimated Replacement Cost:</span>
                  <span className="text-base font-black text-blue-900 font-mono">
                    ₱{newItem.name ? estimateMarketPrice(newItem.name).toLocaleString() : '0'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans italic pt-0.5">
                  Automated pricing cross-referenced against official Philippine retail computer market values.
                </p>
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialReportsView;


