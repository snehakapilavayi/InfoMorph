import { supabase, isSupabaseConfigured } from './supabase';
import {
  ProjectItem,
  SourceCorpusItem,
  OutputItem,
  SourceOfTruth,
  AuditLog
} from '@/types';

/**
 * Persist or fetch projects from Supabase.
 * Falls back gracefully if Supabase is not yet configured.
 */
export async function getProjects(): Promise<ProjectItem[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching projects from Supabase:', error.message);
    return null;
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description || '',
    primarySource: row.primary_source || '',
    outputsCount: row.outputs_count || 0,
    qualityScore: Number(row.quality_score) || 98,
    lastUpdated: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Today',
    status: row.status as 'Completed' | 'In Progress' | 'Draft'
  }));
}

export async function createProject(project: Omit<ProjectItem, 'id' | 'lastUpdated'>): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        title: project.title,
        description: project.description,
        primary_source: project.primarySource,
        outputs_count: project.outputsCount,
        quality_score: project.qualityScore,
        status: project.status
      }
    ])
    .select('id')
    .single();

  if (error) {
    console.warn('Error inserting project into Supabase:', error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * Persist source documents into Supabase
 */
export async function saveSourceDocument(source: SourceCorpusItem, projectId?: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sources')
    .insert([
      {
        project_id: projectId || null,
        name: source.name,
        file_type: source.fileType,
        size: source.size,
        pages: String(source.pages),
        is_primary: source.isPrimary,
        raw_text: source.rawText,
        spans: source.spans || []
      }
    ])
    .select('id')
    .single();

  if (error) {
    console.warn('Error saving source to Supabase:', error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * Save Source of Truth (Canonical facts & metrics)
 */
export async function saveSourceOfTruth(sourceId: string, sot: SourceOfTruth): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('source_of_truth')
    .insert([
      {
        source_id: sourceId,
        summary: sot.summary,
        core_facts: sot.coreFacts,
        entities: sot.entities,
        critical_metrics: sot.criticalMetrics
      }
    ])
    .select('id')
    .single();

  if (error) {
    console.warn('Error saving SoT to Supabase:', error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * Save generated multi-channel outputs & claims
 */
export async function saveGeneratedOutputs(
  outputs: OutputItem[],
  projectId?: string,
  sourceId?: string
): Promise<boolean> {
  if (!supabase) return false;

  try {
    for (const item of outputs) {
      const { data: outputRecord, error: outputError } = await supabase
        .from('outputs')
        .insert([
          {
            project_id: projectId || null,
            source_id: sourceId || null,
            output_type: item.outputType,
            title: item.title,
            subtitle: item.subtitle,
            content: item.content,
            quality_score: item.qualityScore,
            character_count: item.characterCount,
            grounded_percent: item.groundedPercent,
            status: item.status,
            published_at: item.publishedAt ? new Date().toISOString() : null,
            hashtags: item.hashtags || [],
            metadata: item.metadata || {}
          }
        ])
        .select('id')
        .single();

      if (outputError) {
        console.warn(`Error inserting output (${item.outputType}):`, outputError.message);
        continue;
      }

      // Save claims for this output
      if (outputRecord && item.claims && item.claims.length > 0) {
        const claimsData = item.claims.map(claim => ({
          output_id: outputRecord.id,
          claim_text: claim.claimText,
          source_span_ids: claim.sourceSpanIds,
          grounded: claim.grounded,
          contradiction_flag: claim.contradictionFlag,
          contradiction_details: claim.contradictionDetails || null
        }));

        await supabase.from('claims').insert(claimsData);
      }
    }
    return true;
  } catch (err) {
    console.warn('Exception saving outputs to Supabase:', err);
    return false;
  }
}

/**
 * Update an output's status (e.g. 'published')
 */
export async function updateSupabaseOutputStatus(
  outputId: string,
  status: 'ready' | 'published' | 'draft' | 'under_review'
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('outputs')
    .update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null
    })
    .eq('id', outputId);

  return !error;
}

/**
 * Log audit events to Supabase audit_logs table
 */
export async function logAuditEventToSupabase(log: Omit<AuditLog, 'id'>): Promise<void> {
  if (!supabase) return;
  await supabase.from('audit_logs').insert([
    {
      category: log.category,
      action: log.action,
      details: log.details,
      status: log.status
    }
  ]);
}
