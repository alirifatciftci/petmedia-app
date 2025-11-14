import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { FirebaseAuth, UserProfileService } from '../services/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setUser: (user) => 
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    login: async (email: string, password: string) => {
      try {
        set({ isLoading: true, error: null });
        console.log('Attempting login with:', email);
        const result = await FirebaseAuth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', result.user.uid);
        
        const user: User = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          favorites: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = 'Giriş yapılırken bir hata oluştu';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Şifre yanlış';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Geçersiz e-posta adresi';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'İnternet bağlantınızı kontrol edin';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw error;
      }
    },

    register: async (email: string, password: string) => {
      try {
        set({ isLoading: true, error: null });
        console.log('Attempting register with:', email);
        const result = await FirebaseAuth.createUserWithEmailAndPassword(email, password);
        console.log('Register successful:', result.user.uid);
        
        const user: User = {
          id: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          favorites: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Create user profile in Firestore
        try {
          await UserProfileService.updateUserProfile(result.user.uid, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            favorites: user.favorites,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          });
          console.log('User profile created in Firestore');
        } catch (profileError) {
          console.error('Error creating user profile in Firestore:', profileError);
          // Continue even if Firestore update fails
        }
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        console.error('Register error:', error);
        let errorMessage = 'Kayıt olurken bir hata oluştu';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Bu e-posta adresi zaten kullanımda';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Geçersiz e-posta adresi';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Şifre çok zayıf. En az 6 karakter olmalıdır';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'İnternet bağlantınızı kontrol edin';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        set({
          error: errorMessage,
          isLoading: false,
        });
        throw error;
      }
    },

    logout: async () => {
      try {
        set({ isLoading: true, error: null });
        await FirebaseAuth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        set({
          error: error.message || 'Çıkış yapılırken bir hata oluştu',
          isLoading: false,
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  }))
);