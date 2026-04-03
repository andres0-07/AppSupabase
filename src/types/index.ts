export type UserRole = 'ceo' | 'hardware' | 'software' | 'legal' | 'medical';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'pending_validation' | 'completed' | 'rejected';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskType = 'normal' | 'required' | 'wildcard' | 'recurring';
export type EvidenceStatus = 'pending' | 'approved' | 'rejected';
export type EvidenceFileType = 'image' | 'video' | 'pdf' | 'document';
export type PaymentStatus = 'pendiente' | 'pagado' | 'cancelado';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  current_streak?: number;
  best_streak?: number;
  last_streak_week?: number | null;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType;
  is_bonus: boolean;
  bonus_points: number;
  recurrence_days: number | null;
  due_date: string | null;
  depends_on: string | null;
  ceo_comment: string | null;
  last_evidence: string | null;
  unlocked_at: string | null;
  phase: string | null;
  week_number: number | null;
  created_at?: string;
  updated_at?: string;
  assignee?: Pick<Profile, 'id' | 'full_name' | 'role'>;
}

export interface Evidence {
  id: string;
  task_id: string;
  file_url: string;
  file_type: EvidenceFileType;
  uploaded_by: string;
  status: EvidenceStatus;
  reviewer_id?: string | null;
  review_comment?: string | null;
  created_at?: string;
  uploader?: Pick<Profile, 'id' | 'full_name' | 'role'>;
}

export interface BiometricLog {
  id: string;
  raw_data: Record<string, unknown>;
  timestamp: string;
}

export interface Event {
  id: string;
  nombre_evento: string;
  fecha_evento: string;
  fecha_inscripcion: string | null;
  costo: number | null;
  status_pago: PaymentStatus;
  documento_url: string | null;
  created_by: string | null;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  comment: string | null;
  created_at?: string;
}
