# PetMedia - Pet Adoption & Community App

A production-ready React Native mobile app built with Expo for connecting pet owners with adopters and building a community around pet care.

## 🎨 Design

The app follows a pastel, friendly design system inspired by the provided references:
- Soft cream background (#faf7f0)
- Lilac/purple accent colors
- Rounded cards (2xl radius)
- Playfair Display for headlines, Inter for body text
- Micro-animations and spring transitions

## ✨ Features

### 🏠 Home Feed
- Grid/list view of adoptable pets
- Advanced filtering (species, age, location, vaccination status)
- Search functionality
- Infinite scroll with pull-to-refresh
- Favorite/save pets functionality

### 🗺️ Interactive Map (Community Spots)
- Full-screen map showing community food/water spots
- Tap-to-add functionality for creating new spots
- Real-time updates from Firebase
- Spot types: Water, Food, Both, Shelter, Veterinary
- Contribution system - users can contribute to existing spots
- Custom markers with contributor count badges

### ➕ Create Listing
- Multi-step form with image upload
- Camera/gallery integration
- Geolocation tagging
- Form validation with Zod
- Draft autosave functionality

### 💬 Messages
- Real-time chat between pet owners and adopters
- Typing indicators and online status
- Message threading per pet listing

### 👤 Profile
- User management and settings
- My listings, saved pets, contributions
- Language switching (TR/EN)
- Authentication with email/password

### 🔔 Notifications
- Push notifications for new messages
- Adoption application updates
- Nearby community activity alerts

## 🛠️ Tech Stack

- **Framework**: Expo SDK 53+ with TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand for client state
- **Data Fetching**: TanStack Query (React Query)
- **Validation**: Zod schemas
- **Localization**: i18next (Turkish default, English optional)
- **Styling**: StyleSheet with design system
- **Animations**: React Native Reanimated
- **Maps**: react-native-maps
- **Backend**: Firebase (Auth, Firestore, Storage) - easily swappable

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd petmedia
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Firebase credentials
# Get these from Firebase Console > Project Settings > General
```

4. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `.env` file

5. Start the development server:
```bash
npm start
```

## 📝 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

**Important**: Never commit your `.env` file to git. The `.env.example` file is provided as a template.

## 🔒 Security

- Firebase API keys and credentials are stored in environment variables
- `.env` file is gitignored
- Use `.env.example` as a template for required variables

## 📱 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Design inspiration from modern pet adoption platforms
- Community-driven approach inspired by "One Bowl of Food, One Bowl of Water" movement
