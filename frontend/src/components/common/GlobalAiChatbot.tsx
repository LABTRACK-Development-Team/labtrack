import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import apiClient from "@/lib/api-client";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const AI_IMAGE = "/assets/images/123.jpg";

// CUSTOM REALISTIC ROBOT HEAD SVG
const RobotHead = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C11.4 2 11 2.4 11 3V4H8C5.8 4 4 5.8 4 8V17C4 19.2 5.8 21 8 21H16C18.2 21 20 19.2 20 17V8C20 5.8 18.2 4 16 4H13V3C13 2.4 12.6 2 12 2ZM8 10C8.8 10 9.5 10.7 9.5 11.5C9.5 12.3 8.8 13 8 13C7.2 13 6.5 12.3 6.5 11.5C6.5 10.7 7.2 10 8 10ZM16 10C16.8 10 17.5 10.7 17.5 11.5C17.5 12.3 16.8 13 16 13C15.2 13 14.5 12.3 14.5 11.5C14.5 10.7 15.2 10 16 10ZM12 15C13.7 15 15 16.3 15 18H9C9 16.3 10.3 15 12 15Z" />
    <path d="M2 10C2 9.4 2.4 9 3 9H4V15H3C2.4 15 2 14.6 2 14V10ZM20 9H21C21.6 9 22 9.4 22 10V14C22 14.6 21.6 15 21 15H20V9Z" fillOpacity="0.6" />
  </svg>
);

export default function GlobalAiChatbot() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("labtrack_user") || localStorage.getItem("labtrack_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const name = parsed.name || parsed.username || parsed.email?.split("@")[0] || "";
        setUserName(name);
      }
    } catch (e) {}
  }, []);

  const getRole = () => {
    const path = (location.pathname || "").toLowerCase();
    if (path === "/" || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/auth")) return "GUEST";
    if (path.startsWith("/admin")) return "ADMIN";
    if (path.startsWith("/instructor")) return "INSTRUCTOR";
    if (path.startsWith("/student")) return "STUDENT";
    return "GUEST";
  };
  const currentRole = getRole();

  useEffect(() => {
    if (messages.length === 0) {
      let greeting = "";
      const nameStr = userName ? ` ${userName}` : "";

      if (currentRole === "ADMIN") {
 greeting = `Hi Admin${nameStr}! I am your LabTrack AI. How can I help you manage the system today?`;
      } else if (currentRole === "INSTRUCTOR") {
 greeting = `Hi Instructor${nameStr}! I am your LabTrack AI. How can I assist you with your classes and reservations?`;
      } else if (currentRole === "STUDENT") {
 greeting = `Hi Student${nameStr}! I am your LabTrack AI. How can I help you with your schedules today?`;
      } else {
 greeting = "Hi there! Welcome to LabTrack. I am your AI Assistant. How can I help you today?";
      }
      setMessages([{ id: "init", role: "bot", text: greeting }]);
    }
  }, [currentRole, userName, messages.length]);

  useEffect(() => {
    setMessages([]); 
  }, [location.pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const payload = {
        prompt: currentInput,
        systemContext: JSON.stringify({
          role: currentRole,
          userName: userName,
          path: location.pathname,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        })
      };

      let botResponseText = "";
      try {
        const response = await apiClient.post("/api/v1/ai/chat", payload);
        botResponseText = response.data?.data?.response || "I have processed your request.";
      } catch (err) {
        botResponseText = "I'm having trouble connecting to the AI backend right now. (Check if C# and Python servers are running).";
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), role: "bot", text: botResponseText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes ai-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes ai-ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .ai-btn-float {
          animation: ai-float 3s ease-in-out infinite;
        }
        .ai-ring {
          animation: ai-ring-pulse 2s ease-out infinite;
        }
      `}</style>

      {/* DYNAMIC RESPONSIVE CONTAINER (Inangat natin sa bottom-16 para sa Student) */}
      <div 
        className={`fixed z-[9999] flex flex-col items-end gap-2 sm:gap-3 right-4 sm:right-6 ${
          currentRole === "STUDENT" ? "bottom-16 sm:bottom-6" : "bottom-6"
        }`}
      >
        
        {/* CHAT PANEL */}
        {isOpen && (
          <div
            className="w-[calc(100vw-2rem)] sm:w-[380px] max-w-[400px] h-[500px] max-h-[calc(100dvh-160px)] sm:max-h-[550px] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-600/50 relative animate-in slide-in-from-bottom-5 fade-in duration-200"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${AI_IMAGE}')` }}
            ></div>
            
            <div className="absolute inset-0 bg-slate-950/80"></div>

            <div className="relative z-10 flex flex-col h-full w-full">
              
              <div className="shrink-0 bg-slate-900/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-600/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border-2 border-cyan-400/50 shadow-lg shrink-0 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                    <RobotHead className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-sm leading-tight">LabTrack AI <Sparkles className="w-3 h-3 text-amber-400 inline" /></p>
                    <p className="text-cyan-200 text-[10px] sm:text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
 {currentRole === "GUEST" ? "Guest Mode" : `${currentRole} Mode`} System Expert
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {m.role === "bot" && (
                      <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 border border-cyan-400/40 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                        <RobotHead className="w-4 h-4 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-2xl text-[11px] sm:text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-lg"
                          : "bg-slate-800/90 backdrop-blur-md text-slate-100 border border-slate-600/50 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 border border-cyan-400/40 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
                      <RobotHead className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="bg-slate-800/90 backdrop-blur-md border border-slate-600/50 rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form 
                onSubmit={handleSend} 
                className="shrink-0 p-2 sm:p-3 bg-slate-900/90 backdrop-blur-lg border-t border-slate-600/50 flex items-center gap-1.5 sm:gap-2"
              >
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-slate-800/90 border border-slate-600/80 text-white text-[16px] sm:text-sm rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all placeholder-slate-400 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 sm:p-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline ml-1.5 text-xs">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FLOATING BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ai-btn-float bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white border-2 border-cyan-400/50"
          style={{ boxShadow: "0 10px 30px rgba(59, 130, 246, 0.5)" }}
          title="Ask LabTrack AI"
        >
          <span className="absolute inset-0 rounded-full ai-ring pointer-events-none z-10"></span>
          <RobotHead className="w-7 h-7 sm:w-9 sm:h-9 relative z-20 drop-shadow-md" />
        </button>
      </div>
    </>
  );
}
