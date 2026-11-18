# Akıllı Parola Analiz ve Üretim Asistanı

Fırat Üniversitesi Bilgisayar Mühendisliği Tasarımı projesi (27. Proje Grubu).
Parola gücünü 3 analizle (karmaşıklık, ardışıklık, anlamlılık) 0-10 arası puanlar ve
iki modda (tam rastgele / akılda kalıcı) güvenli parola üretir. Parolalar hiçbir yerde saklanmaz veya loglanmaz.

## Yerelde çalıştırma (Node.js 20.12+)

Proje klasöründe PowerShell açın ve aşağıdaki komutları çalıştırın.

```powershell
npm --prefix backend ci
$env:PORT = '3101'
npm --prefix backend start
```

Bağımlılıklar kuruluysa ilk komutu atlayabilirsiniz. Sunucu başladıktan sonra
[http://localhost:3101](http://localhost:3101) adresini açın ve terminali açık tutun.
Express hem arayüzü hem API'yi aynı adresten sunar.

Portu `PORT` ortam değişkeninden veya `backend/.env` dosyasından seçebilirsiniz.
İkisi de ayarlanmamışsa uygulama 3001 portunu kullanır.

Testleri çalıştırmak için `npm --prefix backend test` komutunu kullanın.

## Klasörler
- `backend/` — Node.js + Express API ve analiz/üretim algoritmaları (ayrıntı: `backend/README.md`)
- `frontend/` — Tek sayfalık arayüz (HTML + Tailwind + JS)
