/**
 * Firebase Data Migration Script
 * 
 * This script migrates data from old Firebase project to new project
 * 
 * Usage:
 * 1. Update OLD_FIREBASE_CONFIG with your old project config
 * 2. Update NEW_FIREBASE_CONFIG with your new project config
 * 3. Run: npx ts-node scripts/migrate-firebase.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore, collection, getDocs, doc, setDoc, query } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';

// OLD Firebase Project Config (petmedia-app)
const OLD_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDgOVFJHZJqYCN8mbVsSsH-xVcbXeLyqVo",
  authDomain: "petmedia-app.firebaseapp.com",
  projectId: "petmedia-app",
  storageBucket: "petmedia-app.firebasestorage.app",
  messagingSenderId: "955384772369",
  appId: "1:955384772369:web:4186aa8cdb66977b28beb0",
};

// NEW Firebase Project Config (petmedia-app-v2)
const NEW_FIREBASE_CONFIG = {
  apiKey: "AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0",
  authDomain: "petmedia-app-v2.firebaseapp.com",
  projectId: "petmedia-app-v2",
  storageBucket: "petmedia-app-v2.firebasestorage.app",
  messagingSenderId: "17357521540",
  appId: "1:17357521540:web:c7168bf86db8697c5df8d1",
};

// Initialize Firebase apps
let oldApp: ReturnType<typeof initializeApp>;
let newApp: ReturnType<typeof initializeApp>;
let oldDb: Firestore;
let newDb: Firestore;
let oldStorage: any;
let newStorage: any;

function initializeFirebase() {
  // Initialize old Firebase
  const existingOldApp = getApps().find(app => app.name === 'old');
  if (existingOldApp) {
    oldApp = existingOldApp;
  } else {
    oldApp = initializeApp(OLD_FIREBASE_CONFIG, 'old');
  }
  oldDb = getFirestore(oldApp);
  oldStorage = getStorage(oldApp);

  // Initialize new Firebase
  const existingNewApp = getApps().find(app => app.name === 'new');
  if (existingNewApp) {
    newApp = existingNewApp;
  } else {
    newApp = initializeApp(NEW_FIREBASE_CONFIG, 'new');
  }
  newDb = getFirestore(newApp);
  newStorage = getStorage(newApp);

  console.log('✅ Firebase initialized');
  console.log('Old project:', OLD_FIREBASE_CONFIG.projectId);
  console.log('New project:', NEW_FIREBASE_CONFIG.projectId);
}

// Migrate Firestore collections
async function migrateCollection(collectionName: string) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);
  
  try {
    const oldCollectionRef = collection(oldDb, collectionName);
    const snapshot = await getDocs(oldCollectionRef);
    
    console.log(`   Found ${snapshot.docs.length} documents`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const docId = docSnapshot.id;
        
        // Convert Timestamp to ISO string if needed
        const cleanData: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && 'toDate' in value) {
            cleanData[key] = (value as any).toDate().toISOString();
          } else {
            cleanData[key] = value;
          }
        }
        
        const newDocRef = doc(newDb, collectionName, docId);
        await setDoc(newDocRef, cleanData);
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   Progress: ${successCount}/${snapshot.docs.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating document ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`   ✅ Completed: ${successCount} success, ${errorCount} errors`);
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`   ❌ Error migrating collection ${collectionName}:`, error);
    return { success: 0, errors: 1 };
  }
}

// Migrate Storage files
async function migrateStorageFolder(folderPath: string) {
  console.log(`\n📁 Migrating storage folder: ${folderPath}`);
  
  try {
    const oldFolderRef = ref(oldStorage, folderPath);
    const listResult = await listAll(oldFolderRef);
    
    console.log(`   Found ${listResult.items.length} files`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const itemRef of listResult.items) {
      try {
        // Get download URL from old storage
        const downloadURL = await getDownloadURL(itemRef);
        
        // Download file
        const response = await fetch(downloadURL);
        const blob = await response.blob();
        
        // Upload to new storage
        const newRef = ref(newStorage, itemRef.fullPath);
        await uploadBytes(newRef, blob);
        
        successCount++;
        
        if (successCount % 5 === 0) {
          console.log(`   Progress: ${successCount}/${listResult.items.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating file ${itemRef.name}:`, error);
        errorCount++;
      }
    }
    
    // Recursively migrate subfolders
    for (const prefixRef of listResult.prefixes) {
      await migrateStorageFolder(prefixRef.fullPath);
    }
    
    console.log(`   ✅ Completed: ${successCount} success, ${errorCount} errors`);
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`   ❌ Error migrating folder ${folderPath}:`, error);
    return { success: 0, errors: 1 };
  }
}

// Main migration function
async function migrateAll() {
  console.log('🚀 Starting Firebase Migration...\n');
  
  initializeFirebase();
  
  // Collections to migrate
  const collections = [
    'users',
    'pets',
    'chats',
    'messages',
    'mapSpots',
    'conversations',
    'threads',
    'profiles',
    'favorites',
  ];
  
  // Migrate Firestore collections
  console.log('\n📊 Migrating Firestore Collections:');
  const collectionResults: any[] = [];
  
  for (const collectionName of collections) {
    const result = await migrateCollection(collectionName);
    collectionResults.push({ collection: collectionName, ...result });
  }
  
  // Migrate Storage
  console.log('\n💾 Migrating Storage:');
  const storageResults = await migrateStorageFolder('pets');
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(50));
  
  console.log('\nFirestore Collections:');
  collectionResults.forEach(result => {
    console.log(`  ${result.collection}: ${result.success} ✅, ${result.errors} ❌`);
  });
  
  console.log('\nStorage:');
  console.log(`  Files: ${storageResults.success} ✅, ${storageResults.errors} ❌`);
  
  const totalSuccess = collectionResults.reduce((sum, r) => sum + r.success, 0) + storageResults.success;
  const totalErrors = collectionResults.reduce((sum, r) => sum + r.errors, 0) + storageResults.errors;
  
  console.log(`\nTotal: ${totalSuccess} ✅, ${totalErrors} ❌`);
  console.log('\n✅ Migration completed!');
}

// Run migration
if (require.main === module) {
  migrateAll().catch(console.error);
}

export { migrateAll, initializeFirebase };

