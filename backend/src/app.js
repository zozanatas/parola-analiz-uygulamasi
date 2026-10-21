import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors(origins.length ? { origin: origins } : {}));

  // FOG-1: Parolalar hiçbir yerde saklanmaz ve loglanmaz.
  //  - İstek gövdesini loglayan bir middleware (morgan vb.) KULLANMAYIN.
  //  - Tarayıcı/proxy önbelleğine girmesin diye no-store gönderilir.
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '4kb' }));

  app.use('/api', apiRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Bulunamadı.' }));

  // Hata mesajı bilerek loglanmaz/döndürülmez: JSON ayrıştırma hataları gövdeden
  // bir parça (yani parola) içerebilir.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status && err.status < 500 ? err.status : 500;
    res.status(status).json({ error: status === 500 ? 'Sunucu hatası.' : 'Geçersiz istek.' });
  });

  return app;
}
