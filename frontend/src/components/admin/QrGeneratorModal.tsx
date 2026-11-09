import React, { useState } from 'react';
import { X, Printer, QrCode, Sparkles } from 'lucide-react';

interface QrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campuses?: Array<{ id: string; name: string }>;
}

export const QrGeneratorModal: React.FC<QrGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [lab, setLab] = useState('ComLab 1 (ICT)');
  const [count, setCount] = useState(6);

  if (!isOpen) return null;

  const generatedNodes = Array.from({ length: count }, (_, i) => `PC-${String(i + 1).padStart(3, '0')}`);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-2xl max-w-3xl w-full space-y-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Batch Official JRMSU QR Poster Printer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Target Laboratory</label>
            <select value={lab} onChange={(e) => setLab(e.target.value)} className="w-full border p-2.5 rounded-xl outline-none font-bold">
              <option value="ComLab 1 (ICT)">ComLab 1 (ICT)</option>
              <option value="ComLab 2 (Multimedia)">ComLab 2 (Multimedia)</option>
              <option value="ComLab 3 (Engineering)">ComLab 3 (Engineering)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-1">Number of Cards to Batch Print</label>
            <input type="number" min="1" max="24" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} className="w-full border p-2.5 rounded-xl font-sans text-xs outline-none" />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-4 bg-slate-100 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
          {generatedNodes.map(node => {
            const baseUrl = 'http://192.168.43.165:3000';
            const url = `${baseUrl}/student?lab=${encodeURIComponent(lab.trim())}&capacity=${count}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            return (
              <div key={node} className="bg-[#0b2545] text-white p-4 rounded-2xl border-2 border-blue-900 flex flex-col items-center text-center space-y-2">
                <span className="text-[9px] font-extrabold uppercase text-amber-400">Jose Rizal Memorial State University</span>
                <strong className="text-xs font-black uppercase tracking-wider">SCAN HERE</strong>
                <div className="bg-white p-1.5 rounded-xl">
                  <img src={qrSrc} alt={node} className="w-24 h-24 object-contain" />
                </div>
                <div className="bg-white/90 text-[#0b2545] font-extrabold text-[10px] py-1 px-2 rounded-lg w-full">
                  JRMSU LabTrack Access  -  {node}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 border text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer">Close</button>
          <button onClick={() => window.print()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-2 cursor-pointer">
            <Printer className="w-4 h-4" /> Print All ({count} Posters)
          </button>
        </div>

      </div>
    </div>
  );
};
