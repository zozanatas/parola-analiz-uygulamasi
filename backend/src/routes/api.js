import { Router } from 'express';
import { analyzePassword } from '../services/scoreEngine.js';
import { generatePassword, ValidationError } from '../services/generateService.js';

export const MAX_PASSWORD_LENGTH = 128;

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

// POST /api/analyze   { "password": "..." }
router.post('/analyze', (req, res) => {
  const { password } = req.body ?? {};
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'password alanı dolu bir metin olmalıdır.' });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Parola en fazla ${MAX_PASSWORD_LENGTH} karakter olabilir.` });
  }
  res.json(analyzePassword(password));
});

// POST /api/generate  { "mode": "random"|"memorable", "length": 16, "lowercase": true, ... }
router.post('/generate', (req, res) => {
  try {
    res.json(generatePassword(req.body ?? {}));
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

export default router;
