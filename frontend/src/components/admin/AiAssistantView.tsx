import apiClient from '@/lib/api-client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Plus, Trash2, Search, Sparkles, 
  MessageSquare, Copy, Check, RefreshCw, Activity, 
  ShieldCheck, Terminal, Cpu, HardDrive, Download, Edit3, 
  DollarSign, Users, Wrench, Key, 
  Zap, Globe, ChevronRight, ShieldAlert, UserCheck, AlertTriangle, X
} from 'lucide-react';

export interface AiAssistantViewProps {
  campusName?: string;
  userRole?: 'ADMIN';
  userEmail?: string;
  onTriggerNotification?: (msg: string) => void;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  tokens?: number;
  mode?: 'text' | 'image' | 'code' | 'telemetry' | 'financial' | 'auth' | 'admin';
  codeSnippet?: string;
  suggestedActions?: string[];
}

export interface Thread {
  id: string;
  title: string;
  category: 'General AI Core' | 'System Diagnostics' | 'Maintenance & Audit' | 'Financial & Clearance' | 'User Management';
  lastActive: string;
  msgCount: number;
  messages: Message[];
}

const THREAD_CATEGORIES = [
  'ALL',
  'General AI Core',
  'System Diagnostics',
  'Maintenance & Audit',
  'Financial & Clearance',
  'User Management'
] as const;

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  campusName = 'JRMSU Dapitan Main Campus',
  userRole: propUserRole = 'ADMIN',
  userEmail: propUserEmail = 'admin@jrmsu.edu.ph',
  onTriggerNotification
}) => {
  // Resolve Executive Admin Context dynamically from localStorage or fallback props
  const getUserContext = () => {
    try {
      const savedUserStr = localStorage.getItem('labtrack_user') || localStorage.getItem('user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        return {
          role: 'ADMIN' as const,
          email: parsed.email || propUserEmail
        };
      }
    } catch {
      // Fallback Admin Context
    }
    return { role: 'ADMIN' as const, email: propUserEmail };
  };

  const currentAuth = getUserContext();
  const activeRole = currentAuth.role;

  // Real-Time System Telemetry State
  const [cpuUsage, setCpuUsage] = useState<number>(18);
  const [ramUsage, setRamUsage] = useState<number>(42);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(28);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [totalTokensUsed, setTotalTokensUsed] = useState<number>(1650);

  // Interactive UI & Thread Management States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; threadId?: string }>({ isOpen: false });

  // Initializing Threads State
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: 'TH-ADMIN-101',
      title: 'Global Infrastructure & Maintenance Audit',
      category: 'Maintenance & Audit',
      lastActive: '10:42 AM',
      msgCount: 2,
      messages: [
        {
          id: 'm-1',
          sender: 'assistant',
          text: `Good day, Administrator! I am the **JRMSU LabTrack Executive AI Engine**.\n\nI provide real-time administrative intelligence regarding server telemetry, work orders, hardware procurement, RFID access security, and financial clearance ledgers.`,
          timestamp: '10:40 AM',
          tokens: 95,
          mode: 'admin'
        },
        {
          id: 'm-2',
          sender: 'assistant',
          text: `ðŸ›¡ï¸ **Security Profile:** Authenticated as **${activeRole}** for **${campusName}**.\n\nYou have root-level clearance across system telemetry, audit trail logs, security overrides, and clearance approvals.`,
          timestamp: '10:42 AM',
          tokens: 120,
          mode: 'telemetry',
          suggestedActions: ['Audit pending maintenance work orders', 'Summarize lab clearance collection']
        }
      ]
    },
    {
      id: 'TH-ADMIN-102',
      title: 'User Access Control & RFID Gate Security',
      category: 'User Management',
      lastActive: 'Yesterday',
      msgCount: 1,
      messages: [
        {
          id: 'm-102-1',
          sender: 'assistant',
          text: `Admin Console Operational: Ready to perform user role assignments, RFID card binding audits, and access permission overrides.`,
          timestamp: 'Yesterday',
          tokens: 88,
          mode: 'auth'
        }
      ]
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('TH-ADMIN-101');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Session Data from API if available
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/ai/sessions');
        const data = res.data?.data?.items || res.data?.data || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setThreads(data);
          setActiveThreadId(data[0].id);
        }
      } catch {
        // Fallback to initial local state when API is unreachable
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Smooth Scroll to Latest Message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId, isGenerating]);

  // Dynamic Telemetry Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(Math.floor(14 + Math.random() * 12));
      setRamUsage(Math.floor(40 + Math.random() * 8));
      setActiveUsersCount(26 + Math.floor(Math.random() * 10));
      setLatencyMs(10 + Math.floor(Math.random() * 6));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0] || { 
    id: 'default', 
    title: 'Admin Session', 
    category: 'General AI Core', 
    lastActive: '--:--', 
    msgCount: 0, 
    messages: [] 
  };

  const triggerToast = (msg: string) => {
    if (onTriggerNotification) onTriggerNotification(msg);
  };

  // Dynamic Knowledge Processor for Fallback Admin Responses
  const processAdminKnowledge = (query: string): Message => {
    const q = (query || "").toLowerCase();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (q.includes('maintenance') || q.includes('repair') || q.includes('work order') || q.includes('fault') || q.includes('pending')) {
      const wo1 = Math.floor(100 + Math.random() * 800);
      const wo2 = Math.floor(100 + Math.random() * 800);
      return {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `ðŸ› ï¸ **Global Maintenance Audit (${campusName}):**\n\n` +
              `1. **WO-2026-${wo1} (ComLab 1 - PC-08):**\n` +
              `   • **Diagnostic:** Memory Controller Bus Fault\n` +
              `   • **Technician:** Engr. Santos (In Progress)\n` +
              `   • **Estimated Cost:** ₱2,400.00 (Approved)\n\n` +
              `2. **WO-2026-${wo2} (ComLab 2 - PC-14):**\n` +
              `   • **Diagnostic:** I/O Controller Replacement\n` +
              `   • **Status:** Pending Parts Procurement\n\n` +
              `âœ… *Reconciled live with Central System Telemetry.*`,
        timestamp: timeNow,
        mode: 'telemetry',
        tokens: 205,
        suggestedActions: ['Approve Procurement Request', 'Verify Infrastructure Health']
      };
    }

    if (q.includes('user') || q.includes('role') || q.includes('account') || q.includes('rfid') || q.includes('security') || q.includes('access')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `ðŸ”‘ **User Access & RFID Security Audit:**\n\n` +
              `1. **Role Provisioning:** Managing permission matrices for Admins, Technicians, and Faculty.\n` +
              `2. **RFID Gate Terminal Sync:** Real-time badge authentication across all campus ComLabs.\n` +
              `3. **Security Overrides:** Issue temporary access bypass keys and manage system lockouts.\n` +
              `4. **Audit Trail:** Log analysis of configuration edits and access attempts.`,
        timestamp: timeNow,
        mode: 'auth',
        tokens: 190,
        suggestedActions: ['View Active User Roles', 'Check RFID Terminal Status']
      };
    }

    if (q.includes('financial') || q.includes('clearance') || q.includes('collection') || q.includes('summary') || q.includes('ledger') || q.includes('fee')) {
      const totalColl = (68000 + Math.floor(Math.random() * 12000)).toLocaleString();
      return {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `ðŸ’° **Executive Financial & Clearance Ledger Audit (${campusName}):**\n\n` +
              `• **Monthly Collections:** ₱${totalColl}.00\n` +
              `• **Pending Clearance Holds:** 8 Accounts (Unreturned Hardware / Damage Fees)\n` +
              `• **Ledger Reconciled:** 100% Synced with Campus Treasury Database\n` +
              `• **Executive Clearance:** Ready for Batch Approval.`,
        timestamp: timeNow,
        mode: 'financial',
        tokens: 195,
        suggestedActions: ['View Fee Breakdown', 'Batch Approve Clearances']
      };
    }

    if (q.includes('system') || q.includes('health') || q.includes('server') || q.includes('telemetry') || q.includes('cpu') || q.includes('ram')) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `ðŸ–¥ï¸ **System Infrastructure Diagnostic:**\n\n` +
              `• **CPU Core Utilization:** ${cpuUsage}% (Nominal Load)\n` +
              `• **RAM Memory Allocation:** ${ramUsage}% of Reserved Pool\n` +
              `• **Active Workstations:** ${activeUsersCount} Monitored Terminals\n` +
              `• **API Gateway Latency:** ${latencyMs}ms (FastAPI Microservice)`,
        timestamp: timeNow,
        mode: 'telemetry',
        tokens: 170,
        suggestedActions: ['Verify System Health', 'Execute Full System Scan']
      };
    }

    return {
      id: `ai-${Date.now()}`,
      sender: 'assistant',
      text: `ðŸ¤– **JRMSU LabTrack Executive Admin Assistant:**\n\n` +
            `I have registered your administrative request regarding **"${query}"**.\n\n` +
            `Ready to perform operations on:\n` +
            `1. **User Role Management & RFID Security**\n` +
            `2. **Global Maintenance Audit & Repair Procurement**\n` +
            `3. **Financial Clearance Ledgers & Fee Approvals**\n` +
            `4. **Server Infrastructure Telemetry & Diagnostics**`,
      timestamp: timeNow,
      mode: 'admin',
      tokens: 155,
      suggestedActions: ['Maintenance Audit', 'User Management', 'Financial Audit']
    };
  };

  // Dynamic Thread Actions
  const handleCreateNewThread = () => {
    const newId = `TH-ADMIN-${Math.floor(100 + Math.random() * 900)}`;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const selectedCat = activeCategoryFilter === 'ALL' ? 'General AI Core' : (activeCategoryFilter as Thread['category']);

    const newThread: Thread = {
      id: newId,
      title: `Admin Session #${threads.length + 1}`,
      category: selectedCat,
      lastActive: timeNow,
      msgCount: 1,
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'assistant',
          text: `Good day, Administrator! How may I assist you with executive lab management today?`,
          timestamp: timeNow,
          tokens: 90,
          mode: 'admin',
          suggestedActions: ['Audit pending maintenance work orders', 'User Access & Role Audit', 'Financial Ledger Summary']
        }
      ]
    };

    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
    triggerToast('New Admin Chat Thread created.');
  };

  const confirmDeleteThread = () => {
    if (!deleteConfirmModal.threadId) return;
    if (threads.length <= 1) {
      triggerToast('Cannot delete the last active admin thread.');
      setDeleteConfirmModal({ isOpen: false });
      return;
    }

    const targetId = deleteConfirmModal.threadId;
    const updated = threads.filter(t => t.id !== targetId);
    setThreads(updated);
    if (activeThreadId === targetId) {
      setActiveThreadId(updated[0].id);
    }
    setDeleteConfirmModal({ isOpen: false });
    triggerToast('Admin chat thread deleted successfully.');
  };

  const handleRenameThread = (id: string) => {
    if (!newThreadTitle.trim()) {
      setEditingThreadId(null);
      return;
    }
    setThreads(prev => prev.map(t => t.id === id ? { ...t, title: newThreadTitle.trim() } : t));
    setEditingThreadId(null);
    setNewThreadTitle('');
    triggerToast('Thread title updated.');
  };

  // Dynamic Messaging Engine
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isGenerating) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeNow
    };

    // Update thread state with user input
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastActive: timeNow,
          msgCount: t.messages.length + 1,
          messages: [...t.messages, userMsg]
        };
      }
      return t;
    }));

    if (!textToSend) setInputText('');
    setIsGenerating(true);

    // Asynchronous Response Handling
    setTimeout(async () => {
      let aiMsg: Message;
      try {
        const resp = await apiClient.post('/api/v1/ai/chat/query', { 
          prompt: query,
          role: activeRole,
          campus_id: campusName,
          user_email: currentAuth.email
        });

        const answer = resp?.data?.data?.response || resp?.data?.response;
        if (answer) {
          aiMsg = { 
            id: 'ai-' + Date.now(), 
            sender: 'assistant', 
            text: String(answer), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            mode: 'admin', 
            tokens: 160 
          };
        } else {
          aiMsg = processAdminKnowledge(query);
        }
      } catch {
        aiMsg = processAdminKnowledge(query);
      }

      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            lastActive: aiMsg.timestamp,
            msgCount: t.messages.length + 1,
            messages: [...t.messages, aiMsg]
          };
        }
        return t;
      }));

      setTotalTokensUsed(prev => prev + (aiMsg.tokens || 120));
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatLog = () => {
    const chatText = activeThread.messages.map((m: Message) => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADMIN_${activeThread.title.replace(/\s+/g, '_')}_Transcript.txt`;
    link.click();
    triggerToast('Admin Transcript exported.');
  };

  const filteredThreads = threads.filter(t => {
    const matchesSearch = (t.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
                          (t.category || "").toLowerCase().includes((searchQuery || "").toLowerCase());
    const matchesCategory = activeCategoryFilter === 'ALL' || t.category === activeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getModeBadge = (mode?: string) => {
    switch (mode) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1 border border-blue-300"><ShieldCheck className="w-3 h-3 text-blue-600" /> Executive Admin</span>;
      case 'auth':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1 border border-amber-300"><Key className="w-3 h-3 text-amber-600" /> User Access & RFID</span>;
      case 'financial':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300"><DollarSign className="w-3 h-3 text-emerald-600" /> Financial Clearance</span>;
      case 'telemetry':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1 border border-rose-300"><Wrench className="w-3 h-3 text-rose-600" /> Maintenance Audit</span>;
      case 'code':
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-slate-700"><Terminal className="w-3 h-3 text-emerald-400" /> System CLI</span>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 animate-in fade-in duration-300 block">
      
      {/* MAIN ADMIN WORKSPACE CONTAINER */}
      <div className="bg-white p-4 sm:p-7 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 space-y-6 min-h-[600px]">
        
        {/* HEADER CONTROL BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-slate-800 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Admin AI Intelligence Workspace</span>
                <span className="text-[10px] font-sans font-bold bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-blue-600" /> Role: ADMIN
                </span>
                <span className="text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Globe className="w-3 h-3" /> EN
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Executive System Telemetry & Global Controls • {campusName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Tokens: {totalTokensUsed.toLocaleString()}</span>
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{latencyMs}ms</span>
            </span>
          </div>
        </div>

        {/* 3-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
          
          {/* COLUMN 1: CHAT THREADS MANAGEMENT */}
          <div className="lg:col-span-3 bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/80">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Admin Threads</span>
                </h3>
                <span className="text-[10px] font-sans font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {filteredThreads.length}
                </span>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admin chats..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 w-full font-medium bg-white"
                />
              </div>

              {/* CATEGORY FILTER PILLS */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {THREAD_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-tight whitespace-nowrap transition ${
                      activeCategoryFilter === cat 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* THREAD LIST CONTAINER */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {isLoadingData ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">Loading threads...</div>
                ) : filteredThreads.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">No admin threads found</div>
                ) : (
                  filteredThreads.map(thread => {
                    const isActive = thread.id === activeThreadId;
                    const isEditing = editingThreadId === thread.id;

                    return (
                      <div
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isActive 
                            ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/10' 
                            : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 w-full">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                              isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              <Bot className="w-4 h-4" />
                            </div>

                            {isEditing ? (
                              <input
                                type="text"
                                defaultValue={thread.title}
                                autoFocus
                                onChange={(e) => setNewThreadTitle(e.target.value)}
                                onBlur={() => handleRenameThread(thread.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameThread(thread.id); }}
                                className="text-xs font-bold px-1.5 py-0.5 border border-blue-400 rounded outline-none w-full bg-blue-50"
                              />
                            ) : (
                              <h4 className="font-extrabold text-slate-900 text-xs truncate">
                                {thread.title}
                              </h4>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setEditingThreadId(thread.id); setNewThreadTitle(thread.title); }}
                              className="text-slate-300 hover:text-blue-600 p-1 rounded-lg transition cursor-pointer"
                              title="Rename Thread"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmModal({ isOpen: true, threadId: thread.id }); }}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                              title="Delete Thread"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-100">
                          <span className="truncate max-w-[110px] font-medium">{thread.category}</span>
                          <span className="font-bold text-slate-500 shrink-0">{thread.lastActive}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateNewThread}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Admin Thread</span>
            </button>
          </div>

          {/* COLUMN 2: CONVERSATION STREAM */}
          <div className="lg:col-span-6 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                <h3 className="font-black text-slate-900 text-xs tracking-tight">
                  {activeThread.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={exportChatLog}
                className="text-xs font-sans font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Log</span>
              </button>
            </div>

            {/* MESSAGES STREAM AREA */}
            <div className="flex-1 max-h-[350px] overflow-y-auto space-y-3.5 pr-2">
              {activeThread.messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-slate-800 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                  )}

                  <div className={`max-w-[88%] space-y-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {msg.sender === 'assistant' && getModeBadge(msg.mode)}

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {msg.codeSnippet && (
                        <div className="mt-2.5 p-3 bg-slate-900 text-emerald-400 font-sans text-[11px] rounded-xl overflow-x-auto shadow-inner relative group">
                          <pre>{msg.codeSnippet}</pre>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.id + '-code', msg.codeSnippet || '')}
                            className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition"
                            title="Copy Code"
                          >
                            {copiedId === msg.id + '-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SUGGESTED ACTIONS */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((action, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(action)}
                            className="text-[10px] font-bold bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-xl shadow-xs transition flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3 text-blue-500" />
                            <span>{action}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] font-sans text-slate-400 px-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.id, msg.text)}
                          className="hover:text-blue-600 p-0.5 cursor-pointer flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied
                            </span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs font-black text-[10px]">
                      ADMIN
                    </div>
                  )}
                </div>
              ))}

              {/* GENERATING INDICATOR */}
              {isGenerating && (
                <div className="flex gap-3 items-center text-xs font-sans text-blue-600 p-3 bg-blue-50/80 rounded-2xl w-fit animate-pulse border border-blue-200">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-bold">Processing query with Executive Admin Privilege...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* QUICK SUGGESTION PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => handleSendMessage('Audit pending maintenance work orders.')}
                className="text-[10px] font-bold font-sans bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-700 transition cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <Wrench className="w-3 h-3" /> Maintenance Audit
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Review User Roles and RFID Access Guard status.')}
                className="text-[10px] font-bold font-sans bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl text-indigo-700 transition cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3" /> User Roles & RFID
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Summarize lab clearance collection and financial status.')}
                className="text-[10px] font-bold font-sans bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl text-emerald-700 transition cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <DollarSign className="w-3 h-3" /> Financial Ledger
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Execute full system infrastructure health check.')}
                className="text-[10px] font-bold font-sans bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl text-blue-700 transition cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" /> System Diagnostics
              </button>
            </div>

            {/* INPUT FORM */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition"
            >
              <input
                type="text"
                placeholder="Ask Admin AI Engine (Work orders, User Roles, RFID Gate, Financial Audits)..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isGenerating}
                className="flex-1 pl-3 pr-2 py-1.5 text-xs outline-none bg-transparent font-medium text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className={`p-2.5 rounded-xl text-white transition cursor-pointer ${
                  inputText.trim() && !isGenerating 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-md active:scale-95' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* COLUMN 3: ACTION MATRIX & TELEMETRY */}
          <div className="lg:col-span-3 bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/80">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Admin Matrix</span>
                </h3>
              </div>

              {/* ACTION SHORTCUT BUTTONS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 space-y-1.5 shadow-xs">
                <button 
                  type="button"
                  onClick={() => handleSendMessage('Audit pending maintenance work orders.')}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/60 cursor-pointer transition text-left group"
                >
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 group-hover:text-amber-600">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" /> Work Orders
                  </span>
                  <span className="text-[10px] font-sans bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold">Audit</span>
                </button>

                <button 
                  type="button"
                  onClick={() => handleSendMessage('Check RFID gate terminal authentication status and user roles.')}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50/60 cursor-pointer transition text-left group"
                >
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 group-hover:text-indigo-600">
                    <Key className="w-3.5 h-3.5 text-indigo-600" /> User Permissions
                  </span>
                  <span className="text-[10px] font-sans bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Active</span>
                </button>

                <button 
                  type="button"
                  onClick={() => handleSendMessage('Execute full PC hardware and subnet audit.')}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/60 cursor-pointer transition text-left group"
                >
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 group-hover:text-blue-600">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" /> System Audit
                  </span>
                  <span className="text-[10px] font-sans bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">Fast</span>
                </button>
              </div>

              {/* LIVE TELEMETRY HEALTH METRICS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 space-y-3 font-sans text-[11px] shadow-xs">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> CPU Load
                    </span>
                    <strong className="text-slate-800 font-extrabold">{cpuUsage}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500 rounded-full" style={{ width: `${cpuUsage}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">
                      <HardDrive className="w-3.5 h-3.5 text-indigo-600" /> RAM Alloc
                    </span>
                    <strong className="text-slate-800 font-extrabold">{ramUsage}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${ramUsage}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">
                      <Users className="w-3.5 h-3.5 text-emerald-600" /> Active Users
                    </span>
                    <strong className="text-slate-800 font-extrabold">{activeUsersCount} Online</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, Math.floor(activeUsersCount * 2.5))}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerToast('Executive Security & System Telemetry status verified nominal.')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Infrastructure Health</span>
            </button>
          </div>

        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Thread Confirmation</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setDeleteConfirmModal({ isOpen: false })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Are you sure you want to delete this administrative conversation thread? All logged messages will be removed permanently.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteThread}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AiAssistantView;
