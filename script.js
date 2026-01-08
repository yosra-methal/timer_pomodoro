const MODES = {
    standard: {
        work: 25,
        break: 5,
        gradientVar: '--grad-standard',
        colorVar: '--col-standard'
    },
    light: {
        work: 15,
        break: 5,
        gradientVar: '--grad-light',
        colorVar: '--col-light'
    },
    deep_focus: {
        work: 50,
        break: 10,
        gradientVar: '--grad-deep',
        colorVar: '--col-deep'
    },
    custom: {
        work: 25,
        break: 5,
        gradientVar: '--grad-free',
        colorVar: '--col-free'
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
const timerDisplay = document.getElementById('digitalTimer');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const modePills = document.querySelectorAll('.mode-pill');
const customControls = document.getElementById('customControls');
const activeModeTitle = document.getElementById('activeModeTitle');
const cycleIndicator = document.getElementById('cycleIndicator');

// Inputs
const workSlider = document.getElementById('workSlider');
const breakSlider = document.getElementById('breakSlider');
const workValDisplay = document.getElementById('workValueDisplay');
const breakValDisplay = document.getElementById('breakValueDisplay');

function init() {
    setupListeners();
    updateTheme(currentModeKey);
    updateTimerDisplay();
}

function setupListeners() {
    modePills.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            selectMode(mode);
        });
    });

    startBtn.addEventListener('click', enterActiveMode);
    stopBtn.addEventListener('click', exitActiveMode);

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

    // UI Update Pill
    modePills.forEach(p => p.classList.remove('active'));
    document.querySelector(`.mode-pill[data-mode="${key}"]`).classList.add('active');

    // Show/Hide Free Mode Controls
    if (key === 'custom') {
        customControls.classList.remove('hidden');
    } else {
        customControls.classList.add('hidden');
    }

    updateTheme(key);
    resetTimerToWork();
}

function updateTheme(key) {
    const config = MODES[key];
    const root = document.documentElement;

    // We set the active variables to the specific gradient/color variables
    // But since they are variables themselves, we need to read them or just set them by mapping values? 
    // Easier way: just set the --active-gradient to the value of var(--grad-X)

    // In JS we can just set the property directly to the var string
    root.style.setProperty('--active-gradient', `var(${config.gradientVar})`);
    root.style.setProperty('--active-color', `var(${config.colorVar})`);
}

function resetTimerToWork() {
    const duration = MODES[currentModeKey].work;
    timeLeft = duration * 60;
    updateTimerDisplay();
}

function enterActiveMode() {
    views.selection.classList.add('hidden');
    views.active.classList.remove('hidden');

    // Add border to main container
    appContainer.classList.add('border-active');

    // Title Text
    let title = currentModeKey.replace('_', ' '); // deep_focus -> deep focus
    if (currentModeKey === 'custom') title = 'Free Mode';
    if (currentModeKey === 'deep_focus') title = 'Deep Focus';

    // Capitalize
    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    activeModeTitle.textContent = title;

    const work = MODES[currentModeKey].work;
    const brk = MODES[currentModeKey].break;
    cycleIndicator.textContent = `${work}-${brk}`;

    startTimer();
}

function exitActiveMode() {
    stopTimer();

    views.active.classList.add('hidden');
    views.selection.classList.remove('hidden');

    // Remove border
    appContainer.classList.remove('border-active');

    resetTimerToWork();
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
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = false;
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

init();
