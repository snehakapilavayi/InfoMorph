'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { AddSourceScreen } from '@/components/screens/AddSourceScreen';
import { PreferencesChatScreen } from '@/components/screens/PreferencesChatScreen';
import { OutputsWorkspaceScreen } from '@/components/screens/OutputsWorkspaceScreen';
import { SourcesDashboardScreen } from '@/components/screens/SourcesDashboardScreen';
import { PublishDashboardScreen } from '@/components/screens/PublishDashboardScreen';
import { ProjectsScreen } from '@/components/screens/ProjectsScreen';
import { ToastContainer } from '@/components/ToastContainer';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const { activeNav, setActiveNav } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoUser(false);
  };

  // Auth Gate: user must authenticate with Google, Email, or Demo Pass
  if (!authLoading && !user && !isDemoUser) {
    return <AuthScreen onDemoLogin={() => setIsDemoUser(true)} />;
  }

  return (
    <div className="flex w-full min-h-screen bg-[#F8FAF8] text-[#172019] overflow-hidden antialiased">
      {/* Persistent Left Sidebar with User Profile */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={setActiveNav}
        onOpenSettings={() => setShowSettings(true)}
        user={user}
        isDemoUser={isDemoUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {activeNav === 'new_chat' && <AddSourceScreen />}
        {activeNav === 'preferences' && <PreferencesChatScreen />}
        {activeNav === 'outputs' && <OutputsWorkspaceScreen />}
        {activeNav === 'sources' && <SourcesDashboardScreen />}
        {activeNav === 'publish' && <PublishDashboardScreen />}
        {activeNav === 'projects' && <ProjectsScreen />}
      </div>

      {/* Toast Feedback */}
      <ToastContainer />

      {/* System Telemetry & Audit Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
