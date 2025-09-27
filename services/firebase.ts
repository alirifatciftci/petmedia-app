/**
 * Firebase Configuration and Services
 * 
 * This file provides a clean abstraction layer for Firebase services.
 * The implementation can be easily swapped for Supabase or other backends.
 * 
 * TODO: Replace with your actual Firebase configuration
 */

// Mock Firebase configuration - Replace with actual config
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "petmedia-demo.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "petmedia-demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "petmedia-demo.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo"
};

// Mock Firebase services - Replace with actual Firebase SDK
export class FirebaseAuth {
  static async signInWithEmailAndPassword(email: string, password: string) {
    console.log('Mock Firebase Auth - Sign in:', email);
    return { user: { uid: 'mock-user', email } };
  }

  static async createUserWithEmailAndPassword(email: string, password: string) {
    console.log('Mock Firebase Auth - Create user:', email);
    return { user: { uid: 'mock-user', email } };
  }

  static async signOut() {
    console.log('Mock Firebase Auth - Sign out');
  }

  static onAuthStateChanged(callback: (user: any) => void) {
    console.log('Mock Firebase Auth - State change listener');
    // Return mock user for demo
    setTimeout(() => callback(null), 100);
    return () => {}; // Unsubscribe function
  }
}

export class FirebaseFirestore {
  static async collection(collectionName: string) {
    console.log('Mock Firestore - Access collection:', collectionName);
    return {
      doc: (id: string) => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async (data: any) => console.log('Mock Firestore - Set doc:', id, data),
        update: async (data: any) => console.log('Mock Firestore - Update doc:', id, data),
        delete: async () => console.log('Mock Firestore - Delete doc:', id),
      }),
      add: async (data: any) => {
        console.log('Mock Firestore - Add doc to', collectionName, data);
        return { id: 'mock-doc-id' };
      },
      where: (field: string, operator: string, value: any) => ({
        get: async () => ({ docs: [] }),
        orderBy: (field: string) => ({
          get: async () => ({ docs: [] }),
        }),
      }),
      orderBy: (field: string) => ({
        get: async () => ({ docs: [] }),
        limit: (count: number) => ({
          get: async () => ({ docs: [] }),
        }),
      }),
      onSnapshot: (callback: (snapshot: any) => void) => {
        console.log('Mock Firestore - Real-time listener for:', collectionName);
        return () => {}; // Unsubscribe function
      },
    };
  }
}

export class FirebaseStorage {
  static async uploadImage(path: string, imageUri: string): Promise<string> {
    console.log('Mock Firebase Storage - Upload image:', path, imageUri);
    // Return mock URL
    return `https://mock-storage.com/${path}`;
  }

  static async deleteImage(url: string): Promise<void> {
    console.log('Mock Firebase Storage - Delete image:', url);
  }
}

// Initialize Firebase (mock)
console.log('Mock Firebase initialized with config:', firebaseConfig);

/*
 * REAL FIREBASE IMPLEMENTATION EXAMPLE:
 * 
 * import { initializeApp } from 'firebase/app';
 * import { getAuth, signInWithEmailAndPassword as firebaseSignIn } from 'firebase/auth';
 * import { getFirestore, collection as firestoreCollection } from 'firebase/firestore';
 * import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
 * 
 * const app = initializeApp(firebaseConfig);
 * export const auth = getAuth(app);
 * export const db = getFirestore(app);
 * export const storage = getStorage(app);
 * 
 * export const FirebaseAuth = {
 *   signInWithEmailAndPassword: firebaseSignIn,
 *   // ... other auth methods
 * };
 * 
 * // Similar pattern for Firestore and Storage
 */