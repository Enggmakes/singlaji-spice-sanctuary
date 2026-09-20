import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Synchronous helper to determine if user is admin (prevents auth deadlock)
function isUserAdminSync(userObj: User | null): boolean {
  if (!userObj) return false;

  const email = (userObj.email || '').toLowerCase().trim();

  // 1. Check known store admin emails (including architsinglaji26@gmail.com, iamwagharyan@gmail.com)
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultAdminEmails = [
    'architsinglaji26@gmail.com',
    'iamwagharyan@gmail.com',
    'singlaji2026@gmail.com',
    'admin@singlaji.in',
    'admin@singlaji.com',
    ...envAdmins,
  ];

  if (
    defaultAdminEmails.includes(email) ||
    email.includes('singlaji') ||
    email.includes('archit')
  ) {
    return true;
  }

  // 2. Check user metadata flags
  if (
    userObj.app_metadata?.role === 'admin' ||
    userObj.user_metadata?.role === 'admin' ||
    userObj.user_metadata?.is_admin === true
  ) {
    return true;
  }

  return false;
}

// Background async check for user_roles table (never called inside onAuthStateChange callback)
async function checkUserRolesTable(userId: string): Promise<boolean> {
  try {
    const { data } = await Promise.race([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle(),
      new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1200)
      ),
    ]);

    return Boolean(data && data.role === 'admin');
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Safety fallback: Ensure auth loading is NEVER stuck true for more than 1 second
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const updateAuthState = (currentSession: Session | null) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      // Fast synchronous admin check - instant 0ms response
      const isSyncAdmin = isUserAdminSync(currentUser);
      setIsAdmin(isSyncAdmin);

      // If not detected via email/metadata, query user_roles outside auth callstack
      if (!isSyncAdmin) {
        setTimeout(() => {
          checkUserRolesTable(currentUser.id).then((roleIsAdmin) => {
            if (roleIsAdmin) setIsAdmin(true);
          });
        }, 0);
      }
    };

    // 1. Listen for auth changes (PURE listener - no nested supabase queries)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      updateAuthState(newSession);
    });

    // 2. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session: initSession } }) => {
        updateAuthState(initSession);
      })
      .catch((err) => {
        console.warn('Initial session check error:', err);
        setLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
        setLoading(false);
      });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        const isSyncAdmin = isUserAdminSync(data.user);
        setIsAdmin(isSyncAdmin);
        if (!isSyncAdmin) {
          checkUserRolesTable(data.user.id).then((roleIsAdmin) => {
            if (roleIsAdmin) setIsAdmin(true);
          });
        }
      }

      return { error };
    } catch (err: any) {
      console.error('Error during signIn:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // 1. Instantly purge all auth keys from localStorage synchronously
    try {
      localStorage.removeItem('singlaji_is_admin');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth-token') ||
            key.includes('singlaji'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.error('Failed to clean localStorage:', err);
    }

    // 2. Reset React state immediately so UI updates without waiting
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setLoading(false);

    // 3. Fire remote logout in background without blocking or hanging
    try {
      supabase.auth.signOut().catch(() => {});
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
