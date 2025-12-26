# PetMedia - Proje Dokümantasyonu

## 1. Proje Özeti

**PetMedia**, hayvan sahiplendirme sürecini kolaylaştıran, sokak hayvanları için yardım noktaları oluşturan ve hayvan severler arasında iletişim kurmayı sağlayan bir mobil uygulamadır.

**Platform:** iOS & Android (Cross-platform)
**Geliştirme Süresi:** 2024-2025

---

## 2. Teknoloji Stack

### 2.1 Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| React Native | 0.81.x | Cross-platform mobil uygulama |
| Expo | SDK 54 | Geliştirme araçları ve native API |
| TypeScript | 5.x | Tip güvenliği |
| Expo Router | 6.x | Dosya tabanlı navigasyon |

### 2.2 Backend & Veritabanı
| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| Firebase Authentication | Kullanıcı kimlik doğrulama |
| Cloud Firestore | NoSQL veritabanı |
| Base64 Encoding | Görsel depolama |

### 2.3 State Management & UI
| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| Zustand | Global state yönetimi |
| React Native Reanimated | Animasyonlar |
| Lucide React Native | İkon kütüphanesi |
| react-i18next | Çoklu dil desteği |

---

## 3. Veritabanı Şeması (Firestore)

### Koleksiyonlar

| Koleksiyon | Açıklama |
|------------|----------|
| users | Kullanıcı bilgileri, profil fotoğrafı, favoriler |
| pets | İlan detayları, Base64 fotoğraflar |
| chats | Mesajlaşma odaları |
| messages | Mesaj içerikleri ve zaman damgaları |
| mapSpots | Harita noktaları koordinatları |

---

## 4. Uygulama Özellikleri

- ✅ E-posta/şifre ile kayıt ve giriş
- ✅ Hayvan ilanı oluşturma (3 adımlı form)
- ✅ Çoklu fotoğraf yükleme (Base64)
- ✅ Real-time mesajlaşma
- ✅ Harita üzerinde yardım noktaları
- ✅ Çoklu dil desteği (TR/EN)
- ✅ Favori sistemi

---

## 5. Klasör Yapısı

```
petmedia/
├── app/                    # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigation
│   └── chat.tsx           # Sohbet ekranı
├── components/            # Yeniden kullanılabilir bileşenler
├── services/              # Firebase servisleri
├── stores/                # Zustand store'ları
├── types/                 # TypeScript tipleri
├── theme/                 # UI tema sistemi
├── locales/               # Dil dosyaları (TR/EN)
└── docs/                  # Dokümantasyon
```

---

## 6. Kurulum

```bash
npm install
cp .env.example .env
# Firebase bilgilerini .env'e ekle
npx expo start
```

---

**Son Güncelleme:** Aralık 2024