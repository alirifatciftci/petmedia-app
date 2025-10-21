/**
 * Firebase Configuration and Services
 * 
 * This file provides a clean abstraction layer for Firebase services.
 * The implementation can be easily swapped for Supabase or other backends.
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection as firestoreCollection,
  doc as firestoreDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Firestore,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDgOVFJHZJqYCN8mbVsSsH-xVcbXeLyqVo",
  authDomain: "petmedia-app.firebaseapp.com",
  projectId: "petmedia-app",
  storageBucket: "petmedia-app.firebasestorage.app",
  messagingSenderId: "955384772369",
  appId: "1:955384772369:web:4186aa8cdb66977b28beb0",
  measurementId: "G-WM8W1717LZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage = getStorage(app);

// Firebase Auth Service
export class FirebaseAuth {
  static async signInWithEmailAndPassword(email: string, password: string) {
    try {
      const result = await firebaseSignIn(auth, email, password);
      return { user: result.user };
    } catch (error) {
      console.error('Firebase Auth - Sign in error:', error);
      throw error;
    }
  }

  static async createUserWithEmailAndPassword(email: string, password: string) {
    try {
      const result = await firebaseCreateUser(auth, email, password);
      return { user: result.user };
    } catch (error) {
      console.error('Firebase Auth - Create user error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase Auth - Sign out error:', error);
      throw error;
    }
  }

  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }
}

// Firebase Firestore Service
export class FirebaseFirestore {
  static async collection(collectionName: string) {
    const collectionRef = firestoreCollection(db, collectionName);
    
    return {
      doc: (id: string) => {
        const docRef = firestoreDoc(collectionRef, id);
        return {
          get: async () => {
            const docSnap = await getDoc(docRef);
            return {
              exists: docSnap.exists(),
              data: () => docSnap.data(),
              id: docSnap.id
            };
          },
          set: async (data: any) => {
            await setDoc(docRef, data);
          },
          update: async (data: any) => {
            await updateDoc(docRef, data);
          },
          delete: async () => {
            await deleteDoc(docRef);
          },
        };
      },
      add: async (data: any) => {
        const docRef = await addDoc(collectionRef, data);
        return { id: docRef.id };
      },
      where: (field: string, operator: any, value: any) => {
        const q = query(collectionRef, where(field, operator, value));
        return {
          get: async () => {
            const snapshot = await getDocs(q);
            return { docs: snapshot.docs };
          },
          orderBy: (orderField: string, direction?: 'asc' | 'desc') => {
            const orderedQ = query(q, orderBy(orderField, direction));
            return {
              get: async () => {
                const snapshot = await getDocs(orderedQ);
                return { docs: snapshot.docs };
              },
            };
          },
        };
      },
      orderBy: (field: string, direction?: 'asc' | 'desc') => {
        const q = query(collectionRef, orderBy(field, direction));
        return {
          get: async () => {
            const snapshot = await getDocs(q);
            return { docs: snapshot.docs };
          },
          limit: (count: number) => {
            const limitedQ = query(q, limit(count));
            return {
              get: async () => {
                const snapshot = await getDocs(limitedQ);
                return { docs: snapshot.docs };
              },
            };
          },
        };
      },
      onSnapshot: (callback: (snapshot: QuerySnapshot<DocumentData>) => void) => {
        return onSnapshot(collectionRef, callback);
      },
    };
  }
}

// Firebase Storage Service
export class FirebaseStorage {
  static async uploadImage(path: string, imageUri: string): Promise<string> {
    try {
      console.log('FirebaseStorage: Starting upload for path:', path);
      console.log('FirebaseStorage: Image URI:', imageUri);
      
      // Check if storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }
      
      // Check if user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to upload images');
      }
      
      console.log('FirebaseStorage: User authenticated:', auth.currentUser.uid);
      
      // For React Native, you might need to convert the imageUri to a blob first
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('FirebaseStorage: Blob created, size:', blob.size);
      
      const imageRef = storageRef(storage, path);
      console.log('FirebaseStorage: Reference created:', imageRef.fullPath);
      
      await uploadBytes(imageRef, blob);
      console.log('FirebaseStorage: Upload completed');
      
      const downloadURL = await getDownloadURL(imageRef);
      console.log('FirebaseStorage: Download URL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Firebase Storage - Upload error:', error);
      console.error('Firebase Storage - Error details:', {
        code: error instanceof Error ? (error as any).code : 'unknown',
        message: error instanceof Error ? error.message : 'unknown',
        stack: error instanceof Error ? error.stack : 'unknown'
      });
      throw error;
    }
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      const imageRef = storageRef(storage, url);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Firebase Storage - Delete error:', error);
      throw error;
    }
  }
}

// User Profile Service
export class UserProfileService {
  static async updateUserProfile(userId: string, profileData: any) {
    try {
      console.log('UserProfileService: Updating profile for user:', userId);
      console.log('UserProfileService: Profile data:', profileData);
      
      const userRef = firestoreDoc(db, 'users', userId);
      const dataToSave = {
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('UserProfileService: Data to save:', dataToSave);
      console.log('UserProfileService: Firestore reference:', userRef.path);
      
      await setDoc(userRef, dataToSave, { merge: true });
      
      console.log('UserProfileService: Profile updated successfully in Firestore');
      return true;
    } catch (error) {
      console.error('UserProfileService: Error updating user profile:', error);
      console.error('UserProfileService: Error details:', {
        code: error instanceof Error ? (error as any).code : 'unknown',
        message: error instanceof Error ? error.message : 'unknown',
        stack: error instanceof Error ? error.stack : 'unknown'
      });
      throw error;
    }
  }

  static async getUserProfile(userId: string) {
    try {
      const userRef = firestoreDoc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Test function to create a simple document
  static async testFirestoreConnection() {
    try {
      console.log('Testing Firestore connection...');
      const testRef = firestoreDoc(db, 'test', 'connection');
      await setDoc(testRef, {
        message: 'Firestore connection test',
        timestamp: new Date().toISOString(),
      });
      console.log('Firestore connection test successful');
      return true;
    } catch (error) {
      console.error('Firestore connection test failed:', error);
      throw error;
    }
  }

  // Create profiles collection with sample data
  static async createProfilesCollection() {
    try {
      console.log('Creating profiles collection...');
      
      // Create a sample profile document
      const sampleProfileRef = firestoreDoc(db, 'profiles', 'sample-profile');
      await setDoc(sampleProfileRef, {
        displayName: 'Örnek Kullanıcı',
        email: 'ornek@example.com',
        photoURL: '',
        city: 'İstanbul',
        bio: 'Bu bir örnek profildir',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Profiles collection created successfully');
      return true;
    } catch (error) {
      console.error('Error creating profiles collection:', error);
      throw error;
    }
  }
}

// Initialize Firebase
console.log('Firebase initialized with config:', firebaseConfig);
console.log('Firebase Storage initialized:', !!storage);
console.log('Firebase Auth initialized:', !!auth);
console.log('Firebase Firestore initialized:', !!db);