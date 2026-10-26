'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Upload,
  Paperclip,
  ExternalLink,
  ArrowRight,
  FileText,
  ClipboardPaste,
  Link2,
  Sparkles,
  CheckCircle2,
  User
} from 'lucide-react';

export const AddSourceScreen: React.FC = () => {
  const { addSourceToCorpus, setActiveNav, addToast } = useApp();
  const [inputText, setInputText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitText = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      addToast('Please enter text or upload a document to proceed', 'warning');
      return;
    }

    // Check if the user pasted a single public URL
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      setIsUploading(true);
      addToast('Fetching and extracting clean webpage content...', 'info');
      try {
        const res = await fetch('/api/url/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to extract content from URL');
        }
        await addSourceToCorpus({
          name: data.title ? `${data.title.substring(0, 45)}...` : trimmed.replace(/^https?:\/\//, '').substring(0, 30),
          fileType: 'url',
          size: `${Math.round((data.text.length / 1024) * 10) / 10 || 0.4} KB`,
          pages: `${Math.max(1, Math.round(data.wordCount / 300))} pages`,
          isPrimary: true,
          rawText: data.text
        });
        setInputText('');
        addToast(`Successfully extracted ${data.wordCount} words from webpage`, 'success');
      } catch (err: any) {
        addToast(err.message || 'Failed to extract URL', 'warning');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    await addSourceToCorpus({
      name: 'Custom Document Source.txt',
      fileType: 'txt',
      size: `${Math.round(trimmed.length / 1024 * 10) / 10 || 0.4} KB`,
      pages: `${Math.max(1, Math.round(trimmed.length / 1800))} pages`,
      isPrimary: true,
      rawText: trimmed
    });
    setInputText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : ext === 'csv' ? 'csv' : 'txt';

    if (fileType === 'pdf') {
      setIsUploading(true);
      addToast('Extracting text from PDF via parser...', 'info');
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/pdf/extract', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error('Failed to extract PDF text');
        }

        const data = await res.json();
        if (!data.text || !data.text.trim()) {
          throw new Error('No text could be parsed from this PDF');
        }

        await addSourceToCorpus({
          name: file.name,
          fileType: 'pdf',
          size: `${Math.round(file.size / 1024 / 1024 * 10) / 10 || 1.2} MB`,
          pages: data.numPages || 1,
          isPrimary: true,
          rawText: data.text
        });
      } catch (err: any) {
        console.error('PDF upload error:', err);
        addToast(err.message || 'Failed to parse PDF', 'warning');
      } finally {
        setIsUploading(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = (event.target?.result as string) || '';
        if (!content.trim()) {
          addToast('Uploaded file is empty', 'warning');
          return;
        }
        await addSourceToCorpus({
          name: file.name,
          fileType,
          size: `${Math.round(file.size / 1024 / 1024 * 10) / 10 || 0.5} MB`,
          pages: Math.max(1, Math.round(content.length / 1800)),
          isPrimary: true,
          rawText: content
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSelectExample = (exampleName: string) => {
    let rawText = '';
    if (exampleName === 'AI in Education Report') {
      rawText = `AI IN HIGHER EDUCATION: 2026 BENCHMARK REPORT
Artificial intelligence-assisted learning frameworks have reached 1,240 universities across 42 countries.
Pilot programs demonstrate a 34% reduction in course dropouts and a 28% improvement in graduation velocity.
Key risks identified include syllabus drift and unequal institutional resource allocation.`;
    } else if (exampleName === 'Cybersecurity Advisory') {
      rawText = `NTRO CYBERSECURITY ADVISORY — REF: NTRO/CERT/2026/ADV-049
A critical zero-day vulnerability (CVE-2026-1104, CVSS 9.8) has been identified in memory paging of Linux Kernel versions 6.1 through 6.8.
Exploit vector permits remote unauthenticated ring-0 execution via crafted TCP packets targeting power grid and rail SCADA telemetry.
Mandatory emergency patching required within 48 hours via patch v6.8.9-hotfix1 or net.core.bpf_jit_enable=0.`;
    } else if (exampleName === 'Startup Pitch Deck') {
      rawText = `PULSE METRICS — SERIES A INVESTMENT MEMORANDUM
Pulse is an autonomous data observability engine serving 48 enterprise customers with $4.2M ARR.
Growing 24% month-over-month with 114% net revenue retention.
Seeking $12M Series A to accelerate generative query synthesis and edge agent deployment.`;
    } else {
      rawText = `GLOBAL FINTECH & DIGITAL PAYMENTS MARKET REPORT 2026
Cross-border instant settlement networks expanded by 41% year-over-year.
Regulatory interoperability standards between central bank digital currencies (CBDCs) adopted by 18 central banks.`;
    }

    setInputText(rawText);
    addToast(`Sample "${exampleName}" inserted into prompt box. Press the green arrow to start!`, 'info');
  };

  const handleAddLink = async () => {
    const trimmed = linkUrl.trim();
    if (!trimmed) return;
    setIsUploading(true);
    addToast('Extracting clean article content from URL...', 'info');
    try {
      const res = await fetch('/api/url/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract content from URL');
      }
      await addSourceToCorpus({
        name: data.title ? `${data.title.substring(0, 45)}...` : trimmed.replace(/^https?:\/\//, '').substring(0, 30),
        fileType: 'url',
        size: `${Math.round((data.text.length / 1024) * 10) / 10 || 0.4} KB`,
        pages: `${Math.max(1, Math.round(data.wordCount / 300))} pages`,
        isPrimary: true,
        rawText: data.text
      });
      setShowLinkModal(false);
      setLinkUrl('');
      addToast(`Successfully ingested web resource (${data.wordCount} words)`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to process URL', 'warning');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FCFDFB] min-h-[calc(100vh-4rem)]">
      {/* Top Header Navigation Bar */}
      <header
        className="h-16 flex items-center justify-between px-8 border-b border-[#EBEFEA] bg-white"
        data-purpose="top-header"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#477A3C]">
            Source Ingestion
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-500 font-medium">Stage 1 of 4</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="User profile"
            className="w-9 h-9 rounded-full border border-[#DCE7D9] bg-white flex items-center justify-center text-gray-600 hover:text-[#172019] hover:border-[#477A3C] transition shadow-xs"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Center Hero Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl text-center">
          {/* Heading Section */}
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl sm:text-[28px] font-bold text-[#172019] tracking-tight">
              Add Your Source
            </h2>
            <p className="text-xs sm:text-sm text-[#627063]">
              Upload a file, paste text, or add a link to get started.
            </p>
          </div>

          {/* Prompt Box / Input Container */}
          <div
            className="bg-white border border-[#DCE7D9] rounded-2xl p-4 shadow-sm text-left transition hover:border-[#CADAC5]"
            data-purpose="main-input-card"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full border-none resize-none p-0 text-sm text-[#172019] placeholder-[#9AAB9B] bg-transparent focus:ring-0 leading-relaxed"
              placeholder="Message InfoMorph or add your source text..."
              rows={3}
            />

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt,.csv"
            />

            {/* Bottom Controls within the Input Container */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#ECF2EB]">
              <div className="flex items-center gap-2">
                {/* Attach Clip Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#172019] hover:bg-[#F8FAF7] transition"
                  type="button"
                  title="Upload Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Quick Upload File Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#172019] bg-[#F0F5EE] rounded-md hover:bg-[#E3EDE0] transition"
                  type="button"
                >
                  <Upload className="w-3.5 h-3.5 text-[#477A3C]" />
                  <span>Upload File</span>
                </button>

                {/* External Link Action */}
                <button
                  onClick={() => setShowLinkModal(true)}
                  aria-label="Open Link source"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#172019] hover:bg-[#F8FAF7] transition"
                  type="button"
                  title="Add URL Source"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSubmitText}
                aria-label="Submit prompt"
                className="w-7 h-7 rounded-full bg-[#477A3C] hover:bg-[#3A6331] text-white flex items-center justify-center transition shadow-sm active:scale-95 cursor-pointer"
                type="button"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Source Options: 3 Cards Row */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4"
            data-purpose="quick-source-options"
          >
            {/* Option 1: Upload File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group bg-white border border-[#DCE7D9] hover:border-[#477A3C]/60 rounded-xl p-3 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-start gap-2.5 cursor-pointer hover:bg-[#FAFDF9] disabled:opacity-60"
              type="button"
            >
              <div className="mt-0.5 text-[#477A3C] group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#172019] leading-tight">
                  {isUploading ? 'Parsing File...' : 'Upload File'}
                </p>
                <p className="text-[10px] text-[#627063] mt-0.5">
                  PDF, DOCX, TXT, CSV
                </p>
              </div>
            </button>

            {/* Option 2: Paste Text */}
            <button
              onClick={() => {
                setInputText(
                  `AI in Education Report:\nArtificial intelligence is accelerating personalized curriculum adoption across 1,200 institutions in 42 countries, delivering a 34% increase in student retention in STEM fields.`
                );
                addToast('Sample text inserted into prompt box', 'info');
              }}
              className="group bg-white border border-[#DCE7D9] hover:border-[#477A3C]/60 rounded-xl p-3 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-start gap-2.5 cursor-pointer hover:bg-[#FAFDF9]"
              type="button"
            >
              <div className="mt-0.5 text-[#477A3C] group-hover:scale-105 transition-transform">
                <ClipboardPaste className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#172019] leading-tight">
                  Paste Text
                </p>
                <p className="text-[10px] text-[#627063] mt-0.5">
                  Add text directly
                </p>
              </div>
            </button>

            {/* Option 3: Add Link */}
            <button
              onClick={() => setShowLinkModal(true)}
              className="group bg-white border border-[#DCE7D9] hover:border-[#477A3C]/60 rounded-xl p-3 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-start gap-2.5 cursor-pointer hover:bg-[#FAFDF9]"
              type="button"
            >
              <div className="mt-0.5 text-[#477A3C] group-hover:scale-105 transition-transform">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#172019] leading-tight">
                  Add Link
                </p>
                <p className="text-[10px] text-[#627063] mt-0.5">
                  Add a URL link
                </p>
              </div>
            </button>
          </div>

          {/* Bottom Examples Section */}
          <div className="mt-10" data-purpose="example-prompts-section">
            <span className="text-[11px] text-[#627063] block mb-3 font-normal">
              Try with an example
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                'AI in Education Report',
                'Cybersecurity Advisory',
                'Startup Pitch Deck',
                'Market Research'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSelectExample(example)}
                  className="px-3.5 py-1.5 text-xs font-normal text-[#172019] bg-white border border-[#DCE7D9] rounded-lg hover:border-[#477A3C] hover:text-[#477A3C] hover:bg-[#F8FAF7] transition cursor-pointer shadow-2xs"
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Link Ingestion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCE7D9] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#EAF4E3] text-[#477A3C] flex items-center justify-center">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add Web Resource URL</h3>
                <p className="text-xs text-gray-500">InfoMorph will fetch and index the page content</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">URL Link</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.org/reports/cybersecurity-brief"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#DCE7D9] focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#477A3C] hover:bg-[#3A6331] rounded-lg shadow-sm transition"
              >
                Index URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
