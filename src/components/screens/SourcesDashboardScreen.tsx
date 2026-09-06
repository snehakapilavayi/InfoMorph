'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SourceCorpusItem } from '@/types';
import {
  Plus,
  FileText,
  CheckCircle2,
  MoreVertical,
  Layers,
  Database,
  Search,
  Trash2,
  Eye,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const SourcesDashboardScreen: React.FC = () => {
  const {
    sourceCorpus,
    activeSource,
    setActiveSource,
    addSourceToCorpus,
    sot,
    setActiveNav,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSoTModal, setShowSoTModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  const filteredCorpus = sourceCorpus.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSource = () => {
    if (!newDocName.trim() || !newDocContent.trim()) {
      addToast('Please provide a document title and content', 'warning');
      return;
    }

    addSourceToCorpus({
      name: newDocName.trim(),
      fileType: 'pdf',
      size: `${Math.round(newDocContent.length / 1024 * 10) / 10 || 1.4} MB`,
      pages: Math.max(1, Math.round(newDocContent.length / 1600)),
      isPrimary: false,
      rawText: newDocContent
    });

    setShowAddModal(false);
    setNewDocName('');
    setNewDocContent('');
  };

  const getBadgeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 shadow-2xs font-bold text-[10px]">
            PDF
          </div>
        );
      case 'docx':
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs font-bold text-[10px]">
            DOCX
          </div>
        );
      case 'csv':
        return (
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs font-bold text-[10px]">
            CSV
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-700 shadow-2xs font-bold text-[10px]">
            TXT
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAF7]">
      {/* Top Dashboard Header */}
      <header className="px-8 py-6 bg-white border-b border-[#E8EFE6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#477A3C]">
            <span>AI Content Engine</span>
            <span>•</span>
            <span className="text-gray-400 font-normal">Grounding Corpus</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172019] tracking-tight mt-1">
            Knowledge Hub &amp; Source Repository
          </h2>
        </div>

        {/* Right Status Summary Capsule */}
        <div className="flex items-center gap-3 bg-white border border-[#E3EDE0] px-4 py-2 rounded-xl shadow-xs">
          <div className="text-right">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Grounding Integrity
            </p>
            <p className="text-sm font-bold text-[#477A3C] flex items-center justify-end gap-1">
              <span>98.6%</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#477A3C]" />
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#477A3C]/10 flex items-center justify-center text-[#477A3C] font-semibold text-xs border border-[#477A3C]/20">
            IM
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-8 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connected references..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#DCE7D9] focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowSoTModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#DCE7D9] hover:bg-gray-50 text-gray-700 shadow-2xs transition"
            >
              <Database className="w-3.5 h-3.5 text-[#477A3C]" />
              <span>Inspect Source of Truth</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#477A3C] hover:bg-[#3A6331] text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Source</span>
            </button>
          </div>
        </div>

        {/* Sources Grid Container */}
        <section className="bg-white rounded-2xl border border-[#E3EDE0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F0F5EE] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#172019] tracking-tight">
                Connected Sources ({filteredCorpus.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage connected references &amp; context assets driving transformations
              </p>
            </div>
            <span className="text-xs font-mono text-[#477A3C] bg-[#EAF4E3] px-2.5 py-1 rounded-full font-semibold border border-[#8DBF67]/30">
              Corpus Active
            </span>
          </div>

          {/* Sources List */}
          <div className="p-6 space-y-3.5">
            {filteredCorpus.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No connected sources in your corpus yet. Click &quot;Add Document&quot; above to get started.
              </div>
            ) : (
              filteredCorpus.map((doc) => {
                const isSelected = activeSource?.id === doc.id;

                return (
                  <article
                    key={doc.id}
                    onClick={() => setActiveSource(doc)}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 group cursor-pointer ${
                      isSelected
                        ? 'border-[#8DBF67] bg-[#F4F9F1]/80 shadow-xs'
                        : 'border-[#E5EDE3] bg-white hover:border-[#8DBF67]/50 hover:bg-[#F9FCF8]'
                    }`}
                  >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {getBadgeIcon(doc.fileType)}

                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-[#172019] truncate group-hover:text-[#477A3C] transition-colors">
                        {doc.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-medium uppercase">{doc.fileType}</span>
                        <span className="text-gray-300">•</span>
                        <span>{doc.size}</span>
                        <span className="text-gray-300">•</span>
                        <span>{doc.pages}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-400">{doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {doc.isPrimary && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF4E3] text-[#477A3C] border border-[#8DBF67]/50">
                        Primary
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSource(doc);
                        setActiveNav('preferences');
                        addToast(`Switched active context to "${doc.name}"`, 'success');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#DCE7D9] hover:bg-[#F0F5EE] text-[#477A3C] rounded-lg transition shadow-2xs"
                    >
                      Transform
                    </button>
                  </div>
                </article>
              );
            }))}
          </div>

          {/* Sources Summary Footer */}
          <div className="px-6 py-3.5 bg-[#FBFDFB] border-t border-[#F0F5EE] flex items-center justify-between text-xs text-gray-500">
            <span>Total Grounding Corpus: {sourceCorpus.length} documents</span>
            <span className="text-[#477A3C] font-semibold">7.55 MB Allocated</span>
          </div>
        </section>
      </main>

      {/* Source of Truth Modal */}
      {showSoTModal && sot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCE7D9] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF3EC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF4E3] text-[#477A3C] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#172019]">Canonical Source of Truth (SoT)</h3>
                  <p className="text-[11px] text-gray-500">Extracted structured facts shared across all models</p>
                </div>
              </div>
              <button
                onClick={() => setShowSoTModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE7D9]">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Executive Briefing
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {sot.summary}
              </p>
            </div>

            {/* Facts */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                Extracted Fact Tuples ({sot.coreFacts.length})
              </span>
              {sot.coreFacts.map((fact) => (
                <div key={fact.factId} className="p-3 rounded-lg border border-[#E3ECE0] bg-white text-xs text-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <span>{fact.statement}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EAF4E3] text-[#477A3C] font-semibold shrink-0">
                      {fact.sourceSpans.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Verified Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {sot.criticalMetrics.map((m, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-[#DCE7D9] bg-[#FBFDFB]">
                  <div className="text-[10px] text-gray-400 truncate">{m.label}</div>
                  <div className="text-xs font-bold text-[#172019] mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EDF3EC]">
              <button
                onClick={() => setShowSoTModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#477A3C] text-white hover:bg-[#3A6331] transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCE7D9] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add New Grounding Document</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document Name</label>
              <input
                type="text"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="e.g. Q3 Strategic Operations Report.pdf"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE7D9] focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Raw Text Content</label>
              <textarea
                rows={6}
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Paste document content to tokenize and index..."
                className="w-full p-3 text-xs font-mono border border-[#DCE7D9] rounded-lg focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSource}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#477A3C] hover:bg-[#3A6331] rounded-lg shadow-sm transition"
              >
                Save to Corpus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
