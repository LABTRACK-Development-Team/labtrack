import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Activity, Cpu, Sparkles, Building2, 
  Server, CheckCircle2, Lock, Laptop, Zap, ArrowRight,
  UserCheck, Database, RefreshCw, FileText, AlertTriangle,
  Award, TrendingUp, Check, Layers, BarChart2, Star, Target
} from "lucide-react";
import { useLandingTheme } from "@/layouts/LandingLayout";

export const AboutPage: React.FC = () => {
  const { isDarkMode } = useLandingTheme();
  
  // Dynamic Real-time Node Status Counter for the Visual Panel
  const [activeNodes, setActiveNodes] = useState<number>(128);
  const [latency, setLatency] = useState<number>(1.2);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Number((0.8 + Math.random() * 0.6).toFixed(1)));
      setActiveNodes((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(130, Math.max(122, prev + delta));
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // System Workflow Pipeline Steps
  const systemWorkflow = [
    {
      step: "01",
      title: "Workstation Telemetry Agent",
      role: "Client-Side Monitoring",
      desc: "Background service on ComLab workstations streams CPU, RAM, GPU temperature, and active session metrics via WebSocket.",
      tech: "C# / Python Background Service",
      icon: <Laptop className="w-5 h-5 text-amber-400" />,
      accent: "border-amber-500/30 text-amber-400"
    },
    {
      step: "02",
      title: "Axios & Bearer Auth Gateway",
      role: "Secure Data Transmission",
      desc: "Client API requests inject JWT Bearer Tokens with 15s timeouts and auto-clearing interceptors on 401 Unauthorized status.",
      tech: "Axios + Zustand Persist Storage",
      icon: <Lock className="w-5 h-5 text-emerald-400" />,
      accent: "border-emerald-500/30 text-emerald-400"
    },
    {
      step: "03",
      title: "FastAPI AI Diagnostic Engine",
      role: "Automated Health Processing",
      desc: "Python AI microservice analyzes incoming telemetry metrics to detect thermal spikes, hardware degradation, or network packet drops.",
      tech: "Python FastAPI + SQLAlchemy",
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      accent: "border-purple-500/30 text-purple-400"
    },
    {
      step: "04",
      title: "C# .NET Enterprise Core API",
      role: "Business Logic & Timetables",
      desc: "Handles laboratory reservations, role-based access rules, asset tracking inventory logs, and faculty class clearances.",
      tech: "C# .NET Web API Core",
      icon: <Server className="w-5 h-5 text-blue-400" />,
      accent: "border-blue-500/30 text-blue-400"
    },
    {
      step: "05",
      title: "Executive React Management Portal",
      role: "Unified Admin Dashboard",
      desc: "Provides live workstation maps, automated technician ticketing, seat allocations, and exportable institutional audit reports.",
      tech: "React + TypeScript + Tailwind",
      icon: <Activity className="w-5 h-5 text-cyan-400" />,
      accent: "border-cyan-500/30 text-cyan-400"
    }
  ];

  // Why It Was Built & Impact Advantages
  const whyBuiltReasons = [
    {
      title: "Eliminates Manual Lab Inspection",
      desc: "Traditional paper sign-ins and manual hardware inspection take hours. LabTrack automates 100% of workstation health checks in real time.",
      icon: <RefreshCw className="w-5 h-5 text-blue-400" />,
      tag: "Automated Efficiency"
    },
    {
      title: "Prevents Hardware Asset Theft & Loss",
      desc: "High-value RTX GPUs and RAM components are continuously tagged and verified against anti-tamper security logs.",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      tag: "Asset Protection"
    },
    {
      title: "Zero Timetable & Room Conflicts",
      desc: "Instant faculty clearances and automated room reservation engines guarantee smooth transitions between BSIT and BSCS classes.",
      icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
      tag: "Conflict-Free"
    },
    {
      title: "Rapid < 15 Min IT Maintenance Dispatch",
      desc: "FastAPI diagnostic thresholds alert lab technicians instantly whenever overheating or memory faults occur during class.",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      tag: "Instant Ticketing"
    }
  ];

  return (
    <div className="relative z-10 py-16 md:py-24 px-4 sm:px-6 lg:px-12 min-h-screen flex items-center justify-center select-none font-sans text-slate-100">
      
      {/* CUSTOM PREMIUM GLOW & PULSE ANIMATIONS */}
      <style>{`
        @keyframes premium-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(255,255,255,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 25px rgba(255,255,255,0.5); transform: scale(1.02); }
        }
        .animate-premium-pulse {
          animation: premium-pulse 3s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto w-full space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* ASYMMETRIC ENTERPRISE SPLIT HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* KALIWANG BAHAGI: MAIN ABOUT INFO & EXACT TEXTS */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="space-y-6">
              
              {/* BADGE (EXACT PRESERVED TEXT) */}
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white bg-white text-black text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-premium-pulse">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>About The System</span>
              </div>
              
              {/* HEADING (EXACT PRESERVED TEXT) */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                About <span className="text-blue-400">LabTrack</span>
              </h2>

              {/* MAIN PARAGRAPH (EXACT PRESERVED TEXT) */}
              <p className="text-base sm:text-lg md:text-xl text-white font-black leading-relaxed max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                LabTrack is the official laboratory management and real-time telemetry portal built specifically for <span className="text-blue-300">JRMSU Dapitan Main Campus</span>. 
                We aim to provide a seamless, efficient, and secure environment for students, instructors, and administrators to manage 
                laboratory resources, monitor workstation usage, and ensure the smooth operation of all IT facilities.
              </p>

            </div>

            {/* QUICK INSTITUTIONAL STATS STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Campus</span>
                <p className="text-lg font-black text-cyan-400">JRMSU Main</p>
                <span className="text-[10px] text-slate-500 block">Dapitan City</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Coverage</span>
                <p className="text-lg font-black text-emerald-400">130 Workstations</p>
                <span className="text-[10px] text-slate-500 block">ComLab 1, 2, 3 & 4</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Protocol</span>
                <p className="text-lg font-black text-blue-400">AES-256 Auth</p>
                <span className="text-[10px] text-slate-500 block">Bearer Token Clearing</span>
              </div>
            </div>

          </div>

          {/* KANANG BAHAGI: HIGH-TECH LIVE CAMPUS TELEMETRY SHOWCASE */}
          <div className="lg:col-span-5">
            <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-blue-500/30 via-slate-800/40 to-cyan-500/20 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              
              <div className="rounded-[2.2rem] bg-slate-950 border border-slate-800 p-6 sm:p-8 space-y-6 relative overflow-hidden">
                
                {/* Ambient Internal Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

                {/* Status Bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">CAMPUS CORE TELEMETRY</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                    {latency}ms Latency
                  </span>
                </div>

                {/* Central Platform Architecture Nodes */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-bold">C# .NET Backend API</p>
                        <span className="text-[10px] text-slate-400 block font-sans">LabTrack.CSharp Service</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ONLINE
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-bold">Python FastAPI AI Engine</p>
                        <span className="text-[10px] text-slate-400 block font-sans">LabTrack.Python Agent</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-white font-bold">TypeScript React UI</p>
                        <span className="text-[10px] text-slate-400 block font-sans">Executive Client Interface</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      SYNCED
                    </span>
                  </div>
                </div>

                {/* Active Workstation Capacity Bar */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Total Workstation Load</span>
                    <span className="text-cyan-400">{activeNodes} / 130 Online</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-500" 
                      style={{ width: `${(activeNodes / 130) * 100}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* WHY IT WAS BUILT & SYSTEM ADVANTAGES SECTION */}
        <div className="p-8 md:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl space-y-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest block">SYSTEM PURPOSE & VALUE</span>
              <h3 className="text-2xl font-black text-white">Why LabTrack Was Built & Why It Is Essential</h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-blue-950 border border-blue-800 text-blue-300 font-bold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-400" /> Operational Excellence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyBuiltReasons.map((item, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white leading-snug">{item.title}</h4>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM OPERATIONAL FLOW PIPELINE */}
        <div className="p-8 md:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl space-y-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block">SYSTEM ARCHITECTURE & WORKFLOW</span>
              <h3 className="text-2xl font-black text-white">How LabTrack Operates End-to-End</h3>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
              Automated Pipeline Stream
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {systemWorkflow.map((wf, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`
                  p-5 rounded-2xl border transition-all duration-300 cursor-pointer space-y-3 flex flex-col justify-between
                  ${activeStep === idx 
                    ? 'bg-slate-950 border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02]' 
                    : 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800/80'}
                `}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">{wf.step}</span>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {wf.icon}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white leading-tight">{wf.title}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">{wf.role}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                    {wf.desc}
                  </p>
                </div>

                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 block text-center mt-2">
                  {wf.tech}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* THREE CORE VALUE CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="group p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Secure</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed opacity-90">
              Enterprise-grade security for all lab assets, bearer token injection, and user role authentication data.
            </p>
          </div>

          <div className="group p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Real-time</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed opacity-90">
              Live telemetry stream and active session status monitoring for every computer workstation across ComLabs.
            </p>
          </div>

          <div className="group p-6 md:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Efficient</h3>
            <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed opacity-90">
              Streamlined management portal empowering JRMSU students, instructors, and lab administrators.
            </p>
          </div>

        </div>

        {/* INSTITUTIONAL FOOTER BANNER */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-2xl">
          <div className="flex items-center gap-3 text-slate-300">
            <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
 <span>Jose Rizal Memorial State University Main Campus</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Official Telemetry & Facility Portal</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;