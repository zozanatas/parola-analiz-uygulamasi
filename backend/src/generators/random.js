// TAM RASTGELE MOD (FG-5): crypto.randomInt ile (CSPRNG) üretir.
// Analiz kuralları filtre olarak kullanılır: klavye/ardışık/tekrar veya yıl/tarih içeren
// adaylar elenir ve yeniden üretilir.
import { buildPools, pick, shuffle } from './charsets.js';
import { findSequences } from '../analyzers/sequence.js';
import { detectPersonalData } from '../analyzers/pattern.js';

export const RANDOM_LIMITS = { min: 6, max: 128, default: 16 };

export function generateRandom(opts) {
  const pools = buildPools(opts);
  const names = Object.keys(pools);
  const all = Object.values(pools).join('');
  const length = opts.length;

  for (let attempt = 0; attempt < 500; attempt++) {
    // her seçili türden en az 1 karakter + kalanı rastgele, sonra karıştır
    const chars = names.map((n) => pick(pools[n]));
    while (chars.length < length) chars.push(pick(all));
    const password = shuffle(chars).join('');
    if (findSequences(password).length === 0 && detectPersonalData(password).length === 0) {
      return { password, entropyBits: Math.round(length * Math.log2(all.length)) };
    }
  }
  throw new Error('Uygun parola üretilemedi');
}
