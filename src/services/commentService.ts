import { supabase } from '../lib/supabase';

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  comment: string;
  is_support: boolean;
  created_at?: string;
  author_name?: string;
}

export async function fetchCommentsForTask(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addTaskComment(params: {
  taskId: string;
  authorId: string;
  comment: string;
  isSupport?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('task_comments')
    .insert({
      task_id:    params.taskId,
      author_id:  params.authorId,
      comment:    params.comment,
      is_support: params.isSupport ?? false,
    });
  if (error) throw error;
}

export async function fetchAllTasksWithTeam(): Promise<any[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}