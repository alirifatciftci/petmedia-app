# 🔄 Firebase Veri Migrasyon Rehberi

## 📋 Adımlar

### 1. Yeni Firebase Projesinin Config'ini Al

1. Firebase Console'a git: https://console.firebase.google.com
2. **petmedia-app-v2** projesini seç
3. ⚙️ **Project Settings** > **General**
4. **Your apps** bölümünde **Web app** ekle (veya mevcut olanı seç)
5. Config bilgilerini kopyala:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 2. Migration Script'ini Güncelle

**Seçenek A: TypeScript Script (Önerilen)**

`scripts/migrate-firebase.ts` dosyasını aç ve `NEW_FIREBASE_CONFIG` değerlerini güncelle:

```typescript
const NEW_FIREBASE_CONFIG = {
  apiKey: "YENİ_API_KEY_BURAYA",
  authDomain: "petmedia-app-v2.firebaseapp.com",
  projectId: "petmedia-app-v2",
  storageBucket: "petmedia-app-v2.firebasestorage.app",
  messagingSenderId: "YENİ_SENDER_ID",
  appId: "YENİ_APP_ID",
};
```

**Seçenek B: JavaScript Script (Daha Kolay)**

`scripts/migrate-firebase-simple.js` dosyasını aç ve `NEW_CONFIG` değerlerini güncelle.

### 3. Script'i Çalıştır

**TypeScript için:**
```bash
# ts-node yükle (eğer yoksa)
npm install -g ts-node

# Script'i çalıştır
npx ts-node scripts/migrate-firebase.ts
```

**JavaScript için:**
```bash
node scripts/migrate-firebase-simple.js
```

### 4. Yeni Projede Servisleri Aktifleştir

Yeni projede şunları aktifleştirdiğinden emin ol:

1. **Authentication:**
   - Authentication > Sign-in method > Email/Password > Enable

2. **Firestore:**
   - Firestore Database > Create database
   - Test mode seç
   - Location seç (örn: europe-west1)

3. **Storage:**
   - Storage > Get started
   - Test mode seç
   - Location seç

### 5. Kodda Config'i Güncelle

`services/firebase.ts` dosyasındaki config'i güncelle:

```typescript
export const firebaseConfig = {
  apiKey: "YENİ_API_KEY",
  authDomain: "petmedia-app-v2.firebaseapp.com",
  projectId: "petmedia-app-v2",
  storageBucket: "petmedia-app-v2.firebasestorage.app",
  messagingSenderId: "YENİ_SENDER_ID",
  appId: "YENİ_APP_ID",
  measurementId: "YENİ_MEASUREMENT_ID" // Analytics varsa
};
```

## ⚠️ Önemli Notlar

1. **Firestore Rules:** Yeni projede Firestore rules'ları ayarla (test mode veya production rules)
2. **Storage Rules:** Storage rules'ları da ayarla
3. **Authentication:** Email/Password authentication'ı aktifleştir
4. **Test:** Migration sonrası uygulamayı test et

## 🔍 Migration Sonrası Kontrol

1. Firebase Console'da yeni projeyi aç
2. Firestore'da collections'ları kontrol et:
   - users
   - pets
   - chats
   - messages
   - mapSpots
3. Storage'da dosyaları kontrol et:
   - pets/ klasörü
4. Uygulamayı çalıştır ve test et

## 🆘 Sorun Giderme

**Hata: "Permission denied"**
- Firestore ve Storage rules'larını kontrol et
- Test mode'da olduğundan emin ol

**Hata: "Collection not found"**
- Eski projede collection'ın var olduğundan emin ol
- Collection adlarını kontrol et

**Hata: "Storage folder not found"**
- Eski projede storage'da dosya olup olmadığını kontrol et
- Folder path'ini kontrol et

## 📊 Migration İstatistikleri

Script çalıştıktan sonra şunları göreceksin:
- Her collection için migrate edilen document sayısı
- Storage'dan migrate edilen dosya sayısı
- Hata sayısı (varsa)

## ✅ Tamamlandı!

Migration tamamlandıktan sonra:
1. Yeni config'i kodda güncelle
2. Uygulamayı test et
3. Eski projeyi kapatabilirsin (isteğe bağlı)

