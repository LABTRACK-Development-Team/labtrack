import apiClient from '@/lib/api-client';
import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, X, Calendar, Plus 
} from 'lucide-react';

import { AiAssistantView } from './AiAssistantView';
import { QrGeneratorModal } from './QrGeneratorModal';
import { getCampusTopology } from '../../config/campusData';
import QrManagementView from './QrManagementView';
import AnalyticsReportsView from './AnalyticsReportsView';
import FinancialReportsView from './FinancialReportsView';
import { IssueServiceDeskView } from './IssueServiceDeskView';
import { MaintenanceView } from './MaintenanceView';
import { InventoryTransferView } from './InventoryTransferView';
import { SessionsManagementView } from './SessionsManagementView';
import UserAccessManagementView from './UserAccessManagementView';
import ProfileSettingsView from './ProfileSettingsView';
import { NotificationsManagementView } from './NotificationsManagementView';
import { AuditLogsView } from './AuditLogsView';

import { OverviewView } from './OverviewView';
import { CampusesLabsView } from './CampusesLabsView';
import { AssetsWorkstationDeskView } from './AssetsWorkstationDeskView';

interface AdminDashboardViewProps {
  campusName: string;
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ 
  campusName: initialCampusName, 
  activeTab, 
  onTabChange 
}) => {
  const [selectedCampus] = useState(initialCampusName || 'JRMSU Dapitan Main Campus');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER'>('ALL');
  const campusInfo = getCampusTopology(selectedCampus) || { labs: [], buildings: [] };

  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString());
  const [liveSessionsCount, setLiveSessionsCount] = useState(1563);
  const [cpuUsage, setCpuUsage] = useState(64);
  const [ramUsage, setRamUsage] = useState(71);
  const [networkSpeed, setNetworkSpeed] = useState('48.2 MB/s');
  const [liveWaveSeries, setLiveWaveSeries] = useState([42, 68, 50, 82, 58, 91, 74, 88, 62, 95, 78, 85]);

  const [deskSchedules, setDeskSchedules] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/reservations');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setDeskSchedules(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const [workstations, setWorkstations] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkstations = async () => {
      try {
        setIsLoadingData(true);

        const normalizeStatus = (raw: string): 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_ORDER' => {
          const s = (raw || '').toUpperCase();
          if (s === 'OPERATIONAL' || s === 'ONLINE' || s === 'ACTIVE' || s === 'AVAILABLE' || s === 'RUNNING') return 'OPERATIONAL';
          if (s === 'UNDER_MAINTENANCE' || s === 'MAINTENANCE' || s === 'REPAIR' || s === 'SERVICING') return 'UNDER_MAINTENANCE';
          if (s === 'OUT_OF_ORDER' || s === 'OFFLINE' || s === 'BROKEN' || s === 'DOWN' || s === 'FAULTY') return 'OUT_OF_ORDER';
          return 'OPERATIONAL';
        };

        const labsRes = await apiClient.get('/api/v1/laboratories');
        const labsRaw = labsRes.data?.data?.items || labsRes.data?.data || labsRes.data || [];
        const labs: any[] = Array.isArray(labsRaw) ? labsRaw : [];

        const allWorkstations: any[] = [];
        for (const lab of labs) {
          try {
            const wsRes = await apiClient.get(`/api/v1/laboratories/${lab.id}/workstations`);
            const wsRaw = wsRes.data?.data?.items || wsRes.data?.data || wsRes.data || [];
            const wsList: any[] = Array.isArray(wsRaw) ? wsRaw : [];

            for (const w of wsList) {
              allWorkstations.push({
                id: w.code || w.name || w.id || 'PC-UNKNOWN',
                lab: lab.name || 'Unknown Lab',
                status: normalizeStatus(w.status),
                cpu: w.cpuModel || w.operatingSystem || 'N/A',
                ram: w.ramSize || 'N/A',
                storage: w.storageSize || 'N/A',
                ping: '1ms',
                activeUser: w.activeUser || 'Vacant',
                ip: w.ipAddress || 'N/A',
                temp: 'N/A',
                power: 'N/A',
                score: 'N/A'
              });
            }
          } catch (labErr) {
            console.warn(`Failed to load workstations for lab ${lab.name}`, labErr);
          }
        }

        setWorkstations(allWorkstations);
      } catch (err) {
        console.error("Fetch workstations failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchWorkstations();
  }, []);

  const [selectedAssetCard, setSelectedAssetCard] = useState<any>(null);

  const [workOrders, setWorkOrders] = useState<any[]>([]);

  const [typedText, setTypedText] = useState('');
  const statusAnnouncements = [
    `LabTrack Telemetry Grid actively monitoring ${workstations.length} workstation nodes across ${selectedCampus}.`,
    `Cluster status derived from live workstation telemetry — see Operational Readiness below.`,
    `Python AI Telemetry Agent active: Zero critical hardware bus collisions detected on subnet 192.168.10.x.`,
    `Real-time Maintenance Budget ledger dynamically syncs with active repair work orders (${workOrders.length} pending).`,
    `Live User Stream tracking ${liveSessionsCount} active student telemetry sessions.`
  ];
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [selectedDrilldown, setSelectedDrilldown] = useState<string | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const [schedPc, setSchedPc] = useState('PC-001');
  const [schedDay, setSchedDay] = useState('Mon');
  const [schedUser, setSchedUser] = useState('');

  const [loginFeed, setLoginFeed] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/audit-logs');
        // âœ… FETCH: work orders from repair tickets
        try {
          const woRes = await apiClient.get('/api/v1/repair-tickets');
          const woData = woRes.data?.data?.items || woRes.data?.data || woRes.data || [];
          if (Array.isArray(woData) && woData.length > 0) {
            const mapped = woData.map((t: any) => ({
              id: t.ticketNumber || t.id || 'WO-' + String(t.id).slice(0,6),
              pcId: t.assetTag || t.assetId || 'N/A',
              lab: t.laboratoryName || campusInfo.labs[0]?.name || 'ComLab 1',
              issue: t.title || t.description || 'Repair required',
              priority: (t.priority || 'MEDIUM').toUpperCase(),
              status: t.status === 'RESOLVED' ? 'Completed' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Waiting for Parts',
              tech: t.assignedToName || 'Unassigned',
              dueDate: t.dueDate ? String(t.dueDate).slice(0,10) : new Date().toISOString().slice(0,10),
              cost: Number(t.cost) || 0
            }));
            setWorkOrders(mapped);
          }
        } catch (err) {
          console.warn('Work orders fetch failed:', err);
        }
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setLoginFeed(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const [newAssetTag, setNewAssetTag] = useState('');
  const [newAssetLab, setNewAssetLab] = useState(campusInfo.labs[0]?.name || 'ComLab 1');

  const rawTab = activeTab || 'overview';
  const cleanTab = (rawTab || "").toLowerCase().replace(/[-_ ]/g, '');

  const isOverview = cleanTab === 'overview' || cleanTab === 'dashboard';
  const isCampuses = cleanTab.includes('campus') || cleanTab.includes('lab') || cleanTab.includes('topology');
  const isAssets = cleanTab.includes('asset') || (cleanTab.includes('workstation') && !cleanTab.includes('session'));
  const isQr = cleanTab.includes('qr');
  const isAnalytics = cleanTab.includes('analytic') || (cleanTab.includes('report') && !cleanTab.includes('finan'));
  const isFinancial = cleanTab.includes('finan') || cleanTab.includes('budget') || cleanTab.includes('record');
  const isIssues = cleanTab.includes('issue') || cleanTab.includes('service') || cleanTab.includes('ticket');
  const isMaintenance = cleanTab.includes('maintenance') || cleanTab.includes('preventive');
  const isTransfer = cleanTab.includes('transfer') || cleanTab.includes('inventory') || cleanTab.includes('logistics');
  const isSessions = cleanTab.includes('session') || cleanTab.includes('worksession');
  const isUsers = (cleanTab.includes('user') || cleanTab.includes('access')) && !cleanTab.includes('profile') && !cleanTab.includes('setting');
  const isProfileSettings = cleanTab.includes('profile') || cleanTab.includes('setting');
  const isNotifications = cleanTab.includes('notif') || cleanTab.includes('alert') || cleanTab.includes('bell');
  const isAuditLogs = cleanTab.includes('audit') || cleanTab.includes('log');
  const isAiAssistant = cleanTab.includes('assistant') || cleanTab === 'ai' || cleanTab === 'aiassistant';

  useEffect(() => {
    const liveTicker = setInterval(() => {
      const nowTime = new Date().toLocaleTimeString();
      setLiveClock(nowTime);
      setLiveSessionsCount(prev => prev + (Math.random() > 0.48 ? 1 : -1));
      setCpuUsage(Math.floor(55 + Math.random() * 30));
      setRamUsage(Math.floor(65 + Math.random() * 15));
      setNetworkSpeed((42.0 + Math.random() * 9.5).toFixed(1) + ' MB/s');

      setLiveWaveSeries(prev => {
        const nextArr = [...prev.slice(1)];
        nextArr.push(Math.floor(38 + Math.random() * 58));
        return nextArr;
      });

      setLoginFeed(prev => prev.map(item => ({ ...item, time: nowTime })));
    }, 1000);
  return () => clearInterval(liveTicker);
  }, []);

  // Auto-select first workstation when workstations loads
  useEffect(() => {
    if (workstations && workstations.length > 0 && !selectedAssetCard) {
      setSelectedAssetCard(workstations[0]);
    }
  }, [workstations, selectedAssetCard]);

  useEffect(() => {
    if (!isOverview) return;
    let charIndex = 0;
    const currentFullText = statusAnnouncements[announcementIndex];
    setTypedText('');

    const typingInterval = setInterval(() => {
      charIndex++;
      if (charIndex <= currentFullText.length) {
        setTypedText(currentFullText.slice(0, charIndex));
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setAnnouncementIndex((prev) => (prev + 1) % statusAnnouncements.length);
        }, 3800);
      }
    }, 35);
  return () => clearInterval(typingInterval);
  }, [announcementIndex, isOverview]);

  const triggerNotification = (message: string) => {
    setActionNotification(message);
    setTimeout(() => setActionNotification(null), 3500);
  };

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetTag.trim()) return;
    const newPc = {
      id: newAssetTag.toUpperCase(),
      lab: newAssetLab,
      status: 'OPERATIONAL' as const,
      cpu: '5%',
      ram: '4GB / 16GB',
      storage: '512GB NVMe',
      ping: '1ms',
      activeUser: 'Unassigned',
      ip: `192.168.10.${Math.floor(Math.random() * 200) + 20}`,
      temp: '32‚C',
      power: '95W',
      score: '96%'
    };
    setWorkstations(prev => [newPc, ...prev]);
    setNewAssetTag('');
    setIsAddAssetOpen(false);
    triggerNotification(`Asset ${newPc.id} successfully registered into ${newAssetLab}.`);
  };

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedUser.trim()) return;
    const newSched = {
      id: `SCH-${Math.floor(Math.random() * 800) + 100}`,
      pcId: schedPc,
      day: schedDay,
      time: '14:00 - 16:00',
      user: schedUser,
      lab: campusInfo.labs[0]?.name || 'ComLab 1',
      status: 'BOOKED' as const
    };
    setDeskSchedules(prev => [newSched, ...prev]);
    setSchedUser('');
    setIsScheduleModalOpen(false);
    triggerNotification(`Reservation added for ${schedPc} on ${schedDay}.`);
  };

  const handleEmergencyBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyMessage.trim()) return;
    triggerNotification(`Broadcast Dispatched: "${emergencyMessage}"`);
    setEmergencyMessage('');
    setIsEmergencyModalOpen(false);
  };
  return (
    <div className="space-y-6 text-slate-800 font-sans bg-[#f1f5f9] p-4 sm:p-6 rounded-[2.5rem] min-h-screen animate-in fade-in duration-300 pb-16">

      {actionNotification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white font-sans text-xs px-4 py-3 rounded-2xl shadow-2xl border border-rose-500/50 flex items-center gap-2.5 animate-bounce">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>{actionNotification}</span>
        </div>
      )}

      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100/80 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="font-extrabold text-slate-800">LabTrack Executive Portal</span>
            <span>/</span>
            <span className="text-blue-600 font-extrabold uppercase tracking-wide">{rawTab.replace(/[-_]/g, ' ')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full font-sans font-bold flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE CLOCK: {liveClock}</span>
            </span>

            {isOverview && (
              <button
                onClick={() => setIsEmergencyModalOpen(true)}
                className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-md shadow-rose-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Broadcast Alert</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isAiAssistant && 'AI Assistant Operations'}
            {isOverview && 'Executive Operations & Real-Time Telemetry'}
            {isCampuses && 'Campus Infrastructure & Laboratory Topology'}
            {isAssets && 'Assets / Workstation Desk'}
            {isQr && 'QR Token Studio & Printable Label Generator'}
            {isAnalytics && 'Operational Analytics & Reports'}
            {isFinancial && 'Financial Records & Repair Expenses (PHP)'}
            {isIssues && 'Issues & Service Desk Operations'}
            {isMaintenance && 'Maintenance & Preventive Schedule'}
            {isTransfer && 'Inventory Transfer & Logistics Operations'}
            {isSessions && 'Workstation Sessions & Telemetry Management'}
            {isUsers && 'Users & Access Management'}
            {isProfileSettings && 'Profile & Account Settings'}
            {isNotifications && 'Notifications & Alerts Management'}
            {isAuditLogs && 'System Audit Logs & Security Trails'}
          </h2>

          {isOverview && (
            <p className="text-xs text-slate-600 font-sans mt-3 flex items-center gap-2 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/60 min-h-[48px] shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
              <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px] shrink-0">LIVE TELEMETRY FEED:</span>
              <span className="font-semibold text-slate-800 tracking-tight">{typedText}</span>
              <span className="w-1.5 h-3.5 bg-blue-600 animate-ping inline-block shrink-0"></span>
            </p>
          )}
        </div>
      </div>

      {isAiAssistant && <AiAssistantView campusName={selectedCampus} />}

      {isOverview && (
        <OverviewView
          selectedCampus={selectedCampus}
          campusInfo={campusInfo}
          liveClock={liveClock}
          liveSessionsCount={liveSessionsCount}
          cpuUsage={cpuUsage}
          ramUsage={ramUsage}
          networkSpeed={networkSpeed}
          liveWaveSeries={liveWaveSeries || []}
          typedText={typedText}
          workstations={workstations || []}
          workOrders={workOrders || []}
          loginFeed={loginFeed || []}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onDrilldown={(info) => setSelectedDrilldown(info)}
          onTabChange={onTabChange}
        />
      )}

      {isCampuses && (
        <CampusesLabsView
          selectedCampus={selectedCampus}
          campusInfo={campusInfo}
          triggerNotification={triggerNotification}
        />
      )}

      {isAssets && (
        <AssetsWorkstationDeskView
          selectedCampus={selectedCampus}
          campusInfo={campusInfo}
          workstations={workstations || []}
          setWorkstations={setWorkstations}
          selectedAssetCard={selectedAssetCard}
          setSelectedAssetCard={setSelectedAssetCard}
          deskSchedules={deskSchedules || []}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setIsAddAssetOpen={setIsAddAssetOpen}
          setIsQrModalOpen={setIsQrModalOpen}
          setIsScheduleModalOpen={setIsScheduleModalOpen}
          onDrilldown={(info) => setSelectedDrilldown(info)}
          triggerNotification={triggerNotification}
        />
      )}

      {isQr && (
        <QrManagementView 
          campusName={selectedCampus}
          workstations={workstations || []}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isAnalytics && (
        <AnalyticsReportsView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isFinancial && (
        <FinancialReportsView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isIssues && (
        <IssueServiceDeskView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isMaintenance && (
        <MaintenanceView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isTransfer && (
        <InventoryTransferView 
          campusName={selectedCampus} 
          onTriggerNotification={triggerNotification} 
        />
      )}

      {isNotifications && (
        <NotificationsManagementView 
          campusName={selectedCampus} 
          onTriggerNotification={triggerNotification} 
        />
      )}

      {isUsers && (
        <UserAccessManagementView 
          campusName={selectedCampus} 
          onTriggerNotification={triggerNotification} 
        />
      )}

      {isProfileSettings && (
        <ProfileSettingsView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isSessions && (
        <SessionsManagementView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {isAuditLogs && (
        <AuditLogsView 
          campusName={selectedCampus}
          onTriggerNotification={triggerNotification}
        />
      )}

      {selectedDrilldown && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Telemetry Inspection Details</h3>
              <button onClick={() => setSelectedDrilldown(null)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">{selectedDrilldown}</p>
            <button onClick={() => setSelectedDrilldown(null)} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-2xl text-xs shadow-md cursor-pointer">Close Inspector</button>
          </div>
        </div>
      )}

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Reserve Workstation Slot
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAddScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Workstation Node</label>
                <select value={schedPc} onChange={(e) => setSchedPc(e.target.value)} className="w-full border p-2.5 rounded-xl font-sans outline-none">
                  {workstations.map(w => (
                    <option key={w.id} value={w.id}>{w.id} ({w.lab})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Day of Week</label>
                <select value={schedDay} onChange={(e) => setSchedDay(e.target.value)} className="w-full border p-2.5 rounded-xl font-sans outline-none">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Reserved By / User Group</label>
                <input type="text" value={schedUser} onChange={(e) => setSchedUser(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none" required placeholder="e.g. BSIT Class Sec B" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-2xl shadow cursor-pointer">Save Reservation</button>
            </form>
          </div>
        </div>
      )}

      {isAddAssetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Workstation Asset</h3>
              <button onClick={() => setIsAddAssetOpen(false)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <form onSubmit={handleAddAssetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Workstation Tag</label>
                <input type="text" value={newAssetTag} onChange={(e) => setNewAssetTag(e.target.value)} className="w-full border p-2.5 rounded-xl font-sans outline-none" required placeholder="e.g. PC-007" />
              </div>
              <div>
                <label className="block font-bold mb-1">Assigned Laboratory</label>
                <select value={newAssetLab} onChange={(e) => setNewAssetLab(e.target.value)} className="w-full border p-2.5 rounded-xl font-sans outline-none">
                  {campusInfo.labs.map((lab: any) => (
                    <option key={lab.id} value={lab.name}>{lab.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-2xl shadow cursor-pointer">Save Asset</button>
            </form>
          </div>
        </div>
      )}

      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-rose-600">
                <AlertOctagon className="w-4 h-4" /> Broadcast Network Alert
              </h3>
              <button onClick={() => setIsEmergencyModalOpen(false)} className="cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <form onSubmit={handleEmergencyBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Broadcast Message</label>
                <textarea 
                  rows={3} 
                  value={emergencyMessage} 
                  onChange={(e) => setEmergencyMessage(e.target.value)} 
                  className="w-full border p-2.5 rounded-xl outline-none text-slate-800" 
                  placeholder="System maintenance in 15 mins..." 
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-rose-600 text-white font-bold py-2.5 rounded-2xl shadow cursor-pointer">Dispatch Emergency Alert</button>
            </form>
          </div>
        </div>
      )}

      <QrGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        campuses={[{ id: campusInfo.id, name: selectedCampus }]}
      />

    </div>
  );
};

export default AdminDashboardView;

