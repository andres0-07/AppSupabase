import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

// Limpiar tokens corruptos antes de inicializar
const SUPABASE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
try {
  const raw = localStorage.getItem(SUPABASE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    const expiresAt = parsed?.expires_at ?? 0;
    if (Date.now() / 1000 > expiresAt) {
      localStorage.removeItem(SUPABASE_KEY);
    }
  }
} catch {
  localStorage.removeItem(SUPABASE_KEY);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});