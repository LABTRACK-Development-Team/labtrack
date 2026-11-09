import AdminNotificationsView from '../admin/AdminNotificationsView';
import React, { useState, useEffect } from 'react';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { useAuth } from '@/context/auth-context';
import { 
  LayoutDashboard, Wrench, QrCode, Calendar, ShieldCheck, LogOut, 
  User, Menu, Bell, Tv, DollarSign, Settings, ChevronDown, 
  Building, Layers, AlertTriangle, ArrowRightLeft, Users, 
  Sparkles, History, Download, Clock, MessageSquare
} from 'lucide-react';

import AdminDashboardView from '../admin/AdminDashboardView';
import { InstructorDashboardView } from '../instructor/InstructorDashboardView';

interface PortalShellProps {
  userRole?: 'ADMIN_TECHNICIAN' | 'INSTRUCTOR';
  userName?: string;
  campusName?: string;
  onLogout?: () => void;
}

export const PortalShell: React.FC<PortalShellProps> = ({
  userRole = 'ADMIN_TECHNICIAN',
  onLogout = () => console.log('Logout executed')
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const { user } = useAuth();
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Admin'
    : 'Admin';
  const profilePictureUrl = user?.profilePictureUrl;
  const userInitials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const userCampus = 'Dapitan Main Campus';

  useEffect(() => {
    const storedUser = sessionStorage.getItem("labtrack_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      /* removed: useAuth handles user state */
      // Campus hardcoded to Dapitan
    }
  }, []);

  const isAdmin = userRole === 'ADMIN_TECHNICIAN';

  const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'campuses_labs', label: 'Campuses & Labs', icon: Building },
    { id: 'assets', label: 'Assets / Workstations', icon: Tv },
    { id: 'qr_management', label: 'QR Management', icon: QrCode },
    { id: 'issues', label: 'Issues / Service Desk', icon: AlertTriangle },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'inventory_transfers', label: 'Inventory & Transfers', icon: ArrowRightLeft },
    { id: 'sessions', label: 'Workstation Sessions', icon: Layers },
    { id: 'financials', label: 'Financial Records', icon: DollarSign },
    { id: 'analytics', label: 'Analytics & Reports', icon: Download },
    { id: 'users', label: 'Users & Access', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'audit_logs', label: 'Audit Logs', icon: History },
    { id: 'profile', label: 'Profile & Settings', icon: Settings },
  ];

  const instructorNavItems = [
    { id: 'overview',        label: 'Overview',                icon: LayoutDashboard },
    { id: 'reservations',    label: 'Reservations & Calendar', icon: Calendar },
    { id: 'lab_availability',label: 'Lab Availability',        icon: Tv },
    { id: 'student_sessions',label: 'Student Sessions',        icon: Users },
    { id: 'report_problem',  label: 'Report a Problem',        icon: AlertTriangle },
    { id: 'my_requests',     label: 'My Requests',             icon: Clock },
    { id: 'usage_analytics', label: 'Usage Analytics',         icon: Download },
    { id: 'notifications',   label: 'Notifications',           icon: Bell },
    { id: 'ai_assistant',    label: 'AI Assistant',            icon: Sparkles },
    { id: 'profile',         label: 'Profile & Security',      icon: Settings },
    ];

  const currentNavItems = isAdmin ? adminNavItems : instructorNavItems;

  const { unreadCount } = useNotificationPolling(30000);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800">
      
      {/* BACKGROUND IMAGE */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/images/sami.jpg')" }}></div>
      <div className="fixed inset-0 z-0 bg-slate-950/85"></div>

      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden" onClick={() => setIsMobileDrawerOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-screen w-64 z-50 transition-transform duration-300 flex flex-col bg-[#1e293b] text-slate-300 ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 h-16 flex items-center gap-3 border-b border-slate-700">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-tight">
              {isAdmin ? 'ADMINDEK' : 'FACULTY PORTAL'} <br/><span className="text-blue-400">LABTRACK</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-1">
          
          {currentNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileDrawerOpen(false); }}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-all duration-200 ease-out ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full w-full lg:pl-64 relative z-10">
        
        {/* TOPBAR (White Header) */}
        <header className="h-16 flex-shrink-0 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 lg:px-8 shadow-md z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileDrawerOpen(true)} className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100">
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button onClick={() => setActiveTab('notifications')} className="relative p-2 text-slate-400 hover:text-white transition-all duration-200 ease-out">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full border-2 border-[#0f172a] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 border-l border-slate-700 pl-4 cursor-pointer hover:opacity-80 transition-all duration-200 ease-out" onClick={() => setActiveTab('profile')}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-sm overflow-hidden">
                {profilePictureUrl ? (
                  <img 
                    src={profilePictureUrl} 
                    alt={displayName} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span>{userInitials || (isAdmin ? 'AD' : 'IN')}</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left justify-center">
                <p className="text-sm font-bold text-white leading-tight">{displayName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{isAdmin ? 'Admin' : 'Instructor'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>

            <button onClick={onLogout} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 ease-out ml-1 active:scale-95" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          {isAdmin ? (
            <AdminDashboardView 
              campusName={userCampus}
              activeTab={activeTab} 
              onTabChange={(tab: string) => setActiveTab(tab)} 
            />
          ) : (
            <InstructorDashboardView 
              instructorName={displayName}
              selectedCampus={userCampus}
              activeTab={activeTab} 
              onTabChange={(tab: string) => setActiveTab(tab)} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PortalShell;




