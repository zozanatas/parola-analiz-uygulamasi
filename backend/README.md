# Parola Analiz ve Üretim Backend'i

Node.js + Express API. Parola gücünü 3 analizle 0-10 arası puanlar ve iki modda parola üretir.
**Stateless**: parolalar saklanmaz, loglanmaz, önbelleğe alınmaz (`Cache-Control: no-store`).

## Çalıştırma
```bash
npm install
cp .env.example .env   # opsiyonel (PORT, CORS_ORIGIN)
npm start              # http://localhost:3001   (geliştirme: npm run dev)
npm test
```

## Endpoint'ler

### `POST /api/analyze`
```json
{ "password": "Demir*44Ahmet" }
```
Cevap (kısaltılmış):
```json
{
  "score": 9, "max": 10, "level": "very_strong", "label": "Çok Güçlü",
  "analyses": {
    "complexity": { "score": 9.1, "message": "...", "findings": { "length": 13, "missing": [] } },
    "sequence":   { "score": 10,  "message": "...", "findings": [] },
    "pattern":    { "score": 8,   "message": "...", "findings": { "words": ["demir","ahmet"], "embedded": [], "personal": [], "common": false } }
  },
  "weaknesses": ["Parola kısa"],
  "suggestions": ["Parolanızı en az 12-16 karaktere çıkarın."]
}
```
`level`: `weak | average | risky | strong | very_strong` (frontend renk/ikon için).
Hata: `400 { "error": "..." }` (parola boş, string değil veya 128 karakterden uzun).

### `POST /api/generate`
Tüm alanlar opsiyoneldir:
```json
{
  "mode": "random",          // "random" | "memorable"   (varsayılan random)
  "length": 16,              // random: 6-128, memorable: 16-48
  "lowercase": true, "uppercase": true, "digit": true, "special": true,
  "excludeSimilar": false,   // O/0, l/1/I gibi karışan karakterleri çıkarır
  "wordCount": 3             // sadece memorable, 3 veya 4 (boşsa uzunluğa göre otomatik)
}
```
Cevap:
```json
{ "mode": "memorable", "length": 18, "password": "Saat*Terzi:Inek36.", "entropyBits": 44,
  "score": 10, "max": 10, "level": "very_strong", "label": "Çok Güçlü" }
```
`GET /api/health` -> `{ "status": "ok" }`

## Puanlama özeti
| Analiz | Ne yapar |
|---|---|
| Karmaşıklık | (uzunluk puanı + çeşitlilik puanı) / 2. 16+ karakter ve 4 karakter türü = 10 |
| Ardışıklık | Q/F klavye sıraları ve sütunları, 123/987/abc, aaaa, abab/123123. Kapsanan karakter oranına göre düşer |
| Anlamlılık/Örüntü | 3+ farklı kelime = 10, 2 kelime = 8 (sadece harfse 6), tek kelime oranına göre düşer, rastgele = 8, yaygın parola = 0, yıl/tarih her biri -3 |

Genel skor = üçünün ortalaması, ancak: **kısa parola tavanı** (<6 karakter ≤1.9, <8 ≤3.9, <10 ≤7.9) ve
**en zayıf halka tavanı** (`en düşük skor × 1.25 + 1.9`) uygulanır. Etiketler: <2 Güçsüz, <4 Ortalama, <6 Riskli Güçlü, <8 Güçlü, ≥8 Çok Güçlü.
Tüm eşikler `src/analyzers/*.js` ve `src/services/scoreEngine.js` içinde tek yerde durur.

## Klasör yapısı
```
src/
  analyzers/   sequence.js  complexity.js  pattern.js
  generators/  random.js  memorable.js  charsets.js
  services/    scoreEngine.js  generateService.js
  routes/      api.js
  data/        wordlist_tr/en.txt  names_tr.txt  memorable_tr.txt  common_passwords.txt  loader.js
  app.js  server.js
test/api.test.js
```
Akılda kalıcı modun kelimeleri `src/data/memorable_tr.txt` içindedir (satır başına bir kelime, küçük harf, ASCII).
Listeyi büyütmek parola entropisini doğrudan artırır.
