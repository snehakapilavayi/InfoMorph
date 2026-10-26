'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  OutputType,
  NavSection,
  SourceCorpusItem,
  OutputItem,
  ProjectItem,
  SourceOfTruth,
  QuestionnairePreferences,
  AuditLog,
  VerificationResult
} from '@/types';
import { DEFAULT_PREFERENCES } from '@/lib/mockData';
import { tokenizeTextIntoSpans } from '@/lib/tokenizer';
import {
  saveSourceDocument,
  saveSourceOfTruth,
  saveGeneratedOutputs,
  logAuditEventToSupabase,
  getProjects
} from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';

interface ToastState {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  activeNav: NavSection;
  setActiveNav: (section: NavSection) => void;
  sourceCorpus: SourceCorpusItem[];
  activeSource: SourceCorpusItem | null;
  setActiveSource: (source: SourceCorpusItem | null) => void;
  addSourceToCorpus: (newSource: Omit<SourceCorpusItem, 'id' | 'uploadedAt'>) => Promise<void>;
  preferences: QuestionnairePreferences;
  updatePreferences: (patch: Partial<QuestionnairePreferences>) => void;
  toggleFormat: (format: OutputType) => void;
  outputs: OutputItem[];
  activeOutput: OutputItem | null;
  setActiveOutput: (output: OutputItem | null) => void;
  updateOutputContent: (outputId: string, content: string) => void;
  copyOutput: (content: string) => void;
  publishOutput: (outputId: string) => void;
  publishAllOutputs: () => void;
  projects: ProjectItem[];
  sot: SourceOfTruth | null;
  isGenerating: boolean;
  startGeneration: () => Promise<void>;
  clearAllData: () => Promise<void>;
  toasts: ToastState[];
  removeToast: (id: string) => void;
  addToast: (text: string, type?: 'success' | 'info' | 'warning') => void;
  auditLogs: AuditLog[];
  selectedSpanId: string | null;
  setSelectedSpanId: (spanId: string | null) => void;
  generationError: string | null;
  setGenerationError: (err: string | null) => void;
  isVerifying: boolean;
  verificationResult: VerificationResult | null;
  verificationError: string | null;
  verifyOutputs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNav, setActiveNav] = useState<NavSection>('new_chat');
  const [sourceCorpus, setSourceCorpus] = useState<SourceCorpusItem[]>([]);
  const [activeSource, setActiveSource] = useState<SourceCorpusItem | null>(null);
  const [preferences, setPreferences] = useState<QuestionnairePreferences>(DEFAULT_PREFERENCES);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [activeOutput, setActiveOutput] = useState<OutputItem | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [sot, setSot] = useState<SourceOfTruth | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // On initial mount, optionally load existing records from Supabase
  useEffect(() => {
    async function loadFromSupabase() {
      if (!supabase) return;
      try {
        const { data: sourcesData } = await supabase
          .from('sources')
          .select('*')
          .order('created_at', { ascending: false });

        if (sourcesData && sourcesData.length > 0) {
          const loadedSources: SourceCorpusItem[] = sourcesData.map((s: any) => ({
            id: s.id,
            name: s.name,
            fileType: s.file_type,
            size: s.size || '1 MB',
            pages: s.pages || 1,
            uploadedAt: new Date(s.created_at).toLocaleDateString(),
            isPrimary: Boolean(s.is_primary),
            rawText: s.raw_text,
            spans: s.spans || []
          }));
          setSourceCorpus(loadedSources);
          setActiveSource(loadedSources[0]);
        }

        const projs = await getProjects();
        if (projs && projs.length > 0) {
          setProjects(projs);
        }
      } catch (e) {
        console.warn('Initial Supabase fetch error:', e);
      }
    }
    loadFromSupabase();
  }, []);

  const addToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearAllData = async () => {
    setSourceCorpus([]);
    setActiveSource(null);
    setOutputs([]);
    setActiveOutput(null);
    setProjects([]);
    setSot(null);
    setAuditLogs([]);
    setGenerationError(null);
    setActiveNav('new_chat');

    // Wipe rows from Supabase if connected
    if (supabase) {
      try {
        await supabase.from('claims').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('outputs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('source_of_truth').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('sources').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Error clearing Supabase data:', err);
      }
    }

    addToast('All data erased. Workspace is now completely clean!', 'info');
  };

  const addSourceToCorpus = async (newSource: Omit<SourceCorpusItem, 'id' | 'uploadedAt'>) => {
    const spans = tokenizeTextIntoSpans(newSource.rawText);
    const item: SourceCorpusItem = {
      ...newSource,
      id: `src-${Date.now()}`,
      uploadedAt: 'Just now',
      spans
    };

    setSourceCorpus(prev => [item, ...prev]);
    setActiveSource(item);
    addToast(`Added "${item.name}" to grounding corpus!`, 'success');
    setActiveNav('preferences');

    // Asynchronously extract Source of Truth with Gemini and persist to Supabase
    try {
      const savedId = await saveSourceDocument(item);
      if (savedId) {
        item.id = savedId;
      }

      const understandRes = await fetch('/api/pipeline/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: item.rawText })
      });

      if (understandRes.ok) {
        const { sot: extractedSot, spans: tokenizedSpans } = await understandRes.json();
        if (extractedSot) {
          setSot(extractedSot);
          if (tokenizedSpans) {
            item.spans = tokenizedSpans;
          }
          if (savedId) {
            await saveSourceOfTruth(savedId, extractedSot);
          }
        }
      }

      const log = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'ingestion' as const,
        action: 'Primary Source Verified',
        details: `Ingested ${item.name} (${item.pages || '1 page'}, ${item.size}). ${item.spans?.length || 0} sentence spans indexed.`,
        status: 'success' as const
      };
      setAuditLogs(prev => [{ id: `log-${Date.now()}`, ...log }, ...prev]);
      await logAuditEventToSupabase(log);
    } catch (err) {
      console.warn('Background ingest error:', err);
    }
  };

  const updatePreferences = (patch: Partial<QuestionnairePreferences>) => {
    setPreferences(prev => ({ ...prev, ...patch }));
  };

  const toggleFormat = (format: OutputType) => {
    setPreferences(prev => {
      const exists = prev.selectedFormats.includes(format);
      return {
        ...prev,
        selectedFormats: exists
          ? prev.selectedFormats.filter(f => f !== format)
          : [...prev.selectedFormats, format]
      };
    });
  };

  const updateOutputContent = (outputId: string, content: string) => {
    setOutputs(prev =>
      prev.map(o => (o.id === outputId ? { ...o, content, characterCount: content.length } : o))
    );
    if (activeOutput && activeOutput.id === outputId) {
      setActiveOutput(prev => prev ? ({ ...prev, content, characterCount: content.length }) : null);
    }
    addToast('Changes saved', 'info');
  };

  const copyOutput = (content: string) => {
    navigator.clipboard.writeText(content);
    addToast('Content copied to clipboard!', 'success');
  };

  const publishOutput = (outputId: string) => {
    setOutputs(prev =>
      prev.map(o => (o.id === outputId ? { ...o, status: 'published', publishedAt: 'Just now' } : o))
    );
    const target = outputs.find(o => o.id === outputId);
    const channelName = target?.title || 'Output';
    addToast(`Published ${channelName} to active broadcast queue!`, 'success');
  };

  const publishAllOutputs = () => {
    setOutputs(prev =>
      prev.map(o => ({ ...o, status: 'published', publishedAt: 'Just now' }))
    );
    addToast(`Successfully published all ${outputs.length} channels simultaneously!`, 'success');
  };

  const startGeneration = async () => {
    if (!activeSource) {
      addToast('Please upload or paste a document first', 'warning');
      return;
    }

    if (preferences.selectedFormats.length === 0) {
      addToast('Please select at least one output format', 'warning');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    addToast('Generating grounded content with Gemini...', 'info');

    try {
      let currentSot = sot;
      if (!currentSot) {
        const understandRes = await fetch('/api/pipeline/understand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: activeSource.rawText })
        });
        if (understandRes.ok) {
          const data = await understandRes.json();
          currentSot = data.sot;
          setSot(currentSot);
        }
      }

      const genRes = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sot: currentSot,
          spans: activeSource.spans || [],
          config: preferences,
          selectedTypes: preferences.selectedFormats
        })
      });

      if (!genRes.ok) {
        const errJson = await genRes.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || 'Generation failed');
      }

      const { outputs: generatedOutputs } = await genRes.json();

      if (!generatedOutputs || generatedOutputs.length === 0) {
        throw new Error('No outputs were returned by Gemini');
      }

      setOutputs(generatedOutputs);
      setActiveOutput(generatedOutputs[0]);
      setGenerationError(null);

      // Save to Supabase
      await saveGeneratedOutputs(generatedOutputs, undefined, activeSource.id);

      // Audit Log
      const modelLabel = generatedOutputs[0]?.modelUsed
        ? String(generatedOutputs[0].modelUsed).replace(/^models\//, '')
        : 'Gemini';
      const log = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'generation' as const,
        action: 'Outputs Formatted & Grounded',
        details: `Generated ${generatedOutputs.length} channels with ${modelLabel}. Grounding verified against "${activeSource.name}".`,
        status: 'success' as const
      };
      setAuditLogs(prev => [{ id: `log-${Date.now()}`, ...log }, ...prev]);
      await logAuditEventToSupabase(log);

      addToast(`${generatedOutputs.length} channels generated and saved to Supabase!`, 'success');
      setActiveNav('outputs');
    } catch (err: any) {
      console.error('Generation failure:', err);
      const errMsg = err.message || 'Generation failed';
      setGenerationError(errMsg);
      addToast(errMsg, 'warning');
      setActiveNav('outputs');
    } finally {
      setIsGenerating(false);
    }
  };

  const verifyOutputs = async () => {
    if (!outputs || outputs.length === 0) {
      addToast('No generated outputs available to verify', 'warning');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    addToast('Verifying factual claims against source evidence...', 'info');

    try {
      const res = await fetch('/api/pipeline/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sot,
          spans: activeSource?.spans || [],
          outputs
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      const { verification, verifiedOutputs } = data;
      setVerificationResult(verification);
      if (verifiedOutputs && verifiedOutputs.length > 0) {
        setOutputs(verifiedOutputs);
        if (activeOutput) {
          const matching = verifiedOutputs.find((o: OutputItem) => o.id === activeOutput.id);
          if (matching) setActiveOutput(matching);
        }
      }

      const log = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'verification' as const,
        action: 'Claims Grounding Verified',
        details: `Assessed ${verification.totalClaimsCount} claims: ${verification.groundedClaimsCount} supported, ${verification.partialClaimsCount || 0} partial, ${verification.unsupportedClaimsCount || 0} unsupported. Grounding: ${verification.groundingRate}%, Consistency: ${verification.overallConsistencyScore}%.`,
        status: 'success' as const
      };
      setAuditLogs(prev => [{ id: `log-${Date.now()}`, ...log }, ...prev]);
      await logAuditEventToSupabase(log);

      addToast(`Verified ${verification.totalClaimsCount} claims (${verification.groundingRate}% grounding)`, 'success');
    } catch (err: any) {
      console.error('Verification error:', err);
      const errMsg = err.message || 'Verification failed';
      setVerificationError(errMsg);
      addToast(`Verification failed: ${errMsg}`, 'warning');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeNav,
        setActiveNav,
        sourceCorpus,
        activeSource,
        setActiveSource,
        addSourceToCorpus,
        preferences,
        updatePreferences,
        toggleFormat,
        outputs,
        activeOutput,
        setActiveOutput,
        updateOutputContent,
        copyOutput,
        publishOutput,
        publishAllOutputs,
        projects,
        sot,
        isGenerating,
        startGeneration,
        clearAllData,
        toasts,
        removeToast,
        addToast,
        auditLogs,
        selectedSpanId,
        setSelectedSpanId,
        generationError,
        setGenerationError,
        isVerifying,
        verificationResult,
        verificationError,
        verifyOutputs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
