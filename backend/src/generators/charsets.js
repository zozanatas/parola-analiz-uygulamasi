import { randomInt } from 'node:crypto';

export const SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  special: '!@#$%&*?+-_=.,:;',
};
// Birbirine benzeyen, karıştırılan karakterler (O/0, l/1/I, |)
export const SIMILAR = new Set('O0oIl1|S5B8Z2'.split(''));

export const pick = (str) => str[randomInt(str.length)]; // kriptografik güvenli seçim

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildPools({ lowercase, uppercase, digit, special, excludeSimilar }) {
  const on = { lowercase, uppercase, digit, special };
  const pools = {};
  for (const [name, enabled] of Object.entries(on)) {
    if (!enabled) continue;
    pools[name] = excludeSimilar ? [...SETS[name]].filter((c) => !SIMILAR.has(c)).join('') : SETS[name];
  }
  return pools;
}
