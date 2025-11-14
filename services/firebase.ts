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
      
      // For React Native/Expo, use FileSystem to read the file
      let blob: Blob;
      
      try {
        // Try using fetch first (works for http/https URLs)
        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          const response = await fetch(imageUri);
          blob = await response.blob();
        } else {
          // For local file URIs, use FileSystem
          // Import FileSystem dynamically to avoid issues if not available
          const FileSystemModule = await import('expo-file-system');
          const FileSystem = FileSystemModule.default || FileSystemModule;
          const EncodingType = (FileSystemModule as any).EncodingType || { Base64: 'base64' };
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: EncodingType.Base64 || 'base64',
          });
          
          // Convert base64 to blob
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: 'image/jpeg' });
        }
        
        console.log('FirebaseStorage: Blob created, size:', blob.size);
      } catch (fetchError) {
        console.error('FirebaseStorage: Error creating blob:', fetchError);
        // Fallback: try direct upload with URI (if supported)
        throw new Error(`Failed to process image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
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

// Pet Service
export class PetService {
  static async addPet(petData: any): Promise<string> {
    try {
      console.log('PetService: Adding pet:', petData);
      
      const petsCollection = firestoreCollection(db, 'pets');
      const dataToSave = {
        ...petData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(petsCollection, dataToSave);
      console.log('PetService: Pet added with ID:', docRef.id);
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
        return {
          id: petSnap.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
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
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt) : new Date(),
        };
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
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
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
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
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
      const petRef = firestoreDoc(db, 'pets', petId);
      await updateDoc(petRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('PetService: Error updating pet:', error);
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
      // Create a consistent chat ID (sorted to ensure uniqueness)
      const participants = [userId1, userId2].sort();
      const chatId = `${participants[0]}_${participants[1]}`;
      
      const chatRef = firestoreDoc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
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
        
        console.log('MessageService: Created new chat:', chatId);
      } else {
        // Update user info if it's missing (for existing chats)
        const chatData = chatSnap.data();
        if (!chatData.user1Name || !chatData.user2Name) {
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
        }
      }
      
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
      const q = query(
        messagesCollection,
        where('threadId', '==', threadId),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        };
      });
    } catch (error) {
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
    const q = query(
      messagesCollection,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        };
      });
      callback(messages);
    });
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

// Initialize Firebase
console.log('Firebase initialized with config:', firebaseConfig);
console.log('Firebase Storage initialized:', !!storage);
console.log('Firebase Auth initialized:', !!auth);
console.log('Firebase Firestore initialized:', !!db);