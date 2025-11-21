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
      // Set EXPO_PUBLIC_FIREBASE_* in .env file or environment
      // Fallback values for development (remove in production)
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 
                      (process.env.NODE_ENV !== 'production' ? 'AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0' : ''),
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 
                          (process.env.NODE_ENV !== 'production' ? 'petmedia-app-v2.firebaseapp.com' : ''),
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 
                         (process.env.NODE_ENV !== 'production' ? 'petmedia-app-v2' : ''),
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                              (process.env.NODE_ENV !== 'production' ? 'petmedia-app-v2.firebasestorage.app' : ''),
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 
                                 (process.env.NODE_ENV !== 'production' ? '17357521540' : ''),
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 
                     (process.env.NODE_ENV !== 'production' ? '1:17357521540:web:c7168bf86db8697c5df8d1' : ''),
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 
                             (process.env.NODE_ENV !== 'production' ? 'G-9W68V4VT5D' : ''),
    }
  }
};

