'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  History,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock,
  Download,
  Database,
  Layers,
  Key,
  Trash2
} from 'lucide-react';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { auditLogs, clearAllData } = useApp();

  if (!isOpen) return null;

  const handleExportAudit = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `infomorph_audit_trail_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-[#DCE7D9] rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EDF3EC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4E3] text-[#477A3C] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172019]">
                System Audit Trail &amp; Telemetry
              </h3>
              <p className="text-[11px] text-gray-500">
                Traceability and compliance logs for InfoMorph pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              Grounding
            </span>
            <div className="text-base font-bold text-[#477A3C] font-mono mt-0.5">
              98.6%
            </div>
            <span className="text-[9px] text-gray-500">Traceable</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              Consistency
            </span>
            <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
              98.0%
            </div>
            <span className="text-[9px] text-gray-500">Cross-Format</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9]">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              Latency
            </span>
            <div className="text-base font-bold text-sky-600 font-mono mt-0.5">
              &lt; 1.2s
            </div>
            <span className="text-[9px] text-gray-500">Orchestration</span>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-[#E3ECE0] bg-[#FBFDFB] text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#477A3C]" />
                  {log.action}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  {log.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-mono">
                {log.details}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#EDF3EC] flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to erase all data from the workspace and database?')) {
                clearAllData();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Erase All Data</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#DCE7D9] text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#477A3C]" />
              <span>Export Audit Trail</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#477A3C] text-white hover:bg-[#3A6331] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
