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
      // DO NOT hardcode credentials here - use .env file instead
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
    }
  }
};

