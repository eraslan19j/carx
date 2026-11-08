# Küçük Dünya

Sıcak, stilize bir 3B keşif ve fotoğraf macerası için prosedürel ada sahnesi. Yaklaşık 200 × 200 metrelik yumuşak tepeler ve vadiler; bulutlu, renk değiştiren stilize gökyüzü; yaklaşık 10 dakikada gün doğumundan geceye geçen ışık ve renkli sis; toon/boyalı arazi; yumuşak gölgeler ve Düşük/Orta/Yüksek görüntü kalitesi ayarları bulunur. Otomatik kamera ve gelecekteki yürüyüş karakteri için yükseklik alanı çarpışma sorgusu da korunur.

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

- Arazi, bulutlar, toon ışık rampası ve su kodla üretilir; dış model, doku veya font kullanılmaz.
- `src/sky.ts` gökyüzü/bulutları; `src/terrain.ts` sabit tohumlu fraktal araziyi üretir.
- Gün döngüsü 600 saniyedir. Renkli sis, güneş/ortam ışığı ve su renkleri günün evresine göre yumuşakça değişir.
- Düşük kalite gölgeleri kapatır ve su geometrisini azaltır; Orta/Yüksek yumuşak gölgeler kullanır. Seçim cihazda hatırlanır.
- `src/collision.ts` gelecekteki karakter için `sampleGround(x, z)` yükseklik/normal/yürünebilirlik sorgusu sağlar.
- Su dalgaları ekrandaki düğmeden kapatılabilir; ağır son işleme kullanılmaz.

Telefon testi için: ada dönerek görünmeli; gökyüzündeki bulutlar akmalı, ışık yaklaşık 10 dakikada gün doğumu/öğle/gün batımı/gece renklerine geçmeli; Düşük/Orta/Yüksek ayarları görüntü kalitesi ve gölgeleri değiştirmeli; dalga düğmesi suyu durdurup başlatmalı.
