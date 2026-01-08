const MODES = {
    standard: {
        work: 25,
        break: 5,
        gradientVar: '--grad-standard', /* Original Rich */
        primaryColor: 'var(--text-standard)'
    },
    light: {
        work: 15,
        break: 5,
        gradientVar: '--grad-light',
        primaryColor: 'var(--text-light)'
    },
    deep_focus: {
        work: 50,
        break: 10,
        gradientVar: '--grad-deep',
        primaryColor: 'var(--text-deep)'
    },
    custom: {
        work: 25,
        break: 5,
        gradientVar: '--grad-free',
        primaryColor: 'var(--text-free)'
    }
};

let currentModeKey = 'standard';
let timerInterval = null;
let timeLeft = MODES.standard.work * 60;
let isRunning = false;

// DOM
const appContainer = document.getElementById('appContainer');
const views = {
    selection: document.getElementById('selectionView'),
    active: document.getElementById('activeView')
};
// Removed digitalTimer var
const topModeTitle = document.getElementById('topModeTitle');
const startBtn = document.getElementById('startBtn'); // Selection Play
const activeToggleBtn = document.getElementById('activeToggleBtn'); // Active Play/Pause
const exitBtn = document.getElementById('exitBtn'); // Active Exit
const modePills = document.querySelectorAll('.mode-pill');
const customControls = document.getElementById('customControls');
const cycleIndicator = document.getElementById('cycleIndicator');

// Inputs
const workSlider = document.getElementById('workSlider');
const breakSlider = document.getElementById('breakSlider');
const workValDisplay = document.getElementById('workValueDisplay');
const breakValDisplay = document.getElementById('breakValueDisplay');

// Ions/SVGs
const ICON_PLAY = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>`;
const ICON_PAUSE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="5" width="4" height="14" rx="2" fill="currentColor"/><rect x="13" y="5" width="4" height="14" rx="2" fill="currentColor"/></svg>`;


function init() {
    setupListeners();
    selectMode('standard');
    updateTimerDisplayInstant(); // Ensure clean start
}

function setupListeners() {
    modePills.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.target.closest('.mode-pill');
            if (target) {
                const mode = target.dataset.mode;
                selectMode(mode);
            }
        });
    });

    startBtn.addEventListener('click', enterActiveMode);

    // Updated Logic for Active Controls
    activeToggleBtn.addEventListener('click', toggleTimerState);
    exitBtn.addEventListener('click', exitActiveMode);

    workSlider.addEventListener('input', (e) => {
        MODES.custom.work = parseInt(e.target.value);
        workValDisplay.textContent = MODES.custom.work;
        if (currentModeKey === 'custom') resetTimerToWork();
    });

    breakSlider.addEventListener('input', (e) => {
        MODES.custom.break = parseInt(e.target.value);
        breakValDisplay.textContent = MODES.custom.break;
    });
}

function selectMode(key) {
    currentModeKey = key;

    modePills.forEach(p => p.classList.remove('active'));
    document.querySelector(`.mode-pill[data-mode="${key}"]`).classList.add('active');

    if (key === 'custom') {
        customControls.classList.remove('hidden');
    } else {
        customControls.classList.add('hidden');
    }

    updateTheme(key);
    updateTitleText(key);
    resetTimerToWork();
}

function updateTheme(key) {
    const config = MODES[key];
    const root = document.documentElement;

    root.style.setProperty('--active-gradient', `var(${config.gradientVar})`);
    // Assume subtle convention: gradientVar + '-soft'
    root.style.setProperty('--active-gradient-subtle', `var(${config.gradientVar}-soft)`);
    root.style.setProperty('--active-color-primary', config.primaryColor);
}

function updateTitleText(key) {
    let title = key.replace('_', ' ');
    if (key === 'custom') title = 'Free Mode';
    if (key === 'deep_focus') title = 'Deep Focus';

    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    topModeTitle.textContent = title;
}

function resetTimerToWork() {
    stopTimer(); // Ensure stopped before resetting
    let duration = MODES[currentModeKey].work;
    // Safety check
    if (isNaN(duration) || duration < 1) duration = 25;

    timeLeft = Math.floor(duration * 60);
    updateTimerDisplayInstant();
}

function enterActiveMode() {
    views.selection.classList.add('hidden');
    views.active.classList.remove('hidden');
    appContainer.classList.add('mode-active'); // Enable centered layout

    const work = MODES[currentModeKey].work;
    const brk = MODES[currentModeKey].break;
    cycleIndicator.textContent = `${work}-${brk}`;

    // Auto Start
    startTimer();
    updateToggleBtn(true);
}

function exitActiveMode() {
    stopTimer();
    views.active.classList.add('hidden');
    views.selection.classList.remove('hidden');
    appContainer.classList.remove('mode-active'); // Disable centered layout
    resetTimerToWork();
}

function toggleTimerState() {
    if (isRunning) {
        // Wants to Pause
        pauseTimer();
        updateToggleBtn(false);
    } else {
        // Wants to Resume
        startTimer();
        updateToggleBtn(true);
    }
}

function updateToggleBtn(isPausedStateShouldBe) {
    // If running -> Show Pause Icon
    // If paused -> Show Play Icon
    if (isRunning) {
        activeToggleBtn.innerHTML = ICON_PAUSE;
        activeToggleBtn.setAttribute('aria-label', 'Pause');
    } else {
        activeToggleBtn.innerHTML = ICON_PLAY;
        activeToggleBtn.setAttribute('aria-label', 'Play');
    }
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            updateToggleBtn(false); // Back to play
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    // UI update handled in toggleTimerState usually, but standard helper here
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = false;
}

// DOM - Flip Clock
const flipDigits = {
    m1: document.getElementById('d-m1'),
    m2: document.getElementById('d-m2'),
    s1: document.getElementById('d-s1'),
    s2: document.getElementById('d-s2')
};

// ... existing code ...

function updateTimerDisplay() {
    // Calculate digits
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    updateDigit(flipDigits.m1, mStr[0]);
    updateDigit(flipDigits.m2, mStr[1]);
    updateDigit(flipDigits.s1, sStr[0]);
    updateDigit(flipDigits.s2, sStr[1]);
}

function updateDigit(digitEl, newVal) {
    const currentVal = digitEl.getAttribute('data-val');
    if (currentVal === newVal) return;

    // Trigger Flip
    // 1. Set Back Faces to NEW value
    digitEl.querySelector('.back-top').textContent = newVal;
    digitEl.querySelector('.back-bottom').textContent = newVal;

    // 2. Set Front Faces to OLD value (should already be there, but ensure)
    digitEl.querySelector('.top').textContent = currentVal;
    digitEl.querySelector('.bottom').textContent = currentVal;

    // 3. Add flipping class
    // Remove it first to restart anim if stuck (rare)
    digitEl.classList.remove('flipping');
    void digitEl.offsetWidth; // Trigger reflow
    digitEl.classList.add('flipping');

    // 4. After anim, commit state
    // Animation is 0.6s. We update the "Front" faces to new value and remove class
    setTimeout(() => {
        digitEl.querySelector('.top').textContent = newVal;
        digitEl.querySelector('.bottom').textContent = newVal;
        digitEl.classList.remove('flipping');
        digitEl.setAttribute('data-val', newVal);
    }, 600);
}

// Force instant update without animation (for mode switch)
function updateTimerDisplayInstant() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    setDigitInstant(flipDigits.m1, mStr[0]);
    setDigitInstant(flipDigits.m2, mStr[1]);
    setDigitInstant(flipDigits.s1, sStr[0]);
    setDigitInstant(flipDigits.s2, sStr[1]);
}

function setDigitInstant(digitEl, val) {
    digitEl.setAttribute('data-val', val);
    digitEl.classList.remove('flipping');
    const faces = digitEl.querySelectorAll('.flip-face');
    faces.forEach(f => f.textContent = val);
}

init();
