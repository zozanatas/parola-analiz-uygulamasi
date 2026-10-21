// Metin yardımcıları. Türkçe karakterleri ASCII'ye "katlar" ki
// "Elazığ" / "elazig" / "ELAZIG" aynı kabul edilsin. Katlama 1'e 1'dir
// (uzunluk değişmez), bu yüzden indeksler orijinal parolayla birebir örtüşür.

const FOLD_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

export function fold(str) {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => FOLD_MAP[c]);
}

const LOWER = /[a-zçğıöşü]/;
const UPPER = /[A-ZÇĞİÖŞÜ]/;
const DIGIT = /[0-9]/;

export function charClass(ch) {
  if (LOWER.test(ch)) return 'lowercase';
  if (UPPER.test(ch)) return 'uppercase';
  if (DIGIT.test(ch)) return 'digit';
  return 'special';
}

// Basit "leet" çözümü: p@ssw0rd -> password
const LEET = { '@': 'a', '4': 'a', '3': 'e', '1': 'i', '0': 'o', '$': 's', '5': 's', '7': 't', '!': 'i', '8': 'b' };
export function leetDecode(str) {
  return str.replace(/[@4310$57!8]/g, (c) => LEET[c]);
}
export const LEET_CHARS = /[@4310$57!8]/;
