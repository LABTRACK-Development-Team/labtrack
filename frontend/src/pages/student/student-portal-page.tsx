import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {  useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';;
import { 
  AlertTriangle, Clock, CheckCircle2, 
  X, Home, Bell, User, Send, ShieldAlert, Laptop,
  Trash2, ChevronRight, BookOpen, LogOut, ChevronDown,
  Award, Download, ShieldCheck,
  QrCode, Activity, FileText, Sparkles, MapPin,
  UserCheck, Zap, Monitor, RefreshCw, Check, Calendar,
  Printer
} from 'lucide-react';
import { usePcSession } from '../../hooks/usePcSession';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../context/auth-context';

const COMPLETE_PROBLEM_CATEGORIES = [
  'No Display / Black Screen',
  'No Power / Will Not Turn On',
  'Keyboard Problem / Keys Not Working',
  'Mouse Disconnected / Unresponsive',
  'Monitor Flicker / Glitch / Lines',
  'Internet / Network Offline',
  'Audio / Headset No Sound',
  'Software / OS / Application Error',
  'System Lag / Freezing / Slow OS',
  'Missing Equipment / Stolen Cable',
  'Physical Damage / Broken Desk or Chair',
  'Overheating / Noisy Fan',
  'Others'
];

const parsePcNumber = (val: any): number | null => {
  if (!val) return null;
  const str = String(val).toUpperCase().trim();
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

// DYNAMIC WS FORMAT HELPER (PC-001 -> WS-01, PC-005 -> WS-05)
const formatWs = (val: any) => {
  if (!val) return 'WS-00';
  const num = parsePcNumber(val);
  return num !== null ? `WS-${String(num).padStart(2, '0')}` : 'WS-00';
};

const OCCUPIED_REGISTRY_KEY = 'labtrack_occupied_pcs_v3';

const getTabId = (): string => {
  let tabId = sessionStorage.getItem('labtrack_tab_id');
  if (!tabId) {
    tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('labtrack_tab_id', tabId);
  }
  return tabId;
};

const determineInitialPc = (fromUrlPc: string | null, capacity: number): string => {
  const currentTabId = getTabId();

  // 1. UNAHIN ANG URL PARAMETER (QR Scan).
  if (fromUrlPc) {
    const reqNum = parsePcNumber(fromUrlPc);
    if (reqNum !== null) {
      const target = 'PC-' + String(reqNum).padStart(3, '0');
      sessionStorage.setItem('labtrack_claimed_pc', target);
      return target;
    }
  }

  // 2. Kung walang URL param, tsaka lang titingnan ang naka-save sa session
  const claimedInTab = sessionStorage.getItem('labtrack_claimed_pc');
  if (claimedInTab && claimedInTab !== 'PC-FULL') {
    return claimedInTab;
  }

  // 3. Kung wala pa ring naka-save, mag-assign ng bakante
  const occupiedSet = new Set<number>();
  try {
    const raw = localStorage.getItem(OCCUPIED_REGISTRY_KEY);
    if (raw) {
      const map: Record<string, { tabId: string; ts: number }> = JSON.parse(raw);
      const now = Date.now();
      Object.entries(map).forEach(([pcCode, data]) => {
        if (data.tabId !== currentTabId && (now - data.ts < 20000)) {
          const num = parsePcNumber(pcCode);
          if (num !== null) occupiedSet.add(num);
        }
      });
    }
  } catch (e) {}

  for (let i = 1; i <= capacity; i++) {
    if (!occupiedSet.has(i)) {
      const target = 'PC-' + String(i).padStart(3, '0');
      sessionStorage.setItem('labtrack_claimed_pc', target);
      return target;
    }
  }

  return 'FULL';
};

export const StudentPortalPage: React.FC = () => {
  const { user } = useAuth();
  
  const studentName = user ? ((user.firstName || '') + ' ' + (user.lastName || '')).trim() || 'Student' : 'Student';

  const { workstationId: pathParam } = useParams<{ workstationId: string }>();
  const [searchParams] = useSearchParams();
  const pcFromQuery = searchParams.get('pc');
  const labFromQuery = searchParams.get('lab');
  const capacityFromQuery = parseInt(searchParams.get('capacity') || '61');
  const scheduleFromQuery = searchParams.get('schedule');

  const initialPc = useMemo(() => {
    return determineInitialPc(pcFromQuery || pathParam || null, capacityFromQuery);
  }, [pcFromQuery, pathParam, capacityFromQuery]);

  const [hasValidSession, setHasValidSession] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("labtrack_active_session");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed.expiresAt > Date.now();
    } catch { return false; }
  });

  const [assignedPc, setAssignedPc] = useState<string>(initialPc);

  useEffect(() => {
    const syncBackendOccupiedPcs = async () => {
      const currentTabId = getTabId();
      
      if (pcFromQuery || pathParam) {
        setAssignedPc(initialPc);
        return;
      }

      const claimedInTab = sessionStorage.getItem('labtrack_claimed_pc');
      if (claimedInTab && claimedInTab !== 'PC-FULL') {
        setAssignedPc(claimedInTab);
        return;
      }

      try {
        const activeRes = await apiClient.get('/api/v1/pc-usage/active?pageNumber=1&pageSize=1000').catch(() => null);
        const respData = activeRes?.data?.data;
        const activeSessions = Array.isArray(respData) ? respData : (respData?.items || []);

        const occupiedSet = new Set<number>();
        activeSessions.forEach((s: any) => {
          const rawCode = s.workstationCode || s.workstationNumber || s.pcNumber || s.workstationId || s.pc || s.assignedPc;
          const num = parsePcNumber(rawCode);
          if (num !== null) occupiedSet.add(num);
        });

        const rawLocal = localStorage.getItem(OCCUPIED_REGISTRY_KEY);
        if (rawLocal) {
          const map: Record<string, { tabId: string; ts: number }> = JSON.parse(rawLocal);
          const now = Date.now();
          Object.entries(map).forEach(([pcCode, data]) => {
            if (data.tabId !== currentTabId && (now - data.ts < 20000)) {
              const num = parsePcNumber(pcCode);
              if (num !== null) occupiedSet.add(num);
            }
          });
        }

        let targetPc: string | null = null;
        for (let i = 1; i <= (capacityFromQuery || 61); i++) {
          if (!occupiedSet.has(i)) {
            targetPc = 'PC-' + String(i).padStart(3, '0');
            break;
          }
        }

        if (targetPc) {
          setAssignedPc(targetPc);
          sessionStorage.setItem('labtrack_claimed_pc', targetPc);
          
          const newSession = {
            lab: labFromQuery || "Main Lab",
            pc: targetPc,
            startedAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
          };
          localStorage.setItem("labtrack_active_session", JSON.stringify(newSession));
          if (scheduleFromQuery) localStorage.setItem("labtrack_active_schedule", scheduleFromQuery);
          setHasValidSession(true);

          apiClient.post('/api/v1/pc-usage/scan-login-auto', {
            laboratoryId: '00000000-0000-0000-0000-000000000000',
            laboratoryName: labFromQuery || 'Main Lab',
            workstationCode: targetPc,
            workstationNumber: targetPc,
            pcNumber: targetPc
          }).catch(() => {});
        }
      } catch (err) {}
    };

    syncBackendOccupiedPcs();
  }, [capacityFromQuery, labFromQuery, scheduleFromQuery, pcFromQuery, pathParam, initialPc]);

  useEffect(() => {
    if (!assignedPc || assignedPc === 'FULL') return;
    const registerHeartbeat = () => {
      try {
        const tabId = getTabId();
        const raw = localStorage.getItem(OCCUPIED_REGISTRY_KEY);
        const map: Record<string, { tabId: string; ts: number }> = raw ? JSON.parse(raw) : {};
        map[assignedPc] = { tabId, ts: Date.now() };
        localStorage.setItem(OCCUPIED_REGISTRY_KEY, JSON.stringify(map));
      } catch (e) {}
    };

    registerHeartbeat();
    const interval = setInterval(registerHeartbeat, 3000);
    return () => clearInterval(interval);
  }, [assignedPc]);

  const workstationId = assignedPc || initialPc;
  let derivedLab = labFromQuery;
  if (!derivedLab) {
    try {
      const raw = localStorage.getItem("labtrack_active_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lab && parsed.lab !== "unknown") derivedLab = parsed.lab;
      }
    } catch (e) {}
  }

  const scannedLocation = {
    campus: 'JRMSU Dapitan Main Campus',
    lab: derivedLab || 'College of Computing ComLab 1',
    station: workstationId
  };

  const displayStation = useMemo(() => {
    if (assignedPc && assignedPc !== 'FULL') return assignedPc;
    return initialPc;
  }, [assignedPc, initialPc]);

  // DYNAMIC STUDENT ID (Nakadepende sa PC number - HASH GENERATED)
  const dynamicStudentId = useMemo(() => {
    if (!displayStation || displayStation === 'FULL') return 'STU-000000';
    const pcNum = parsePcNumber(displayStation) || 1;
    
    let hash = pcNum * 2654435761; 
    hash = hash >>> 0; 
    const idNum = 100000 + (hash % 900000); 
    
    return `STU-${idNum}`;
  }, [displayStation]);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'notifications' | 'profile'>('home');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDigitalIdModal, setShowDigitalIdModal] = useState(false);
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<any | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const [heartbeatBpm, setHeartbeatBpm] = useState(74);
  const [isUserActive, setIsUserActive] = useState(true);

  // --- 59-SECOND INACTIVITY / AWAY COUNTDOWN & AUTO-LOGOUT LOGIC ---
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [isAway, setIsAway] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(59);

  const resetUserActivity = useCallback(() => {
    setIsUserActive(true);
    setShowInactivityWarning(false);
    setIsAway(false);
    setInactivityCountdown(59);
  }, []);

  const getOrCreateSessionUuid = () => {
    try {
      let id = sessionStorage.getItem('labtrack_session_uuid');
      if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        sessionStorage.setItem('labtrack_session_uuid', id);
      }
      return id;
    } catch {
      return 'temp-' + Date.now();
    }
  };

  const sessionUuid = getOrCreateSessionUuid();
  const { endSession } = usePcSession(sessionUuid);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);

  const profileStats = useMemo(() => {
    const totalSessions = historyData.length + (sessionSeconds > 0 ? 1 : 0);
    const completedSessions = historyData.filter((s: any) => {
      const st = String(s.status || '').toUpperCase();
      return st === 'COMPLETED' || st === 'AUTO_TIMEOUT' || st === 'FORCED_LOGOUT';
    }).length;
    const totalMinutes = historyData.reduce((sum: number, s: any) => sum + (Number(s.durationMinutes) || 0), 0);
    const totalHours = (totalMinutes / 60) + (sessionSeconds / 3600);
    const attendancePct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 100;
    
    return { totalSessions, completedSessions, totalHours, attendancePct, scheduleText: 'General Class' };
  }, [historyData, sessionSeconds]);

  const handleLogout = useCallback(() => {
    const currentPc = displayStation;
    const currentLab = scannedLocation.lab;

    if (currentPc && currentPc !== 'FULL') {
      try {
        const raw = localStorage.getItem(OCCUPIED_REGISTRY_KEY);
        if (raw) {
          const map: Record<string, { tabId: string; ts: number }> = JSON.parse(raw);
          delete map[currentPc];
          localStorage.setItem(OCCUPIED_REGISTRY_KEY, JSON.stringify(map));
        }
      } catch (e) {}
    }

    sessionStorage.removeItem('labtrack_claimed_pc');
    sessionStorage.removeItem('labtrack_session_uuid');
    sessionStorage.removeItem('labtrack_tab_id');
    localStorage.removeItem('labtrack_active_session');

    if (currentPc && currentPc !== 'FULL') {
      apiClient.post('/api/v1/pc-usage/heartbeat', {
        workstationCode: currentPc,
        laboratoryName: currentLab,
        isActive: false
      }).catch(() => {});

      apiClient.post('/api/v1/pc-usage/end-session-release/' + sessionUuid, {}).catch(() => {});
    }
    try { endSession(); } catch (e) {}

    window.location.href = "/student";
  }, [displayStation, scannedLocation.lab, endSession, sessionUuid]);

  // --- HEARTBEAT LOGIC: YELLOW FIRST -> 3 SECONDS -> COUNTDOWN ---
  useEffect(() => {
    let awayTimer: any = null;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        setIsAway(true);
        setIsUserActive(false);
        
        if (awayTimer) clearTimeout(awayTimer);
        awayTimer = setTimeout(() => {
          setShowInactivityWarning(true);
        }, 3000);
      } else {
        setIsAway(false);
        setShowInactivityWarning(false);
        setInactivityCountdown(59);
        setIsUserActive(true);
        if (awayTimer) clearTimeout(awayTimer);
        resetUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleVisibility);
      if (awayTimer) clearTimeout(awayTimer);
    };
  }, [resetUserActivity]);

  // Countdown interval para sa 59 seconds
  useEffect(() => {
    let countdownTimer: any = null;
    if (showInactivityWarning && inactivityCountdown > 0) {
      countdownTimer = setInterval(() => {
        setInactivityCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            handleLogout(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [showInactivityWarning, handleLogout]);

  // Fetch Notifications & History
  useEffect(() => {
    if (!hasValidSession && !labFromQuery && !pcFromQuery && !pathParam) return;
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get('/api/v1/notifications');
        const data = res.data?.data || res.data;
        const items = Array.isArray(data) ? data : (data?.items || []);
        const mapped = items.map((n: any) => ({
          id: n.id || Date.now(),
          title: n.title || n.subject || 'Notification',
          desc: n.message || n.body || n.content || '',
          time: n.createdAtUtc ? new Date(n.createdAtUtc).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now',
          unread: !(n.isRead || n.readAtUtc)
        }));
        if (mapped.length > 0) setNotifications(mapped);
      } catch (err) {}
    };
    fetchNotifications();
  }, [hasValidSession, labFromQuery, pcFromQuery, pathParam]);

  useEffect(() => {
    if (!hasValidSession && !labFromQuery && !pcFromQuery && !pathParam) return;
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/api/v1/pc-usage/history');
        const data = res.data?.data || res.data;
        const items = Array.isArray(data) ? data : (data?.items || []);
        setHistoryData(items);
      } catch (err: any) {
        setHistoryData([]);
      }
    };
    fetchHistory();
  }, [hasValidSession, labFromQuery, pcFromQuery, pathParam]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateStr(now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };

    updateDateTime();
    const timer = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
      updateDateTime();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      setHeartbeatBpm(isUserActive ? 72 + Math.floor(Math.random() * 6) : 60 + Math.floor(Math.random() * 4));
    }, 1200);
    return () => clearInterval(heartbeatTimer);
  }, [isUserActive]);

  useEffect(() => {
    if (!hasValidSession && !labFromQuery) return;
    const sendHeartbeat = async () => {
      if (!displayStation) return;
      try {
        await apiClient.post('/api/v1/pc-usage/heartbeat', {
          workstationCode: displayStation,
          laboratoryName: scannedLocation.lab,
          isActive: isUserActive
        });
      } catch (err) {}
    };
    sendHeartbeat();
    const hbi = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(hbi);
  }, [hasValidSession, labFromQuery, displayStation, scannedLocation.lab, isUserActive]);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredCategories = COMPLETE_PROBLEM_CATEGORIES.filter(cat => 
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = selectedCategory || categorySearchQuery || 'General Technical Issue';
    if (!description.trim()) return;

    const descSnapshot = description;
    const photoSnapshot = photoPreview;
    const stationSnapshot = displayStation;
    const labSnapshot = scannedLocation.lab;
    const campusSnapshot = scannedLocation.campus;

    setNotifications(prev => [
      {
        id: Date.now(),
        title: 'Report Submitted',
        desc: `Ticket created for ${stationSnapshot} (${finalCategory}): "${descSnapshot.slice(0, 40)}..."`,
        time: 'Just now',
        unread: true
      },
      ...prev
    ]);

    setReportSuccess(true);

    apiClient.post('/api/v1/problem-reports', {
      campus: campusSnapshot, title: finalCategory,
      labName: labSnapshot,
      workstationId: null,
      assetId: null,
      category: finalCategory,
      description: descSnapshot,
      hasPhoto: !!photoSnapshot,
    }).catch(() => {});

    setTimeout(() => {
      setReportSuccess(false);
      setShowReportModal(false);
      setSelectedCategory('');
      setCategorySearchQuery('');
      setDescription('');
      setPhotoPreview(null);
      setIsSubmittingReport(false);
    }, 1400);
  };

  const handleSaveToStorage = () => {
    const receiptContent = 
`========================================
        JRMSU LABTRACK RECEIPT
========================================
Station:    ${displayStation}
Student:    Student
Campus:     ${scannedLocation.campus}
Lab:        ${scannedLocation.lab}
Date:       ${currentDateStr}
Time:       ${currentTimeStr}
Duration:   ${formatDuration(sessionSeconds)}
----------------------------------------
Status:     VERIFIED & SECURED SESSION
========================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LabTrack_Receipt_${displayStation}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const hasEntryParams = !!(labFromQuery || pcFromQuery || pathParam || searchParams.get('lab') || searchParams.get('pc'));
  if (!hasEntryParams) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-24 h-24 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/50">
            <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white">Scan QR Code to Begin</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Scan the QR code displayed on your assigned PC to start a session.
            If you don't have a QR code, please ask the lab technician for assistance.
          </p>
        </div>
      </div>
    );
  }
  if (assignedPc === 'FULL') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-24 h-24 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center border-2 border-rose-500/50">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>
          <h1 className="text-3xl font-black text-rose-500">Laboratory is Full</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Sorry, all PCs in this laboratory are currently in use. 
            Please wait for someone to log out before scanning again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-100 flex flex-col w-full relative font-sans select-none overflow-hidden">
      
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/images/sami.jpg')" }}
      ></div>
      <div className="fixed inset-0 z-0 bg-slate-950/85 backdrop-blur-[1px]"></div>

      {/* --- 59-SECOND COUNTDOWN WARNING MODAL --- */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <div className="bg-blue-950/90 border border-blue-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-blue-500/20 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <AlertTriangle className="w-10 h-10 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Are you still there?</h3>
            <p className="text-blue-200 text-sm mb-6 leading-relaxed">
              You have been inactive for a while. You will be logged out in <strong className="text-white text-xl font-mono">{inactivityCountdown}s</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetUserActivity}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 active:scale-95"
              >
                I'm still here
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="flex-1 py-3.5 bg-blue-900/50 hover:bg-blue-900 text-blue-300 font-bold rounded-xl border border-blue-800 transition active:scale-95"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        
        <style>{`
          @keyframes ecg-sweep {
            0% { stroke-dashoffset: 600; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes subtle-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
          }
          .animate-ecg-wave {
            stroke-dasharray: 600;
            stroke-dashoffset: 600;
            animation: ecg-sweep 2.2s linear infinite;
          }
          .asean-glass {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .asean-glass-card {
            background: rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .animate-float { animation: subtle-float 4s ease-in-out infinite; }
          .no-scrollbar::-webkit-scrollbar { display: none !important; }
          .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }

          @media print {
            body * { visibility: hidden !important; }
            #printable-receipt, #printable-receipt * { visibility: visible !important; }
            #printable-receipt {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 320px !important;
              background: #ffffff !important;
              color: #000000 !important;
              border: 2px dashed #000000 !important;
              border-radius: 12px !important;
              padding: 24px !important;
              box-shadow: none !important;
            }
            #printable-receipt * { color: #000000 !important; }
          }
        `}</style>

        <header className="asean-glass flex-shrink-0 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl text-white shadow-lg shadow-blue-500/30 animate-float">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400 uppercase leading-none">
                  LABTRACK PORTAL
                </h1>
                <span className="text-[10px] font-semibold text-cyan-400/80 hidden sm:block tracking-wide">
                  JRMSU Campus Telemetry Network
                </span>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'history', icon: Clock, label: 'History' },
                { id: 'notifications', icon: Bell, label: 'Notifications' },
                { id: 'profile', icon: User, label: 'Profile' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 active:scale-95 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'notifications' && notifications.some(n => n.unread) && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1"></span>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Station {displayStation}
              </span>
              <div 
                className={`w-3 h-3 rounded-full animate-pulse shadow-lg transition-colors duration-500 ${
                  isAway ? 'bg-amber-400 shadow-amber-500/80' : 'bg-emerald-400 shadow-emerald-500/80'
                }`} 
                title="Telemetry Pulse"
              ></div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-28 sm:pb-8">
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Welcome, Student!</span>
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">JRMSU Workstation Kiosk & Real-time Telemetry Dashboard</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="asean-glass-card rounded-3xl p-6 space-y-4 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Current Station Session
                      </p>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-extrabold rounded-xl flex items-center gap-1.5 border border-emerald-500/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        {displayStation}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-white/10 text-xs sm:text-sm">
                      <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                        <MapPin className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <span className="font-extrabold text-white block text-sm sm:text-base">{scannedLocation.campus}</span>
                        <span className="text-xs text-slate-400">{scannedLocation.lab}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-cyan-500/30 space-y-0.5 shadow-inner">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400 animate-pulse" /> Live Time
                      </span>
                      <span className="font-mono font-bold text-cyan-300 block text-xs tracking-tight truncate">
                        {currentTimeStr || '00:00:00 AM'}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5 space-y-0.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" /> Today's Date
                      </span>
                      <span className="font-bold text-slate-200 block text-[11px] truncate">
                        {currentDateStr}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-emerald-500/30 space-y-0.5 shadow-inner">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> Duration
                      </span>
                      <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm tracking-wider truncate">
                        {formatDuration(sessionSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- DYNAMIC GREEN / YELLOW HEARTBEAT & TELEMETRY SECTION --- */}
                <div 
                  className={`bg-slate-950 text-white rounded-3xl p-6 border shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-4 transition-colors duration-500 ${
                    isAway ? 'border-amber-500/50' : 'border-emerald-500/30'
                  }`}
                >
                  <div 
                    className={`absolute inset-0 pointer-events-none ${
                      isAway 
                        ? 'bg-[linear-gradient(to_right,#78350f15_1px,transparent_1px),linear-gradient(to_bottom,#78350f15_1px,transparent_1px)] bg-[size:16px_16px]'
                        : 'bg-[linear-gradient(to_right,#064e3b15_1px,transparent_1px),linear-gradient(to_bottom,#064e3b15_1px,transparent_1px)] bg-[size:16px_16px]'
                    }`}
                  ></div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full animate-ping ${isAway ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${isAway ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isAway ? 'INACTIVITY DETECTED - AWAY' : 'ACTIVE USER SESSION DETECTED'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs font-bold ${
                      isAway 
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' 
                        : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                    }`}>
                      <Activity className={`w-4 h-4 animate-pulse ${isAway ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span>{heartbeatBpm} BPM</span>
                    </div>
                  </div>

                  <div className={`relative z-10 h-16 w-full bg-slate-900/90 rounded-2xl border p-2 flex items-center overflow-hidden transition-colors duration-500 ${
                    isAway ? 'border-amber-500/30' : 'border-slate-800'
                  }`}>
                    <svg className={`w-full h-full ${isAway ? 'text-amber-400' : 'text-emerald-400'}`} viewBox="0 0 600 50" preserveAspectRatio="none">
                      <path
                        d="M 0,25 L 60,25 L 70,25 L 75,8 L 82,42 L 90,2 L 98,34 L 104,20 L 110,25 L 210,25 L 220,25 L 225,8 L 232,42 L 240,2 L 248,34 L 254,20 L 260,25 L 360,25 L 370,25 L 375,8 L 382,42 L 390,2 L 398,34 L 404,20 L 410,25 L 510,25 L 520,25 L 525,8 L 532,42 L 540,2 L 548,34 L 554,20 L 560,25 L 600,25"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`animate-ecg-wave ${
                          isAway 
                            ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]' 
                            : 'drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]'
                        }`}
                      />
                    </svg>
                  </div>

                  <div className="flex items-center justify-end text-[11px] font-mono relative z-10 pt-1">
                    <span className={`font-bold ${isAway ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isAway ? 'STATUS: AWAY / INACTIVE' : 'STABILITY: 99.8%'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="asean-glass-card hover:bg-white/10 active:scale-95 text-white font-bold p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-lg group border-rose-500/20 hover:border-rose-500/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400 border border-rose-500/30 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <span className="text-sm tracking-wide">Report a Problem</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className="asean-glass-card hover:bg-white/10 active:scale-95 text-white font-bold p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-lg group border-blue-500/20 hover:border-blue-500/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400 border border-blue-500/30 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-sm tracking-wide">Usage History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="asean-glass-card hover:bg-white/10 active:scale-95 text-white font-bold p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-lg group border-amber-500/20 hover:border-amber-500/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <span className="text-sm tracking-wide">Reports & Updates</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => setShowRulesModal(true)}
                    className="asean-glass-card hover:bg-white/10 active:scale-95 text-white font-bold p-5 rounded-3xl flex items-center justify-between transition-all duration-300 shadow-lg group border-emerald-500/20 hover:border-emerald-500/50"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-sm tracking-wide">Lab Guidelines</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">My Usage History</h2>
                <p className="text-xs sm:text-sm text-slate-400">Your recent computer laboratory sessions.</p>
              </div>
              <div className="asean-glass-card rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2.5">Recent Session Logs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  
                  {/* ACTIVE CARD (KALIWA) - KEEP WS */}
                  <div 
                    onClick={() => setSelectedReportDetail({ 
                      title: formatWs(displayStation), 
                      status: 'Active Now', 
                      detail: scannedLocation.campus + ' - ' + scannedLocation.lab + '. Current live session active for ' + formatDuration(sessionSeconds) + '.' 
                    })}
                    className="p-4 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-emerald-500/30 cursor-pointer flex justify-between items-center transition"
                  >
                    <div>
                      <span className="font-extrabold text-white block text-sm">{formatWs(displayStation)}</span>
                      <span className="text-xs text-slate-400">{scannedLocation.campus}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-extrabold rounded-lg border border-emerald-500/40">Active Now</span>
                  </div>

                  {/* PAST SESSION CARD (KANAN) - REMOVED WS */}
                  {(() => {
                    const pastSessions = historyData.filter((s: any) => String(s.status || '').toUpperCase() !== 'ACTIVE');
                    const latest = pastSessions[0];
                    if (latest) {
                      const rawPc = latest.workstationCode || latest.workstationNumber || latest.pcNumber || latest.workstationId || displayStation;
                      const pc = formatWs(rawPc);
                      
                      const mins = Number(latest.durationMinutes) || 0;
                      const durStr = mins > 0 ? (mins >= 60 ? (mins/60).toFixed(1) + ' hrs' : mins + ' min') : 'N/A';
                      const dateStr = latest.sessionStartUtc ? new Date(latest.sessionStartUtc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                      return (
                        <div 
                          onClick={() => setSelectedReportDetail({ 
                            title: pc, 
                            status: 'Completed', 
                            detail: (latest.laboratoryName || 'Lab') + '. Date: ' + dateStr + '. Duration: ' + durStr 
                          })}
                          className="p-4 bg-slate-800/40 hover:bg-slate-800 rounded-2xl border border-white/10 cursor-pointer flex justify-between items-center transition"
                        >
                          <div>
                            {/* TINANGGAL ANG WS-04 TEXT DITO */}
                            <span className="font-extrabold text-slate-200 block text-sm">Previous Session</span>
                            <span className="text-xs text-slate-400">{dateStr}</span>
                          </div>
                          <span className="text-cyan-400 font-mono font-bold text-xs">{durStr}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-white/10 flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-slate-500 block text-sm">No past session</span>
                          <span className="text-xs text-slate-500">Your previous activity will appear here</span>
                        </div>
                        <span className="text-slate-500 font-mono font-bold text-xs">--</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Notifications</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Updates and alerts regarding your lab usage.</p>
                </div>
                {notifications.some(n => n.unread) && (
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold rounded-full">
                    {notifications.filter(n => n.unread).length} New
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="asean-glass-card rounded-3xl p-10 text-center space-y-3">
                  <Bell className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">No notifications available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {notifications.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        markNotificationAsRead(item.id);
                        setSelectedReportDetail({ title: item.title, status: item.time, detail: item.desc });
                      }}
                      className={`p-4 rounded-2xl border shadow-lg cursor-pointer transition-all duration-200 ${
                        item.unread ? 'bg-blue-950/40 border-blue-500/40 hover:border-blue-400' : 'asean-glass-card hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                          {item.unread && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                          {item.title}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-slate-400 font-mono">{item.time}</span>
                          <button
                            onClick={(e) => handleDeleteNotification(item.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition"
                            title="Delete Notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pr-2">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Student Profile & Credentials</h2>
                <p className="text-xs sm:text-sm text-slate-400">Official JRMSU Laboratory Account Details</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-2xl border border-cyan-500/30 relative overflow-hidden space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-2xl border-2 border-white/20 shadow-xl">
                        {"S"}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-lg tracking-tight">Student</h3>
                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        </div>
                        <p className="text-xs text-cyan-300 font-mono font-bold tracking-widest">{dynamicStudentId}</p>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                        <span className="font-bold text-slate-200">{(user as any)?.department || "College of Computing"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Scanned Campus</span>
                        <span className="font-bold text-slate-200 truncate block">{scannedLocation.campus}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDigitalIdModal(true)}
                      className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 text-cyan-300 font-extrabold py-3 rounded-2xl border border-cyan-500/30 flex items-center justify-center gap-2 text-xs transition"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show Personal Student QR ID</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[92px]">
                      <Award className="w-5 h-5 text-blue-400 mb-1.5 shrink-0" />
                      <span className="font-black text-white text-sm sm:text-base block leading-none">
                        {profileStats.attendancePct > 0 ? profileStats.attendancePct + '%' : '100%'}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">Attendance</span>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[92px]">
                      <Clock className="w-5 h-5 text-emerald-400 mb-1.5 shrink-0" />
                      <span className="font-black text-white text-sm sm:text-base block leading-none">
                        {(profileStats.totalHours || 0).toFixed(1)}h
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">Total Hrs</span>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[92px]">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 mb-1.5 shrink-0" />
                      <span className="font-black text-white text-sm sm:text-base block leading-none">
                        {profileStats.totalSessions}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1 leading-tight">Check-Ins</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="asean-glass-card rounded-3xl p-6 shadow-xl space-y-3">
                    <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/10 pb-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Laboratory Standing & Badges
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                        <Award className="w-8 h-8 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-extrabold text-white block text-xs">Clean Workstation</span>
                          <span className="text-[10px] text-slate-400">Zero Violation Rating</span>
                        </div>
                      </div>
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                        <UserCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-extrabold text-white block text-xs">Lab Safety Pass</span>
                          <span className="text-[10px] text-slate-400">Verified User</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="asean-glass-card rounded-3xl p-6 shadow-xl space-y-3 text-xs sm:text-sm">
                    <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-2.5">Student Documents & Tools</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        onClick={() => setShowReceiptModal(true)}
                        className="p-3.5 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5 text-white font-bold">
                          <Download className="w-4 h-4 text-cyan-400" />
                          <span>Download Lab Receipt</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                      
                      <button
                        onClick={() => setShowTelemetryModal(true)}
                        className="p-3.5 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-2.5 text-white font-bold">
                          <Monitor className="w-4 h-4 text-emerald-400" />
                          <span>My Workstation Details</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 font-extrabold py-4 rounded-2xl border border-rose-500/30 flex items-center justify-center gap-2 transition text-xs sm:text-sm shadow-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Workstation & Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="sm:hidden fixed bottom-0 left-0 right-0 asean-glass border-t border-white/10 px-6 py-2.5 flex items-center justify-between text-slate-400 z-40 shadow-2xl">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'history', icon: Clock, label: 'History' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex flex-col items-center gap-1 transition ${activeTab === tab.id ? 'text-cyan-400 font-bold' : ''}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </nav>

        {showReportModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-white space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/15 rounded-2xl border border-rose-500/30 text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Report Equipment Issue</h3>
                    <p className="text-[11px] text-slate-400">{displayStation} • {scannedLocation.lab}</p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-lg font-black text-white">Ticket Submitted Successfully!</h4>
                  <p className="text-xs text-slate-300">Lab technicians have been notified to inspect {displayStation}.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-300 block">
                      Select or Search Issue Category <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search category (e.g. Broken keyboard, Mouse lag)..."
                        value={selectedCategory || categorySearchQuery}
                        onChange={(e) => {
                          setSelectedCategory('');
                          setCategorySearchQuery(e.target.value);
                          setIsCategoryDropdownOpen(true);
                        }}
                        onFocus={() => setIsCategoryDropdownOpen(true)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {isCategoryDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-44 overflow-y-auto no-scrollbar z-20 divide-y divide-slate-800">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setCategorySearchQuery('');
                                setIsCategoryDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-cyan-600 hover:text-white transition flex items-center justify-between"
                            >
                              <span>{cat}</span>
                              {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2.5 text-xs text-slate-400 italic">
                            Press Enter to use custom category: "{categorySearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300 block">
                        Detailed Description <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-500">{description.length}/300</span>
                    </div>
                    <textarea
                      rows={4}
                      required
                      maxLength={300}
                      placeholder="Describe what is wrong with the equipment..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Hardware Photo Evidence (Optional)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    
                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 max-h-40 bg-slate-950 flex items-center justify-center">
                        <img src={photoPreview} alt="Hardware issue preview" className="object-cover w-full h-40" />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white bg-slate-950/40 transition text-xs font-bold"
                      >
                        <span>Tap to upload a photo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!description.trim()}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold py-3 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Ticket</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {showReceiptModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 text-white space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Lab Session Receipt
                </h3>
                <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div id="printable-receipt" className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-3 font-mono text-xs relative overflow-hidden">
                <div className="text-center pb-3 border-b border-slate-700 border-dashed">
                  <h4 className="font-black text-lg text-white tracking-widest">JRMSU LABTRACK</h4>
                  <p className="text-[10px] text-slate-400">Official Lab Session Receipt</p>
                </div>
                
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between"><span className="text-slate-400">Station:</span> <span className="text-white font-bold">{displayStation}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Student:</span> <span className="text-white font-bold">Student</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Campus:</span> <span className="text-cyan-400 font-bold text-right truncate pl-4">{scannedLocation.campus}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Lab:</span> <span className="text-cyan-400 font-bold text-right truncate pl-4">{scannedLocation.lab}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Date:</span> <span className="text-white">{currentDateStr}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Duration:</span> <span className="text-emerald-400 font-bold">{formatDuration(sessionSeconds)}</span></div>
                </div>

                <div className="pt-3 border-t border-slate-700 border-dashed text-center">
                  <p className="text-[10px] text-emerald-400 font-bold">• VERIFIED & SECURED</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setShowReceiptModal(false)} 
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Close
                </button>
                <button 
                  onClick={handleSaveToStorage} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
                >
                  <Download className="w-4 h-4" /> Save File
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/30"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>
        )}

        {showDigitalIdModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-cyan-500/30 text-center space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">JRMSU Digital Pass</span>
                <button onClick={() => setShowDigitalIdModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 shadow-2xl flex flex-col items-center justify-center border-2 border-cyan-400">
                <QrCode className="w-36 h-36 text-slate-950" />
                <span className="text-[9px] font-mono font-bold text-slate-800 mt-1 tracking-widest">{dynamicStudentId}</span>
              </div>
              <div>
                <h4 className="font-extrabold text-base">Student</h4>
                <p className="text-xs text-slate-400">Student Account</p>
              </div>
              <button onClick={() => setShowDigitalIdModal(false)} className="w-full bg-cyan-600 text-white font-bold py-2.5 rounded-2xl text-xs">
                Close Badge
              </button>
            </div>
          </div>
        )}

        {showTelemetryModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  Active Workstation Telemetry
                </h3>
                <button onClick={() => setShowTelemetryModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-white/10 flex justify-between">
                  <span className="text-slate-400">Station ID:</span>
                  <span className="text-white font-bold">{displayStation}</span>
                </div>
                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-white/10 flex justify-between">
                  <span className="text-slate-400">Laboratory:</span>
                  <span className="text-cyan-400 font-bold">{scannedLocation.lab}</span>
                </div>
                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-white/10 flex justify-between">
                  <span className="text-slate-400">Live Duration:</span>
                  <span className="text-amber-400 font-bold">{formatDuration(sessionSeconds)}</span>
                </div>
              </div>
              <button onClick={() => setShowTelemetryModal(false)} className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs">
                Close Details
              </button>
            </div>
          </div>
        )}

        {selectedReportDetail && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-3 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm">{selectedReportDetail.title}</h3>
                <button onClick={() => setSelectedReportDetail(null)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedReportDetail.detail}</p>
              <button onClick={() => setSelectedReportDetail(null)} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs">
                Close
              </button>
            </div>
          </div>
        )}

        {showRulesModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  JRMSU Lab Guidelines
                </h3>
                <button onClick={() => setShowRulesModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ul className="text-xs space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>Always scan the workstation QR code upon sitting down.</li>
                <li>Food and drinks are strictly prohibited inside the computer labs.</li>
                <li>Report any hardware or display issues immediately via the portal.</li>
              </ul>
              <button onClick={() => setShowRulesModal(false)} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-2xl text-xs">
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortalPage;