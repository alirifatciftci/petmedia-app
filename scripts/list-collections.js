/**
 * List all collections in old Firebase project
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const OLD_CONFIG = {
  apiKey: "AIzaSyDgOVFJHZJqYCN8mbVsSsH-xVcbXeLyqVo",
  authDomain: "petmedia-app.firebaseapp.com",
  projectId: "petmedia-app",
  storageBucket: "petmedia-app.firebasestorage.app",
  messagingSenderId: "955384772369",
  appId: "1:955384772369:web:4186aa8cdb66977b28beb0",
};

async function listAllCollections() {
  console.log('🔍 Listing all collections in old Firebase project...\n');
  
  try {
    const app = initializeApp(OLD_CONFIG);
    const db = getFirestore(app);
    
    // Known collections to check
    const knownCollections = [
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
    
    console.log('Checking known collections:');
    for (const collectionName of knownCollections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`  ✅ ${collectionName}: ${snapshot.docs.length} documents`);
      } catch (error) {
        console.log(`  ❌ ${collectionName}: Error - ${error.message}`);
      }
    }
    
    console.log('\n💡 Note: Firestore doesn\'t have a direct API to list all collections.');
    console.log('   Check Firebase Console > Firestore > Data for all collections.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllCollections().catch(console.error);

