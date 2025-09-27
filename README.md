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

### 🗺️ Mamamatik (Snap-Map Style)
- Full-screen map showing community food/water spots
- Custom paw markers with clustering
- Add new spots with photos and notes
- Heatmap visualization of activity
- Location-based notifications

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

## 📁 Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── common/           # Generic components
│   └── layout/           # Layout components
├── stores/               # Zustand stores
├── services/             # API and external services
├── types/                # TypeScript type definitions
├── theme/                # Design system (colors, typography, spacing)
├── locales/              # Translation files
└── hooks/                # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator
- Expo Go app on your mobile device

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

3. **Configure Firebase** (or use mock services for demo):
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Set up Firestore database
   - Enable Storage
   - Copy configuration to `.env` file

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Run on device or simulator**:
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator

## 🔧 Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication with Email/Password
4. Create Firestore database in test mode
5. Enable Storage
6. Copy the config keys to your `.env` file

### Environment Variables

Update `.env` with your actual Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Type checking:
```bash
npm run typecheck
```

Linting:
```bash
npm run lint
```

## 📱 Platform Support

- ✅ iOS (tested with Expo Go)
- ✅ Android (tested with Expo Go)
- ✅ Web (Expo Web support)

## 🌍 Localization

The app supports multiple languages with i18next:
- 🇹🇷 Turkish (default)
- 🇺🇸 English

Add new languages by creating files in the `locales/` directory.

## 🎨 Design System

The app uses a comprehensive design system:

- **Colors**: Pastel palette with semantic color ramps
- **Typography**: Playfair Display + Inter with consistent scales  
- **Spacing**: 8px grid system
- **Components**: Reusable UI components with consistent styling

## 🔄 State Management

- **Zustand stores** for client-side state (auth, pets, filters)
- **TanStack Query** for server state and caching
- **Expo SecureStore** for sensitive data persistence

## 🚀 Deployment

### Expo Application Services (EAS)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Build for production:
   ```bash
   eas build --platform all
   ```

3. Submit to app stores:
   ```bash
   eas submit --platform all
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review the Firebase setup guide above
3. Open an issue in this repository

## 🏗️ Architecture

The app follows clean architecture principles:

- **Presentation Layer**: React Native components and screens
- **Business Logic**: Zustand stores and custom hooks  
- **Data Layer**: Firebase services with abstraction for easy swapping
- **UI Layer**: Design system with reusable components

This makes it easy to:
- Swap Firebase for Supabase or other backends
- Add new features without breaking existing code
- Test individual layers in isolation
- Scale the application as it grows

---

Built with ❤️ for our furry friends 🐾