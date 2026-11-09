import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  ArrowRight, ShieldCheck, Activity, Bot, 
  Wrench, Sparkles, Building2, Cpu, FileText, 
  CheckCircle2, Users, Layers, Lock, Server
} from "lucide-react";

export const HomePage: React.FC = () => {
  // Live Telemetry Controls & Animated States
  const [telemetryCount, setTelemetryCount] = useState<number>(150525);
  const [activeNodesCount, setActiveNodesCount] = useState<number>(123);
  const [cpuUsage, setCpuUsage] = useState<number>(24.8);
  const [activeTab, setActiveTab] = useState<'analytics' | 'network' | 'thermals'>('analytics');
  
  // Wave phase offset para sa sabay-sabay at smooth na paggalaw ng mga bar
  const [waveOffset, setWaveOffset] = useState<number>(0);

 // Balanced Data Animation Loop (450ms saktong bilis at suwabe lang ang galaw)
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryCount((prev) => prev + Math.floor(Math.random() * 8) + 2);
      setCpuUsage(() => Number((20 + Math.random() * 15).toFixed(1)));
      setWaveOffset((prev) => (prev + 1) % 10);
      setActiveNodesCount((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(130, Math.max(118, prev + delta));
      });
    }, 450);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full min-h-screen font-sans select-none text-slate-100 overflow-hidden relative flex flex-col justify-center">
      
      {/* CUSTOM ANIMATION PARA SA SMART LABORATORY TEXT */}
      <style>{`
        @keyframes premium-glow {
          0%, 100% { 
            text-shadow: 0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3); 
          }
          50% { 
            text-shadow: 0 0 20px rgba(255,255,255,1), 0 0 40px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4); 
          }
        }
        .animate-premium-glow {
          animation: premium-glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section className="relative w-full py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* KALIWANG BAHAGI */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 animate-in slide-in-from-left-8 fade-in duration-1000">
              
              {/* BADGE: Puti ang background, Itim ang text */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>LabTrack System Portal</span>
              </div>

              {/* TITLE */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] flex flex-col gap-2">
                <span className="text-black animate-premium-glow">
                  Smart Laboratory
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 drop-shadow-md">
                  Management & <br /> Telemetry
                </span>
              </h1>

              {/* SUBTITLE */}
              <p className="text-base sm:text-xl text-white leading-relaxed max-w-xl font-extrabold drop-shadow-md">
                The ultimate facility management solution for JRMSU. Experience real-time workstation tracking, automated hardware diagnostics, and a seamless digital environment for students and faculty.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 sm:pt-4">
                <Link
                  to="/login/admin"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs sm:text-sm transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-2.5 active:scale-95 hover:-translate-y-1"
                >
                  <span>ACCESS PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/laboratories"
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-xl rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 hover:-translate-y-1"
                >
                  <span>EXPLORE FACILITIES</span>
                </Link>
              </div>

            </div>

            {/* KANANG BAHAGI: LIVE TELEMETRY DASHBOARD PREVIEW */}
            <div className="lg:col-span-6 relative flex justify-center animate-in slide-in-from-right-8 fade-in duration-1000 delay-200 w-full">
              <div className="relative w-full max-w-lg aspect-auto sm:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-tr from-blue-700/50 via-blue-600/40 to-indigo-800/50 p-1.5 backdrop-blur-xl border border-white/20">
                
                <div className="w-full h-full bg-slate-950/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative group overflow-hidden space-y-4">
                  
                  {/* Interactive Header Bar */}
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-700/50 pb-3 gap-2 text-xs font-sans">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-[11px] sm:text-xs">LIVE TELEMETRY NODE</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/50 text-[10px]">
                      <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`px-2 py-0.5 rounded font-bold transition ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Analytics
                      </button>
                      <button 
                        onClick={() => setActiveTab('network')}
                        className={`px-2 py-0.5 rounded font-bold transition ${activeTab === 'network' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Net
                      </button>
                      <button 
                        onClick={() => setActiveTab('thermals')}
                        className={`px-2 py-0.5 rounded font-bold transition ${activeTab === 'thermals' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Temp
                      </button>
                    </div>

                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded font-bold text-[10px]">
 - SYNC ACTIVE
                    </span>
                  </div>

                  {/* Animated Bar Chart - Balanced & Saktong Bilis */}
                  <div className="my-2 space-y-2">
                    <div className="flex justify-between text-[11px] font-sans text-slate-400">
                      <span>Network Traffic Index</span>
                      <span className="text-cyan-400 font-bold">{telemetryCount.toLocaleString()} events</span>
                    </div>

                    <div className="h-28 sm:h-32 flex items-end justify-between gap-1 sm:gap-1.5 pt-2 w-full overflow-hidden">
                      {[65, 80, 45, 90, 75, 88, 92, 70, 85, 60, 95, 82, 78, 88, 94].map((baseHeight, idx) => {
                        // Dynamic height: saktong galaw gamit ang sine wave at 450ms transition
                        const dynamicHeight = Math.min(100, Math.max(15, baseHeight + Math.sin((idx + waveOffset) * 0.7) * 16));
                        return (
                          <div 
                            key={idx} 
                            className={`w-full rounded-t transition-all duration-500 ease-in-out ${
                              activeTab === 'thermals' ? 'bg-amber-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-cyan-400'
                            }`} 
                            style={{ height: `${dynamicHeight}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Overlay Badge Status */}
                  <div className="p-3 bg-slate-900/90 backdrop-blur-md rounded-xl text-slate-100 flex items-center justify-between border border-slate-700 shadow-lg font-sans text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 block uppercase">Workstation Status</span>
                      <h4 className="text-xs font-black text-white">{activeNodesCount} / 130 Nodes Active</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">CPU Load</span>
                      <span className="text-xs font-bold text-emerald-400">{cpuUsage}% Avg</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CORE SYSTEM MODULES / OUR SERVICES */}
      <section className="py-16 sm:py-24 bg-slate-950/40 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest block font-sans">
                System Modules
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-tight">
                Comprehensive Laboratory <br className="hidden sm:inline" />
                Solutions
              </h2>
            </div>

            <div className="flex flex-col items-start md:items-end gap-4 max-w-md">
              <p className="text-sm font-bold text-slate-300 leading-relaxed drop-shadow-md">
                Empowering JRMSU with state-of-the-art facility management, secure access, and real-time diagnostics for an optimized learning environment.
              </p>
              <Link
                to="/laboratories"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg hover:-translate-y-1"
              >
                <span>VIEW ALL FACILITIES</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="relative rounded-3xl overflow-hidden h-80 group border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600"
                alt="Cyber Security"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <ShieldCheck className="w-8 h-8 text-blue-400 mb-2" />
                <h3 className="text-lg font-black drop-shadow-md">Asset Security</h3>
                <p className="text-xs font-bold text-slate-300 line-clamp-2">Advanced encryption and role-based access control for all laboratory nodes.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-3xl overflow-hidden h-80 group border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600"
                alt="Digital Telemetry"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Activity className="w-8 h-8 text-cyan-400 mb-2" />
                <h3 className="text-lg font-black drop-shadow-md">Digital Telemetry</h3>
                <p className="text-xs font-bold text-slate-300 line-clamp-2">Real-time monitoring of workstation status, CPU load, and network traffic.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-3xl overflow-hidden h-80 group border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600"
                alt="AI Diagnostics"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Bot className="w-8 h-8 text-amber-400 mb-2" />
                <h3 className="text-lg font-black drop-shadow-md">AI Diagnostics</h3>
                <p className="text-xs font-bold text-slate-300 line-clamp-2">Intelligent system health alerts and automated troubleshooting assistance.</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="relative rounded-3xl overflow-hidden h-80 group border border-white/10 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600"
                alt="Hardware Maintenance"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Wrench className="w-8 h-8 text-emerald-400 mb-2" />
                <h3 className="text-lg font-black drop-shadow-md">Hardware Maintenance</h3>
                <p className="text-xs font-bold text-slate-300 line-clamp-2">Streamlined ticketing and rapid technician dispatch workflows.</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. ENTERPRISE FACILITY OPERATIONS & GOVERNANCE SECTION */}
      <section className="py-16 sm:py-24 bg-slate-900/60 border-t border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-16">
          
          {/* Institutional Metrics Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl font-mono">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Workstation Fleet</span>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400">130+ <span className="text-xs text-slate-400 font-sans font-semibold">Nodes</span></p>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans block">Across 4 Computer Labs</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Uptime</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">99.9%</p>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans block">Active Node Diagnostics</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Security Compliance</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-400">100%</p>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans block">Role Authorization</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dispatch Efficiency</span>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">&lt; 15m</p>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-sans block">Technician Alert Time</span>
            </div>
          </div>

          {/* Business SaaS Operational Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Business Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-950/80 border border-white/10 hover:border-blue-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
              <div className="p-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl w-fit">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Campus Facility Governance</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Centralized management designed for JRMSU administration. Seamlessly monitor room capacity, schedule clearances, and asset allocations in real time.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-400">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                <span>Multi-Room Infrastructure</span>
              </div>
            </div>

            {/* Business Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-950/80 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
              <div className="p-3 bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 rounded-2xl w-fit">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Institutional Access Control</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Role-based access permissions tailored for Students, Faculty Instructors, and System Administrators ensuring data privacy and lab integrity.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-cyan-400">
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                <span>Encrypted Auth Token Injection</span>
              </div>
            </div>

            {/* Business Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-950/80 border border-white/10 hover:border-emerald-500/50 transition-all duration-300 space-y-4 hover:-translate-y-1 shadow-xl">
              <div className="p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-2xl w-fit">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Audit & Compliance Reports</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Exportable historical telemetry logs, maintenance histories, and usage analytics for institutional reporting and IT resource auditing.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Automated Log Archival</span>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

export default HomePage;