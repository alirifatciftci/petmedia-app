// Load environment variables from .env file
require('dotenv').config();

export default {
  expo: {
    name: "PetMedia",
    slug: "petmedia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.svg",
    scheme: "petmedia",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.petmedia.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "PetMedia needs location access to show nearby pets and community spots.",
        NSCameraUsageDescription: "PetMedia needs camera access to take photos of pets.",
        NSPhotoLibraryUsageDescription: "PetMedia needs photo library access to select pet photos."
      }
    },
    android: {
      package: "com.petmedia.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/logo.svg"
    },
    plugins: [
      "expo-router", 
      "expo-font", 
      "expo-web-browser",
      "expo-camera",
      "expo-image-picker",
      "expo-location",
      "expo-notifications",
      "expo-secure-store"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      // Firebase configuration from environment variables
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAvGcePNoIhHJhguLTTlIXMdQWdnouGbYA',
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'petmediav3.firebaseapp.com',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'petmediav3',
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'petmediav3.firebasestorage.app',
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '595200415606',
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:595200415606:web:5821eaa2cbf9ce21804c57',
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-515TXLZX18',
    }
  }
};

