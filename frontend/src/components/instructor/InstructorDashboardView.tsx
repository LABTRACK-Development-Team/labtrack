import { MaintenanceView } from '../admin/MaintenanceView';
import React, { useState, useEffect } from "react";
import { OverviewView } from "./OverviewView";
import { ReservationsView } from "./ReservationsView";
import { LabAvailabilityView } from "./LabAvailabilityView";
import { StudentSessionsView } from "./StudentSessionsView";
import { ReportProblemView } from "./ReportProblemView";
import { MyRequestsView } from "./MyRequestsView";
import { UsageAnalyticsView } from "./UsageAnalyticsView";
import { NotificationsView } from "./NotificationsView";
import { AiAssistantView } from "./AiAssistantView";
import { ProfileView } from "./ProfileView";

interface InstructorDashboardViewProps {
  instructorName?: string;
  selectedCampus?: string;
  onLogout?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// TYPING EFFECT COMPONENT
const TypingEffect = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: any;
    const i = displayed.length;
    
    if (!isDeleting) {
      if (i < text.length) {
        timer = setTimeout(() => setDisplayed(text.substring(0, i + 1)), 60);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2500); // Hihinto ng 2.5s bago burahin
      }
    } else {
      if (i > 0) {
        timer = setTimeout(() => setDisplayed(text.substring(0, i - 1)), 25); // Mabilis magbura
      } else {
        setIsDeleting(false);
        timer = setTimeout(() => {}, 500); // Hihinto bago mag-type ulit
      }
    }
    return () => clearTimeout(timer);
  }, [displayed, isDeleting, text]);

  return (
    <span className="font-semibold text-blue-700">
      {displayed}
      <span className="animate-pulse text-blue-500">|</span>
    </span>
  );
};

// HEADER COMPONENT (White Box)
const TabHeader = ({ tabName }: { tabName: string }) => {
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayTab = tabName.replace(/_/g, ' ').toUpperCase();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider sm:tracking-widest">
          LabTrack Executive Portal <span className="text-slate-300 mx-2">/</span> 
          <span className="text-blue-600">{displayTab}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] sm:text-[10px] font-sans text-green-600 font-bold bg-green-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-green-200 shadow-sm">
            LIVE CLOCK: {clock}
          </span>
        </div>
      </div>
      
      {/* DYNAMIC TITLE PER TAB */}
      {tabName === 'overview' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-3">Executive Operations & Real-Time Telemetry</h1>}
      
      {tabName === 'reservations' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Lab Reservations & Scheduling Hub</h1>}
      {tabName === 'lab_availability' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Real-Time Lab Availability</h1>}
      {tabName === 'report_problem' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Incident & Issue Reporting</h1>}
      {tabName === 'student_sessions' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Student Sessions & QR Check-In Monitoring</h1>}
      {tabName === 'my_requests' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">My Service Requests</h1>}
      {tabName === 'usage_analytics' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Usage Analytics & Insights</h1>}
      {tabName === 'notifications' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">System Notifications & Alerts</h1>}
      {tabName === 'ai_assistant' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">AI Assistant & Intelligent Support Hub</h1>}
      {tabName === 'profile' && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Profile & Security Settings</h1>}

      {/* TELEMETRY FEED (Typing Effect) for Overview Only */}
      {tabName === 'overview' && (
        <div className="flex items-center gap-2 text-xs text-slate-600 font-sans mt-4">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
          <span className="font-bold text-blue-600 shrink-0">LIVE TELEMETRY FEED:</span> 
          <TypingEffect text="Python AI Agent active; Zero critical hardware bus collisions detected." />
        </div>
      )}
    </div>
  );
};

// MAIN DASHBOARD (Router)
export const InstructorDashboardView: React.FC<InstructorDashboardViewProps> = ({
  activeTab = "overview",
}) => {
  const cleanTab = (activeTab || '').toLowerCase().replace(/[-_ ]/g, '');
  const isMaintenance = cleanTab.includes('maintenance');

  return (
    <div className="w-full h-full animate-in fade-in duration-300">
      
      {/* 1. Laging nandiyan ang Header (White Box + Green Clock) */}
      <TabHeader tabName={activeTab} />

      {/* 2. Content Area (Naka-depende sa kung anong file ang tinawag) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {(activeTab === "overview" || !activeTab) && <OverviewView />}
        
        {activeTab === "reservations" && <ReservationsView />}
        {activeTab === "lab_availability" && <LabAvailabilityView />}
        {activeTab === "student_sessions" && <StudentSessionsView />}
        {activeTab === "report_problem" && <ReportProblemView />}
        {activeTab === "my_requests" && <MyRequestsView />}
        {activeTab === "usage_analytics" && <UsageAnalyticsView />}
        {activeTab === "notifications" && <NotificationsView />}
        {activeTab === "ai_assistant" && <AiAssistantView />}
        {activeTab === "profile" && <ProfileView />}
      </div>
      
      {isMaintenance && <MaintenanceView />}
    </div>
  );
};

export default InstructorDashboardView;