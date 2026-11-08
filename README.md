# Küçük Dünya

Sıcak, stilize bir 3B keşif ve fotoğraf macerası için prosedürel ada sahnesi. Bu ilk dilimde yaklaşık 200 × 200 metrelik, yumuşak noise tabanlı tepeler ve vadilerden oluşan bir ada; çevresinde animasyonlu, yarı saydam su; otomatik dönen kamera ve ileride yürüyüş karakterinin kullanacağı yükseklik alanı çarpışma sorgusu bulunur.

## Çalıştırma

```bash
npm install
npm run dev
```

Üretim derlemesi: `npm run build`. Android kabuğunu eşitlemek için `npm run cap:sync` (Java ve Android SDK gerekir).

## Android APK

GitHub Actions'ta **Küçük Dünya APK & Release** iş akışı her `main` push'unda debug APK'yı derler ve `latest` Release'e yükler. Sabit APK bağlantısı:

[**Küçük Dünya debug APK'sını indir**](https://github.com/eraslan19j/carx/releases/download/latest/kucuk-dunya-debug.apk)

APK hata ayıklama imzalıdır. Telefonda bağlantıya dokunup indir; indirme tamamlanınca dosyayı aç ve Android'in istediği yükleme iznini ver.

## Teknik notlar

- Arazi ve su tamamen kodla üretilir; dış model, doku veya font kullanılmaz.
- `src/terrain.ts` sabit tohumlu fraktal noise ile üçgen arazi üretir.
- `src/collision.ts` gelecekteki karakter için `sampleGround(x, z)` yükseklik/normal/yürünebilirlik sorgusu sağlar.
- Su dalgaları ekrandaki düğmeden kapatılabilir. Arazi statik tampon geometridir; gölgeler ve ağır son işleme kapalıdır.

Telefon testi için: adanın tamamı dönerek görünmeli; sahilde açık renkli sığlık, içeride yumuşak tepeler ve vadiler seçilmeli; dalga düğmesi suyu durdurup başlatmalı.
