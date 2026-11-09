import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, Users, Activity, Cpu, 
  CheckCircle2, Server, Lock, Wrench, BarChart2,
  Clock, ArrowRight, Laptop, Sparkles, Terminal, Check, Layers, QrCode, Smartphone
} from "lucide-react";
import { useLandingTheme } from "@/layouts/LandingLayout";

export const FeaturesPage: React.FC = () => {
  const { isDarkMode } = useLandingTheme();
  const [activeFeature, setActiveFeature] = useState<number>(0);

  // Real-time animation counter states
  const [cpuUsage, setCpuUsage] = useState<number>(24.2);
  const [memoryUsage, setMemoryUsage] = useState<number>(41.5);
  const [activeNodes, setActiveNodes] = useState<number>(128);
  const [waveTick, setWaveTick] = useState<number>(0);

  useEffect(() => {
    // TAMANG BILIS: 1000ms (1 segundo) para smooth at hindi nakakalula
    const timer = setInterval(() => {
      setWaveTick((prev) => prev + 1);
      setCpuUsage(() => Number((18 + Math.random() * 18).toFixed(1)));
      setMemoryUsage(() => Number((38 + Math.random() * 10).toFixed(1)));
      setActiveNodes((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(130, Math.max(122, prev + delta));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 5 CORE SYSTEM PILLARS
  const featurePillars = [
    {
      id: "telemetry",
      title: "Real-time Telemetry",
      shortDesc: "Monitor CPU, RAM, GPU temps, and active sessions of every workstation instantly.",
      detailedDesc: "Continuous live telemetry stream provides real-time visibility into all workstation health across ComLab 1-4 because real-time monitoring prevents system crashes and freezing during heavy coding classes.",
      whyBuilt: "Built to eliminate the tedious manual checking of individual computers. It automatically detects system bottlenecks and hardware degradation before users experience lag or crashes during critical exams.",
      whyGreat: "Provides 100ms metrics for the Admin to monitor all labs effortlessly. Guarantees zero lag for Instructors during heavy coding exams, and ensures a smooth, uninterrupted experience for Students.",
      answerHighlight: "Why use it: Delivers real-time 100ms workstation health metrics to eliminate downtime.",
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      accentColor: "from-amber-500 to-orange-500",
      statsBadge: `${cpuUsage}% Avg CPU Load`,
      type: "TELEMETRY_VIEW"
    },
    {
      id: "qrcode",
      title: "QR Code Instant Session Check-In",
      shortDesc: "Scan workstation QR codes using mobile phones for instant login and attendance logging.",
 detailedDesc: "Students simply scan the unique QR code displayed on their assigned workstation monitor. The system instantly verifies their identity, checks their class schedule, unlocks the PC, and automatically logs their attendanceeliminating the need for manual passwords and ensuring a completely touchless, 2-second login process.",
      whyBuilt: "Built to completely remove long student queues, manual sign-in errors, and wasted time during laboratory attendance logging. It replaces traditional paper logbooks with a modern, automatic, 3-step contactless flow (Scan > Verify > Unlock), ensuring no student is left waiting outside the lab while the instructor manually checks names.",
      whyGreat: "It eliminates student password typing and queue delays with 2-second scans, saves instructors 10-15 minutes of manual attendance and seating confusion, and equips administrators with fraud-proof cryptographic logs and real-time utilization insights that cut administrative overhead by over 75%.",
      answerHighlight: "Why use it: Automatic 3-Step flow (Scan > Verify > Unlock) saves time for everyone.",
      icon: <QrCode className="w-5 h-5 text-cyan-400" />,
      accentColor: "from-cyan-500 to-blue-500",
      statsBadge: "< 2s Mobile Login",
      type: "QRCODE_VIEW"
    },
    {
      id: "security",
      title: "Secure Asset Tracking",
      shortDesc: "Track hardware inventory, component replacements, and audit logs seamlessly.",
      detailedDesc: "Automated hardware component tagging and anti-tamper security logs protect all laboratory nodes because robust asset tracking prevents hardware theft and unauthorized access.",
      whyBuilt: "Built to stop unauthorized removal and swapping of high-value workstation components like RTX GPUs, RAM sticks, and SSDs across university labs, ensuring complete peace of mind for the institution.",
      whyGreat: "Uses AES-256 tamper-proof logs. Admins are instantly alerted of hardware theft. Instructors can trust that all equipment is secure. Students enjoy a safe, fully-equipped environment with no missing components.",
      answerHighlight: "Why use it: Protects high-value GPU & RAM inventory using AES-256 encrypted logs.",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      accentColor: "from-emerald-500 to-teal-500",
      statsBadge: "AES-256 Encryption",
      type: "SECURITY_VIEW"
    },
    {
      id: "scheduling",
      title: "Automated Scheduling",
      shortDesc: "Manage lab reservations, class schedules, and workstation allocations without conflicts.",
      detailedDesc: "Smart timetable engine prevents room reservation overlaps and handles instant class clearances because automated room allocation ensures effortless class transitions.",
      whyBuilt: "Built to resolve room double-booking, schedule clashes, and manual paper clearance delays between consecutive IT and CS classes. It ensures that instructors and students always have the right room at the right time.",
      whyGreat: "Zero schedule overlaps. Admins save hours of paperwork. Instructors can seamlessly book labs for their classes without conflicts. Students are guaranteed their assigned workstation for their scheduled classes.",
      answerHighlight: "Why use it: Guarantees zero schedule overlaps and streamlines laboratory room clearance.",
      icon: <Users className="w-5 h-5 text-blue-400" />,
      accentColor: "from-blue-500 to-cyan-500",
      statsBadge: "Zero Conflict Engine",
      type: "SCHEDULING_VIEW"
    },
    {
      id: "diagnostics",
      title: "Automated Diagnostics",
      shortDesc: "Instant fault logging and technician dispatch for hardware issues.",
      detailedDesc: "Proactive telemetry threshold alerts detect GPU overheating and hardware faults before classes begin because early fault detection enables rapid IT maintenance.",
      whyBuilt: "Built to eliminate long waiting times for IT repair requests. Instead of students reporting broken PCs manually, the system automatically flags faulty machines directly to lab technicians before they cause class disruptions.",
      whyGreat: "Auto-dispatches IT tickets in <15 mins. Admins keep lab uptime at 99.9%. Instructors never have to delay a class due to a broken PC. Students experience zero disruptions during their hands-on activities.",
      answerHighlight: "Why use it: Automatically dispatches IT technicians in under 15 minutes during hardware failures.",
      icon: <Wrench className="w-5 h-5 text-purple-400" />,
      accentColor: "from-purple-500 to-indigo-500",
      statsBadge: "< 15m Dispatch",
      type: "DIAGNOSTICS_VIEW"
    }
  ];

  const currentFeature = featurePillars[activeFeature];

  return (
    <div className="relative z-10 py-16 md:py-24 px-4 sm:px-6 lg:px-12 min-h-screen select-none font-sans text-slate-100">
      
      {/* CUSTOM ANIMATIONS */}
      <style>{`
        @keyframes premium-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(255,255,255,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 25px rgba(255,255,255,0.5); transform: scale(1.02); }
        }
        .animate-premium-pulse {
          animation: premium-pulse 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white bg-white text-black text-sm font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-premium-pulse">
            <Activity className="w-5 h-5 text-black animate-pulse" />
            <span>System Capabilities</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
            Why use <span className="text-blue-400">LabTrack?</span>
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-white font-black leading-relaxed max-w-3xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
            Experience the future of laboratory management with our comprehensive suite of tools designed for efficiency and security.
          </p>
        </div>

        {/* MODERN SPLIT INTERACTIVE FEATURE SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* KALIWA: INTERACTIVE FEATURE PILLARS SELECTOR */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {featurePillars.map((pillar, idx) => {
              const isSelected = activeFeature === idx;
              return (
                <div
                  key={pillar.id}
                  onClick={() => setActiveFeature(idx)}
                  className={`
                    group p-3.5 md:p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-2
                    backdrop-blur-xl relative overflow-hidden
                    ${isSelected 
                      ? 'bg-slate-900/95 border-blue-500 shadow-[0_0_35px_rgba(37,99,235,0.3)] scale-[1.02]' 
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-white/20'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl bg-slate-950 border border-slate-800 ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}>
                        {pillar.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                          {pillar.title}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {pillar.statsBadge}
                        </span>
                      </div>
                    </div>

                    <div className={`w-3 h-3 rounded-full transition-all ${isSelected ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]' : 'bg-slate-800'}`} />
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {pillar.shortDesc}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>{pillar.answerHighlight}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KANAN: DYNAMIC LIVE FEATURE CANVAS PREVIEW */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Gradient Glow */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${currentFeature.accentColor} opacity-10 blur-[90px] rounded-full pointer-events-none`} />

            {/* Canvas Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  {currentFeature.icon}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest block">ACTIVE FEATURE PREVIEW</span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{currentFeature.title}</h3>
                </div>
              </div>

              <span className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Node Sync
              </span>
            </div>

            {/* BOLD DESCRIPTION */}
            <p className="text-xs sm:text-sm text-white font-bold leading-relaxed drop-shadow-sm">
              {currentFeature.detailedDesc}
            </p>

            {/* WHY IT WAS BUILT & WHY IT IS GREAT GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">WHY IT WAS BUILT</span>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{currentFeature.whyBuilt}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">WHY IT IS ADVANTAGEOUS</span>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">{currentFeature.whyGreat}</p>
              </div>
            </div>

            {/* DYNAMIC VIEW PANEL BASED ON SELECTED FEATURE */}
            {currentFeature.type === "TELEMETRY_VIEW" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Workstation Traffic & Load</span>
                  <span className="text-cyan-400">{activeNodes} / 130 Nodes Online</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase">CPU Load</span>
                    <p className="text-xl font-black text-amber-400">{cpuUsage}%</p>
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                      {/* SMOOTH TRANSITION: duration-700 para tuloy-tuloy at hindi biglaan */}
                      <div className="bg-amber-400 h-full transition-all duration-700 ease-in-out" style={{ width: `${cpuUsage}%` }} />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase">Memory Allocation</span>
                    <p className="text-xl font-black text-cyan-400">{memoryUsage}%</p>
                    <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                      {/* SMOOTH TRANSITION: duration-700 para tuloy-tuloy at hindi biglaan */}
                      <div className="bg-cyan-400 h-full transition-all duration-700 ease-in-out" style={{ width: `${memoryUsage}%` }} />
                    </div>
                  </div>
                </div>

                {/* WAVE ANIMATION BARS (Taas-baba, taas-baba nang sabay-sabay) */}
                <div className="h-14 flex items-end justify-between gap-1.5 pt-2">
                  {[...Array(14)].map((_, idx) => {
                    // Ginagamitan ng Math.sin para maging tuloy-tuloy (wave) ang galaw
                    const waveHeight = 50 + Math.sin((waveTick + idx) * 0.5) * 35;
                    return (
                      <div 
                        key={idx} 
                        /* duration-700 ease-in-out para sobrang smooth ng hatak pataas at pababa */
                        className="w-full rounded-t bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 ease-in-out" 
                        style={{ height: `${Math.min(100, Math.max(15, waveHeight))}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ORIGINAL QRCODE VIEW */}
            {currentFeature.type === "QRCODE_VIEW" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <span>QR CHECK-IN & SESSION PROTOCOL</span>
 <span className="text-cyan-400 font-bold"> - SCAN READY</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="p-4 bg-slate-900 rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
                      <QrCode className="w-full h-full text-slate-950" />
                    </div>
 <span className="text-[10px] text-cyan-300 font-bold">ComLab 2 PC 14</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-300">Mobile Camera Scan</span>
                      <span className="text-emerald-400 font-bold">&lt; 2 Seconds</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-300">Attendance Logged</span>
                      <span className="text-cyan-400 font-bold">Automatic</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentFeature.type === "SECURITY_VIEW" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <span>SECURITY AUDIT PROTOCOL</span>
 <span className="text-emerald-400 font-bold"> - ACTIVE AUDIT</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Auth Token Injection Interceptor</span>
                    <span className="text-emerald-400 font-bold">401 Auto-Clear Active</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300">Hardware Anti-Tamper Check</span>
                    <span className="text-cyan-400 font-bold">130 Nodes Verified</span>
                  </div>
                </div>
              </div>
            )}

            {currentFeature.type === "SCHEDULING_VIEW" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <span>TIMETABLE RESERVATION ENGINE</span>
                  <span className="text-blue-400 font-bold">ComLab 1 - 4 Synced</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">ComLab 1 (BSIT 3A)</span>
                    <p className="text-white font-bold">Software Engineering</p>
                    <span className="text-emerald-400 block text-[10px]">38 / 40 Seats Occupied</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">ComLab 2 (BSCS 2B)</span>
                    <p className="text-white font-bold">Network Security</p>
                    <span className="text-emerald-400 block text-[10px]">35 / 35 Seats Occupied</span>
                  </div>
                </div>
              </div>
            )}

            {currentFeature.type === "DIAGNOSTICS_VIEW" && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <span>TELEMETRY FAULT LOGGING</span>
                  <span className="text-purple-400 font-bold">Auto-Ticketing Active</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30 text-purple-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">[Alert Log #4092]</span>
                    <span className="text-[10px] text-slate-400">1 min ago</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
 ComLab 3 RTX GPU fan speeds nominal. Thermal load operating at 42 deg C average. Zero hardware faults flagged.
                  </p>
                </div>
              </div>
            )}

            {/* ALL-IN-ONE SYSTEM IMPACT SUMMARY CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-950 to-indigo-950/60 border border-blue-500/30 space-y-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                WHY USE LABTRACK? KEY VALUE PROPOSITION
              </span>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
 Choose LabTrack because it integrates mobile QR check-ins, real-time telemetry monitoring, AES-256 asset security, conflict-free scheduling, and automated fault diagnostics into a single dashboardreducing IT maintenance overhead by over <strong className="text-emerald-400 font-bold">75%</strong> while ensuring optimal workstation performance across JRMSU campus computer laboratories.
              </p>
            </div>

            {/* Bottom Enterprise Badge Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">JRMSU LabTrack Architecture</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
              </span>
            </div>

          </div>

        </div>

        {/* BOTTOM METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Campus Fleet</span>
            <p className="text-2xl font-black text-cyan-400">130+ <span className="text-xs text-slate-400 font-sans">Nodes</span></p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cluster Uptime</span>
            <p className="text-2xl font-black text-emerald-400">99.98%</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Auth Security</span>
            <p className="text-2xl font-black text-blue-400">AES-256</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dispatch Time</span>
            <p className="text-2xl font-black text-purple-400">&lt; 15m</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FeaturesPage;