// AKILDA KALICI MOD (FG-6): kısa/yaygın kelime listesinden anlamsal bağı olmayan
// 3-4 kelime seçer, aralarına rakam ve özel karakter yerleştirir.
// Örnek: Ceviz-92-Mavi-Kilit!
import { randomInt } from 'node:crypto';
import { MEMORABLE_WORDS } from '../data/loader.js';
import { SETS, SIMILAR, pick } from './charsets.js';
import { findSequences } from '../analyzers/sequence.js';
import { detectPersonalData } from '../analyzers/pattern.js';

export const MEMORABLE_LIMITS = { min: 16, max: 48, default: 16 };

const cap = (w) => w[0].toUpperCase() + w.slice(1);

export function generateMemorable(opts) {
  const { length, lowercase, uppercase, digit, special, excludeSimilar } = opts;
  const digits = excludeSimilar ? [...SETS.digit].filter((c) => !SIMILAR.has(c)).join('') : SETS.digit;
  const specials = excludeSimilar ? [...SETS.special].filter((c) => !SIMILAR.has(c)).join('') : SETS.special;
  const wordCount = opts.wordCount || Math.max(3, Math.min(8, Math.round(length / 6.5)));

  const glue = () => {
    // 'digit' ve 'special' kapalıysa kelimeler bitişik yazılır
    const kinds = [];
    if (digit) kinds.push('d');
    if (special) kinds.push('s');
    if (!kinds.length) return { text: '', bits: 0 };
    const k = kinds[randomInt(kinds.length)];
    if (k === 'd') return { text: pick(digits) + pick(digits), bits: 2 * Math.log2(digits.length) + 1 };
    return { text: pick(specials), bits: Math.log2(specials.length) + 1 };
  };
  const styleWord = (w) => {
    if (uppercase && lowercase) return cap(w);
    if (uppercase) return w.toUpperCase();
    return w;
  };
  const pool = excludeSimilar && uppercase && lowercase
    ? MEMORABLE_WORDS.filter((w) => !'ioIO'.includes(w[0])) // büyük harfle başlayınca I/O karışmasın
    : MEMORABLE_WORDS;

  for (let attempt = 0; attempt < 2000; attempt++) {
    let bits = 0;
    const picked = new Set();
    while (picked.size < wordCount) picked.add(pool[randomInt(pool.length)]);
    bits += wordCount * Math.log2(pool.length);

    let out = '';
    const words = [...picked];
    words.forEach((w, i) => {
      out += styleWord(w);
      if (i < words.length - 1) { const g = glue(); out += g.text; bits += g.bits; }
    });
    // seçili türlerden eksik kalan varsa sona ekle (örn. hiç rakam çıkmadıysa)
    if (digit && !/[0-9]/.test(out)) { const g = pick(digits) + pick(digits); out += g; bits += 2 * Math.log2(digits.length); }
    if (special && !/[^A-Za-z0-9]/.test(out)) { out += pick(specials); bits += Math.log2(specials.length); }
    // hedef uzunluğa kadar sona rakam/özel karakter ekle
    const padPool = (digit ? digits : '') + (special ? specials : '');
    while (out.length < length && padPool) { out += pick(padPool); bits += Math.log2(padPool.length); }

    // rakam/sembol kapalıysa dolgu yapılamaz: hedefe en fazla 4 karakter yaklaşmak yeterli
    const okLength = padPool ? out.length === length : out.length <= length && out.length >= length - 4;
    if (!okLength) continue;
    if (findSequences(out).length || detectPersonalData(out).length) continue;
    return { password: out, entropyBits: Math.round(bits) };
  }
  throw new Error('Uygun parola üretilemedi');
}
