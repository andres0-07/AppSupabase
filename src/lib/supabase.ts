import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase environment variables.');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'biotechk-auth', storage: { getItem: (key) => { try { return localStorage.getItem(key); } catch { return null; } }, setItem: (key, value) => { try { localStorage.setItem(key, value); } catch {} }, removeItem: (key) => { try { localStorage.removeItem(key); } catch {} } }, lock: async (_name, _acquireTimeout, fn) => fn() } });
