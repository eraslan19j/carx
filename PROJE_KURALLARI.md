# PROJE_KURALLARI.md

Bu belge, Apollo oyun projesindeki sonraki tüm işler için ürün ve teslimat kurallarını tanımlar.

## Kullanıcıyla çalışma biçimi
- Kullanıcı kodlama bilmez. Gereken tüm kodu ve dosyaları ajan hazırlar; kullanıcıdan kod yazması veya terminal kullanması istenmez.
- Sonuçları Türkçe ve kısa anlat. Kullanıcıdan istenecek adımlar yalnızca ekranda nereye tıklayacağını söyleyecek kadar basit olsun.
- Küçük adımlarla ilerle ve her görevde yalnızca istenen tek özelliği ele al. İstenmeyen özellik, tasarım değişikliği veya kapsam genişletmesi ekleme.
- Değişiklik bitince telefonda beklenen görünümü anlatan kısa, maddeli bir **Telefon test listesi** ver.

## Ürün vizyonu
- Oyun; sıcak, renkli, stilize/çizgi film estetiğinde bir 3B keşif ve fotoğraf çekme macerasıdır.
- Savaş veya şiddet mekaniği ekleme.
- Orta seviye Android telefonları hedefle; 30 FPS ve üzerini gözet, çizim yükünü ve bellek kullanımını düşük tut.
- Ağır görsel efektler bulunursa ayarlardan ayrı ayrı kapatılabilsin. Varsayılan ayarlar orta seviye telefonda akıcı çalışmayı hedeflesin.
- Görsel ve mekanik kararlar bu vizyona hizmet etmeli; kullanıcı istemedikçe yeni özellik eklenmemeli.

## Varlıklar ve lisanslar
- Dışarıdan hazır görsel, model, ses veya başka bir varlık gerektiğinde yalnızca lisansı doğrulanmış CC0/ücretsiz kaynak kullan: Kenney, Quaternius veya Poly Haven.
- Kullanılan her dış varlığın adı, kaynağı, doğrudan bağlantısı ve lisansı `CREDITS.md` dosyasına yazılmalı.
- Lisans veya indirme doğrulanamıyorsa varlığı kullanma; kodla prosedürel bir çözüm üret.
- Çalışma anında, izin verilmeyen dış sunuculardan varlık yükleme.

## Uygulama, derleme ve teslim
- Her değişiklikten sonra ilgili kontrolleri ve üretim derlemesini çalıştır. Bir şey çalışmazsa tahmin yürütme: gerçek logu, kaynak kodu ve hatanın oluştuğu adımı inceleyip kök nedeni bul; sonra düzeltip yeniden doğrula.
- Android uygulaması mevcut ve derlenebilir olduğunda APK'yı GitHub Actions üzerinden üret. Başarılı derlemeyi Actions sonucundan doğrulamadan APK'nın hazır olduğunu söyleme.
- Sonuçta doğrudan indirilebilir `.apk` bağlantısı ver. Pipeline yalnızca ZIP artifact'i sunuyorsa bunu açıkça belirt ve içindeki APK'ya ulaşmak için kısa indirme/açma adımlarını yaz.
- APK işi mevcut değilse veya derleme ortamı yoksa bunu başarı gibi gösterme; engeli ve gereken tek tıklama adımını kısa biçimde açıkla.
- Her teslimin sonunda **Telefon test listesi** bulunmalı.

## Dal ve GitHub çalışma kuralı
- Değişiklikleri Arena oturumunun etkin çalışma dalında yap; dal değiştirme veya başka bir dalı oluşturup/değiştirip gönderme.
- Ortam kuralları `main` dalına doğrudan gönderimi yasaklıyorsa `main`e push etme. Etkin daldaki değişiklikleri commit et ve gerekiyorsa `main`e alınması için bu daldan Pull Request aç; kullanıcıya PR'ı inceleyip birleştireceği yeri söyle.
- Yalnızca istenen dosya ve değişiklikleri gönder. Üretilen APK, derleme çıktısı ve önbellekleri Git'e ekleme; kullanıcı ayrıca istemedikçe Actions artifact'i olarak tut.
