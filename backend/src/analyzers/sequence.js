// ARDIŞIKLIK ANALİZİ (FG-2)
// Tespit edilenler: klavye desenleri (Q ve F, yatay + sütun/çapraz), sayısal/alfabetik
// ardışıklık (123, 987, abc), tekrar eden karakter (aaaa) ve tekrar eden grup (abab, 123123).
import { fold } from '../utils/text.js';

const KEYBOARD_MIN = 4; // qwer, asdf ...
const RUN_MIN = 3; // 123, 987, abc
const REPEAT_MIN = 3; // aaa

// Satırlar (Türkçe Q ve F klavye; Türkçe karakterler katlanmış halde tutulur)
const ROWS = [
  '1234567890',
  'qwertyuiopgu', // Türkçe Q üst sıra: qwertyuıopğü
  'asdfghjklsi', //  orta sıra:        asdfghjklşi
  'zxcvbnmoc', //    alt sıra:         zxcvbnmöç
  'fgg' + 'iodrnhpqwx', // F klavye üst sıra: fgğıodrnhpqwx
  'uieautkmlys', //  F orta sıra: uieaütkmlyş
  'jovcczsb', //     F alt sıra:  jövcçzsb
];
// Sütun / çapraz (Q klavye): 1qaz 2wsx 3edc ...
const COLUMNS = ['1qaz2wsx3edc4rfv5tgb6yhn7ujm', 'zaq1xsw2cde3vfr4bgt5nhy6mju7'];

const PATTERNS = [...ROWS, ...COLUMNS].flatMap((p) => [p, [...p].reverse().join('')]);

function keyboardMatches(p) {
  const matches = [];
  let i = 0;
  while (i < p.length) {
    let best = 0;
    for (const pat of PATTERNS) {
      let from = pat.indexOf(p[i]);
      while (from !== -1) {
        let k = 0;
        while (i + k < p.length && from + k < pat.length && p[i + k] === pat[from + k]) k++;
        if (k > best) best = k;
        from = pat.indexOf(p[i], from + 1);
      }
    }
    if (best >= KEYBOARD_MIN) {
      matches.push({ type: 'keyboard', start: i, length: best });
      i += best;
    } else i++;
  }
  return matches;
}

function runMatches(p) {
  // 123, 987, abc, cba
  const matches = [];
  const isDigit = (c) => c >= '0' && c <= '9';
  const isLetter = (c) => c >= 'a' && c <= 'z';
  let i = 0;
  while (i < p.length - 1) {
    const d = p.charCodeAt(i + 1) - p.charCodeAt(i);
    const sameKind = (isDigit(p[i]) && isDigit(p[i + 1])) || (isLetter(p[i]) && isLetter(p[i + 1]));
    if ((d === 1 || d === -1) && sameKind) {
      let j = i + 1;
      while (j + 1 < p.length && p.charCodeAt(j + 1) - p.charCodeAt(j) === d && (isDigit(p[j + 1]) === isDigit(p[i]))) j++;
      const len = j - i + 1;
      if (len >= RUN_MIN) {
        matches.push({ type: 'run', start: i, length: len });
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return matches;
}

function repeatMatches(p) {
  const matches = [];
  // aaaa
  let i = 0;
  while (i < p.length) {
    let j = i;
    while (j + 1 < p.length && p[j + 1] === p[i]) j++;
    if (j - i + 1 >= REPEAT_MIN) matches.push({ type: 'repeat', start: i, length: j - i + 1 });
    i = j + 1;
  }
  // abab, 123123 (grup boyu 2-4, en az 2 tekrar)
  i = 0;
  while (i < p.length) {
    let found = 0;
    for (let size = 2; size <= 4 && !found; size++) {
      const g = p.substr(i, size);
      if (g.length < size || new Set(g).size === 1) continue;
      let reps = 1;
      while (p.substr(i + reps * size, size) === g) reps++;
      if (reps >= 2 && size * reps >= 4) found = size * reps;
    }
    if (found) {
      matches.push({ type: 'repeat', start: i, length: found });
      i += found;
    } else i++;
  }
  return matches;
}

/** Ardışık/desenli parçaları bulur. [{type, start, length, text}] */
export function findSequences(password) {
  const p = fold(password);
  const all = [...keyboardMatches(p), ...runMatches(p), ...repeatMatches(p)];
  return all
    .map((m) => ({ ...m, text: password.substr(m.start, m.length) }))
    .sort((a, b) => a.start - b.start);
}

const TYPE_LABEL = { keyboard: 'klavye deseni', run: 'ardışık karakter', repeat: 'tekrar eden karakter' };

export function analyzeSequence(password) {
  const matches = findSequences(password);
  const covered = new Set();
  for (const m of matches) for (let k = m.start; k < m.start + m.length; k++) covered.add(k);
  const ratio = password.length ? covered.size / password.length : 0;
  const score = round1(10 * (1 - Math.min(1, ratio * 1.5)));

  let message;
  if (matches.length === 0) message = 'Ardışıklık veya klavye deseni tespit edilmedi.';
  else if (score >= 5) message = 'Ortalama bir ardışıklık tespit edildi (riskli).';
  else message = 'Parolada yüksek oranda ardışıklık/tekrar tespit edildi.';

  return {
    score,
    message,
    findings: matches.map((m) => ({ type: m.type, label: TYPE_LABEL[m.type], text: m.text })),
  };
}

const round1 = (n) => Math.round(n * 10) / 10;
