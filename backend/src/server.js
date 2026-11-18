import { fileURLToPath } from 'node:url';

// backend/.env varsa yükle (Node 20.12+ yerleşik; dosya yoksa sessizce geç)
try {
  process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch {
  // .env yok: varsayılanlar kullanılır
}

const { createApp } = await import('./app.js');

const port = Number(process.env.PORT) || 3001;
createApp().listen(port, () => console.log(`Parola uygulaması http://localhost:${port} adresinde çalışıyor`));
