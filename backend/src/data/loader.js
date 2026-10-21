// Sözlükleri bir kez belleğe yükler (sunucu açılırken). Tüm girdiler "katlanmış"
// (küçük harf + ASCII) olarak saklanır.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fold } from '../utils/text.js';

const dir = dirname(fileURLToPath(import.meta.url));
const readLines = (file) =>
  readFileSync(join(dir, file), 'utf-8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

// Akılda kalıcı mod için seçilmiş kısa/yaygın kelimeler (rastgele seçim buradan yapılır)
export const MEMORABLE_WORDS = readLines('memorable_tr.txt');

// Özel isim / şehir / ülke / hayvan / takım (3 harf ve üstü). Kişisel veri tahmini için.
export const NAMES = new Set(readLines('names_tr.txt').map(fold).filter((w) => w.length >= 3));

// Genel sözlük: Türkçe + İngilizce (4 harf ve üstü, sadece harf) + yukarıdaki listeler
export const DICT = new Set();
for (const w of readLines('wordlist_tr.txt')) DICT.add(fold(w));
for (const w of readLines('wordlist_en.txt')) DICT.add(fold(w));
for (const w of MEMORABLE_WORDS) DICT.add(w);
for (const w of NAMES) if (w.length >= 4) DICT.add(w);

// Çok yaygın parolalar (katlanmış)
export const COMMON_PASSWORDS = new Set(readLines('common_passwords.txt').map(fold));
