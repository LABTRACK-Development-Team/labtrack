import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, User, Key, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout, AuthRole } from "../../components/auth/AuthLayout";
import apiClient from "@/lib/api-client";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { role = "admin" } = useParams<{ role: string }>();
  const authRole = (role.toLowerCase() as AuthRole) || "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => pinInputRef.current?.focus(), 350);
    }
  }, [step]);

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 550);
      return () => clearTimeout(t);
    }
  }, [shake]);

  const extractError = (err: any): string => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Connection error. Please try again.";
    if (data.error?.message) return data.error.message;
    if (data.message) return data.message;
    return err?.response?.status === 401 ? "Invalid credentials." : "Login failed.";
  };

  const extractAuthData = (response: any) => {
    const root = response?.data || {};
    const inner = root.data || root;
    const token = inner.accessToken || inner.token || root.accessToken || root.token || "";
    const user = inner.user || root.user || (inner.email ? inner : null);
    return { token, user };
  };

  const getDashboard = (roleName: string): string => {
    const r = String(roleName || "").toLowerCase().trim();
    if (r === "admin" || r === "administrator" || r === "admin_technician") return "/admin";
    if (r === "instructor" || r === "teacher") return "/instructor";
    if (r === "technician" || r === "lab_technician") return "/technician";
    if (r === "student" || r === "learner") return "/student";
    return "/admin";
  };

  const persistToken = (tok: string, usr: any) => {
    if (tok) {
      sessionStorage.setItem("labtrack_token", tok);
      localStorage.setItem("labtrack_token", tok);
    }
    if (usr) {
      sessionStorage.setItem("labtrack_user", JSON.stringify(usr));
      localStorage.setItem("labtrack_user", JSON.stringify(usr));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await apiClient.post("/api/v1/auth/login", {
        usernameOrEmail: email.trim().toLowerCase(),
        password,
        rememberMe: false,
      });
      const { token, user } = extractAuthData(response);
      if (!user) { setError("Invalid response from server."); return; }

      // ROLE ISOLATION
      const userRole = String(user.role || '').toLowerCase().trim();
      const expectedRole = authRole.toLowerCase().trim();
      const isAdminRole = userRole === 'admin' || userRole === 'administrator' || userRole === 'admin_technician';
      const isInstructorRole = userRole === 'instructor' || userRole === 'teacher';
      const isStudentRole = userRole === 'student' || userRole === 'learner';
      let roleMatches = false;
      if (expectedRole === 'admin') roleMatches = isAdminRole;
      else if (expectedRole === 'instructor') roleMatches = isInstructorRole;
      else if (expectedRole === 'student') roleMatches = isStudentRole;
      else roleMatches = (userRole === expectedRole);
      
      if (!roleMatches) {
        const portalName = expectedRole === 'admin' ? 'Administrator' : 
                           expectedRole === 'instructor' ? 'Instructor' : 
                           expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1);
        setError(`This account is not a ${portalName}. You cannot log in here.`);
        setShake(true);
        return;
      }

      setLoggedInUser(user);
      setAccessToken(token || "");

      if (token) {
        sessionStorage.setItem("labtrack_token", token);
        localStorage.setItem("labtrack_token", token);
      }
      sessionStorage.setItem("labtrack_user", JSON.stringify(user));
      localStorage.setItem("labtrack_user", JSON.stringify(user));

      setTimeout(() => setStep(2), 300);
    } catch (err: any) {
      setError(extractError(err));
      setShake(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // STRICT: requires exactly 6 digits
    if (pin.length !== 6) {
      setError("PIN must be exactly 6 digits.");
      setShake(true);
      return;
    }
    
    setError("");
    setIsLoading(true);

    const go = (tok: string, usr: any) => {
      persistToken(tok, usr);
      setSuccess(true);
      const path = getDashboard(usr?.role || "admin");
      setTimeout(() => { window.location.href = path; }, 850);
    };

    try {
      const response = await apiClient.post("/api/v1/auth/verify-pin", {
        usernameOrEmail: email.trim().toLowerCase(),
        pin,
      });
      
      const { token, user } = extractAuthData(response);
      go(token || accessToken, user || loggedInUser);
      
    } catch (err: any) {
      const status = err?.response?.status;
      
      if (status === 401 || status === 400) {
        setError("Invalid PIN. Please try again.");
        setShake(true);
        setPin(""); // Auto-clear on wrong PIN
      } else {
        setError("PIN verification failed. Please try again.");
        setShake(true);
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout role={authRole}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-7px); }
          20%, 40%, 60%, 80% { transform: translateX(7px); }
        }
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-glow {
          0%, 100% { box-shadow: 0 0 24px rgba(52,211,153,0.5), 0 0 0 0 rgba(52,211,153,0.4); }
          50% { box-shadow: 0 0 40px rgba(52,211,153,0.9), 0 0 0 12px rgba(52,211,153,0); }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes btn-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.4); }
          50% { box-shadow: 0 0 32px rgba(37,99,235,0.7); }
        }
        @keyframes pin-focus-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.35); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0.08); }
        }
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes border-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-shake { animation: shake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
        .animate-pop-in { animation: pop-in 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-success-glow { animation: success-glow 1.1s ease-in-out infinite; }
        .animate-btn-glow { animation: btn-glow 2s ease-in-out infinite; }
        .animate-float-bounce { animation: float-bounce 2s ease-in-out infinite; }
        .animate-pin-focus { animation: pin-focus-glow 2s ease-in-out infinite; }
        .animate-ambient-pulse { animation: ambient-pulse 4s ease-in-out infinite; }
        .animate-border-shimmer {
          background-size: 200% 200%;
          animation: border-shimmer 4s ease-in-out infinite;
        }
        .btn-ripple { position: relative; overflow: hidden; }
        .btn-ripple::after {
          content: ''; position: absolute; top: 50%; left: 50%;
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(255,255,255,0.4);
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
        }
        .btn-ripple:active::after { animation: ripple 0.6s ease-out; }
        
        /* SECURE PIN INPUT — block copy/paste, no autofill */
        input.secure-pin {
          -webkit-text-security: disc !important;
          -moz-text-security: disc !important;
          text-security: disc !important;
          user-select: none;
        }
        input.secure-pin::-webkit-outer-spin-button,
        input.secure-pin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-[0.97] slide-in-from-bottom-12 duration-700 ease-out fill-mode-both relative">

        <Link to="/" className="fixed top-6 left-6 p-3 bg-slate-900/50 hover:bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-full text-white transition-all duration-300 z-[999] shadow-lg hover:-translate-x-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {step === 1 ? (
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 w-full max-w-md border border-white/50">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Welcome!</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in to your {authRole} account</p>
            </div>

            {error && (
              <div className={`mb-4 bg-rose-50 text-rose-600 p-2.5 rounded-lg text-[11px] font-bold text-center border border-rose-200 flex items-center justify-center gap-2 ${shake ? 'animate-shake' : 'animate-in fade-in slide-in-from-top-2 duration-300'}`}>
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Email</label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-blue-500 transition-colors" />
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@jrmsu.edu.ph" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 pl-9 py-2 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all duration-300" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Password</label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-blue-500 transition-colors" />
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 pl-9 pr-9 py-2 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all duration-300" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to={`/forgot-password/${authRole}`} className="text-[10px] font-bold text-blue-600 hover:underline">Forgot Password?</Link>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn-ripple w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Next"}
              </button>
            </form>
            <div className="mt-5 text-center text-[11px] text-slate-500">
              No account? <Link to={`/register/${authRole}`} className="font-bold text-blue-600 hover:underline">Create Account</Link>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-right-8 duration-500">

            <div
              className={`
                absolute -inset-3 rounded-[32px] blur-2xl pointer-events-none
                transition-all duration-700 animate-ambient-pulse
                ${success
                  ? 'bg-gradient-to-br from-emerald-500/35 via-teal-400/30 to-emerald-500/35'
                  : 'bg-gradient-to-br from-blue-500/25 via-cyan-400/20 to-blue-500/25'}
              `}
            />

            <div
              className={`
                relative rounded-3xl overflow-hidden backdrop-blur-2xl
                bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/95
                border transition-all duration-500
                ${success
                  ? 'border-emerald-400/40 animate-success-glow'
                  : 'border-white/10'}
                ${shake ? 'animate-shake' : ''}
              `}
            >

              <div
                className={`
                  absolute inset-0 rounded-3xl p-px pointer-events-none animate-border-shimmer
                  ${success
                    ? 'bg-gradient-to-br from-emerald-400/50 via-teal-400/30 to-emerald-400/50'
                    : 'bg-gradient-to-br from-blue-400/40 via-cyan-400/25 to-blue-400/40'}
                `}
              >
                <div className={`w-full h-full rounded-3xl transition-colors duration-500 ${success ? 'bg-slate-950/85' : 'bg-slate-950/80'}`} />
              </div>

              <div
                className={`
                  absolute top-0 left-1/2 -translate-x-1/2 w-56 h-[2px] rounded-full
                  transition-all duration-500
                  ${success
                    ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-blue-400 to-transparent'}
                `}
              />

              <div
                className={`
                  absolute top-0 left-0 w-20 h-20 rounded-tl-3xl pointer-events-none
                  border-t-2 border-l-2 transition-colors duration-500
                  ${success ? 'border-emerald-400/50' : 'border-blue-400/40'}
                `}
              />
              <div
                className={`
                  absolute top-0 right-0 w-20 h-20 rounded-tr-3xl pointer-events-none
                  border-t-2 border-r-2 transition-colors duration-500
                  ${success ? 'border-emerald-400/50' : 'border-blue-400/40'}
                `}
              />

              <div
                className={`
                  absolute bottom-0 left-0 w-16 h-16 rounded-bl-3xl pointer-events-none
                  border-b border-l transition-colors duration-500
                  ${success ? 'border-teal-400/25' : 'border-cyan-400/20'}
                `}
              />
              <div
                className={`
                  absolute bottom-0 right-0 w-16 h-16 rounded-br-3xl pointer-events-none
                  border-b border-r transition-colors duration-500
                  ${success ? 'border-teal-400/25' : 'border-cyan-400/20'}
                `}
              />

              <div className="absolute inset-0 rounded-3xl pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_55%)]" />
              <div className="absolute inset-0 rounded-3xl pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />

              <div className="relative p-6 text-center">

                <div
                  className={`
                    w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border mb-4 shadow-lg
                    transition-all duration-500 relative
                    ${success
                      ? 'bg-emerald-500/30 border-emerald-400/60 shadow-emerald-500/40'
                      : 'bg-blue-600/20 border-blue-500/50 animate-float-bounce'}
                  `}
                >
                  {success
                    ? <CheckCircle2 className="w-7 h-7 text-emerald-300 animate-pop-in" />
                    : <ShieldCheck className="w-7 h-7 text-blue-400" />
                  }
                </div>

                <h2 className={`text-lg font-black mb-1 transition-colors duration-300 ${success ? 'text-emerald-300' : 'text-white'}`}>
                  {success ? "Verified!" : "Enter Security PIN"}
                </h2>
                <p className="text-[10px] text-slate-400 mb-5 transition-colors duration-300">
                  {success ? "Redirecting to dashboard..." : `Security verification for ${loggedInUser?.email || ''}`}
                </p>

                {error && (
                  <div className={`mb-4 bg-rose-500/20 text-rose-300 p-2 rounded-lg text-xs font-bold border border-rose-500/30 ${shake ? 'animate-shake' : 'animate-in fade-in slide-in-from-top-2 duration-300'}`}>
                    {error}
                  </div>
                )}

                <form onSubmit={handlePinSubmit} className="space-y-5">
                  <div className="relative group">
                    <Key className="w-5 h-5 text-slate-500 absolute left-3.5 top-3 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      ref={pinInputRef}
                      type="password"
                      maxLength={6}
                      autoComplete="off"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={pin}
                      onChange={(e) => {
                        // Only digits, max 6
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPin(val);
                        setError("");
                      }}
                      onPaste={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      disabled={isLoading || success}
                      className={`
                        secure-pin
                        w-full bg-slate-950/50 border text-white text-center text-xl tracking-[0.8em] font-sans rounded-2xl pl-10 pr-2 py-3 outline-none
                        transition-all duration-300
                        ${success
                          ? 'border-emerald-400/60 bg-emerald-950/30'
                          : pin.length === 6
                            ? 'border-blue-500/50 bg-blue-950/20'
                            : 'border-slate-700 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] animate-pin-focus'}
                        disabled:opacity-60
                      `}
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || success || pin.length !== 6}
                    className={`
                      btn-ripple w-full font-black py-3 rounded-2xl text-sm
                      transition-all duration-300
                      flex items-center justify-center gap-2
                      ${success
                        ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)] cursor-default'
                        : isLoading
                          ? 'bg-blue-500/70 text-white cursor-wait'
                          : pin.length === 6
                            ? 'bg-blue-600 hover:bg-blue-500 text-white animate-btn-glow hover:-translate-y-0.5 active:scale-[0.96] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)]'
                            : 'bg-blue-600/40 text-slate-300 cursor-not-allowed'}
                    `}
                  >
                    {success ? (
                      <><CheckCircle2 className="w-4 h-4 animate-pop-in" /> Success</>
                    ) : isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                    ) : (
                      "ENTER"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setPin(""); setError(""); }}
                    disabled={isLoading || success}
                    className="text-[10px] font-bold text-slate-400 hover:text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    Back to Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default LoginPage;