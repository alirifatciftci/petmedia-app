/**
 * Check if new Firebase project is ready for migration
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getStorage, ref, listAll } = require('firebase/storage');

const NEW_CONFIG = {
  apiKey: "AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0",
  authDomain: "petmedia-app-v2.firebaseapp.com",
  projectId: "petmedia-app-v2",
  storageBucket: "petmedia-app-v2.firebasestorage.app",
  messagingSenderId: "17357521540",
  appId: "1:17357521540:web:c7168bf86db8697c5df8d1",
};

async function checkProject() {
  console.log('🔍 Checking new Firebase project...\n');
  
  try {
    const app = initializeApp(NEW_CONFIG);
    const db = getFirestore(app);
    const storage = getStorage(app);
    
    console.log('✅ Firebase initialized');
    
    // Check Firestore
    try {
      const testCollection = collection(db, 'test');
      await getDocs(testCollection);
      console.log('✅ Firestore is accessible');
    } catch (error) {
      console.log('⚠️  Firestore might not be initialized or rules need adjustment');
      console.log('   Make sure Firestore is created in Firebase Console');
    }
    
    // Check Storage
    try {
      const rootRef = ref(storage, '/');
      await listAll(rootRef);
      console.log('✅ Storage is accessible');
    } catch (error) {
      console.log('⚠️  Storage might not be initialized or rules need adjustment');
      console.log('   Make sure Storage is created in Firebase Console');
    }
    
    console.log('\n✅ Project check completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure Authentication > Email/Password is enabled');
    console.log('   2. Make sure Firestore is created (test mode is OK)');
    console.log('   3. Make sure Storage is created (test mode is OK)');
    console.log('   4. Run: node scripts/migrate-firebase-simple.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Make sure:');
    console.log('   - Firebase project is created');
    console.log('   - Config values are correct');
    console.log('   - Firestore and Storage are initialized');
  }
}

checkProject().catch(console.error);

