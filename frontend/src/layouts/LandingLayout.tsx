import React, { useState, createContext, useContext } from 'react';
import { Link, Outlet, useLocation } from "react-router-dom";
import { Cpu, Moon, Sun, Menu, X } from "lucide-react";

const ThemeContext = createContext({ isDarkMode: false, toggleTheme: () => {} });
export const useLandingTheme = () => useContext(ThemeContext);

export const LandingLayout: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Laboratories", path: "/laboratories" },
    { name: "Features", path: "/features" },
    { name: "About Us", path: "/about" },
  ];

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <div className={`min-h-screen flex flex-col font-sans relative transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        
        {/* ULTRA HD BACKGROUND LAYER */}
        <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden">
          <img 
            src="/assets/images/sven2.jpg" 
            alt="LabTrack Background" 
            className="w-full h-full object-cover object-center transition-transform duration-10000 hover:scale-105"
            style={{ 
              filter: isDarkMode 
                ? 'contrast(1.15) saturate(1.2) brightness(0.85)'
                : 'contrast(1.1) saturate(1.15) brightness(1.05)',
              imageRendering: '-webkit-optimize-contrast' 
            }}
            loading="eager"
          />
          
          {/* DYNAMIC OVERLAY */}
          {isDarkMode ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-slate-900/30 to-slate-950/80"></div>
              <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-900/60"></div>
            </>
          )}
        </div>

        {/* NAVBAR */}
        <nav className={`fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between border-b transition-all duration-700 ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/40 border-white/10'} backdrop-blur-xl shadow-2xl`}>
          
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <div className={`p-1.5 sm:p-2 rounded-xl transition-all duration-500 group-hover:rotate-[360deg] ${isDarkMode ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.8)]' : 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]'}`}>
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-sm sm:text-xl font-black tracking-widest uppercase text-white drop-shadow-md">LabTrack</span>
          </Link>

          <div className={`hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-white'}`}>
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`relative group py-1 transition-all duration-300 hover:scale-105 active:scale-95 drop-shadow-md ${location.pathname === link.path ? 'text-blue-400' : 'hover:text-blue-200'}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-400 transition-all duration-300 origin-left animate-slide-indicator ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            ))}
          </div>

          {/* NAVIGATION ACTIONS (Inadjust ang gap at sizes para magkasya sa mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button onClick={toggleTheme} className={`p-1.5 sm:p-2 rounded-full transition-all duration-500 hover:rotate-180 hover:scale-110 ${isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-white/20 text-white'}`}>
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            {/* SIGN-UP BUTTON (Ibinallik sa mobile) */}
            <Link to="/register/admin" className={`text-[10px] sm:text-xs md:text-sm font-bold px-2 sm:px-4 py-1.5 sm:py-2 border rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-90 ${isDarkMode ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-white/40 text-white hover:bg-white/20'}`}>
              Sign-up
            </Link>

            <Link to="/login/admin" className="text-[10px] sm:text-xs md:text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] px-2 sm:px-5 md:px-6 py-1.5 sm:py-2 rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 active:scale-90">
              Login
            </Link>

            {/* HAMBURGER BUTTON */}
            <button className="md:hidden p-1.5 sm:p-2 ml-0.5 text-white transition-transform active:scale-75 hover:bg-white/10 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </nav>

 {/* ====================== MOBILE SIDE DRAWER (PUTI AT NAKA-GILID) ====================== */}
        
        {/* Dark Overlay sa likod ng menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* White Side Drawer mula sa Kanan (Pinaliit ang width) */}
        <div className={`fixed top-0 right-0 h-full w-[240px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-sm font-black tracking-widest uppercase text-slate-900">LabTrack</span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                  location.pathname === link.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

        </div>

        {/* MAIN CONTENT (May padding sa taas para sa fixed navbar) */}
        <main className="flex-1 relative z-10 pt-[60px] sm:pt-[72px]">
          <div key={location.pathname} className="w-full h-full animate-in fade-in duration-300 ease-out fill-mode-both">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};