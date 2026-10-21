import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { analyzePassword } from '../src/services/scoreEngine.js';
import { findSequences } from '../src/analyzers/sequence.js';
import { generatePassword } from '../src/services/generateService.js';

let server;
let base;
before(async () => {
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

const post = (path, body, raw) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ?? JSON.stringify(body) });

// ---------- Analiz ----------
test('zayıf parolalar düşük skor alır', () => {
  for (const p of ['12345', 'qwerty123', 'password', 'p@ssw0rd', 'aaaaaaaaaaaa', '1qaz2wsx', 'abc', 'Elazig2024!']) {
    assert.ok(analyzePassword(p).score < 4, `${p} -> ${analyzePassword(p).score}`);
  }
});

test('tek kelime + yıl zayıf, birden fazla ilgisiz kelime güçlü', () => {
  assert.ok(analyzePassword('Ahmet1990').score < 4);
  assert.ok(analyzePassword('Demir*44Ahmet').score >= 8);
  assert.ok(analyzePassword('Ceviz-92-Mavi-Kilit!').score >= 8);
});

test('sadece harften oluşan 2 kelime "çok güçlü" olamaz', () => {
  assert.ok(analyzePassword('ahmetmehmet').score < 8);
});

test('ardışıklık: klavye (Q/F), sayı, tekrar, grup', () => {
  const found = (p) => findSequences(p).map((m) => m.text.toLowerCase());
  assert.ok(found('xqwertyx').includes('qwerty'));
  assert.ok(found('xasdfgx').includes('asdfg'));
  assert.ok(found('x12345x').includes('12345'));
  assert.ok(found('x987x').includes('987'));
  assert.ok(found('xaaaax').includes('aaaa'));
  assert.ok(found('x123123x').includes('123123'));
  assert.ok(found('xfgğıx').length > 0); // F klavye
  assert.equal(found('t9#Kx!2m$Lp8').length, 0);
});

test('skor etiketleri aralıklara uyar', () => {
  const r = analyzePassword('Demir*44?Masa!Elma');
  assert.equal(r.label, 'Çok Güçlü');
  assert.equal(analyzePassword('12345').label, 'Güçsüz');
});

test('rastgele güçlü parola yanlışlıkla sözlük kelimesi sanılmaz (yanlış alarm düşük)', () => {
  let bad = 0;
  for (let i = 0; i < 300; i++) {
    const { password } = generatePassword({ mode: 'random', length: 16 });
    if (analyzePassword(password).analyses.pattern.score < 7) bad++;
  }
  assert.ok(bad / 300 < 0.08, `yanlış alarm oranı: ${bad / 300}`);
});

// ---------- Üretim ----------
test('tam rastgele: uzunluk, karakter türleri, ardışıklık yok', () => {
  for (let i = 0; i < 300; i++) {
    const len = 6 + (i % 40);
    const r = generatePassword({ mode: 'random', length: len });
    assert.equal(r.password.length, len);
    assert.match(r.password, /[a-z]/);
    assert.match(r.password, /[A-Z]/);
    assert.match(r.password, /[0-9]/);
    assert.match(r.password, /[^A-Za-z0-9]/);
    assert.equal(findSequences(r.password).length, 0);
  }
});

test('tam rastgele: karakter filtreleri ve benzer karakter engeli', () => {
  for (let i = 0; i < 100; i++) {
    const r = generatePassword({ mode: 'random', length: 20, special: false, uppercase: false, excludeSimilar: true });
    assert.match(r.password, /^[a-z0-9]+$/);
    assert.doesNotMatch(r.password, /[O0oIl1|]/);
  }
});

test('akılda kalıcı: tam uzunluk, 3+ kelime, rakam ve sembol içerir', () => {
  for (const length of [16, 20, 24, 32, 48]) {
    for (let i = 0; i < 50; i++) {
      const r = generatePassword({ mode: 'memorable', length });
      assert.equal(r.password.length, length);
      assert.match(r.password, /[0-9]/);
      assert.match(r.password, /[^A-Za-z0-9]/);
      assert.ok(analyzePassword(r.password).analyses.pattern.findings.words.length >= 3, r.password);
      assert.ok(r.score >= 8, `${r.password} ${r.score}`);
    }
  }
});

test('üretim: geçersiz parametreler reddedilir', () => {
  assert.throws(() => generatePassword({ mode: 'x' }));
  assert.throws(() => generatePassword({ length: 3 }));
  assert.throws(() => generatePassword({ length: 500 }));
  assert.throws(() => generatePassword({ lowercase: false, uppercase: false, digit: false, special: false }));
  assert.throws(() => generatePassword({ mode: 'memorable', lowercase: false, uppercase: false }));
});

// ---------- API ----------
test('POST /api/analyze çalışır ve hızlıdır (<1sn)', async () => {
  const t = Date.now();
  const res = await post('/api/analyze', { password: 'Demir*44Ahmet' });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.ok(Date.now() - t < 1000);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.ok(j.analyses.complexity && j.analyses.sequence && j.analyses.pattern);
  assert.equal(typeof j.score, 'number');
});

test('POST /api/analyze geçersiz girdileri reddeder', async () => {
  assert.equal((await post('/api/analyze', {})).status, 400);
  assert.equal((await post('/api/analyze', { password: 123 })).status, 400);
  assert.equal((await post('/api/analyze', { password: '' })).status, 400);
  assert.equal((await post('/api/analyze', { password: 'a'.repeat(129) })).status, 400);
});

test('POST /api/generate çalışır', async () => {
  const res = await post('/api/generate', { mode: 'memorable', length: 18 });
  assert.equal(res.status, 200);
  const j = await res.json();
  assert.equal(j.password.length, 18);
  assert.equal((await post('/api/generate', { mode: 'nope' })).status, 400);
});

test('stateless: parola loglara düşmez, hata cevabında gövde sızmaz', async () => {
  const secret = 'S1rr1m-Parola-Test!';
  const logged = [];
  const orig = {};
  for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
    orig[m] = console[m];
    console[m] = (...a) => logged.push(a.join(' '));
  }
  try {
    await post('/api/analyze', { password: secret });
    const bad = await post('/api/analyze', null, `{"password":"${secret}"`); // bozuk JSON
    const text = await bad.text();
    assert.equal(bad.status, 400);
    assert.ok(!text.includes(secret));
  } finally {
    Object.assign(console, orig);
  }
  assert.ok(!logged.some((l) => l.includes(secret)));
});
