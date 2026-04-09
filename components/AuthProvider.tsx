'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Radio } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  email: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAnonymous: false, 
  email: null,
  logout: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (!firebaseUser && pathname !== '/login') {
        router.push('/login');
      } else if (firebaseUser && pathname === '/login') {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAnonymous: user?.isAnonymous ?? false,
      email: user?.email ?? null,
      logout
    }}>
      {/* 
        Always render children to keep their hooks stable across auth transitions!
        We just keep them visually hidden or use an overlay during the initial load.
      */}
      {children}
      
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-8">
           <div className="w-16 h-16 glass-card bg-white/5 flex items-center justify-center border-mint-accent/20 shadow-2xl mb-8 animate-pulse">
             <Radio className="w-8 h-8 text-mint-accent neon-text-mint" />
           </div>
           <div className="text-mint-accent text-xs font-black tracking-[0.4em] uppercase text-center max-w-sm leading-relaxed opacity-80 neon-text-mint">
             SENSE OS / INITIALIZING_SECURE_TUNNEL
           </div>
           <div className="mt-6 flex items-center space-x-2">
             <div className="w-8 h-[2px] bg-mint-accent/20" />
             <div className="w-1.5 h-1.5 bg-mint-accent rounded-full animate-ping" />
             <div className="w-8 h-[2px] bg-mint-accent/20" />
           </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
