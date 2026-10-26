'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  Database,
  Key,
  Trash2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ServiceStatus {
  configured: boolean;
  required: boolean;
  description: string;
  verified?: boolean;
}

interface HealthData {
  status: string;
  services: {
    gemini: ServiceStatus;
    supabase: ServiceStatus;
    youtube: ServiceStatus;
    openai: ServiceStatus;
  };
}

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { auditLogs, clearAllData } = useApp();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingHealth(true);
      fetch('/api/health')
        .then(res => res.json())
        .then(data => setHealth(data))
        .catch(err => console.warn('Failed to fetch health status:', err))
        .finally(() => setIsLoadingHealth(false));
    }
  }, [isOpen]);

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
                System Configuration &amp; Audit Trail
              </h3>
              <p className="text-[11px] text-gray-500">
                API credentials status, service health, and audit logs
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

        {/* API Services Configuration Status */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#477A3C]" />
              Server API Integrations
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Configured via .env.local
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Gemini */}
            <div className="p-2.5 rounded-xl border border-[#DCE7D9] bg-[#F8FAF7] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">Gemini Flash</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">Required</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Content extraction &amp; claim verification</p>
              </div>
              <div className="flex items-center">
                {health?.services.gemini.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#477A3C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertCircle className="w-3 h-3" /> Missing
                  </span>
                )}
              </div>
            </div>

            {/* Supabase */}
            <div className="p-2.5 rounded-xl border border-[#DCE7D9] bg-[#F8FAF7] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">Supabase</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">Required</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Projects &amp; telemetry persistence</p>
              </div>
              <div className="flex items-center">
                {health?.services.supabase.verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#477A3C] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : health?.services.supabase.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <AlertCircle className="w-3 h-3" /> Missing
                  </span>
                )}
              </div>
            </div>

            {/* YouTube */}
            <div className="p-2.5 rounded-xl border border-[#DCE7D9] bg-[#F8FAF7] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">YouTube</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">Optional</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Video upload automation</p>
              </div>
              <div className="flex items-center">
                {health?.services.youtube.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </div>
            </div>

            {/* OpenAI */}
            <div className="p-2.5 rounded-xl border border-[#DCE7D9] bg-[#F8FAF7] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-800">OpenAI</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">Optional</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Cross-model evaluation</p>
              </div>
              <div className="flex items-center">
                {health?.services.openai.configured ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Optional
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/50 flex items-start gap-2 text-[10px] text-emerald-900 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-[#477A3C] shrink-0 mt-0.5" />
            <span>
              All API keys are securely stored server-side in your local <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-emerald-200">.env.local</code> file and never sent over the wire or exposed in client bundles.
            </span>
          </div>
        </div>

        {/* Audit Log Title */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Recent System Events ({auditLogs.length})
          </span>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 min-h-[140px]">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No audit events logged yet. Ingest documents or generate outputs to record telemetry.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl border border-[#E3ECE0] bg-[#FBFDFB] text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#477A3C]" />
                    {log.action}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed font-mono">
                  {log.details}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EDF3EC] flex items-center justify-between mt-2">
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
