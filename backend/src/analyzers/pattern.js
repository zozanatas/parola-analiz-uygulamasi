// ANLAMLILIK & ÖRÜNTÜ ANALİZİ (FG-3)
// Sözlük (TR + EN), isim/şehir/hayvan listesi, çok yaygın parolalar ve kişisel veri
// şablonları (yıl, tarih) kontrol edilir.
//
// Puanlama mantığı (projedeki karara göre):
//  - 3+ farklı sözlük kelimesi  -> 10  (tek tek anlamlı, bütün olarak anlamsız = akılda kalıcı + güvenli)
//  - 2 farklı kelime            -> 8
//  - tek kelime                 -> kelimenin parolaya oranı arttıkça düşer (10 * (1 - oran))
//  - hiç kelime yok (rastgele)  -> 8  (güvenli ama hatırlaması zor; gömülü kelime varsa biraz düşer)
//  - çok yaygın parola          -> 0
//  - yıl / tarih bulunursa her biri için -3
import { DICT, NAMES, COMMON_PASSWORDS } from '../data/loader.js';
import { fold, leetDecode, LEET_CHARS } from '../utils/text.js';

const EMBED_MIN = 5; // parola içine gömülü kelimeler için en az harf sayısı (yanlış alarmı azaltır)
const SEGMENT_MIN_TOKEN = 7;

const isWord = (t) => (t.length >= 4 ? DICT.has(t) || NAMES.has(t) : t.length === 3 && NAMES.has(t));

function splitTokens(password) {
  const letters = password.match(/[A-Za-zÇĞİÖŞÜçğıöşü]+/g) || [];
  // DemirAhmet -> Demir, Ahmet
  return letters.flatMap((t) => t.split(/(?<=[a-zçğıöşü])(?=[A-ZÇĞİÖŞÜ])/));
}

// "demirmasa" -> ["demir","masa"]. Tamamı sözlük kelimeleriyle örtülmezse null.
function segment(t) {
  const n = t.length;
  const best = new Array(n + 1).fill(null);
  best[0] = [];
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - 16); j < i; j++) {
      if (best[j] && isWord(t.slice(j, i))) {
        const cand = [...best[j], t.slice(j, i)];
        if (!best[i] || cand.length < best[i].length) best[i] = cand;
      }
    }
  }
  return best[n] && best[n].length >= 2 ? best[n] : null;
}

function longestEmbedded(t) {
  for (let L = Math.min(t.length - 1, 14); L >= EMBED_MIN; L--) {
    for (let i = 0; i + L <= t.length; i++) {
      const w = t.slice(i, i + L);
      if (DICT.has(w)) return w;
    }
  }
  return null;
}

// p@ssw0rd gibi "leet" yazımlarda gizlenen kelimeler
function leetWords(password, alreadyFound) {
  const found = [];
  for (const run of password.split(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9@$!]+/)) {
    if (!LEET_CHARS.test(run)) continue;
    const d = fold(leetDecode(run));
    for (const m of d.matchAll(/[a-z]+/g)) {
      const seg = m[0];
      for (let L = seg.length; L >= EMBED_MIN; L--) {
        let hit = null;
        for (let i = 0; i + L <= seg.length; i++) {
          const start = m.index + i;
          const w = seg.slice(i, i + L);
          // leet karakteri kelimenin İÇİNDE olmalı (başta/sonda ise gerçek kelimeye yapışmış sembol olabilir)
          const usesLeet = [...run.slice(start + 1, start + L - 1)].some((c) => LEET_CHARS.test(c));
          if (usesLeet && DICT.has(w) && !alreadyFound.has(w)) { hit = w; break; }
        }
        if (hit) { found.push(hit); break; }
      }
    }
  }
  return found;
}

/** Yıl ve tarih gibi kişisel veri şablonları. [{type, text}] */
export function detectPersonalData(password) {
  const out = [];
  for (const run of password.match(/\d+/g) || []) {
    const year = run.match(/(?:19|20)\d{2}/);
    if (year) out.push({ type: 'yıl', text: year[0] });
    if (run.length >= 6) {
      const date = run.match(/(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])(?:\d{4}|\d{2})/);
      if (date) out.push({ type: 'tarih', text: date[0] });
    }
  }
  return out;
}

function isCommonPassword(password) {
  const f = fold(password);
  const stripTail = (s) => s.replace(/[^a-z]+$/, '');
  const d = fold(leetDecode(password));
  return [f, stripTail(f), stripTail(d)].some((c) => c && COMMON_PASSWORDS.has(c));
}

export function analyzePattern(password) {
  const len = password.length;
  const words = [];
  const embedded = [];
  let chars = 0;

  for (const tok of splitTokens(password)) {
    const t = fold(tok);
    if (isWord(t)) { words.push(t); chars += t.length; continue; }
    const seg = t.length >= SEGMENT_MIN_TOKEN ? segment(t) : null;
    if (seg) { words.push(...seg); chars += t.length; continue; }
    const emb = longestEmbedded(t);
    if (emb) { embedded.push(emb); chars += emb.length * 0.5; }
  }
  for (const w of leetWords(password, new Set([...words, ...embedded]))) { words.push(w); chars += w.length; }

  const distinct = [...new Set(words)];
  const personal = detectPersonalData(password);
  const common = isCommonPassword(password);
  const fraction = len ? Math.min(1, chars / len) : 0;

  let score;
  let message;
  if (common) {
    score = 0;
    message = 'Bu parola çok yaygın kullanılan parolalar arasında.';
  } else if (distinct.length >= 3) {
    score = 10;
    message = `Birbirinden bağımsız ${distinct.length} kelime tespit edildi: akılda kalıcı ve güçlü bir yapı.`;
  } else if (distinct.length === 2) {
    // Sadece harflerden oluşan 2 kelime klasik sözlük saldırısına açıktır; rakam/sembol varsa 8
    const hasNonLetter = /[^A-Za-zÇĞİÖŞÜçğıöşü]/.test(password);
    score = hasNonLetter ? 8 : 6;
    message = 'İki ayrı kelime tespit edildi: akılda kalıcı, ancak 3. bir kelime ve rakam/sembol eklemek güvenliği artırır.';
  } else if (distinct.length === 1) {
    score = 10 * (1 - fraction);
    message = `Parola sözlükte geçen bir kelime/isim içeriyor (${distinct[0]}).`;
  } else if (embedded.length) {
    score = 8 * (1 - fraction);
    message = `Parolanın içinde sözlük kelimesi gömülü olabilir (${embedded[0]}).`;
  } else {
    score = 8;
    message = 'Önemli bir anlamlılık bulunamadı (rastgele yapı). Güvenli, ancak hatırlaması zor olabilir.';
  }
  if (!common) score -= 3 * personal.length;
  if (personal.length) message += ' Yıl/tarih gibi kişisel veri şablonu içeriyor.';
  score = Math.round(Math.max(0, score) * 10) / 10;

  return {
    score,
    message,
    findings: { words: distinct, embedded, personal, common },
  };
}
