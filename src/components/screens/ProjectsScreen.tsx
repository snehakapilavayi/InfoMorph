'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ProjectItem } from '@/types';
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Layers,
  CheckCircle2,
  Clock,
  Search,
  Sparkles
} from 'lucide-react';

export const ProjectsScreen: React.FC = () => {
  const { projects, setActiveNav, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProject = (p: ProjectItem) => {
    setActiveNav('outputs');
    addToast(`Loaded project "${p.title}" with ${p.outputsCount} generated outputs`, 'success');
  };

  const handleCreateProject = () => {
    if (!newTitle.trim()) return;
    addToast(`Project "${newTitle}" created! Ready to add source documents.`, 'success');
    setShowCreateModal(false);
    setActiveNav('new_chat');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAF7]">
      {/* Dashboard Header */}
      <header className="px-8 py-6 bg-white border-b border-[#E8EFE6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#477A3C]">
            <span>Workspace Management</span>
            <span>•</span>
            <span className="text-gray-400 font-normal">Active Campaigns</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172019] tracking-tight mt-1">
            Projects &amp; Context Collections
          </h2>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 bg-[#477A3C] hover:bg-[#3A6331] text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="p-8 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#DCE7D9] focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C] shadow-2xs"
          />
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-[#DCE7D9] p-8">
              <div className="w-12 h-12 rounded-xl bg-[#EAF4E3] flex items-center justify-center text-[#477A3C] mx-auto mb-3">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">No Projects Found</h3>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                Create a new project to organize multi-channel transformations and track quality scores.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#477A3C] hover:bg-[#3A6331] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
              >
                Create Project
              </button>
            </div>
          ) : (
            filteredProjects.map((p) => {
            return (
              <div
                key={p.id}
                onClick={() => handleOpenProject(p)}
                className="bg-white rounded-2xl border border-[#E3EDE0] p-5 shadow-xs hover:shadow hover:border-[#8DBF67]/60 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        p.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs font-bold text-[#477A3C] font-mono">
                      {p.qualityScore}% Quality
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#172019] group-hover:text-[#477A3C] transition-colors mb-1.5 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#627063] leading-relaxed mb-4 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F0F5EE] flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#477A3C]" />
                    <span className="font-medium text-gray-600">{p.outputsCount} Outputs</span>
                  </div>

                  <span className="flex items-center gap-1 text-[#477A3C] font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          }))}
        </div>
      </main>

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCE7D9] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Create New Project</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Q4 National Policy Dissemination"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-[#DCE7D9] focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe project objectives and target communication channels..."
                className="w-full p-2.5 text-xs border border-[#DCE7D9] rounded-lg focus:border-[#477A3C] focus:ring-1 focus:ring-[#477A3C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#477A3C] hover:bg-[#3A6331] rounded-lg shadow-sm transition"
              >
                Create Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
