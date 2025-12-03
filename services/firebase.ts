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
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Firebase configuration from environment variables
// Set these in .env file with EXPO_PUBLIC_* prefix or in app.config.js
// DO NOT commit actual credentials to git
const getFirebaseConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  
  // Development fallback values (for local development only)
  const devFallback = {
    apiKey: 'AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0',
    authDomain: 'petmedia-app-v2.firebaseapp.com',
    projectId: 'petmedia-app-v2',
    storageBucket: 'petmedia-app-v2.firebasestorage.app',
    messagingSenderId: '17357521540',
    appId: '1:17357521540:web:c7168bf86db8697c5df8d1',
    measurementId: 'G-9W68V4VT5D',
  };
  
  // Helper function to check if a value is a placeholder
  const isPlaceholder = (value: string | undefined): boolean => {
    if (!value) return true;
    const placeholderPatterns = [
      'your_firebase',
      'your_project',
      'your_',
      '123456789',
      'abcdef',
    ];
    return placeholderPatterns.some(pattern => value.toLowerCase().includes(pattern));
  };
  
  // Get from Constants.expoConfig.extra first (set in app.config.js)
  // Then fallback to process.env (for runtime access)
  // Finally use development fallback values if placeholder or missing
  const getValue = (extraValue: string | undefined, envValue: string | undefined, fallback: string): string => {
    // Check if extra value is valid (not placeholder)
    if (extraValue && !isPlaceholder(extraValue)) {
      return extraValue;
    }
    // Check if env value is valid (not placeholder)
    if (envValue && !isPlaceholder(envValue)) {
      return envValue;
    }
    // Use fallback
    return fallback;
  };
  
  const config = {
    apiKey: getValue(extra.firebaseApiKey, process.env.EXPO_PUBLIC_FIREBASE_API_KEY, devFallback.apiKey),
    authDomain: getValue(extra.firebaseAuthDomain, process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, devFallback.authDomain),
    projectId: getValue(extra.firebaseProjectId, process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, devFallback.projectId),
    storageBucket: getValue(extra.firebaseStorageBucket, process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, devFallback.storageBucket),
    messagingSenderId: getValue(extra.firebaseMessagingSenderId, process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, devFallback.messagingSenderId),
    appId: getValue(extra.firebaseAppId, process.env.EXPO_PUBLIC_FIREBASE_APP_ID, devFallback.appId),
    measurementId: getValue(extra.firebaseMeasurementId, process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID, devFallback.measurementId),
  };
  
  // Debug: Log what we're getting (only in development)
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('Firebase Config Debug:', {
      hasExtra: !!Constants.expoConfig?.extra,
      extraKeys: Object.keys(extra),
      apiKeySource: extra.firebaseApiKey && !isPlaceholder(extra.firebaseApiKey) ? 'app.config.js' : 
                    (process.env.EXPO_PUBLIC_FIREBASE_API_KEY && !isPlaceholder(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) ? 'env' : 'fallback'),
      apiKeyPreview: config.apiKey.substring(0, 15) + '...',
      projectId: config.projectId,
    });
  }
  
  // Validate that required config is present
  if (!config.apiKey || !config.projectId) {
    console.error('Firebase: Missing required configuration!', {
      apiKey: config.apiKey ? '***' : 'MISSING',
      projectId: config.projectId || 'MISSING',
    });
    console.warn('Firebase: Please set EXPO_PUBLIC_FIREBASE_* environment variables in .env file or restart Expo server.');
  } else {
    console.log('Firebase: Configuration loaded successfully', {
      apiKey: config.apiKey.substring(0, 10) + '...',
      projectId: config.projectId,
    });
  }
  
  return config;
};

export const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

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

// Image Service - Local URI Storage
// Images are stored as local file URIs in Firestore (no Firebase Storage needed)
export class FirebaseStorage {
  /**
   * Return image URI directly (no Firebase Storage upload)
   * Images are stored as local file URIs in Firestore
   */
  static async uploadImage(path: string, imageUri: string): Promise<string> {
    try {
      console.log('📤 FirebaseStorage.uploadImage: Starting upload...');
      console.log('📤 FirebaseStorage.uploadImage: Path:', path);
      console.log('📤 FirebaseStorage.uploadImage: Image URI:', imageUri);
      console.log('📤 FirebaseStorage.uploadImage: URI type:', {
        isFile: imageUri.startsWith('file://'),
        isHttp: imageUri.startsWith('http://') || imageUri.startsWith('https://'),
        isData: imageUri.startsWith('data:'),
        length: imageUri.length,
      });
      
      // Check if user is authenticated
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error('❌ FirebaseStorage.uploadImage: User not authenticated');
        throw new Error('User must be authenticated to upload images');
      }
      
      console.log('✅ FirebaseStorage.uploadImage: User authenticated:', auth.currentUser.uid);
      
      // ⚠️ WARNING: Currently returning local URI directly instead of uploading to Firebase Storage
      // This means the image will only work on the current device!
      // TODO: Implement actual Firebase Storage upload
      console.warn('⚠️ FirebaseStorage.uploadImage: WARNING - Returning local URI instead of uploading to Firebase Storage!');
      console.warn('⚠️ FirebaseStorage.uploadImage: This image will only work on the current device.');
      console.warn('⚠️ FirebaseStorage.uploadImage: Local URI:', imageUri);
      
      // Return the local URI directly (same as users table)
      // This works because React Native Image component can handle file:// URIs
      // BUT: This won't work across devices or after app reinstall!
      const returnedUri = imageUri;
      console.log('📤 FirebaseStorage.uploadImage: Returning local URI:', returnedUri);
      return returnedUri;
    } catch (error) {
      console.error('❌ FirebaseStorage.uploadImage: Upload error:', error);
      console.error('❌ FirebaseStorage.uploadImage: Error details:', {
        error: error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  }

  /**
   * Delete image (no-op for local URIs)
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      // Local URIs are managed by the device, no deletion needed
      console.log('ImageService: Local URI deletion not needed');
    } catch (error) {
      console.error('ImageService - Delete error:', error);
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
      console.log('🔍 UserProfileService.getUserProfile: Starting for userId:', userId);
      const userRef = firestoreDoc(db, 'users', userId);
      console.log('🔍 UserProfileService.getUserProfile: Firestore path:', userRef.path);
      
      const userSnap = await getDoc(userRef);
      console.log('🔍 UserProfileService.getUserProfile: Document exists:', userSnap.exists());
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log('🔍 UserProfileService.getUserProfile: Raw Firestore data:', JSON.stringify(data, null, 2));
        console.log('🔍 UserProfileService.getUserProfile: photoURL from Firestore:', {
          value: data.photoURL,
          type: typeof data.photoURL,
          isString: typeof data.photoURL === 'string',
          length: typeof data.photoURL === 'string' ? data.photoURL.length : 0,
          isEmpty: typeof data.photoURL === 'string' ? data.photoURL.trim() === '' : true,
          startsWithFile: typeof data.photoURL === 'string' ? data.photoURL.startsWith('file://') : false,
          startsWithHttp: typeof data.photoURL === 'string' ? (data.photoURL.startsWith('http://') || data.photoURL.startsWith('https://')) : false,
        });
        return data;
      }
      console.log('🔍 UserProfileService.getUserProfile: Document does not exist');
      return null;
    } catch (error) {
      console.error('❌ UserProfileService.getUserProfile: Error getting user profile:', error);
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

// Pet Service
export class PetService {
  static async addPet(petData: any): Promise<string> {
    try {
      console.log('PetService: Adding pet:', petData);
      
      // Validate photos array - must be non-empty and all URLs must be valid
      if (!petData.photos || !Array.isArray(petData.photos) || petData.photos.length === 0) {
        throw new Error('Pet must have at least one photo');
      }
      
      // Ensure all photos are valid URLs
      const validPhotos = petData.photos.filter((photo: string) => 
        photo && typeof photo === 'string' && photo.trim().length > 0
      );
      
      if (validPhotos.length === 0) {
        throw new Error('No valid photo URLs found. All photos must be provided.');
      }
      
      const petsCollection = firestoreCollection(db, 'pets');
      const dataToSave = {
        ...petData,
        photos: validPhotos, // Store URLs in Firestore
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('PetService: Saving pet with photos:', validPhotos.length, 'URLs');
      
      const docRef = await addDoc(petsCollection, dataToSave);
      console.log('PetService: Pet added with ID:', docRef.id);
      console.log('PetService: Photos saved (URLs):', validPhotos.length);
      return docRef.id;
    } catch (error) {
      console.error('PetService: Error adding pet:', error);
      throw error;
    }
  }

  static async getPet(petId: string) {
    try {
      const petRef = firestoreDoc(db, 'pets', petId);
      const petSnap = await getDoc(petRef);
      
      if (petSnap.exists()) {
        const data = petSnap.data();
        
        // Ensure photos is always an array
        let photos = Array.isArray(data.photos) ? data.photos : (data.photos ? [data.photos] : []);
        
        const pet = {
          id: petSnap.id,
          ...data,
          photos: photos, // Store URLs
          videos: Array.isArray(data.videos) ? data.videos : (data.videos ? [data.videos] : []),
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        
        console.log('PetService: getPet data:', {
          id: pet.id,
          name: (pet as any).name,
          photosCount: pet.photos?.length || 0,
          photos: pet.photos,
        });
        
        return pet;
      }
      return null;
    } catch (error) {
      console.error('PetService: Error getting pet:', error);
      throw error;
    }
  }

  static async getUserPets(userId: string) {
    try {
      console.log('PetService: Getting pets for user:', userId);
      const petsCollection = firestoreCollection(db, 'pets');
      
      // Index gerektirmemek için sadece where kullan, orderBy'ı client-side'da yap
      // ÖNEMLİ: orderBy kullanmıyoruz çünkü composite index gerektirir
      const q = query(petsCollection, where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      
      console.log(`PetService: Found ${snapshot.docs.length} pets for user`);
      
      const pets = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure photos is always an array
        let photos = Array.isArray(data.photos) ? data.photos : (data.photos ? [data.photos] : []);
        
        const pet = {
          id: doc.id,
          ...data,
          photos: photos, // Store URLs
          videos: Array.isArray(data.videos) ? data.videos : (data.videos ? [data.videos] : []),
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt) : new Date(),
        };
        
        // Debug: Log photos for first pet
        if (snapshot.docs.indexOf(doc) === 0) {
          console.log('PetService: Sample user pet data:', {
            id: pet.id,
            name: (pet as any).name,
            photosCount: pet.photos?.length || 0,
            photos: pet.photos,
          });
        }
        
        return pet;
      });
      
      // Client-side'da tarihe göre sırala (en yeni önce)
      // Bu index gerektirmez çünkü Firestore query'si değil, JavaScript sort
      const sortedPets = pets.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`PetService: Returning ${sortedPets.length} sorted pets`);
      return sortedPets;
    } catch (error: any) {
      console.error('PetService: Error getting user pets:', error);
      
      // Index hatası ise, kullanıcıya bilgi ver
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('PetService: Index required. Falling back to getAllPets and filtering client-side.');
        // Fallback: Tüm pet'leri al ve client-side'da filtrele (daha yavaş ama çalışır)
        try {
          const allPets = await this.getAllPets();
          const userPets = allPets.filter((pet: any) => pet.ownerId === userId);
          return userPets.sort((a: any, b: any) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
        } catch (fallbackError) {
          console.error('PetService: Fallback also failed:', fallbackError);
          throw error; // Orijinal hatayı fırlat
        }
      }
      
      throw error;
    }
  }

  static async getAllPets(limitCount?: number) {
    try {
      const petsCollection = firestoreCollection(db, 'pets');
      let q = query(petsCollection, orderBy('createdAt', 'desc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure photos is always an array
        let photos = Array.isArray(data.photos) ? data.photos : (data.photos ? [data.photos] : []);
        
        const pet = {
          id: doc.id,
          ...data,
          photos: photos, // Store URLs
          videos: Array.isArray(data.videos) ? data.videos : (data.videos ? [data.videos] : []),
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        
        // Debug: Log photos for first pet
        if (snapshot.docs.indexOf(doc) === 0) {
          console.log('PetService: Sample pet data:', {
            id: pet.id,
            name: (pet as any).name,
            photosCount: pet.photos?.length || 0,
            photos: pet.photos,
          });
        }
        
        return pet;
      });
    } catch (error) {
      console.error('PetService: Error getting all pets:', error);
      throw error;
    }
  }

  static async getPetsBySpecies(species: string) {
    try {
      const petsCollection = firestoreCollection(db, 'pets');
      // Index gerektirmemek için sadece where kullan, orderBy'ı client-side'da yap
      const q = query(petsCollection, where('species', '==', species));
      const snapshot = await getDocs(q);
      
      const pets = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Ensure photos is always an array
        let photos = Array.isArray(data.photos) ? data.photos : (data.photos ? [data.photos] : []);
        
        const pet = {
          id: doc.id,
          ...data,
          photos: photos, // Store URLs
          videos: Array.isArray(data.videos) ? data.videos : (data.videos ? [data.videos] : []),
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        
        // Debug: Log photos for first pet
        if (snapshot.docs.indexOf(doc) === 0) {
          console.log('PetService: Sample species pet data:', {
            id: pet.id,
            name: (pet as any).name,
            photosCount: pet.photos?.length || 0,
            photos: pet.photos,
          });
        }
        
        return pet;
      });
      
      // Client-side'da tarihe göre sırala (en yeni önce)
      return pets.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('PetService: Error getting pets by species:', error);
      throw error;
    }
  }

  static async updatePet(petId: string, updates: any) {
    try {
      console.log('PetService: Updating pet with ID:', petId);
      console.log('PetService: Updates data:', updates);
      
      const petRef = firestoreDoc(db, 'pets', petId);
      
      // Remove undefined values to avoid Firestore errors
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          cleanUpdates[key] = updates[key];
        }
      });
      
      // Validate photos if they're being updated
      if (cleanUpdates.photos) {
        if (!Array.isArray(cleanUpdates.photos) || cleanUpdates.photos.length === 0) {
          throw new Error('Pet must have at least one photo');
        }
        
        // Ensure all photos are valid URLs
        const validPhotos = cleanUpdates.photos.filter((photo: string) => 
          photo && typeof photo === 'string' && photo.trim().length > 0
        );
        
        if (validPhotos.length === 0) {
          throw new Error('No valid photo URLs found. All photos must be provided.');
        }
        
        cleanUpdates.photos = validPhotos;
        console.log('PetService: Validated photos:', validPhotos.length, 'URLs');
      }
      
      cleanUpdates.updatedAt = new Date().toISOString();
      
      console.log('PetService: Clean updates to save:', cleanUpdates);
      console.log('PetService: Firestore reference path:', petRef.path);
      
      await updateDoc(petRef, cleanUpdates);
      
      console.log('PetService: Pet updated successfully');
    } catch (error) {
      console.error('PetService: Error updating pet:', error);
      console.error('PetService: Error details:', {
        code: error instanceof Error ? (error as any).code : 'unknown',
        message: error instanceof Error ? error.message : 'unknown',
        stack: error instanceof Error ? error.stack : 'unknown'
      });
      throw error;
    }
  }

  static async deletePet(petId: string) {
    try {
      const petRef = firestoreDoc(db, 'pets', petId);
      await deleteDoc(petRef);
    } catch (error) {
      console.error('PetService: Error deleting pet:', error);
      throw error;
    }
  }
}

// Message Service
export class MessageService {
  // Get or create a chat between two users
  static async getOrCreateThread(userId1: string, userId2: string): Promise<string> {
    try {
      console.log('MessageService: getOrCreateThread called for users:', userId1, userId2);
      
      // Create a consistent chat ID (sorted to ensure uniqueness)
      const participants = [userId1, userId2].sort();
      const chatId = `${participants[0]}_${participants[1]}`;
      
      console.log('MessageService: Generated chatId:', chatId);
      
      const chatRef = firestoreDoc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        console.log('MessageService: Chat does not exist, creating new chat...');
        
        // Get user info for both users
        const [user1, user2] = await Promise.all([
          UserService.getUserById(userId1),
          UserService.getUserById(userId2),
        ]);
        
        // Create new chat with user information
        await setDoc(chatRef, {
          participants: participants,
          user1Id: userId1,
          user1Name: (user1 as any)?.displayName || (user1 as any)?.email || 'Kullanıcı',
          user1Photo: (user1 as any)?.photoURL || '',
          user2Id: userId2,
          user2Name: (user2 as any)?.displayName || (user2 as any)?.email || 'Kullanıcı',
          user2Photo: (user2 as any)?.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessage: null,
          lastMessageAt: null,
        });
        
        console.log('MessageService: ✅ Created new chat:', chatId);
      } else {
        console.log('MessageService: ✅ Chat already exists, returning existing chat:', chatId);
        
        // Update user info if it's missing (for existing chats)
        const chatData = chatSnap.data();
        if (!chatData.user1Name || !chatData.user2Name) {
          console.log('MessageService: Updating missing user info in existing chat...');
          const [user1, user2] = await Promise.all([
            UserService.getUserById(userId1),
            UserService.getUserById(userId2),
          ]);
          
          await updateDoc(chatRef, {
            user1Name: (user1 as any)?.displayName || (user1 as any)?.email || 'Kullanıcı',
            user1Photo: (user1 as any)?.photoURL || '',
            user2Name: (user2 as any)?.displayName || (user2 as any)?.email || 'Kullanıcı',
            user2Photo: (user2 as any)?.photoURL || '',
            updatedAt: new Date().toISOString(),
          });
          console.log('MessageService: User info updated in existing chat');
        }
      }
      
      console.log('MessageService: Returning chatId:', chatId);
      return chatId;
    } catch (error) {
      console.error('MessageService: Error getting/creating chat:', error);
      throw error;
    }
  }

  // Send a message
  static async sendMessage(threadId: string, senderId: string, text: string): Promise<string> {
    try {
      const messagesCollection = firestoreCollection(db, 'messages');
      const messageData = {
        threadId,
        senderId,
        text,
        readBy: [senderId], // Sender has read their own message
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(messagesCollection, messageData);
      
      // Update chat with last message
      const chatRef = firestoreDoc(db, 'chats', threadId);
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('MessageService: Error sending message:', error);
      throw error;
    }
  }

  // Get messages for a thread
  static async getThreadMessages(threadId: string) {
    try {
      const messagesCollection = firestoreCollection(db, 'messages');
      // Use query without orderBy to avoid index requirement
      // We'll sort client-side instead
      const q = query(
        messagesCollection,
        where('threadId', '==', threadId)
      );
      
      const snapshot = await getDocs(q);
      
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
        };
      });
      
      // Sort by createdAt (client-side sorting)
      messages.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
      
      return messages;
    } catch (error: any) {
      console.error('MessageService: Error getting messages:', error);
      throw error;
    }
  }

  // Get all chats for a user
  static async getUserConversations(userId: string) {
    try {
      console.log('MessageService: Getting chats for user:', userId);
      const chatsCollection = firestoreCollection(db, 'chats');
      const q = query(
        chatsCollection,
        where('participants', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      
      console.log(`MessageService: Found ${snapshot.docs.length} chats`);
      
      const chats = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          participants: data.participants || [],
          user1Id: data.user1Id || '',
          user1Name: data.user1Name || '',
          user1Photo: data.user1Photo || '',
          user2Id: data.user2Id || '',
          user2Name: data.user2Name || '',
          user2Photo: data.user2Photo || '',
          lastMessage: data.lastMessage || null,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          lastMessageAt: data.lastMessageAt ? new Date(data.lastMessageAt) : null,
        };
      });
      
      // Sort by lastMessageAt (most recent first)
      const sortedChats = chats.sort((a, b) => {
        const dateA = a.lastMessageAt || a.createdAt;
        const dateB = b.lastMessageAt || b.createdAt;
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log(`MessageService: Returning ${sortedChats.length} sorted chats`);
      return sortedChats;
    } catch (error) {
      console.error('MessageService: Error getting chats:', error);
      throw error;
    }
  }

  // Get chat by ID
  static async getChatById(chatId: string) {
    try {
      console.log('MessageService: Getting chat by ID:', chatId);
      const chatRef = firestoreDoc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        console.warn('MessageService: Chat not found:', chatId);
        return null;
      }
      
      const data = chatSnap.data();
      return {
        id: chatSnap.id,
        participants: data.participants || [],
        user1Id: data.user1Id || '',
        user1Name: data.user1Name || '',
        user1Photo: data.user1Photo || '',
        user2Id: data.user2Id || '',
        user2Name: data.user2Name || '',
        user2Photo: data.user2Photo || '',
        lastMessage: data.lastMessage || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        lastMessageAt: data.lastMessageAt ? new Date(data.lastMessageAt) : null,
      };
    } catch (error) {
      console.error('MessageService: Error getting chat by ID:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(threadId: string, userId: string) {
    try {
      const messagesCollection = firestoreCollection(db, 'messages');
      // Get all messages in the thread
      const q = query(
        messagesCollection,
        where('threadId', '==', threadId)
      );
      const snapshot = await getDocs(q);
      
      // Update messages that are NOT read by this user
      const updatePromises = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          const readBy = data.readBy || [];
          return !readBy.includes(userId);
        })
        .map(doc => {
          const data = doc.data();
          const readBy = data.readBy || [];
          return updateDoc(doc.ref, {
            readBy: [...readBy, userId],
          });
        });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('MessageService: Error marking as read:', error);
      throw error;
    }
  }

  // Subscribe to messages in real-time
  static subscribeToThreadMessages(
    threadId: string,
    callback: (messages: any[]) => void
  ) {
    const messagesCollection = firestoreCollection(db, 'messages');
    
    // Use query without orderBy to avoid index requirement
    // We'll sort client-side instead
    const q = query(
      messagesCollection,
      where('threadId', '==', threadId)
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        console.log('MessageService: Received', snapshot.docs.length, 'messages in subscription');
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
          };
        });
        
        // Sort by createdAt (client-side sorting)
        messages.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
        
        console.log('MessageService: Calling callback with', messages.length, 'messages');
        callback(messages);
      },
      (error) => {
        console.error('MessageService: Subscription error:', error);
        // Return empty array on error to prevent app crash
        callback([]);
      }
    );
  }
}

// User Service - Get all authenticated users
export class UserService {
  static async getAllUsers(excludeUserId?: string) {
    try {
      console.log('UserService: Fetching all users from Firestore...');
      const usersCollection = firestoreCollection(db, 'users');
      const snapshot = await getDocs(usersCollection);
      
      console.log(`UserService: Found ${snapshot.docs.length} users in Firestore`);
      
      let users: any[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || 'Kullanıcı',
          photoURL: data.photoURL || '',
          city: data.city || '',
          bio: data.bio || '',
          favorites: data.favorites || [],
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt) : new Date(),
        };
      });
      
      // Exclude current user if provided
      if (excludeUserId) {
        users = users.filter(user => user.id !== excludeUserId);
        console.log(`UserService: Excluded current user, ${users.length} users remaining`);
      }
      
      // Sort by displayName or email
      const sortedUsers = users.sort((a, b) => {
        const nameA = (a.displayName || a.email || '').toLowerCase();
        const nameB = (b.displayName || b.email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      console.log(`UserService: Returning ${sortedUsers.length} users`);
      return sortedUsers;
    } catch (error) {
      console.error('UserService: Error getting all users:', error);
      throw error;
    }
  }

  static async getUserById(userId: string) {
    try {
      const userRef = firestoreDoc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          id: userSnap.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
      }
      return null;
    } catch (error) {
      console.error('UserService: Error getting user:', error);
      throw error;
    }
  }

  // Ensure current user exists in Firestore
  static async ensureUserInFirestore(userId: string, userData: any) {
    try {
      const userRef = firestoreDoc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('UserService: User not found in Firestore, creating...');
        await setDoc(userRef, {
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('UserService: User created in Firestore');
      } else {
        console.log('UserService: User already exists in Firestore');
      }
    } catch (error) {
      console.error('UserService: Error ensuring user in Firestore:', error);
      throw error;
    }
  }
}

// Map Spot Service
export class MapSpotService {
  static async getUserMapSpots(userId: string) {
    try {
      console.log('MapSpotService: Getting map spots for user:', userId);
      const spotsCollection = firestoreCollection(db, 'mapSpots');
      const q = query(spotsCollection, where('creatorId', '==', userId));
      const snapshot = await getDocs(q);
      
      console.log(`MapSpotService: Found ${snapshot.docs.length} map spots for user`);
      
      const spots = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
          lastUpdatedAt: data.lastUpdatedAt ? (typeof data.lastUpdatedAt === 'string' ? new Date(data.lastUpdatedAt) : data.lastUpdatedAt.toDate ? data.lastUpdatedAt.toDate() : new Date(data.lastUpdatedAt)) : new Date(),
        };
      });
      
      return spots;
    } catch (error) {
      console.error('MapSpotService: Error getting user map spots:', error);
      // If collection doesn't exist or error occurs, return empty array
      return [];
    }
  }

  static async getMapSpotsCount(userId: string): Promise<number> {
    try {
      const spots = await this.getUserMapSpots(userId);
      return spots.length;
    } catch (error) {
      console.error('MapSpotService: Error getting map spots count:', error);
      return 0;
    }
  }

  static async getAllMapSpots() {
    try {
      console.log('MapSpotService: Getting all map spots');
      const spotsCollection = firestoreCollection(db, 'mapSpots');
      const q = query(spotsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      console.log(`MapSpotService: Found ${snapshot.docs.length} total map spots`);
      
      const spots = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          coords: data.coords || { latitude: 0, longitude: 0 },
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
          lastUpdatedAt: data.lastUpdatedAt ? (typeof data.lastUpdatedAt === 'string' ? new Date(data.lastUpdatedAt) : data.lastUpdatedAt.toDate ? data.lastUpdatedAt.toDate() : new Date(data.lastUpdatedAt)) : new Date(),
        };
      });
      
      return spots;
    } catch (error) {
      console.error('MapSpotService: Error getting all map spots:', error);
      return [];
    }
  }

  static subscribeToMapSpots(
    callback: (spots: any[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      console.log('MapSpotService: Subscribing to map spots');
      const spotsCollection = firestoreCollection(db, 'mapSpots');
      const q = query(spotsCollection, orderBy('createdAt', 'desc'));
      
      return onSnapshot(
        q,
        (snapshot) => {
          console.log(`MapSpotService: Received ${snapshot.docs.length} map spots`);
          const spots = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              coords: data.coords || { latitude: 0, longitude: 0 },
              createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
              lastUpdatedAt: data.lastUpdatedAt ? (typeof data.lastUpdatedAt === 'string' ? new Date(data.lastUpdatedAt) : data.lastUpdatedAt.toDate ? data.lastUpdatedAt.toDate() : new Date(data.lastUpdatedAt)) : new Date(),
            };
          });
          callback(spots);
        },
        (error) => {
          console.error('MapSpotService: Error in subscription:', error);
          if (onError) onError(error);
        }
      );
    } catch (error) {
      console.error('MapSpotService: Error setting up subscription:', error);
      if (onError) onError(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  static async createMapSpot(spotData: {
    creatorId: string;
    type: 'food' | 'water' | 'both' | 'veterinary' | 'shelter';
    title: string;
    note?: string;
    coords: { latitude: number; longitude: number };
    photoURL?: string;
  }) {
    try {
      console.log('MapSpotService: Creating map spot:', spotData);
      const spotsCollection = firestoreCollection(db, 'mapSpots');
      
      const newSpot = {
        creatorId: spotData.creatorId,
        type: spotData.type,
        title: spotData.title,
        note: spotData.note || '',
        coords: spotData.coords,
        photoURL: spotData.photoURL || '',
        contributorsCount: 1, // Creator is the first contributor
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };
      
      const docRef = await addDoc(spotsCollection, newSpot);
      console.log('MapSpotService: Map spot created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...newSpot,
      };
    } catch (error) {
      console.error('MapSpotService: Error creating map spot:', error);
      throw error;
    }
  }

  static async contributeToSpot(spotId: string) {
    try {
      console.log('MapSpotService: Contributing to spot:', spotId);
      const spotRef = firestoreDoc(db, 'mapSpots', spotId);
      const spotDoc = await getDoc(spotRef);
      
      if (!spotDoc.exists()) {
        throw new Error('Map spot not found');
      }
      
      const currentCount = spotDoc.data()?.contributorsCount || 0;
      await updateDoc(spotRef, {
        contributorsCount: currentCount + 1,
        lastUpdatedAt: new Date(),
      });
      
      console.log('MapSpotService: Contribution added to spot:', spotId);
      return true;
    } catch (error) {
      console.error('MapSpotService: Error contributing to spot:', error);
      throw error;
    }
  }
}

// Initialize Firebase
console.log('Firebase initialized with config:', firebaseConfig);
console.log('Firebase Auth initialized:', !!auth);
console.log('Firebase Firestore initialized:', !!db);