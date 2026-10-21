// KARMAŞIKLIK & ÇEŞİTLİLİK ANALİZİ (FG-1)
// Skor = (uzunluk puanı + çeşitlilik puanı) / 2
//  - uzunluk: 16 karakter ve üstü tam puan (10)
//  - çeşitlilik: 4 karakter türünden (küçük, büyük, rakam, özel) kaç tanesi var
import { charClass } from '../utils/text.js';

export const TARGET_LENGTH = 16;
const CLASSES = ['lowercase', 'uppercase', 'digit', 'special'];
const CLASS_LABEL = { lowercase: 'küçük harf', uppercase: 'büyük harf', digit: 'rakam', special: 'özel karakter' };

export function analyzeComplexity(password) {
  const present = new Set([...password].map(charClass));
  const missing = CLASSES.filter((c) => !present.has(c));
  const lengthScore = Math.min(10, (password.length / TARGET_LENGTH) * 10);
  const varietyScore = (present.size / CLASSES.length) * 10;
  const score = Math.round(((lengthScore + varietyScore) / 2) * 10) / 10;

  let message;
  if (score >= 7) message = 'Parolada yeterli oranda karmaşıklık tespit edildi.';
  else if (score >= 4) message = 'Parolanın karmaşıklığı orta düzeyde.';
  else message = 'Parolanın karmaşıklığı yetersiz.';

  return {
    score,
    message,
    findings: {
      length: password.length,
      lowercase: present.has('lowercase'),
      uppercase: present.has('uppercase'),
      digit: present.has('digit'),
      special: present.has('special'),
      missing: missing.map((c) => CLASS_LABEL[c]),
    },
  };
}
