// Sayfa backend tarafından servis edilir (npm start -> http://localhost:3001).
// index.html doğrudan dosya olarak açılırsa yerel backend'e gider.
const API_BASE = location.protocol === 'file:' ? 'http://localhost:3001/api' : '/api';

// Backend kurallarıyla aynı sınırlar (generateService.js)
const MEMORABLE_MIN_LENGTH = { 3: 16, 4: 22 };
const DIGIT_ONLY_MAX_LENGTH = 32;

const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const eyeIcon = document.getElementById('eyeIcon');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisResult = document.getElementById('analysisResult');
const scoreText = document.getElementById('scoreText');
const levelBadge = document.getElementById('levelBadge');
const weaknessesList = document.getElementById('weaknessesList');
const suggestionsList = document.getElementById('suggestionsList');
const scoreToggle = document.getElementById('scoreToggle');
const scoreChevron = document.getElementById('scoreChevron');
const analysisDetails = document.getElementById('analysisDetails');

const ANALYSIS_TITLES = {
    complexity: 'Karmaşıklık & Çeşitlilik',
    sequence: 'Ardışıklık',
    pattern: 'Anlamlılık & Örüntü',
};

const modeRandom = document.getElementById('modeRandom');
const modeMemorable = document.getElementById('modeMemorable');
const lengthRange = document.getElementById('lengthRange');
const lengthVal = document.getElementById('lengthVal');
const randomOptions = document.getElementById('randomOptions');
const memorableOptions = document.getElementById('memorableOptions');
const wordCountSelect = document.getElementById('wordCountSelect');
const generatedPasswordOutput = document.getElementById('generatedPasswordOutput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const analysisStatus = document.getElementById('analysisStatus');
const generationStatus = document.getElementById('generationStatus');
const copyStatus = document.getElementById('copyStatus');

let liveTimer;
let analysisRequest = 0;
let generationRequest = 0;
let copyRequest = 0;
let generatedPassword = '';

let currentMode = 'random';

togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

lengthRange.addEventListener('input', (e) => {
    lengthVal.textContent = e.target.value;
});

const chk = (id) => document.getElementById(id).checked;

// Uzunluk kaydırıcısının sınırlarını moda ve seçeneklere göre ayarlar; değeri sınıra çeker
function updateLengthLimits() {
    let min, max;
    if (currentMode === 'memorable') {
        min = MEMORABLE_MIN_LENGTH[wordCountSelect.value];
        max = 48;
    } else {
        const digitOnly = chk('chkDigit') && !chk('chkLower') && !chk('chkUpper') && !chk('chkSpecial');
        min = 6;
        max = digitOnly ? DIGIT_ONLY_MAX_LENGTH : 128;
    }
    lengthRange.min = min;
    lengthRange.max = max;
    lengthRange.value = Math.min(max, Math.max(min, Number(lengthRange.value)));
    lengthVal.textContent = lengthRange.value;
}

['chkLower', 'chkUpper', 'chkDigit', 'chkSpecial'].forEach((id) =>
    document.getElementById(id).addEventListener('change', updateLengthLimits));
wordCountSelect.addEventListener('change', updateLengthLimits);

modeRandom.addEventListener('click', () => {
    currentMode = 'random';
    modeRandom.className = "py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition";
    modeMemorable.className = "py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition";
    randomOptions.classList.remove('hidden');
    memorableOptions.classList.add('hidden');
    lengthRange.value = 16;
    updateLengthLimits();
});

modeMemorable.addEventListener('click', () => {
    currentMode = 'memorable';
    modeMemorable.className = "py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition";
    modeRandom.className = "py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition";
    memorableOptions.classList.remove('hidden');
    randomOptions.classList.add('hidden');
    lengthRange.value = 0; // seçilen kelime sayısının en kısa uzunluğuna çekilir
    updateLengthLimits();
});

function resetAnalysis() {
    clearTimeout(liveTimer);
    analysisRequest++;
    analysisResult.classList.add('hidden');
    analysisStatus.textContent = '';
}

async function showAnalysis(password, source) {
    resetAnalysis();
    const request = analysisRequest;
    analysisStatus.textContent = 'Analiz ediliyor...';

    try {
        const data = await analyze(password);
        if (request !== analysisRequest) return;
        analysisStatus.textContent = '';
        renderAnalysis(data);
    } catch (err) {
        if (request !== analysisRequest) return;
        analysisStatus.textContent = source === 'generated'
            ? 'Parola üretildi ancak analiz edilemedi. Analiz Et düğmesiyle tekrar deneyin.'
            : source === 'manual' ? err.message : '';
    }
}

analyzeBtn.addEventListener('click', () => {
    const password = passwordInput.value;
    if (!password) {
        resetAnalysis();
        analysisStatus.textContent = 'Lütfen analiz için bir parola girin.';
        return;
    }
    void showAnalysis(password, 'manual');
});

passwordInput.addEventListener('input', () => {
    resetAnalysis();
    const password = passwordInput.value;
    if (password) liveTimer = setTimeout(() => showAnalysis(password, 'live'), 400);
});

function renderAnalysis(data) {
    analysisResult.classList.remove('hidden');
    scoreText.textContent = `${data.score} / ${data.max}`;

    levelBadge.textContent = data.label;
    levelBadge.className = "px-3 py-1 rounded-lg text-sm font-semibold ";
    switch (data.level) {
        case 'weak': levelBadge.classList.add('bg-rose-900', 'text-rose-300'); break;
        case 'average': levelBadge.classList.add('bg-amber-900', 'text-amber-300'); break;
        case 'risky': levelBadge.classList.add('bg-yellow-900', 'text-yellow-300'); break;
        case 'strong': levelBadge.classList.add('bg-emerald-900', 'text-emerald-300'); break;
        case 'very_strong': levelBadge.classList.add('bg-indigo-900', 'text-indigo-300'); break;
        default: levelBadge.classList.add('bg-slate-700', 'text-slate-300');
    }

    renderDetails(data.analyses);

    weaknessesList.innerHTML = '';
    if (data.weaknesses.length === 0) {
        weaknessesList.innerHTML = '<li class="text-emerald-400">Hiçbir zayıf yön tespit edilmedi!</li>';
    } else {
        data.weaknesses.forEach(w => {
            const li = document.createElement('li');
            li.textContent = w;
            weaknessesList.appendChild(li);
        });
    }

    suggestionsList.innerHTML = '';
    data.suggestions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        suggestionsList.appendChild(li);
    });
}

scoreToggle.addEventListener('click', () => {
    const open = analysisDetails.classList.toggle('hidden') === false;
    scoreToggle.setAttribute('aria-expanded', String(open));
    scoreChevron.classList.toggle('rotate-180', open);
});

function scoreColor(score) {
    if (score < 4) return 'bg-rose-500';
    if (score < 6) return 'bg-amber-500';
    if (score < 8) return 'bg-emerald-500';
    return 'bg-indigo-500';
}

// Alt analiz kartları (karmaşıklık, ardışıklık, örüntü). Sunucudan gelen metinler
// textContent ile yazılır (innerHTML değil).
function renderDetails(analyses) {
    analysisDetails.innerHTML = '';
    for (const [key, title] of Object.entries(ANALYSIS_TITLES)) {
        const a = analyses[key];
        if (!a) continue;

        const box = document.createElement('div');
        const head = document.createElement('div');
        head.className = 'flex justify-between text-sm mb-1';
        const name = document.createElement('span');
        name.className = 'text-slate-300 font-medium';
        name.textContent = title;
        const val = document.createElement('span');
        val.className = 'font-bold text-slate-100';
        val.textContent = `${a.score} / 10`;
        head.append(name, val);

        const bar = document.createElement('div');
        bar.className = 'w-full h-2 bg-slate-700 rounded-full overflow-hidden';
        const fill = document.createElement('div');
        fill.className = `h-full rounded-full ${scoreColor(a.score)}`;
        fill.style.width = `${Math.max(0, Math.min(10, a.score)) * 10}%`;
        bar.appendChild(fill);

        const msg = document.createElement('p');
        msg.className = 'text-xs text-slate-400 mt-1';
        msg.textContent = a.message;

        box.append(head, bar, msg);
        analysisDetails.appendChild(box);
    }
}

async function analyze(password) {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analiz başarısız.');
    return data;
}

generateBtn.addEventListener('click', async () => {
    const request = ++generationRequest;
    generationStatus.textContent = 'Parola üretiliyor...';
    // Akılda kalıcı modda karakter seçenekleri gizli: gönderilmez, backend varsayılanları (hepsi açık) kullanılır
    const payload = currentMode === 'memorable'
        ? { mode: 'memorable', length: parseInt(lengthRange.value), wordCount: parseInt(wordCountSelect.value) }
        : {
            mode: 'random',
            length: parseInt(lengthRange.value),
            lowercase: chk('chkLower'),
            uppercase: chk('chkUpper'),
            digit: chk('chkDigit'),
            special: chk('chkSpecial'),
            excludeSimilar: chk('chkExcludeSimilar'),
        };

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Parola üretilemedi.');

        if (request !== generationRequest) return;
        generationStatus.textContent = '';
        generatedPassword = data.password;
        copyRequest++;
        copyStatus.textContent = '';
        copyBtn.disabled = false;
        generatedPasswordOutput.textContent = generatedPassword;
        passwordInput.value = generatedPassword;
        void showAnalysis(generatedPassword, 'generated');
    } catch (err) {
        if (request !== generationRequest) return;
        generationStatus.textContent = err.message;
    }
});

copyBtn.addEventListener('click', async () => {
    if (!generatedPassword) return;
    const request = ++copyRequest;
    copyStatus.textContent = '';
    try {
        await navigator.clipboard.writeText(generatedPassword);
        if (request === copyRequest) copyStatus.textContent = 'Parola kopyalandı.';
    } catch {
        if (request === copyRequest) copyStatus.textContent = 'Parola kopyalanamadı.';
    }
});
