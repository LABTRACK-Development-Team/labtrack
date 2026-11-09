import React from 'react';
import { Wrench, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export interface PCMaintenanceProps {
  workstationCode?: string;
  labName?: string;
  estimatedResolution?: string;
  maintenanceReason?: string;
  onScanAnother?: () => void;
  onGoBack?: () => void;
}

export const StudentPCMaintenanceGuard: React.FC<PCMaintenanceProps> = ({
  workstationCode = 'WS-14',
  labName = 'ComLab 1 (Networking)',
  estimatedResolution = 'Today at 4:00 PM',
  maintenanceReason = 'Hardware component diagnostic and thermal repasting in progress.',
  onScanAnother,
  onGoBack
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl text-center space-y-6 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />

        <div className="relative mx-auto w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center border border-amber-200 shadow-inner">
          <Wrench className="w-10 h-10 animate-bounce" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow">
            !
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-300 inline-block">
            Workstation Out of Service
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {workstationCode} is Under Maintenance
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            This computer station in <span className="font-bold text-slate-700">{labName}</span> is currently undergoing scheduled repairs or hardware checks.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-700">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-slate-900">Reason:</span>
              <p className="text-slate-500 font-medium">{maintenanceReason}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
            <span className="text-slate-400 font-semibold">Expected Resolution:</span>
            <span className="font-bold text-[#1e5352] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{estimatedResolution}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          {onScanAnother && (
            <button
              onClick={onScanAnother}
              className="w-full py-3 bg-[#1e5352] hover:bg-[#143c3b] text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scan / Select Different PC</span>
            </button>
          )}

          {onGoBack && (
            <button
              onClick={onGoBack}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Student Portal</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          If you require immediate lab access, please notify the duty lab technician or instructor.
        </p>

      </div>
    </div>
  );
};

export default StudentPCMaintenanceGuard;
