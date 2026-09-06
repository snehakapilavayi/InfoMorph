'use client';

import React from 'react';
import { BrandLogo } from './BrandLogo';
import { NavSection } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  MessageSquare,
  FolderKanban,
  FileText,
  Share2,
  Layers,
  Settings,
  Moon,
  Sparkles,
  ShieldCheck,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

export const Sidebar: React.FC<{
  activeNav: NavSection;
  onNavigate: (section: NavSection) => void;
  onOpenSettings?: () => void;
  user?: User | null;
  isDemoUser?: boolean;
  onSignOut?: () => void;
}> = ({ activeNav, onNavigate, onOpenSettings, user, isDemoUser, onSignOut }) => {
  const { sourceCorpus, outputs, projects } = useApp();

  const navItems = [
    {
      id: 'new_chat' as NavSection,
      label: 'New Chat',
      icon: MessageSquare,
      badge: undefined,
    },
    {
      id: 'projects' as NavSection,
      label: 'Projects',
      icon: FolderKanban,
      badge: projects.length > 0 ? String(projects.length) : undefined,
    },
    {
      id: 'sources' as NavSection,
      label: 'Sources',
      icon: FileText,
      badge: sourceCorpus.length > 0 ? String(sourceCorpus.length) : undefined,
    },
    {
      id: 'outputs' as NavSection,
      label: 'Outputs',
      icon: Layers,
      badge: outputs.length > 0 ? String(outputs.length) : undefined,
    },
    {
      id: 'publish' as NavSection,
      label: 'Publish',
      icon: Share2,
      badge: outputs.filter(o => o.status === 'ready').length > 0 ? String(outputs.filter(o => o.status === 'ready').length) : undefined,
    },
  ];

  return (
    <aside
      className="w-64 bg-white border-r border-[#EBEFEA] flex flex-col justify-between shrink-0 select-none min-h-screen z-20"
      data-purpose="navigation-sidebar"
    >
      <div className="flex flex-col">
        {/* Brand Logo Header */}
        <div
          onClick={() => onNavigate('new_chat')}
          className="h-16 flex items-center px-5 gap-3 border-b border-[#F0F4EF] cursor-pointer hover:bg-[#FAFDF9] transition-colors"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            <BrandLogo size={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight tracking-tight text-[#1B2818]">
              InfoMorph
            </span>
            <span className="text-[10px] text-gray-400 tracking-wide font-medium">
              One Source. Infinite Forms.
            </span>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeNav === item.id ||
              (item.id === 'new_chat' && activeNav === 'preferences');

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-[#EBF3E8] text-[#345B2C] font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-[#F3F7F2] hover:text-gray-900 font-medium'
                }`}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#477A3C]' : 'text-gray-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-[#477A3C] text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Workspace Status & Settings */}
      <div className="p-3.5 space-y-3 border-t border-[#F0F5EE]">
        {/* User Profile Capsule */}
        <div className="bg-white p-2.5 rounded-xl border border-[#DCE7D9] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-[#477A3C]/30 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#EAF4E3] text-[#477A3C] font-bold text-xs flex items-center justify-center border border-[#8DBF67]/40 shrink-0">
                {user?.email ? user.email.charAt(0).toUpperCase() : isDemoUser ? 'D' : 'U'}
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                {user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : isDemoUser ? 'Demo User' : 'Authenticated')}
              </p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {user?.email || (isDemoUser ? 'demo@infomorph.ai' : 'Active Session')}
              </p>
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
              title="Sign Out"
              type="button"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Footer actions: settings and theme toggle */}
        <div className="flex items-center justify-between px-2 pt-0.5 text-gray-400 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-gray-500 font-medium">
              Knowledge Sync Active
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded transition cursor-pointer"
            title="Settings & Audit"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
