# Bitirme Projesi Sunum Notları - Veritabanı Bölümü

## Jüriye Anlatılacaklar

### 1. Neden Firebase Firestore?

**Geleneksel SQL yerine NoSQL tercih sebepleri:**
- Mobil uygulama için optimize edilmiş
- Gerçek zamanlı senkronizasyon (mesajlaşma için kritik)
- Offline çalışma desteği
- Otomatik ölçeklendirme
- Ücretsiz başlangıç kotası

### 2. Veritabanı Yapısı Gösterimi

**Firebase Console'dan gösterilecekler:**
1. Firebase Console → Firestore Database aç
2. Her koleksiyonu (users, pets, chats, messages, mapSpots) göster
3. Örnek bir dokümanın içeriğini göster
4. Gerçek zamanlı güncellemeyi göster (mesaj at, anında görünsün)

### 3. Diyagram Araçları

**draw.io ile diyagram oluşturmak için:**
1. https://app.diagrams.net adresine git
2. DATABASE_SCHEMA.md dosyasındaki ASCII diyagramı referans al
3. "Entity Relationship" şablonunu kullan
4. Her koleksiyon için bir kutu oluştur
5. İlişkileri oklar ile göster

### 4. Jüri Soruları için Hazırlık

**Olası sorular ve cevaplar:**

**S: Neden SQL kullanmadınız?**
C: Mobil uygulamada gerçek zamanlı mesajlaşma ve offline destek kritik. Firestore bu özellikleri kutudan çıkar çıkmaz sunuyor. Ayrıca şema esnekliği, hızlı prototipleme için ideal.

**S: İlişkiler nasıl kuruldu?**
C: Document referansları ile. Örneğin pets.ownerId, users koleksiyonundaki bir dokümanı referans ediyor. NoSQL'de JOIN yerine client-side birleştirme yapıyoruz.

**S: Veri tutarlılığı nasıl sağlanıyor?**
C: Firebase Security Rules ile. Kullanıcı sadece kendi verilerini değiştirebilir. Ayrıca transaction'lar ile atomik işlemler yapılabiliyor.

**S: Ölçeklenebilirlik?**
C: Firestore otomatik olarak ölçeklenir. Milyonlarca kullanıcıya kadar ek konfigürasyon gerektirmez.

### 5. Demo Sırası

1. Uygulamayı aç
2. Yeni kullanıcı kaydet → users koleksiyonunda görünsün
3. Pet ilanı oluştur → pets koleksiyonunda görünsün
4. Mesaj gönder → messages koleksiyonunda anlık görünsün
5. Harita noktası ekle → mapSpots koleksiyonunda görünsün

### 6. Teknik Detaylar

**Koleksiyon Sayısı:** 5
**Toplam Alan Sayısı:** ~45
**İlişki Sayısı:** 5
**Gerçek Zamanlı Listener:** 3

**Kullanılan Firebase Servisleri:**
- Firebase Authentication (kullanıcı girişi)
- Cloud Firestore (veritabanı)
- (Opsiyonel) Firebase Hosting (web versiyonu için)
