'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { OutputType, OutputItem } from '@/types';
import {
  Send,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  Share2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const PublishDashboardScreen: React.FC = () => {
  const { outputs, publishOutput, publishAllOutputs } = useApp();
  const [activeTab, setActiveTab] = useState<'ready' | 'published'>('ready');

  const readyOutputs = outputs.filter(o => o.status !== 'published');
  const publishedOutputs = outputs.filter(o => o.status === 'published');
  const displayList = activeTab === 'ready' ? readyOutputs : publishedOutputs;

  const getChannelIcon = (type: OutputType) => {
    switch (type) {
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
            </svg>
          </div>
        );
      case 'youtube':
        return (
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
            </svg>
          </div>
        );
      case 'linkedin':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#0077B5] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
            </svg>
          </div>
        );
      case 'blog':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#2D3748] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path>
            </svg>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-xs">
            𝕏
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAF7]">
      {/* Dashboard Header */}
      <header className="px-8 py-6 bg-white border-b border-[#E8EFE6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#477A3C]">
            <span>Multi-Channel Distribution</span>
            <span>•</span>
            <span className="text-gray-400 font-normal">Publishing Pipeline</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172019] tracking-tight mt-1">
            Publish &amp; Broadcast Hub
          </h2>
        </div>

        {/* Right Status Capsule */}
        <div className="flex items-center gap-3 bg-white border border-[#E3EDE0] px-4 py-2 rounded-xl shadow-xs">
          <div className="text-right">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Channel Readiness
            </p>
            <p className="text-sm font-bold text-[#477A3C] flex items-center justify-end gap-1">
              <span>{outputs.length} Formats Grounded</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#477A3C]" />
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#477A3C]/10 flex items-center justify-center text-[#477A3C] font-semibold text-xs border border-[#477A3C]/20">
            IM
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-8 max-w-[1200px] w-full mx-auto space-y-6">
        <section
          className="bg-white rounded-2xl border border-[#E3EDE0] shadow-sm flex flex-col overflow-hidden"
          data-purpose="multi-channel-publishing-panel"
        >
          {/* Header & Tabs */}
          <div className="px-6 pt-5 pb-0 border-b border-[#F0F5EE]">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xl font-bold text-[#172019] tracking-tight">Publish</h3>
              <span className="text-xs bg-[#EAF4E3] text-[#477A3C] px-2.5 py-1 rounded-full font-semibold border border-[#8DBF67]/40">
                {outputs.length} Channels Configured
              </span>
            </div>

            {/* Tab Navigation */}
            <nav aria-label="Publish Tabs" className="flex gap-6 -mb-px text-sm font-medium">
              <button
                onClick={() => setActiveTab('ready')}
                className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'ready'
                    ? 'border-[#477A3C] text-[#477A3C] font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
                type="button"
              >
                <span>Ready to Publish</span>
                <span className="w-5 h-5 rounded-full bg-[#F4F9F1] text-[#477A3C] text-[11px] font-bold inline-flex items-center justify-center border border-[#8DBF67]/50">
                  {readyOutputs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('published')}
                className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'published'
                    ? 'border-[#477A3C] text-[#477A3C] font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
                type="button"
              >
                <span>Published</span>
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold inline-flex items-center justify-center">
                  {publishedOutputs.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Distribution Channels List */}
          <div className="p-6 divide-y divide-[#F1F6EF]">
            {displayList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No channels currently in this view.
              </div>
            ) : (
              displayList.map((item) => {
                const isPublished = item.status === 'published';

                return (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {getChannelIcon(item.outputType)}
                      <div>
                        <h4 className="text-sm font-semibold text-[#172019]">{item.title}</h4>
                        <span className="text-xs text-[#657361]">
                          {isPublished ? `Published ${item.publishedAt || 'Just now'}` : 'Ready to broadcast'}
                        </span>
                      </div>
                    </div>

                    {/* Status & Publish Trigger */}
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-semibold ${
                          isPublished ? 'text-[#477A3C]' : 'text-gray-400'
                        }`}
                      >
                        {isPublished ? 'Live' : 'Ready'}
                      </span>

                      {isPublished ? (
                        <span className="px-3.5 py-1.5 bg-[#EAF4E3] text-[#477A3C] rounded-lg text-xs font-semibold border border-[#8DBF67]/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => publishOutput(item.id)}
                          className="px-4 py-2 bg-[#477A3C] hover:bg-[#3A6331] text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-sm active:scale-95 cursor-pointer"
                          type="button"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* WhatsApp Channel Disclosure Notice */}
          <div className="mx-6 mb-4 p-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9] text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#477A3C] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-[#172019]">
                WhatsApp Channel Architectural Disclosure:
              </span>{' '}
              Meta's Cloud API does not support posting to WhatsApp Channels as of current documentation.
              Content generation is 100% verified and formatted; the broadcast action is simulated per architectural design.
            </div>
          </div>

          {/* Publish All Footer Action Panel */}
          {activeTab === 'ready' && readyOutputs.length > 0 && (
            <div className="mt-auto px-6 py-4 bg-[#F8FBF7] border-t border-[#F0F5EE] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#657361]">
                Queue is ready. You can trigger platforms individually or sync all at once.
              </p>
              <button
                onClick={publishAllOutputs}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#477A3C] hover:bg-[#3A6331] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                type="button"
              >
                <span>Publish to All ({readyOutputs.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
