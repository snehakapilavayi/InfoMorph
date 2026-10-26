'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { OutputType } from '@/types';
import {
  ArrowLeft,
  FileText,
  Check,
  CheckCheck,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export const PreferencesChatScreen: React.FC = () => {
  const {
    activeSource,
    preferences,
    updatePreferences,
    toggleFormat,
    startGeneration,
    isGenerating,
    setActiveNav
  } = useApp();

  const AUDIENCES = ['Technical', 'General', 'Entrepreneurship'];
  const TONES = [
    'Professional',
    'Bold & Punchy',
    'Storytelling',
    'Witty',
    'Inspirational',
    'Contrarian',
    'Informative',
    'Conversational',
    'Educational'
  ];
  const HOOK_STYLES = ['Question', 'Statistic', 'Story', 'Myth-busting'];
  const LANGUAGES = ['English (US)', 'English (UK)', 'Spanish', 'French', 'German'];
  const OUTPUT_TYPES = ['Post', 'Audio', 'Video'];
  const OBJECTIVES = ['Inform', 'Educate', 'Engage', 'Summarize'];

  const FORMATS: {
    id: OutputType;
    label: string;
    iconElement: React.ReactNode;
  }[] = [
    {
      id: 'instagram',
      label: 'Instagram Post',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] flex items-center justify-center shrink-0">
          <svg className="w-2.5 h-2.5 text-white stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect height="20" rx="5" ry="5" width="20" x="2" y="2"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
          </svg>
        </div>
      )
    },
    {
      id: 'youtube',
      label: 'YouTube Post',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-[#FF0000] flex items-center justify-center shrink-0">
          <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
            <polygon points="9.5,7.5 16.5,12 9.5,16.5"></polygon>
          </svg>
        </div>
      )
    },
    {
      id: 'linkedin',
      label: 'LinkedIn Post',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-[#0A66C2] flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-white leading-none">in</span>
        </div>
      )
    },
    {
      id: 'blog',
      label: 'Blog / Article',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-gray-100 border border-gray-300 flex items-center justify-center shrink-0 text-gray-600">
          <svg className="w-2.5 h-2.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
      )
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Channel',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-[#25D366] flex items-center justify-center shrink-0 text-white">
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path>
          </svg>
        </div>
      )
    },
    {
      id: 'twitter',
      label: 'Twitter Post',
      iconElement: (
        <div className="w-4 h-4 rounded-[4px] bg-black flex items-center justify-center shrink-0 text-white">
          <span className="text-[9px] font-black leading-none">𝕏</span>
        </div>
      )
    },
  ];

  if (!activeSource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAF8] min-h-[calc(100vh-4rem)]">
        <div className="w-16 h-16 rounded-2xl bg-[#EAF4E3] border border-[#8DBF67]/40 flex items-center justify-center text-[#477A3C] mb-4 shadow-sm">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#172019] mb-2">No Source Document Selected</h3>
        <p className="text-sm text-[#657361] max-w-md mb-6 leading-relaxed">
          Please upload a document or paste content in New Chat first so InfoMorph can analyze and extract the canonical Source of Truth.
        </p>
        <button
          onClick={() => setActiveNav('new_chat')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#477A3C] hover:bg-[#3A6331] text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Add Source</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAF8]">
      {/* Top Header Navigation */}
      <header
        className="h-16 bg-white border-b border-[#EBEFEA] flex items-center justify-between px-8 shrink-0 z-10"
        data-purpose="chat-header"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('new_chat')}
            aria-label="Go back"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-[#182317]">New Chat</h1>
            <p className="text-[10px] text-gray-400">Tailor Preferences & Target Formats</p>
          </div>
        </div>

        {/* Top Right User Avatar */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full bg-[#477A3C] text-white flex items-center justify-center font-bold text-xs shadow-xs"
            data-purpose="user-badge"
          >
            S
          </div>
        </div>
      </header>

      {/* Scrollable Chat Stream / Question Canvas */}
      <main
        className="flex-1 overflow-y-auto px-6 py-6 md:px-12 md:py-8 space-y-6"
        data-purpose="chat-stream"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Message: Source Uploaded Card (Aligned Right) */}
          <div className="flex flex-col items-end" data-purpose="user-message-wrapper">
            <div className="bg-white border border-[#DCE7D9] rounded-xl px-4 py-3 shadow-xs flex items-center gap-3.5 max-w-sm">
              {/* Red PDF Icon */}
              <div className="w-9 h-10 bg-[#FFECEC] text-[#E03131] border border-[#FFD5D5] rounded-md flex flex-col items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
                <span className="text-[8px] font-bold mt-0.5 tracking-tighter uppercase">
                  {activeSource.fileType}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-900 leading-snug">
                  {activeSource.name}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {activeSource.fileType.toUpperCase()} • {activeSource.size} • {activeSource.pages}
                </span>
              </div>
            </div>

            {/* Timestamp & status ticks */}
            <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400 mr-1">
              <span>10:30 AM</span>
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>

          {/* AI Assistant Intro Message (Aligned Left) */}
          <div className="flex items-start gap-3.5 max-w-2xl" data-purpose="ai-response-wrapper">
            {/* InfoMorph AI Badge Icon */}
            <div className="w-7 h-7 rounded-full bg-[#477A3C] flex items-center justify-center shrink-0 mt-0.5 shadow-xs text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <div className="bg-white border border-[#DCE7D9] rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs text-xs text-gray-700 leading-relaxed font-medium">
                <p className="font-normal text-[13px] leading-relaxed text-[#2D392B]">
                  Great! I&apos;ve received your source.<br />
                  To tailor the content perfectly for you, could you please help me with a few details?
                </p>
              </div>
              <div className="text-[10px] text-gray-400 ml-1">10:30 AM</div>
            </div>
          </div>

          {/* Preference Questionnaire Container Card */}
          <div
            className="ml-10 bg-white border border-[#DCE7D9] rounded-2xl p-6 shadow-xs space-y-6"
            data-purpose="preference-form-container"
          >
            {/* Grid for 4 Columns Questionnaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Question 1: Audience */}
              <div className="space-y-2.5" data-purpose="question-column-audience">
                <label className="block text-xs font-semibold text-gray-800">
                  Who is your audience?
                </label>
                <div className="space-y-1.5 flex flex-col">
                  {AUDIENCES.map((aud) => {
                    const isSelected = preferences.audience === aud;
                    return (
                      <button
                        key={aud}
                        onClick={() => updatePreferences({ audience: aud })}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#8DBF67] bg-[#F2F8EE] text-[#2E5824] font-medium shadow-xs'
                            : 'border-[#E3ECE0] bg-white text-gray-700 font-normal hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        {aud}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Tone */}
              <div className="space-y-2.5" data-purpose="question-column-tone">
                <label className="block text-xs font-semibold text-gray-800">
                  What tone do you prefer?
                </label>
                <div className="space-y-1.5 flex flex-col">
                  {TONES.map((t) => {
                    const isSelected = preferences.tone === t;
                    return (
                      <button
                        key={t}
                        onClick={() => updatePreferences({ tone: t })}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#8DBF67] bg-[#F2F8EE] text-[#2E5824] font-medium shadow-xs'
                            : 'border-[#E3ECE0] bg-white text-gray-700 font-normal hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 3 & 4: Language & Output Type */}
              <div className="space-y-4" data-purpose="question-column-language-type">
                {/* Language Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-800">
                    What language should I use?
                  </label>
                  <div className="relative">
                    <select
                      value={preferences.language}
                      onChange={(e) => updatePreferences({ language: e.target.value })}
                      className="w-full text-xs font-normal border border-[#DCE7D9] rounded-lg px-3 py-2 appearance-none bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#477A3C] focus:border-[#477A3C] cursor-pointer pr-8"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Output Type Chips */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-800">
                    Output type
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {OUTPUT_TYPES.map((cat) => {
                      const isSelected = preferences.outputCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => updatePreferences({ outputCategory: cat })}
                          className={`text-center py-1.5 px-2 text-xs rounded-lg border transition-all ${
                            isSelected
                              ? 'border-[#8DBF67] bg-[#F2F8EE] text-[#2E5824] font-medium'
                              : 'border-[#E3ECE0] bg-white text-gray-600 font-normal hover:bg-gray-50'
                          }`}
                          type="button"
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Question 5: Objective */}
              <div className="space-y-2.5" data-purpose="question-column-objective">
                <label className="block text-xs font-semibold text-gray-800">
                  What is your objective?
                </label>
                <div className="space-y-1.5 flex flex-col">
                  {OBJECTIVES.map((obj) => {
                    const isSelected = preferences.objective === obj;
                    return (
                      <button
                        key={obj}
                        onClick={() => updatePreferences({ objective: obj })}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#8DBF67] bg-[#F2F8EE] text-[#2E5824] font-medium shadow-xs'
                            : 'border-[#E3ECE0] bg-white text-gray-700 font-normal hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        {obj}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hook Style and Voice Sample Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#EDF3EC]">
              {/* Hook Style Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-800">
                  Opening Hook Style
                </label>
                <p className="text-[11px] text-gray-500">
                  Choose how content opens across communication channels.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {HOOK_STYLES.map((hs) => {
                    const isSelected = preferences.hookStyle === hs;
                    return (
                      <button
                        key={hs}
                        onClick={() => updatePreferences({ hookStyle: hs })}
                        className={`text-left px-3 py-2 text-xs rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#8DBF67] bg-[#F2F8EE] text-[#2E5824] font-semibold shadow-xs'
                            : 'border-[#E3ECE0] bg-white text-gray-700 font-normal hover:bg-gray-50'
                        }`}
                        type="button"
                      >
                        {hs}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voice Sample Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-800">
                  Writing Voice Sample (optional)
                </label>
                <p className="text-[11px] text-gray-500">
                  Paste a sample of your writing. InfoMorph will adapt its pacing without copying facts.
                </p>
                <textarea
                  value={preferences.voiceSample || ''}
                  onChange={(e) => updatePreferences({ voiceSample: e.target.value })}
                  placeholder="Paste 1-2 paragraphs of your writing here..."
                  rows={3}
                  className="w-full text-xs p-3 border border-[#DCE7D9] rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#477A3C] focus:border-[#477A3C] font-mono leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#EDF3EC]"></div>

            {/* Question 6: Output Formats with Brand Badges */}
            <div className="space-y-3" data-purpose="output-formats-selection">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-800">
                  What output formats would you like? ({preferences.selectedFormats.length} selected)
                </label>
                <button
                  onClick={() => {
                    const allIds = FORMATS.map(f => f.id);
                    updatePreferences({
                      selectedFormats:
                        preferences.selectedFormats.length === allIds.length ? [] : allIds
                    });
                  }}
                  className="text-[11px] font-medium text-[#477A3C] hover:underline"
                >
                  {preferences.selectedFormats.length === FORMATS.length
                    ? 'Deselect All'
                    : 'Select All 6'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {FORMATS.map((fmt) => {
                  const isChecked = preferences.selectedFormats.includes(fmt.id);

                  return (
                    <label
                      key={fmt.id}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFormat(fmt.id);
                      }}
                      className={`relative flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#8DBF67] bg-[#F2F8EE]/60'
                          : 'border-[#DCE7D9] bg-white hover:border-[#8DBF67]'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-1">
                        {fmt.iconElement}
                        <span className="text-[11px] font-medium text-gray-700 truncate">
                          {fmt.label}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#477A3C] border-[#D0DED0] rounded focus:ring-[#477A3C] shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Primary CTA: Generate Content Button (Bottom Right) */}
          <div className="flex justify-end pt-2 pb-6" data-purpose="primary-action-wrapper">
            <button
              onClick={startGeneration}
              disabled={isGenerating || preferences.selectedFormats.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#477A3C] hover:bg-[#3C6932] active:bg-[#345B2C] text-white font-semibold text-xs tracking-wide rounded-lg shadow-sm hover:shadow transition-all group disabled:opacity-50 cursor-pointer"
              type="button"
            >
              <span>{isGenerating ? 'Generating Content...' : 'Generate Content'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
