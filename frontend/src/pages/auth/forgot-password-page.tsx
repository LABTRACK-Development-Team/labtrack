import React, { useState } from 'react';
import { Link, useParams } from "react-router-dom";
import { Mail, ArrowLeft, Send, Loader2, ExternalLink } from "lucide-react";
import { AuthLayout, AuthRole } from "../../components/auth/AuthLayout";

export const ForgotPasswordPage: React.FC = () => {
  const { role = "admin" } = useParams<{ role: string }>();
  const authRole = (role.toLowerCase() as AuthRole) || "admin";

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      
      // OPEN REAL GMAIL COMPOSE WINDOW
      const supportEmail = "support@jrmsu.edu.ph";
      const subject = encodeURIComponent(`Password Reset Request: ${email}`);
      const body = encodeURIComponent(`Hello AdminDek Support,\n\nI forgot my password for the LabTrack System.\n\nRegistered Email: ${email}\nRole: ${authRole}\n\nPlease send me a password reset link.\n\nThank you!`);
      
      // Using Gmail's official compose URL
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${subject}&body=${body}`, '_blank');
      
    }, 2000);
  };

  if (isSent) {
    return (
      <AuthLayout role={authRole}>
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10 text-center border border-white/50 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-10 h-10 text-blue-600 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Gmail Opened</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            A Gmail compose window has been opened for you. Please click <strong>Send</strong> in Gmail to complete your password reset request.
          </p>
          <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-200 mb-6 font-medium text-left">
            <strong>Note:</strong> If the Gmail window didn't open automatically, please allow pop-ups for this site.
          </div>
          <Link to={`/login/${authRole}`} className="inline-flex items-center gap-2 font-bold text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout role={authRole}>
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-10 w-full border border-white/50 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">Forgot Password?</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Enter your Gmail address to request a secure password reset link from the IT Support.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Gmail Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="yourname@gmail.com" 
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" 
                required 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening Gmail...
              </>
            ) : (
              <>
                Request Reset via Gmail
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <Link to={`/login/${authRole}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
export default ForgotPasswordPage;