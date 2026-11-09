import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const LabTrackAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello! I am LabTrack AI Assistant. How can I assist you with JRMSU Computer Laboratory schedules, workstation maintenance, or ticket tracking?',
      time: 'Just now'
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const generateSmartResponse = (query: string): string => {
    const q = (query || '').toLowerCase();
    if (q.includes('maintenance') || q.includes('pc down') || q.includes('broken')) {
      return 'If a workstation displays an "Under Maintenance" guard screen, please select another active PC in ComLab 1 or ComLab 2, or file an issue under "Report Problem".';
    }
    if (q.includes('schedule') || q.includes('hours') || q.includes('open')) {
      return 'JRMSU Computer Laboratories are available Monday through Saturday from 7:30 AM to 6:00 PM. Check the "Schedules" tab for real-time room bookings.';
    }
    if (q.includes('wifi') || q.includes('internet') || q.includes('lan')) {
      return 'For LAN connectivity issues, check that the RJ45 network cable is plugged firmly into the workstation tower. Submit a ticket under Category: Network & Connectivity if offline.';
    }
    if (q.includes('ticket') || q.includes('request') || q.includes('status')) {
      return 'You can monitor all your pending requests in real-time under the "My Requests" tab on your sidebar.';
    }
    return 'Thank you for reaching out! For technical equipment repairs or laboratory requests, you can submit an official report directly using the "Report Problem" menu.';
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const aiReplyText = generateSmartResponse(userMsg.text);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400/40 cursor-pointer transition transform hover:scale-105 active:scale-95"
        >
          <Bot className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-extrabold tracking-wide">LabTrack AI Helper</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#1e5352] p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wide">LabTrack AI Support</h3>
                <span className="text-[9px] text-emerald-200 font-bold block">Smart Virtual Assistant</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-[#1e5352] text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[78%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#1e5352] text-white rounded-br-none font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-2xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="text-[9px] opacity-60 block text-right mt-1 font-sans">{m.time}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI about PC status, schedules..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1e5352]"
            />
            <button
              type="submit"
              className="p-2 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default LabTrackAIChatbot;
