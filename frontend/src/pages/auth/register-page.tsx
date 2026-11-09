import React, { useState } from 'react';
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, User, Mail, MapPin, Key, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { AuthLayout, AuthRole } from "../../components/auth/AuthLayout";
import apiClient from '@/lib/api-client';


export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { role = "admin" } = useParams<{ role: string }>();
  const authRole = (role.toLowerCase() as AuthRole) || "admin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const campus = "Dapitan Main Campus";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password) return setError("Please create a password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (pin.length !== 6) return setError("Security PIN must be exactly 6 digits.");

    setIsLoading(true);

    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || name || "User";
      const lastName = parts.slice(1).join(" ") || "Account";
      const roleMap: Record<string, string> = { admin: "ADMIN_TECHNICIAN", instructor: "INSTRUCTOR", student: "STUDENT" };
      const backendRole = roleMap[authRole.toLowerCase()] || "STUDENT";
      await apiClient.post("/api/v1/auth/register", {
        email, password, firstName, lastName,
        role: backendRole,
        pin: pin,
        campus: campus,
        schoolId: campus || "N/A"
      });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => navigate(`/login/${authRole}`), 2600);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout role={authRole}>
      {/* SUCCESS MODAL — Refined Text */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
          <div className="relative bg-slate-900 border border-slate-700/60 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 w-full max-w-md">
            
            {/* Animated checkmark */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/25 animate-ping"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-full">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4L19 6" className="animate-draw" strokeDasharray="100" strokeDashoffset="100" />
                </svg>
              </div>
            </div>

            {/* Title & subtitle */}
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              You're All Set!
            </h2>
            <p className="text-sm text-slate-400 mb-7 leading-relaxed max-w-sm">
              Your LabTrack account has been created successfully.
              Sign in anytime with your email and 6-digit PIN.
            </p>

            {/* Campus card */}
            <div className="w-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/80 rounded-2xl px-6 py-5 mb-7">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300/90 uppercase tracking-[0.2em]">
                  Your Campus
                </span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-2">
                {campus}
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-emerald-300/90 tracking-wide">
                  Where your LabTrack journey begins
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-2.5">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-progress rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold animate-pulse">
                Taking you to sign in...
              </p>
            </div>

            <style>{`
              @keyframes dash { to { stroke-dashoffset: 0; } }
              .animate-draw { animation: dash 0.8s ease-in-out 0.2s forwards; }
              @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
              .animate-progress { animation: progress 2.6s linear forwards; }
            `}</style>
          </div>
        </div>
      )}

      {/* PREMIUM SLOW-MO TRANSITION WRAPPER */}
      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-12 duration-700 ease-out fill-mode-both relative">
        
        {/* BACK BUTTON */}
        <Link to="/" className="fixed top-6 left-6 p-3 bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 z-[999] shadow-lg hover:-translate-x-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 w-full max-w-lg border border-white/50">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Create Account</h2>
            <p className="text-xs text-slate-500 mt-1">Register as {authRole} with your security PIN</p>
          </div>
          
          {error && (
            <div className="mb-3 bg-rose-50 text-rose-600 p-2.5 rounded-lg text-xs font-bold text-center border border-rose-200 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-2.5 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-2 sm:top-3" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Santos" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-[11px] sm:text-sm rounded-xl pl-9 sm:pl-11 pr-3 py-1.5 sm:py-2.5 outline-none focus:border-blue-500 transition-all font-medium" required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-2 sm:top-3" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@jrmsu.edu.ph" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-[11px] sm:text-sm rounded-xl pl-9 sm:pl-11 pr-3 py-1.5 sm:py-2.5 outline-none focus:border-blue-500 transition-all font-medium" required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-2 sm:top-3" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Create your password" 
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-[11px] sm:text-sm rounded-xl pl-9 sm:pl-11 pr-9 sm:pr-10 py-1.5 sm:py-2.5 outline-none focus:border-blue-500 transition-all font-medium tracking-wide" 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 sm:top-3 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-2 sm:top-3" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Re-type password" 
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-[11px] sm:text-sm rounded-xl pl-9 sm:pl-11 pr-9 sm:pr-10 py-1.5 sm:py-2.5 outline-none focus:border-blue-500 transition-all font-medium tracking-wide" 
                    required 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2 sm:top-3 text-slate-400 hover:text-slate-600">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-700 uppercase mb-1">6-Digit Security PIN</label>
              <div className="relative">
                <Key className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-3.5 top-2 sm:top-3" />
                <input 
                  type="password" 
                  maxLength={6} 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                  placeholder="••••••" 
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-[11px] sm:text-sm rounded-xl pl-9 sm:pl-11 pr-3 py-1.5 sm:py-2.5 outline-none focus:border-blue-500 font-sans tracking-widest transition-all" 
                  required 
                  minLength={6}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">You will use this PIN to log in.</p>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-[11px] sm:text-sm disabled:opacity-70 mt-2">
              {isLoading ? "Registering..." : "Register Account"}
            </button>
          </form>
          <div className="mt-3 sm:mt-6 pt-3 sm:pt-5 border-t border-slate-200 text-center text-[10px] sm:text-sm text-slate-500">
            Already have an account? <Link to={`/login/${authRole}`} className="font-bold text-blue-600 hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;