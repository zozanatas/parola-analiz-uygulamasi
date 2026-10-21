const API_BASE = 'http://localhost:3000/api';

const passwordInput = document.getElementById('passwordInput');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const eyeIcon = document.getElementById('eyeIcon');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisResult = document.getElementById('analysisResult');
const scoreText = document.getElementById('scoreText');
const levelBadge = document.getElementById('levelBadge');
const weaknessesList = document.getElementById('weaknessesList');
const suggestionsList = document.getElementById('suggestionsList');

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

modeRandom.addEventListener('click', () => {
    currentMode = 'random';
    modeRandom.className = "py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition";
    modeMemorable.className = "py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition";
    randomOptions.classList.remove('hidden');
    memorableOptions.classList.add('hidden');
    lengthRange.min = 6;
    lengthRange.max = 128;
    lengthRange.value = 16;
    lengthVal.textContent = 16;
});

modeMemorable.addEventListener('click', () => {
    currentMode = 'memorable';
    modeMemorable.className = "py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white transition";
    modeRandom.className = "py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition";
    memorableOptions.classList.remove('hidden');
    randomOptions.classList.add('hidden');
    lengthRange.min = 16;
    lengthRange.max = 48;
    lengthRange.value = 16;
    lengthVal.textContent = 16;
});

analyzeBtn.addEventListener('click', async () => {
    const password = passwordInput.value;
    if (!password) {
        alert('Lütfen analiz için bir parola girin.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Analiz başarısız.');

        renderAnalysis(data);
    } catch (err) {
        alert(err.message);
    }
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

generateBtn.addEventListener('click', async () => {
    const payload = {
        mode: currentMode,
        length: parseInt(lengthRange.value),
        lowercase: document.getElementById('chkLower').checked,
        uppercase: document.getElementById('chkUpper').checked,
        digit: document.getElementById('chkDigit').checked,
        special: document.getElementById('chkSpecial').checked,
        excludeSimilar: document.getElementById('chkExcludeSimilar').checked,
    };

    if (currentMode === 'memorable') {
        payload.wordCount = parseInt(wordCountSelect.value);
    }

    try {
        const response = await fetch(`${API_BASE}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Parola üretilemedi.');

        generatedPasswordOutput.textContent = data.password;
        passwordInput.value = data.password;
        renderAnalysis(data);
    } catch (err) {
        alert(err.message);
    }
});

copyBtn.addEventListener('click', () => {
    const pwd = generatedPasswordOutput.textContent;
    if (!pwd || pwd === 'Parola bekleniyor...') return;
    navigator.clipboard.writeText(pwd);
    copyBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400 text-lg"></i>';
    setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-copy text-lg"></i>';
    }, 2000);
});