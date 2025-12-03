# JS Bundle Yükleme Sorunları - Çözüm Kılavuzu

## Sorun: QR kod okutunca JS bundle yüklenmiyor

### Hızlı Çözümler

#### 1. Cache Temizle ve Yeniden Başlat
```bash
npm start
```
Bu komut otomatik olarak `--clear` flag'i ile cache'i temizleyip başlatır.

#### 2. LAN Modunu Dene (Aynı Wi-Fi'deyseniz)
```bash
npm run start:lan
```
Aynı Wi-Fi ağındaysanız bu daha hızlı çalışır.

#### 3. Tunnel Modunu Dene
```bash
npm start
```
Veya manuel:
```bash
npx expo start --clear --tunnel
```

### Detaylı Çözümler

#### Windows Firewall Kontrolü
1. Windows Defender Firewall'u açın
2. "Gelen kuralları görüntüle" seçin
3. Node.js ve Expo için kuralların aktif olduğundan emin olun
4. Gerekirse, Node.js için yeni bir kural ekleyin (Port 8081)

#### Port Kontrolü
Metro bundler varsayılan olarak 8081 portunu kullanır. Başka bir uygulama bu portu kullanıyorsa:
```bash
# Portu kullanan uygulamayı bul
netstat -ano | findstr :8081

# Veya farklı port kullan
npx expo start --port 8082
```

#### Manuel Cache Temizleme
```bash
# Metro cache
npx expo start --clear

# Node modules ve cache
rm -rf node_modules
rm -rf .expo
npm install
npx expo start --clear
```

#### Expo Go Uygulamasını Yeniden Başlat
1. Expo Go uygulamasını tamamen kapatın
2. Uygulamayı yeniden açın
3. QR kodu tekrar okutun

### Alternatif Yöntemler

#### Development Build Kullan
```bash
# iOS için
npm run ios

# Android için
npm run android
```

#### Web'de Test Et
```bash
npx expo start --web
```

### Hata Ayıklama

#### Logları Kontrol Et
Terminal'de şu hataları kontrol edin:
- "Unable to resolve module"
- "Network request failed"
- "Connection refused"

#### Network Bağlantısını Kontrol Et
- Telefon ve bilgisayar aynı Wi-Fi ağında mı?
- VPN kullanıyorsanız kapatın
- Firewall ayarlarını kontrol edin

### Yaygın Hatalar ve Çözümleri

#### "Unable to connect to Metro"
- Çözüm: `npm start` ile cache temizleyerek başlatın

#### "Network request failed"
- Çözüm: LAN modunu deneyin: `npm run start:lan`

#### "Bundle failed to load"
- Çözüm: `npx expo start --clear` ile cache temizleyin

### İletişim
Sorun devam ederse, terminal çıktısını paylaşın.

