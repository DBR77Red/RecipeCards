import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { restoreFromCloud, setCurrentUserId } from '../utils/storage';

type AuthState = {
  session: Session | null;
  user: User | null;
  isValidated: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isValidated: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const restoredForRef = useRef<string | null>(null);

  const triggerRestore = (userId: string | null) => {
    if (!userId || userId === restoredForRef.current) return;
    restoredForRef.current = userId;
    restoreFromCloud().catch(() => {});
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUserId(session?.user?.id ?? null);
      triggerRestore(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUserId(session?.user?.id ?? null);
      triggerRestore(session?.user?.id ?? null);
      if (!session) restoredForRef.current = null;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;
  // invite_validated lives in app_metadata — only service role can set it
  const isValidated = user?.app_metadata?.invite_validated === true;

  return (
    <AuthContext.Provider value={{ session, user, isValidated, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
