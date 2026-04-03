import { supabase } from '../lib/supabase';
import type { Event } from '../types';

export async function fetchAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('fecha_evento', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(payload: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(eventId: string, payload: Partial<Omit<Event, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', eventId);
  if (error) throw error;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
}
