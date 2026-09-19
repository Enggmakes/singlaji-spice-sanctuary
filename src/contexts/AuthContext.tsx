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

// Helper to determine if user is admin
async function checkAdminRole(userObj: User | null): Promise<boolean> {
  if (!userObj) {
    localStorage.removeItem('singlaji_is_admin');
    return false;
  }

  const email = (userObj.email || '').toLowerCase().trim();

  // 1. Check known store admin emails (including architsinglaji26@gmail.com)
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultAdminEmails = [
    'architsinglaji26@gmail.com',
    'singlaji2026@gmail.com',
    'admin@singlaji.in',
    'admin@singlaji.com',
    ...envAdmins,
  ];

  if (
    email === 'architsinglaji26@gmail.com' ||
    email === 'singlaji2026@gmail.com' ||
    email.includes('singlaji') ||
    email.includes('archit') ||
    defaultAdminEmails.includes(email)
  ) {
    localStorage.setItem('singlaji_is_admin', 'true');
    return true;
  }

  // 2. Check user metadata flags
  if (
    userObj.app_metadata?.role === 'admin' ||
    userObj.user_metadata?.role === 'admin' ||
    userObj.user_metadata?.is_admin === true
  ) {
    localStorage.setItem('singlaji_is_admin', 'true');
    return true;
  }

  // 3. Query user_roles table
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userObj.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (data && data.role === 'admin') {
      localStorage.setItem('singlaji_is_admin', 'true');
      return true;
    }
  } catch (err) {
    console.warn('Error verifying user_roles from database:', err);
  }

  localStorage.removeItem('singlaji_is_admin');
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize isAdmin from localStorage so it never flickers false on refresh
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('singlaji_is_admin') === 'true';
  });

  useEffect(() => {
    // 1. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const adminStatus = await checkAdminRole(currentUser);
        setIsAdmin(adminStatus);
      } else {
        localStorage.removeItem('singlaji_is_admin');
        setIsAdmin(false);
      }

      setLoading(false);
    });

    // 2. Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initSession } }) => {
      setSession(initSession);
      const currentUser = initSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const adminStatus = await checkAdminRole(currentUser);
        setIsAdmin(adminStatus);
      } else {
        localStorage.removeItem('singlaji_is_admin');
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      setUser(data.user);
      setSession(data.session);
      const adminStatus = await checkAdminRole(data.user);
      setIsAdmin(adminStatus);
    }

    return { error };
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
    try {
      // 1. Sign out locally without waiting on network
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      // 2. Wipe clean all supabase and singlaji keys from localStorage
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

      // 3. Reset state immediately
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
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
