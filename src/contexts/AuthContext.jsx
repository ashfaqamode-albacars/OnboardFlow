import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUser as getSupabaseUser, onAuthStateChange, signOut as supabaseSignOut } from '@/api/supabaseClient';
import * as Entities from '@/api/entities';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    // initial session
    (async () => {
      try {
        console.log('[auth] initializing session');
        const s = await supabase.auth.getSession();
        console.log('[auth] initial session', s?.data?.session ?? null);
        if (!mounted) return;
        setSession(s?.data?.session ?? null);
        if (s?.data?.session) {
          const u = await Entities.User.me();
          console.log('[auth] fetched user on init', u);
          if (!mounted) return;
          setUser(u);
        }
      } catch (err) {
        console.error('AuthProvider init error', err);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      try {
        console.log('[auth] onAuthStateChange', event, s ?? null);
        setSession(s ?? null);
        if (s?.user) {
          const u = await Entities.User.me();
          console.log('[auth] fetched user on auth change', u);
          setUser(u);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('onAuthStateChange handler error', err);
      }
    });

    return () => {
      mounted = false;
      try { listener.subscription.unsubscribe(); } catch (e) {}
    };
  }, []);

  const logout = async () => {
    try {
      await supabaseSignOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('logout error', err);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
