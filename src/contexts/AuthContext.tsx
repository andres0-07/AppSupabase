import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCurrentProfile, signInWithEmail, signOutUser } from '../services/authService';
import type { Profile } from '../types';

interface AuthContextType { session: Session | null; profile: Profile | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; isAuthenticated: boolean; }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        if (!data.session) { setSession(null); setProfile(null); setLoading(false); return; }
        setSession(data.session);
        try { const p = await getCurrentProfile(data.session.user.id); if (mountedRef.current) setProfile(p); }
        catch { if (mountedRef.current) setProfile(null); }
      } catch { if (mountedRef.current) { setSession(null); setProfile(null); } }
      finally { if (mountedRef.current) setLoading(false); }
    }
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mountedRef.current) return;
      if (event === 'TOKEN_REFRESHED') return;
      if (event === 'SIGNED_OUT') { setSession(null); setProfile(null); setLoading(false); return; }
      if (event === 'SIGNED_IN' && nextSession?.user) {
        setProfile(null); setSession(nextSession); setLoading(true);
        try { const p = await getCurrentProfile(nextSession.user.id); if (mountedRef.current) setProfile(p); }
        catch { if (mountedRef.current) setProfile(null); }
        finally { if (mountedRef.current) setLoading(false); }
      }
    });
    return () => { mountedRef.current = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextType>(() => ({ session, profile, loading, login: signInWithEmail, logout: signOutUser, isAuthenticated: Boolean(session && profile) }), [loading, profile, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; }
