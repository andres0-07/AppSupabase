import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCurrentProfile, signInWithEmail, signOutUser } from '../services/authService';
import type { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(userId: string): Promise<boolean> {
      try {
        const p = await getCurrentProfile(userId);
        if (mounted) setProfile(p);
        return true;
      } catch {
        if (mounted) setProfile(null);
        return false;
      }
    }

    async function init() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const s = data.session ?? null;
        setSession(s);
        if (s?.user) {
          const ok = await loadProfile(s.user.id);
          if (!ok) {
            // Perfil no existe o fallo — limpiar sesion corrupta
            await supabase.auth.signOut();
            setSession(null);
          }
        }
      } catch {
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && nextSession?.user) {
        setSession(nextSession);
        await loadProfile(nextSession.user.id);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && nextSession) {
        setSession(nextSession);
        return;
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setSession(null);
    setProfile(null);
    setLoading(false);
    await signOutUser();
  }

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      profile,
      loading,
      login: signInWithEmail,
      logout: handleLogout,
      isAuthenticated: Boolean(session && profile),
    }),
    [loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
