import { supabase } from '../lib/supabase';
import type { Announcement, FinanceComment, PhaseBudget, Task } from '../types';

// ─── COMENTARIOS CONTABLES ───────────────────────────────────────────────────

export async function fetchFinanceComments(taskId: string): Promise<FinanceComment[]> {
  const { data, error } = await supabase
    .from('finance_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFinanceComment(params: {
  taskId: string;
  authorId: string;
  comment: string;
  amount?: number | null;
}): Promise<void> {
  const { error } = await supabase
    .from('finance_comments')
    .insert({
      task_id:   params.taskId,
      author_id: params.authorId,
      comment:   params.comment,
      amount:    params.amount ?? null,
    });
  if (error) throw error;
}

export async function deleteFinanceComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('finance_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// ─── CANDADO CONTABLE ────────────────────────────────────────────────────────

export async function setFinanceLock(taskId: string, locked: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      finance_locked:      locked,
      finance_approved_at: locked ? null : new Date().toISOString(),
      updated_at:          new Date().toISOString(),
    })
    .eq('id', taskId);
  if (error) throw error;
}

export async function setFinanceComment(taskId: string, comment: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ finance_comment: comment, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function setRequiresInvoice(taskId: string, requires: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ requires_invoice: requires, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function setSpentAmount(taskId: string, amount: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ spent_amount: amount, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

// ─── PRESUPUESTOS POR FASE ───────────────────────────────────────────────────

export async function fetchPhaseBudgets(): Promise<PhaseBudget[]> {
  const { data, error } = await supabase
    .from('phase_budgets')
    .select('*')
    .order('phase', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertPhaseBudget(phase: string, budget: number): Promise<void> {
  const { error } = await supabase
    .from('phase_budgets')
    .upsert({ phase, budget, updated_at: new Date().toISOString() }, { onConflict: 'phase' });
  if (error) throw error;
}

// ─── AVISOS GENERALES ────────────────────────────────────────────────────────

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addAnnouncement(params: {
  authorId: string;
  message: string;
  expiresAt?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .insert({
      author_id:  params.authorId,
      message:    params.message,
      expires_at: params.expiresAt ?? null,
    });
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}