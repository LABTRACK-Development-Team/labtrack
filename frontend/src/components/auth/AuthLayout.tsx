import React, { useState, useEffect } from 'react';
import { Monitor, ShieldCheck } from "lucide-react";

export type AuthRole = "admin" | "instructor";

interface AuthLayoutProps {
  role: AuthRole;
  children: React.ReactNode;
}

const ROLE_CONTENT = {
  admin: {
    title: "LABTRACK",
    subtitle: "Computer Laboratory Assistant & Asset Management System",
    tagline: "Monitor. Track. Manage.",
    accent: "text-blue-400",
  },
  instructor: {
    title: "LABTRACK",
    subtitle: "Faculty Portal for Lab Reservations & Student Monitoring",
    tagline: "Reserve. Monitor. Guide.",
    accent: "text-blue-400",
  },
};

const useSequentialTypewriter = (lines: string[], typeSpeed = 70, deleteSpeed = 25, pauseBetweenLines = 200, pauseAtEnd = 3000) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>(lines.map(() => ""));
  const [lineIndex, setLineIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isPaused) {
      const currentPause = (lineIndex === lines.length - 1 && !isDeleting) || (lineIndex === 0 && isDeleting) ? pauseAtEnd : pauseBetweenLines;
      timer = setTimeout(() => setIsPaused(false), currentPause);
      return () => clearTimeout(timer);
    }
    const currentFullText = lines[lineIndex];
    const currentDisplayed = displayedLines[lineIndex];
    if (!isDeleting) {
      if (currentDisplayed.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[lineIndex] = currentFullText.slice(0, currentDisplayed.length + 1);
            return next;
          });
        }, typeSpeed);
      } else {
        if (lineIndex < lines.length - 1) { setLineIndex(lineIndex + 1); setIsPaused(true); }
        else { setIsDeleting(true); setIsPaused(true); }
      }
    } else {
      if (currentDisplayed.length > 0) {
        timer = setTimeout(() => {
          setDisplayedLines(prev => {
            const next = [...prev];
            next[lineIndex] = currentFullText.slice(0, currentDisplayed.length - 1);
            return next;
          });
        }, deleteSpeed);
      } else {
        if (lineIndex > 0) { setLineIndex(lineIndex - 1); setIsPaused(true); }
        else { setIsDeleting(false); setIsPaused(true); }
      }
    }
    return () => clearTimeout(timer);
  }, [displayedLines, lineIndex, isDeleting, isPaused, lines, typeSpeed, deleteSpeed, pauseBetweenLines, pauseAtEnd]);

  return displayedLines;
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({ role, children }) => {
  const content = ROLE_CONTENT[role] || ROLE_CONTENT.admin;
  const textLines = [content.title, content.subtitle, content.tagline];
  const [typedTitle, typedSubtitle, typedTagline] = useSequentialTypewriter(textLines);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col md:flex-row relative font-sans overflow-hidden bg-slate-950">
      
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/images/sami.jpg')",
          filter: 'saturate(1.15) contrast(1.05)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-slate-950/55"></div>

      {/* LEFT SIDE (Branding) */}
      <div className="hidden md:flex md:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="text-white max-w-lg space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md">
              <Monitor className={`w-8 h-8 ${content.accent}`} />
            </div>
            <h1 className="text-3xl font-black tracking-widest drop-shadow-lg min-h-[40px]">
              {typedTitle}
              {typedTitle.length > 0 && <span className="animate-pulse text-blue-400">|</span>}
            </h1>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-white drop-shadow-md min-h-[64px]">
              {typedSubtitle}
              {typedSubtitle.length > 0 && typedSubtitle.length < content.subtitle.length && <span className="animate-pulse text-blue-400">|</span>}
            </h2>
            <p className={`text-sm font-sans tracking-[0.2em] uppercase font-bold ${content.accent} min-h-[20px]`}>
              {typedTagline}
              {typedTagline.length > 0 && typedTagline.length < content.tagline.length && <span className="animate-pulse text-blue-400">|</span>}
            </p>
          </div>
          <div className="pt-8 border-t border-white/20 flex items-center gap-2 text-white/60 text-xs font-sans">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured by JRMSU IT Infrastructure</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (Form Area) - PERFECTLY CENTERED */}
      <div className="w-full md:w-1/2 relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8 md:py-0 animate-in fade-in zoom-in-95 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
};