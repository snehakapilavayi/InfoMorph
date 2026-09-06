'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-fadeIn ${
              isSuccess
                ? 'bg-white border-[#DCE7D9] text-[#192317]'
                : isWarning
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {isSuccess && (
              <CheckCircle2 className="w-4 h-4 text-[#477A3C] shrink-0 mt-0.5" />
            )}
            {isWarning && (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            {!isSuccess && !isWarning && (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.text}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
