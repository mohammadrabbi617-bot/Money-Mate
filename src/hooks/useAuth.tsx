import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { financeService } from '../services/financeService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('cached_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const hasUser = !!localStorage.getItem('cached_user');
      const hasProfile = !!localStorage.getItem('cached_profile');
      return !(hasUser && hasProfile);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (firebaseUser) {
        try {
          localStorage.setItem('cached_user', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email
          }));
        } catch (e) {
          console.error('Failed to cache user', e);
        }

        unsubscribeProfile = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setProfile(data);
              try {
                localStorage.setItem('cached_profile', JSON.stringify(data));
              } catch (e) {
                console.error('Failed to cache profile', e);
              }
              // Ensure cash account exists in the background so it is completely non-blocking
              financeService.ensureCashAccount(firebaseUser.uid).catch((err) => {
                console.error("Background cash account check failed: ", err);
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching user profile snapshot:', err);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        try {
          localStorage.removeItem('cached_user');
          localStorage.removeItem('cached_profile');
        } catch (e) {
          console.error('Failed to clear cash', e);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('cached_user');
      localStorage.removeItem('cached_profile');
      sessionStorage.removeItem('app_unlocked_session');
    } catch (e) {
      console.error('Failed to clear cash', e);
    }
    return auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
