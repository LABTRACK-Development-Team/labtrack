import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info, Check, RefreshCw, ShieldAlert } from 'lucide-react';
import apiClient, { apiClient as namedApiClient } from '../../lib/api-client';
import { useRealtime } from '../../hooks/useRealtime';

const api = apiClient || namedApiClient;

export interface HeaderNotifItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  isRead: boolean;
  labName?: string;
}

export const HeaderNotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<HeaderNotifItem[]>([
    {
      id: 'h-notif-1',
      title: 'Critical Switch Port Timeout',
      message: 'Loose RJ45 LAN connector detected at ComLab 1 (WS-03).',
      time: '5 mins ago',
      type: 'critical',
      isRead: false,
      labName: 'ComLab 1 (Networking)'
    },
    {
      id: 'h-notif-2',
      title: 'GPU Thermal Threshold Warning',
      message: 'High thermal sensor alert reaching 78°C on PC-202.',
      time: '18 mins ago',
      type: 'warning',
      isRead: false,
      labName: 'ComLab 2 (Software Eng)'
    },
    {
      id: 'h-notif-3',
      title: 'CUDA Driver Maintenance Completed',
      message: 'Jupyter notebook kernel updated across 25 GPU nodes.',
      time: '1 hour ago',
      type: 'success',
      isRead: true,
      labName: 'ComLab 3 (AI Lab)'
    }
  ]);

  const mapApiToHeaderNotif = (n: any): HeaderNotifItem => {
    const sev = (n.severity || '').toLowerCase();
    let type: HeaderNotifItem['type'] = 'info';
    if (sev === 'critical' || sev === 'high') type = 'critical';
    else if (sev === 'warning' || sev === 'medium') type = 'warning';
    else if (n.isRead || n.status === 'Resolved') type = 'success';

    return {
      id: String(n.id || `h-${Math.random()}`),
      title: n.title || n.notificationTitle || n.subject || 'System Notification',
      message: n.details || n.message || n.description || 'System alert triggered.',
      time: n.createdAtUtc ? new Date(n.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (n.time || n.lastOccurrence || 'Recently'),
      type: type,
      isRead: !!n.isRead,
      labName: n.labName || n.lab || 'System Environment'
    };
  };

  const fetchHeaderNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/notifications').catch(() => api.get('/api/v1/admin/notifications'));
      const data = res?.data?.data || res?.data || [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      if (items.length > 0) {
        setNotifications(items.map(mapApiToHeaderNotif));
      }
    } catch (err) {
      console.warn('[HeaderNotificationBell] Retaining fallback notifications');
    }
  }, []);

  useRealtime(fetchHeaderNotifications);

  useEffect(() => {
    fetchHeaderNotifications();
  }, [fetchHeaderNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/v1/notifications/mark-all-read').catch(() => {});
    } catch (e) {}
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isOpen ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40' : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
        }`}
        title="Notifications & Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-200">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Live System Telemetry</h3>
              <span className="text-[10px] font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800/50">
                {unreadCount} New
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-extrabold text-cyan-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 bg-slate-900/90">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">No active notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleToggleRead(n.id)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/60 transition cursor-pointer relative ${
                    !n.isRead ? 'bg-cyan-950/20' : 'opacity-75'
                  }`}
                >
                  {!n.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-cyan-400 rounded-full" />
                  )}

                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                    n.type === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    n.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  }`}>
                    {n.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                     n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 space-y-0.5 pr-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white line-clamp-1">{n.title}</span>
                      <span className="text-[9px] text-slate-500 font-sans shrink-0 ml-2">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{n.message}</p>
                    {n.labName && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 inline-block mt-1">
                        📍 {n.labName}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span>JRMSU LabTrack Realtime Engine</span>
            <button
              onClick={fetchHeaderNotifications}
              className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Sync Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderNotificationBell;
