import { supabase } from '../lib/supabase';
import type { BiometricLog } from '../types';

export async function fetchBiometricLogs(limit = 20): Promise<BiometricLog[]> {
  const { data, error } = await supabase
    .from('biometric_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
