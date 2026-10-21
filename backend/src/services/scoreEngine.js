// PUANLAMA MOTORU (FG-4): üç analizi birleştirip 0-10 arası tek skor üretir.
import { analyzeComplexity } from '../analyzers/complexity.js';
import { analyzeSequence } from '../analyzers/sequence.js';
import { analyzePattern } from '../analyzers/pattern.js';

// Skor etiketleri (üst sınır dahil değil)
export const LEVELS = [
  { max: 2, key: 'weak', label: 'Güçsüz' },
  { max: 4, key: 'average', label: 'Ortalama' },
  { max: 6, key: 'risky', label: 'Riskli Güçlü' },
  { max: 8, key: 'strong', label: 'Güçlü' },
  { max: Infinity, key: 'very_strong', label: 'Çok Güçlü' },
];

export function levelOf(score) {
  return LEVELS.find((l) => score < l.max);
}

// Kısa parola tavanları: ortalama ne olursa olsun kısa parola "güçlü" olamaz.
function lengthCap(len) {
  if (len < 6) return 1.9;
  if (len < 8) return 3.9;
  if (len < 10) return 7.9;
  return 10;
}

const round1 = (n) => Math.round(n * 10) / 10;

export function analyzePassword(password) {
  const complexity = analyzeComplexity(password);
  const sequence = analyzeSequence(password);
  const pattern = analyzePattern(password);

  const scores = [complexity.score, sequence.score, pattern.score];
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  // "En zayıf halka" tavanı: tek bir analiz çok kötüyse ortalama onu gizleyemez.
  const weakestCap = Math.min(...scores) * 1.25 + 1.9;
  const score = round1(Math.min(average, weakestCap, lengthCap(password.length)));
  const level = levelOf(score);

  const weaknesses = [];
  const suggestions = [];
  const f = complexity.findings;
  if (password.length < 12) {
    weaknesses.push(password.length < 8 ? 'Parola çok kısa' : 'Parola kısa');
    suggestions.push('Parolanızı en az 12-16 karaktere çıkarın.');
  }
  if (f.missing.length && f.missing.length < 4) {
    weaknesses.push(`Eksik karakter türü: ${f.missing.join(', ')}`);
    suggestions.push(`Parolaya şunları ekleyin: ${f.missing.join(', ')}.`);
  } else if (f.missing.length === 4) {
    weaknesses.push('Parola harf, rakam veya sembol içermiyor');
  }
  for (const s of sequence.findings) {
    weaknesses.push(`${s.label[0].toUpperCase()}${s.label.slice(1)} var: ${s.text}`);
  }
  if (sequence.findings.length) suggestions.push('Klavye sıraları, ardışık sayılar ve tekrar eden karakterlerden kaçının.');
  const pf = pattern.findings;
  if (pf.common) weaknesses.push('Çok yaygın bir parola');
  if (pf.words.length === 1) weaknesses.push(`Sözlük kelimesi/isim içeriyor: ${pf.words[0]}`);
  for (const e of pf.embedded) weaknesses.push(`Gömülü sözlük kelimesi olabilir: ${e}`);
  for (const p of pf.personal) weaknesses.push(`Kişisel veri şablonu (${p.type}): ${p.text}`);
  if (pf.words.length === 1 || pf.common || pf.personal.length) {
    suggestions.push('Tek bir kelime/isim ya da yıl yerine, birbiriyle alakasız 3-4 kelimeyi sembol ve rakamlarla birleştirin.');
  }
  if (!weaknesses.length) suggestions.push('Parolanız iyi görünüyor. Her hesap için farklı bir parola kullanmayı unutmayın.');

  return {
    score,
    max: 10,
    level: level.key,
    label: level.label,
    analyses: { complexity, sequence, pattern },
    weaknesses,
    suggestions: [...new Set(suggestions)],
  };
}
