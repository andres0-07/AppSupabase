import { supabase } from '../lib/supabase';
import type { Evidence, EvidenceStatus, Profile, Task, TaskStatus } from '../types';

type TaskInsert = {
  title: string;
  description?: string | null;
  assigned_to: string;
  priority?: 'high' | 'medium' | 'low';
  due_date?: string | null;
  depends_on?: string | null;
  phase?: string | null;
  week_number?: number | null;
  task_type?: 'normal' | 'required' | 'wildcard' | 'recurring';
  is_bonus?: boolean;
  bonus_points?: number;
  recurrence_days?: number | null;
};

type TaskUpdate = Partial<TaskInsert> & { status?: TaskStatus };

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTasksForProfile(profile: Profile): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (profile.role !== 'ceo') {
    query = query.eq('assigned_to', profile.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createTask(payload: TaskInsert): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...payload, priority: payload.priority ?? 'medium', status: 'pending' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, payload: TaskUpdate): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ ...payload })
    .eq('id', taskId);
  if (error) throw error;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string, releaseChildren: boolean): Promise<void> {
  if (releaseChildren) {
    const { error: releaseError } = await supabase
      .from('tasks')
      .update({ depends_on: null })
      .eq('depends_on', taskId);
    if (releaseError) throw releaseError;
  }
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function sendCeoComment(taskId: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ ceo_comment: comment })
    .eq('id', taskId);
  if (error) throw error;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export const fetchTeamProfiles = fetchAllProfiles;

export async function fetchEvidenceForProfile(profile: Profile): Promise<Evidence[]> {
  let query = supabase
    .from('evidence')
    .select('id, task_id, file_url, file_type, uploaded_by, status, reviewer_id, review_comment, created_at')
    .order('created_at', { ascending: false });
  if (profile.role !== 'ceo') {
    query = query.eq('uploaded_by', profile.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function reviewEvidence(params: {
  evidenceId: string;
  status: EvidenceStatus;
  reviewComment?: string;
  reviewerId: string;
}): Promise<void> {
  const { evidenceId, status, reviewComment, reviewerId } = params;
  const { error } = await supabase
    .from('evidence')
    .update({ status, reviewer_id: reviewerId, review_comment: reviewComment ?? null })
    .eq('id', evidenceId);
  if (error) throw error;
}

export async function fetchProfileWithStreak(userId: string): Promise<Profile & { current_streak: number; best_streak: number }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, current_streak, best_streak')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function forceUnlockTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ unlocked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}
