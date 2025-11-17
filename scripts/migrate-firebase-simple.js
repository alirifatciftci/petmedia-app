/**
 * Simple Firebase Migration Script (Node.js)
 * 
 * This is a simpler version that can be run directly with Node.js
 * 
 * Setup:
 * 1. Install dependencies: npm install firebase
 * 2. Update the configs below
 * 3. Run: node scripts/migrate-firebase-simple.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');
const { getStorage, ref, listAll, getDownloadURL, uploadBytes } = require('firebase/storage');

// OLD Firebase Project Config
const OLD_CONFIG = {
  apiKey: "AIzaSyDgOVFJHZJqYCN8mbVsSsH-xVcbXeLyqVo",
  authDomain: "petmedia-app.firebaseapp.com",
  projectId: "petmedia-app",
  storageBucket: "petmedia-app.firebasestorage.app",
  messagingSenderId: "955384772369",
  appId: "1:955384772369:web:4186aa8cdb66977b28beb0",
};

// NEW Firebase Project Config (petmedia-app-v2)
const NEW_CONFIG = {
  apiKey: "AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0",
  authDomain: "petmedia-app-v2.firebaseapp.com",
  projectId: "petmedia-app-v2",
  storageBucket: "petmedia-app-v2.firebasestorage.app",
  messagingSenderId: "17357521540",
  appId: "1:17357521540:web:c7168bf86db8697c5df8d1",
};

// Initialize apps
const oldApp = initializeApp(OLD_CONFIG, 'old');
const newApp = initializeApp(NEW_CONFIG, 'new');

const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);
const oldStorage = getStorage(oldApp);
const newStorage = getStorage(newApp);

// Migrate collection
async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating: ${collectionName}`);
  
  try {
    const snapshot = await getDocs(collection(oldDb, collectionName));
    console.log(`   Found ${snapshot.docs.length} documents`);
    
    let count = 0;
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      // Clean data (convert Timestamps)
      const cleanData = {};
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && value.toDate) {
          cleanData[key] = value.toDate().toISOString();
        } else {
          cleanData[key] = value;
        }
      }
      
      await setDoc(doc(newDb, collectionName, docId), cleanData);
      count++;
      
      if (count % 10 === 0) {
        console.log(`   Progress: ${count}/${snapshot.docs.length}`);
      }
    }
    
    console.log(`   ✅ Migrated ${count} documents`);
    return count;
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return 0;
  }
}

// Migrate storage
async function migrateStorage(folderPath) {
  console.log(`\n📁 Migrating storage: ${folderPath}`);
  
  try {
    const folderRef = ref(oldStorage, folderPath);
    const listResult = await listAll(folderRef);
    
    console.log(`   Found ${listResult.items.length} files`);
    
    let count = 0;
    for (const itemRef of listResult.items) {
      try {
        const downloadURL = await getDownloadURL(itemRef);
        const response = await fetch(downloadURL);
        const blob = await response.blob();
        
        const newRef = ref(newStorage, itemRef.fullPath);
        await uploadBytes(newRef, blob);
        
        count++;
        if (count % 5 === 0) {
          console.log(`   Progress: ${count}/${listResult.items.length}`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating file:`, error.message);
      }
    }
    
    console.log(`   ✅ Migrated ${count} files`);
    return count;
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return 0;
  }
}

// Main
async function main() {
  console.log('🚀 Starting Migration...\n');
  console.log('Old project:', OLD_CONFIG.projectId);
  console.log('New project:', NEW_CONFIG.projectId);
  
  // Migrate collections
  const collections = ['users', 'pets', 'chats', 'messages', 'mapSpots', 'conversations', 'threads', 'profiles', 'favorites'];
  let totalDocs = 0;
  
  for (const collectionName of collections) {
    const count = await migrateCollection(collectionName);
    totalDocs += count;
  }
  
  // Migrate storage
  await migrateStorage('pets');
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration completed!');
  console.log(`Total documents migrated: ${totalDocs}`);
  console.log('='.repeat(50));
}

main().catch(console.error);

