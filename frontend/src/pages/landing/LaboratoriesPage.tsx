import React, { useState } from 'react';
import { 
  Monitor, Wifi, Cpu, Video, Wrench, Server, 
  CheckCircle2, Activity, ShieldCheck, Sparkles, 
  ChevronRight, Layers, Zap
} from "lucide-react";
import { useLandingTheme } from "@/layouts/LandingLayout";

export const LaboratoriesPage: React.FC = () => {
  const { isDarkMode } = useLandingTheme();
  const [selectedFacility, setSelectedFacility] = useState<string>("comlab-1");

  const facilities = [
    {
      id: "comlab-1",
      code: "COMLAB-01",
      name: "Computer Laboratory 1",
      subtitle: "Full-Stack Software Engineering & Database Systems",
      desc: "Primary software development hub equipped with modern workstations optimized for C# .NET, Python FastAPI services, and relational database systems development.",
      stats: "40 Workstations",
 spec: "Intel Core i7 - 32GB RAM - NVMe SSD - 1Gbps LAN",
      status: "Operational",
      occupiedSeats: 38,
      totalSeats: 40,
      icon: <Monitor className="w-5 h-5 text-cyan-400" />
    },
    {
      id: "comlab-2",
      code: "COMLAB-02",
      name: "Computer Laboratory 2",
      subtitle: "Enterprise Cisco Networking & Cyber Defense",
      desc: "Advanced networking laboratory configured with Cisco Catalyst switches, enterprise routers, and hardware racks for network topology simulations.",
      stats: "35 Workstations",
 spec: "Cisco Catalyst Racks - Enterprise Routers - Hardware Switches",
      status: "Class In Session",
      occupiedSeats: 35,
      totalSeats: 35,
      icon: <Wifi className="w-5 h-5 text-blue-400" />
    },
    {
      id: "comlab-3",
      code: "COMLAB-03",
      name: "Computer Laboratory 3",
      subtitle: "AI, Deep Learning & High-Performance Compute Cluster",
      desc: "Computational research facility featuring NVIDIA RTX acceleration for machine learning training, computer vision models, and data analytics.",
      stats: "30 GPU Nodes",
 spec: "NVIDIA RTX 4090 - 64GB RAM - CUDA Acceleration",
      status: "AI Cluster Active",
      occupiedSeats: 28,
      totalSeats: 30,
      icon: <Cpu className="w-5 h-5 text-amber-400" />
    },
    {
      id: "comlab-4",
      code: "COMLAB-04",
      name: "Computer Laboratory 4",
      subtitle: "3D CAD Modeling & Digital Media Production Suite",
      desc: "High-end multimedia design studio equipped with color-accurate 4K monitors and dedicated rendering GPUs for CAD and digital art creation.",
      stats: "25 Creative Workstations",
 spec: "4K Color-Calibrated Displays - Studio GPUs - Tablet Support",
      status: "Available Seats",
      occupiedSeats: 22,
      totalSeats: 25,
      icon: <Video className="w-5 h-5 text-purple-400" />
    },
    {
      id: "hardware-hub",
      code: "TECH-BENCH",
      name: "Hardware Diagnostics & Repair Station",
      subtitle: "Component Maintenance & Embedded Systems Bench",
      desc: "Dedicated hardware maintenance station with electronic test instruments, digital oscilloscopes, and micro-soldering tools for technical diagnostics.",
      stats: "15 Tech Benches",
 spec: "Digital Oscilloscopes - Logic Analyzers - Soldering Stations",
      status: "Operational",
      occupiedSeats: 10,
      totalSeats: 15,
      icon: <Wrench className="w-5 h-5 text-emerald-400" />
    },
    {
      id: "server-core",
      code: "EDGE-CORE",
      name: "Campus Telemetry & Edge Server Core",
      subtitle: "Central Infrastructure & Network Operations Hub",
      desc: "Main server node driving LabTrack local telemetry microservices, centralized domain authorization, and 10Gbps fiber optic backbone routing.",
      stats: "Central Datacenter Cluster",
 spec: "10Gbps Fiber Backbone - Dual Redundant Power UPS",
      status: "100% Telemetry Sync",
      occupiedSeats: 0,
      totalSeats: 0,
      icon: <Server className="w-5 h-5 text-teal-400" />
    }
  ];

  const activeFacilityData = facilities.find(f => f.id === selectedFacility) || facilities[0];

  return (
    <div className="relative z-10 py-12 md:py-20 px-4 sm:px-6 lg:px-12 min-h-screen text-slate-100 font-sans select-none">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER SECTION - STRICTLY PRESERVED TEXT */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          {/* FACILITY EXPLORER BADGE */}
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white bg-white text-black text-sm font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Facility Explorer</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter flex flex-col items-center justify-center gap-2">
            <span className="text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              Our State-of-the-Art
            </span>
            <span className="text-blue-400 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              Laboratories
            </span>
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg max-w-3xl mx-auto text-white font-black leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
            Explore the high-tech facilities managed by the LabTrack system, designed to empower JRMSU students and faculty with industry-standard equipment.
          </p>

        </div>

        {/* TOP ENTERPRISE EXECUTIVE METRICS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Capacity</span>
              <p className="text-xl font-black text-cyan-400">145 / 150 <span className="text-xs text-slate-400 font-sans font-normal">Active</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Trunk</span>
              <p className="text-xl font-black text-emerald-400">10 Gbps <span className="text-xs text-slate-400 font-sans font-normal">Fiber</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telemetry Sync</span>
              <p className="text-xl font-black text-blue-400">99.9% <span className="text-xs text-slate-400 font-sans font-normal">Sync Rate</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Status</span>
              <p className="text-xl font-black text-emerald-400">Nominal</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ENTERPRISE SPLIT WORKBENCH / DATA MATRIX VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: FACILITY DIRECTORY SELECTOR */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-mono font-bold text-slate-400">
              <span>FACILITY DIRECTORY</span>
              <span>NODE STATUS</span>
            </div>

            <div className="space-y-2">
              {facilities.map((fac) => {
                const isSelected = fac.id === selectedFacility;
                return (
                  <button
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac.id)}
                    className={`
                      w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3
                      ${isSelected 
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950/50' 
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'}
                    `}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800'}`}>
                        {fac.icon}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">{fac.code}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black truncate text-white">{fac.name}</h4>
                        <span className="text-[11px] text-slate-400 font-sans block truncate">{fac.stats}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                        {fac.status}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-blue-400' : 'text-slate-500'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: EXECUTIVE FACILITY INSPECTION PANEL */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            
            {/* Panel Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-blue-400 uppercase">{activeFacilityData.code}</span>
 <span className="text-xs text-slate-500"> - </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {activeFacilityData.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1">{activeFacilityData.name}</h3>
                <p className="text-xs font-bold text-slate-300 mt-0.5">{activeFacilityData.subtitle}</p>
              </div>

              <div className="px-3.5 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono font-bold text-cyan-400">
                {activeFacilityData.stats}
              </div>
            </div>

            {/* Overview Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {activeFacilityData.desc}
            </p>

            {/* Hardware Specification Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                Hardware Specification Profile
              </span>
              <p className="text-xs font-mono text-cyan-300 font-bold">
                {activeFacilityData.spec}
              </p>
            </div>

            {/* Live Occupancy Gauge (If Seats > 0) */}
            {activeFacilityData.totalSeats > 0 ? (
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-slate-300">Active Workstation Load</span>
                  <span className="text-cyan-400">{activeFacilityData.occupiedSeats} / {activeFacilityData.totalSeats} Workstations Occupied</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-500"
                    style={{ width: `${(activeFacilityData.occupiedSeats / activeFacilityData.totalSeats) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Capacity Ratio: {((activeFacilityData.occupiedSeats / activeFacilityData.totalSeats) * 100).toFixed(0)}%</span>
                  <span>Available Seats: {activeFacilityData.totalSeats - activeFacilityData.occupiedSeats}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Core Telemetry Datacenter Node</span>
                <span className="text-emerald-400 font-bold">10Gbps Edge Sync Active</span>
              </div>
            )}

            {/* Telemetry Operational Status Box */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Telemetry Node</span>
                <span className="text-white font-bold">LabTrack Agent v2.4</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Diagnostics Protocol</span>
                <span className="text-emerald-400 font-bold">Automated Logging</span>
              </div>
            </div>

          </div>

        </div>

        {/* INSTITUTIONAL GOVERNANCE FOOTER BANNER */}
        <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center justify-center lg:justify-start gap-2.5">
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
              JRMSU Institutional Facility Governance
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-normal">
              Centralized telemetry nodes across all campus computer laboratories ensure 100% equipment tracking, automated fault logging, and streamlined faculty class clearance.
            </p>
          </div>

          <div className="flex gap-4 w-full lg:w-auto font-mono">
            <div className="flex-1 lg:flex-none px-6 py-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[130px] shadow-lg">
              <span className="text-2xl font-black text-blue-400">145+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Nodes</span>
            </div>
            <div className="flex-1 lg:flex-none px-6 py-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-w-[130px] shadow-lg">
              <span className="text-2xl font-black text-emerald-400">99.9%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sync Rate</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LaboratoriesPage;