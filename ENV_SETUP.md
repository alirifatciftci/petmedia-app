# Environment Variables Setup

## 🔐 Firebase Configuration

Firebase config bilgileri artık environment variable'lar ile yönetiliyor. Güvenlik için config bilgilerini kod içinde saklamıyoruz.

### Adımlar:

1. **Root dizinde `.env` dosyası oluştur:**
   ```bash
   # .env dosyası oluştur
   touch .env
   ```

2. **Firebase Console'dan config bilgilerini al:**
   - Firebase Console > petmedia-app-v2 > Project Settings > General
   - Your apps > Web app > Config bilgilerini kopyala

3. **`.env` dosyasına ekle:**
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB9zqqbVuCaPO3tL1uMhXcCPi-F7rJmcr0
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=petmedia-app-v2.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=petmedia-app-v2
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=petmedia-app-v2.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=17357521540
   EXPO_PUBLIC_FIREBASE_APP_ID=1:17357521540:web:c7168bf86db8697c5df8d1
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-9W68V4VT5D
   ```

4. **Uygulamayı yeniden başlat:**
   ```bash
   npm start
   ```

### ⚠️ Önemli:
- `.env` dosyası `.gitignore`'da olduğu için git'e push edilmez
- `.env` dosyasını asla commit etme!
- Her geliştirici kendi `.env` dosyasını oluşturmalı

