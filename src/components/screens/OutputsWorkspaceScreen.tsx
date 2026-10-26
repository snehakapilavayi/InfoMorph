'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { OutputType, OutputItem } from '@/types';
import {
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Share2,
  Sparkles,
  Layers,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Image as ImageIcon,
  Radio,
  Video,
  FileText
} from 'lucide-react';
import { PostImageCard } from '@/components/media/PostImageCard';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { VideoPlayer } from '@/components/media/VideoPlayer';

export const OutputsWorkspaceScreen: React.FC = () => {
  const {
    activeSource,
    outputs,
    failedFormats,
    retryFailedFormat,
    activeOutput,
    setActiveOutput,
    updateOutputContent,
    copyOutput,
    publishOutput,
    setActiveNav,
    generationError,
    isGenerating,
    startGeneration,
    isVerifying,
    verificationResult,
    verificationError,
    verifyOutputs
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(activeOutput?.content || '');
  const [viewMode, setViewMode] = useState<'text' | 'image' | 'audio' | 'video' | 'claims'>('text');

  // Keep edited text & default viewMode in sync when activeOutput changes
  React.useEffect(() => {
    if (activeOutput) {
      setEditedText(activeOutput.content);
      setIsEditing(false);
      if (activeOutput.mediaType === 'audio') {
        setViewMode('audio');
      } else if (activeOutput.mediaType === 'video' || activeOutput.outputType === 'youtube') {
        setViewMode('video');
      } else if (activeOutput.imageUrl && viewMode === 'video') {
        setViewMode('text');
      }
    }
  }, [activeOutput?.id]);

  if (generationError && (!activeOutput || outputs.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAF7] min-h-[calc(100vh-4rem)]">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#172019] mb-2">Generation Failed</h3>
        <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 max-w-xl mb-6 leading-relaxed font-mono">
          {generationError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => startGeneration()}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#477A3C] hover:bg-[#3A6331] disabled:opacity-50 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Retrying...' : 'Retry Generation'}</span>
          </button>
          <button
            onClick={() => setActiveNav('new_chat')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
          >
            <span>Back to Source</span>
          </button>
        </div>
      </div>
    );
  }

  if (!activeOutput || outputs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAF7] min-h-[calc(100vh-4rem)]">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF4E3] border border-[#8DBF67]/40 flex items-center justify-center text-[#477A3C] mb-4 shadow-sm">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#172019] mb-2">No Outputs Generated Yet</h3>
        <p className="text-sm text-[#657361] max-w-md mb-6 leading-relaxed">
          Upload or paste a source document and configure your preferences to generate coordinated, verified multi-channel communications.
        </p>
        <button
          onClick={() => setActiveNav('new_chat')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#477A3C] hover:bg-[#3A6331] text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start New Transformation</span>
        </button>
      </div>
    );
  }

  // Sync edited text when active output changes
  const handleSelectOutput = (output: OutputItem) => {
    setActiveOutput(output);
    setEditedText(output.content);
    setIsEditing(false);
  };

  const handlePrevOutput = () => {
    const currentIndex = outputs.findIndex(o => o.id === activeOutput.id);
    const prevIndex = (currentIndex - 1 + outputs.length) % outputs.length;
    handleSelectOutput(outputs[prevIndex]);
  };

  const handleNextOutput = () => {
    const currentIndex = outputs.findIndex(o => o.id === activeOutput.id);
    const nextIndex = (currentIndex + 1) % outputs.length;
    handleSelectOutput(outputs[nextIndex]);
  };

  const handleSaveEdit = () => {
    updateOutputContent(activeOutput.id, editedText);
    setIsEditing(false);
  };

  const getFormatIcon = (type: OutputType) => {
    switch (type) {
      case 'instagram':
        return (
          <span className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
            </svg>
          </span>
        );
      case 'youtube':
        return (
          <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
            </svg>
          </span>
        );
      case 'linkedin':
        return (
          <span className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"></path>
            </svg>
          </span>
        );
      case 'blog':
        return (
          <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </span>
        );
      case 'whatsapp':
        return (
          <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path>
            </svg>
          </span>
        );
      case 'twitter':
        return (
          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xs">
            𝕏
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#FBFBFB]">
      {/* Content Header */}
      <header
        className="bg-white border-b border-[#EBECEF] px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10"
        data-purpose="screen-header"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Outputs</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-semibold text-slate-800">
                {activeSource?.name || 'Canonical Source'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Completed
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {activeOutput.modelUsed ? activeOutput.modelUsed.replace(/^models\//, '') : 'Gemini-powered'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {verificationResult && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#477A3C]" />
              <span>
                {verificationResult.groundingRate != null
                  ? `${verificationResult.groundingRate}% Grounded`
                  : 'Assessed'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-[11px] text-emerald-700 font-normal">
                {verificationResult.groundedClaimsCount}/{verificationResult.totalClaimsCount} supported
              </span>
            </div>
          )}

          {verificationError && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Verification Unsuccessful</span>
            </div>
          )}

          <button
            onClick={() => verifyOutputs()}
            disabled={isVerifying || outputs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#8DBF67] hover:bg-[#F2F8EF] text-[#3A6331] shadow-2xs transition disabled:opacity-50 cursor-pointer"
            type="button"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : 'text-[#477A3C]'}`} />
            <span>{isVerifying ? 'Verifying Claims...' : 'Verify Claims'}</span>
          </button>

          <button
            onClick={() => setActiveNav('publish')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#477A3C] hover:bg-[#3A6331] text-white shadow-sm transition cursor-pointer"
            type="button"
          >
            <span>Go to Publish</span>
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Two Column Workspace */}
      <div className="p-8 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Generated Outputs Grid */}
        <section
          className="lg:col-span-6 flex flex-col gap-4"
          data-purpose="outputs-grid-view"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-800">Generated Outputs</h2>
            <p className="text-sm text-slate-500">
              Here are your generated outputs. Review, edit or publish them.
            </p>
          </div>

          {/* Failed Formats Retry Banner */}
          {failedFormats && failedFormats.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {failedFormats.map((failed) => (
                <div
                  key={failed.outputType}
                  className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold capitalize">{failed.outputType}</span> output failed:{' '}
                      <span className="text-amber-800">{failed.error}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => retryFailedFormat(failed.outputType)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold tracking-wide transition shadow-2xs cursor-pointer shrink-0 ml-2"
                  >
                    <RotateCcw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Retry Format</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {outputs.map((out) => {
              const isSelected = activeOutput.id === out.id;

              return (
                <article
                  key={out.id}
                  onClick={() => handleSelectOutput(out)}
                  className={`rounded-xl p-4 transition flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-[#F2F8EF]/60 border-2 border-[#477A3C] shadow-sm ring-2 ring-[#477A3C]/10'
                      : 'bg-white border-[#E9EBEF] hover:border-[#8DBF67]/60 hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFormatIcon(out.outputType)}
                        <h3 className="text-sm font-semibold text-slate-800">
                          {out.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {out.isFallback && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Fallback
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#477A3C]" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {out.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isSelected ? 'text-[#3A6331] font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Score'}
                    </span>
                    {out.qualityScore != null && !out.isFallback ? (
                      <span className="text-xs font-bold text-[#477A3C]">
                        {out.qualityScore}%
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        Not verified
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Right Column: Output Preview / Editor */}
        <section
          className="lg:col-span-6 bg-white border border-[#E9EBEF] rounded-2xl shadow-sm flex flex-col overflow-hidden"
          data-purpose="output-preview-editor"
        >
          {/* Editor Header Toolbar */}
          <div className="px-6 py-4 border-b border-[#F0F1F3] flex items-center justify-between gap-4 bg-[#FCFCFD]">
            {/* Current Format Title */}
            <div className="flex items-center gap-2.5">
              {getFormatIcon(activeOutput.outputType)}
              <span className="text-base font-bold text-slate-900">
                {activeOutput.title}
              </span>
              {activeOutput.isFallback && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  Fallback
                </span>
              )}
              {activeOutput.modelUsed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {activeOutput.modelUsed.replace(/^models\//, '')}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#477A3C] hover:bg-[#3A6331] rounded-lg shadow-sm transition"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  type="button"
                >
                  Edit
                </button>
              )}

              <button
                onClick={() => copyOutput(activeOutput.content)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#477A3C] hover:bg-[#3A6331] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                type="button"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>

              <button
                onClick={() => publishOutput(activeOutput.id)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <Send className="w-3.5 h-3.5 text-[#477A3C]" />
                <span>Publish</span>
              </button>
            </div>
          </div>

          {/* Amber Fallback Banner */}
          {activeOutput.isFallback && (
            <div className="mx-6 my-3 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Fallback Mode Active:</span>{' '}
                <span>{activeOutput.fallbackReason || 'Generated using fallback pipeline. Scores unverified.'}</span>
              </div>
            </div>
          )}

          {/* Multi-Modal Tab Navigation */}
          <div className="px-6 py-2.5 border-b border-[#F0F1F3] bg-[#FAFDF9] flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setViewMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'text'
                  ? 'bg-[#477A3C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              type="button"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Copy</span>
            </button>
            <button
              onClick={() => setViewMode('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'image'
                  ? 'bg-[#477A3C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              type="button"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Post Image</span>
            </button>
            <button
              onClick={() => setViewMode('audio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'audio'
                  ? 'bg-[#477A3C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              type="button"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Audio Briefing</span>
            </button>
            <button
              onClick={() => setViewMode('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'video'
                  ? 'bg-[#477A3C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              type="button"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Studio</span>
            </button>
            <button
              onClick={() => setViewMode('claims')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'claims'
                  ? 'bg-[#477A3C] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
              type="button"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Claims &amp; Grounding ({activeOutput.claims?.length || 0})</span>
            </button>
          </div>

          {/* Conditional Multi-Modal Renderers */}
          {viewMode === 'claims' && (
            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Contradiction Warnings if present */}
              {verificationResult?.contradictions && verificationResult.contradictions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Cross-Output Inconsistencies Detected ({verificationResult.contradictions.length})
                  </h4>
                  {verificationResult.contradictions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-950 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900">{c.topic}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            c.severity === 'high'
                              ? 'bg-rose-200 text-rose-800'
                              : c.severity === 'medium'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {c.severity} Severity
                        </span>
                      </div>
                      <p className="text-rose-900/90 leading-relaxed">{c.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 bg-white/80 rounded-lg border border-rose-200/60">
                          <span className="font-bold uppercase text-[9px] text-gray-500 block">
                            {c.outputA.type}
                          </span>
                          <span className="italic">"{c.outputA.text}"</span>
                        </div>
                        <div className="p-2 bg-white/80 rounded-lg border border-rose-200/60">
                          <span className="font-bold uppercase text-[9px] text-gray-500 block">
                            {c.outputB.type}
                          </span>
                          <span className="italic">"{c.outputB.text}"</span>
                        </div>
                      </div>
                      <div className="text-[11px] bg-white/90 p-2 rounded-lg border border-rose-200/80 font-medium text-emerald-900">
                        <span className="font-bold text-emerald-700">Recommended Fix: </span>
                        {c.suggestedFix}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Channel Stats Overview */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9] text-center">
                  <span className="text-[10px] uppercase font-semibold text-gray-500 block">Total Claims</span>
                  <span className="text-base font-bold text-gray-800 font-mono">
                    {activeOutput.claims?.length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-semibold text-emerald-800 block">Supported</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {activeOutput.claims?.filter(c => c.status === 'supported').length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-semibold text-amber-800 block">Partial</span>
                  <span className="text-base font-bold text-amber-700 font-mono">
                    {activeOutput.claims?.filter(c => c.status === 'partial').length || 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-center">
                  <span className="text-[10px] uppercase font-semibold text-rose-800 block">Unsupported</span>
                  <span className="text-base font-bold text-rose-700 font-mono">
                    {activeOutput.claims?.filter(c => c.status === 'unsupported').length || 0}
                  </span>
                </div>
              </div>

              {/* Claims List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Assessed Factual Statements ({activeOutput.claims?.length || 0})
                  </h4>
                  {activeOutput.groundedPercent != null ? (
                    <span className="text-[#477A3C] font-mono font-bold text-xs">
                      {activeOutput.groundedPercent}% Grounded
                    </span>
                  ) : (
                    <button
                      onClick={() => verifyOutputs()}
                      disabled={isVerifying}
                      className="text-[11px] text-[#477A3C] font-semibold hover:underline cursor-pointer"
                    >
                      Run Grounding Verification
                    </button>
                  )}
                </div>

                {(!activeOutput.claims || activeOutput.claims.length === 0) ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No individual claims registered for this output.
                  </p>
                ) : (
                  activeOutput.claims.map((claim, idx) => (
                    <div
                      key={claim.id || idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                        claim.status === 'supported'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : claim.status === 'partial'
                          ? 'border-amber-200 bg-amber-50/30'
                          : claim.status === 'unsupported'
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 leading-snug">
                          "{claim.claimText}"
                        </p>
                        <div>
                          {claim.status === 'supported' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Supported
                            </span>
                          ) : claim.status === 'partial' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <AlertTriangle className="w-3 h-3 text-amber-700" /> Partial Support
                            </span>
                          ) : claim.status === 'unsupported' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <AlertCircle className="w-3 h-3 text-rose-700" /> Unsupported
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              <ShieldAlert className="w-3 h-3 text-slate-400" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cited Spans */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Cited Evidence:</span>
                        {claim.sourceSpanIds && claim.sourceSpanIds.length > 0 ? (
                          claim.sourceSpanIds.map((sid) => (
                            <span
                              key={sid}
                              className="inline-block px-1.5 py-0.2 bg-white border border-[#DCE7D9] rounded font-mono text-[10px] text-[#477A3C] font-semibold"
                            >
                              {sid}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] italic text-rose-600 font-medium">None cited</span>
                        )}
                      </div>

                      {/* Model Grounding Explanation */}
                      {claim.explanation && (
                        <p className="text-[11px] text-gray-700 bg-white/80 p-2 rounded-lg border border-gray-100 leading-relaxed font-sans">
                          <span className="font-semibold text-gray-900">Verdict: </span>
                          {claim.explanation}
                        </p>
                      )}

                      {/* Source Ambiguity Notice */}
                      {claim.sourceAmbiguity && (
                        <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Source Ambiguity: The source contains conflicting figures on this point.</span>
                        </div>
                      )}

                      {/* Suggested Correction */}
                      {claim.suggestedCorrection && (
                        <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                          <span className="font-bold text-emerald-800">Suggested Correction: </span>
                          {claim.suggestedCorrection}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {viewMode === 'image' && (
            <div className="p-6">
              <PostImageCard
                imageUrl={activeOutput.imageUrl}
                title={activeOutput.title}
              />
            </div>
          )}

          {viewMode === 'audio' && (
            <div className="p-6">
              <AudioPlayer
                title={activeOutput.title}
                narrationText={activeOutput.content}
                duration={activeOutput.audioDuration}
              />
            </div>
          )}

          {viewMode === 'video' && (
            <div className="p-6">
              <VideoPlayer
                title={activeOutput.title}
                storyboard={activeOutput.storyboard}
                duration={activeOutput.videoDuration}
                imageUrl={activeOutput.imageUrl}
              />
            </div>
          )}

          {viewMode === 'text' && (
            <div className="relative p-6 sm:p-8 flex items-center justify-between min-h-[380px]">
              {/* Left Arrow Navigation */}
              <button
                onClick={handlePrevOutput}
                aria-label="Previous output"
                className="shrink-0 -ml-2 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Main Content Formatted Display */}
              <div
                className="flex-1 px-4 sm:px-6 max-w-xl text-slate-800 space-y-4"
                data-purpose="post-content-container"
              >
                {/* Optional mini image banner preview */}
                {activeOutput.imageUrl && (
                  <div className="w-full h-36 rounded-xl overflow-hidden border border-[#DCE7D9] shadow-2xs mb-4">
                    <img
                      src={activeOutput.imageUrl}
                      alt={activeOutput.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {isEditing ? (
                  <textarea
                    rows={12}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-3 text-sm text-slate-800 border border-[#DCE7D9] rounded-xl focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C] font-mono leading-relaxed"
                  />
                ) : (
                  <div className="space-y-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-sans">
                    {activeOutput.content}
                  </div>
                )}
              </div>

              {/* Right Arrow Navigation */}
              <button
                onClick={handleNextOutput}
                aria-label="Next output"
                className="shrink-0 -mr-2 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                type="button"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Editor Footer Metadata */}
          <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#F0F1F3] flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Characters: {activeOutput.characterCount}
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-[#477A3C]">
              {activeOutput.groundedPercent != null && !activeOutput.isFallback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#477A3C]" />
                  <span>{activeOutput.groundedPercent}% Grounded</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 font-medium">Not verified</span>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
