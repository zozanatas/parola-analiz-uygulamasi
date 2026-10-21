// Girdi doğrulama + üretici seçimi + üretilen parolanın skorlanması
import { generateRandom, RANDOM_LIMITS } from '../generators/random.js';
import { generateMemorable, MEMORABLE_LIMITS } from '../generators/memorable.js';
import { analyzePassword } from './scoreEngine.js';

export class ValidationError extends Error {}

const bool = (v, def) => (v === undefined || v === null ? def : v);

export function generatePassword(body = {}) {
  const mode = body.mode ?? 'random';
  if (mode !== 'random' && mode !== 'memorable') {
    throw new ValidationError("mode 'random' veya 'memorable' olmalıdır.");
  }
  const limits = mode === 'random' ? RANDOM_LIMITS : MEMORABLE_LIMITS;

  const length = body.length ?? limits.default;
  if (!Number.isInteger(length) || length < limits.min || length > limits.max) {
    throw new ValidationError(`length ${limits.min}-${limits.max} arasında bir tam sayı olmalıdır.`);
  }
  const flags = {
    lowercase: bool(body.lowercase, true),
    uppercase: bool(body.uppercase, true),
    digit: bool(body.digit, true),
    special: bool(body.special, true),
    excludeSimilar: bool(body.excludeSimilar, false),
  };
  for (const [k, v] of Object.entries(flags)) {
    if (typeof v !== 'boolean') throw new ValidationError(`${k} true/false olmalıdır.`);
  }
  if (mode === 'random') {
    const selected = ['lowercase', 'uppercase', 'digit', 'special'].filter((k) => flags[k]).length;
    if (selected === 0) throw new ValidationError('En az bir karakter türü seçilmelidir.');
    if (length < selected) throw new ValidationError('length seçilen karakter türü sayısından küçük olamaz.');
  } else {
    if (!flags.lowercase && !flags.uppercase) {
      throw new ValidationError('Akılda kalıcı modda küçük veya büyük harften en az biri seçilmelidir.');
    }
    if (body.wordCount !== undefined && (![3, 4].includes(body.wordCount))) {
      throw new ValidationError('wordCount 3 veya 4 olmalıdır.');
    }
  }

  const gen = mode === 'random'
    ? generateRandom({ length, ...flags })
    : generateMemorable({ length, wordCount: body.wordCount, ...flags });
  const analysis = analyzePassword(gen.password);

  return {
    mode,
    length: gen.password.length,
    password: gen.password,
    entropyBits: gen.entropyBits,
    score: analysis.score,
    max: 10,
    level: analysis.level,
    label: analysis.label,
  };
}
