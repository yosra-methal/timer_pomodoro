const MODES = {
    standard: {
        work: 25,
        break: 5,
        color: '#007AFF' // Blue
    },
    light: {
        work: 15,
        break: 5,
        color: '#34C759' // Green
    },
    deep_focus: {
        work: 50,
        break: 10,
        color: '#AF52DE' // Purple
    },
    custom: {
        work: 25,
        break: 5,
        color: '#FF9500' // Orange
    }
};

let currentModeKey = 'standard';
let timerInterval = null;
let timeLeft = MODES.standard.work * 60;
let isRunning = false;

// DOM
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
    updateTimerDisplay(); // Show initial 25:00
}

function setupListeners() {
    // Mode Selection
    modePills.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            selectMode(mode);
        });
    });

    // Start
    startBtn.addEventListener('click', () => {
        enterActiveMode();
    });

    // Stop / Reset
    stopBtn.addEventListener('click', () => {
        exitActiveMode();
    });

    // Custom Sliders
    workSlider.addEventListener('input', (e) => {
        MODES.custom.work = parseInt(e.target.value);
        workValDisplay.textContent = MODES.custom.work;
        if (currentModeKey === 'custom') resetTimerToWork();
    });

    breakSlider.addEventListener('input', (e) => {
        MODES.custom.break = parseInt(e.target.value);
        breakValDisplay.textContent = MODES.custom.break;
    }); // Break updates don't change current timer unless we are in break, but here we are in selection mode (Work) usually
}

function selectMode(key) {
    currentModeKey = key;

    // UI Update
    modePills.forEach(p => p.classList.remove('active'));
    document.querySelector(`.mode-pill[data-mode="${key}"]`).classList.add('active');

    // Show/Hide Custom Controls
    if (key === 'custom') {
        customControls.classList.remove('hidden');
    } else {
        customControls.classList.add('hidden');
    }

    // Update Theme Colors
    updateTheme(key);

    // Reset Timer to this mode's Work time
    resetTimerToWork();
}

function updateTheme(key) {
    const color = MODES[key].color;
    document.documentElement.style.setProperty('--theme-color', color);
}

function resetTimerToWork() {
    const duration = MODES[currentModeKey].work;
    timeLeft = duration * 60;
    updateTimerDisplay();
}

function enterActiveMode() {
    // Switch View
    views.selection.classList.add('hidden');
    views.selection.style.display = 'none'; // Ensure layout removal

    views.active.classList.remove('hidden');
    views.active.style.display = 'flex';

    // Update Active View Text
    const modeName = currentModeKey.replace('_', ' '); // deep_focus -> deep focus
    activeModeTitle.textContent = modeName;

    const work = MODES[currentModeKey].work;
    const brk = MODES[currentModeKey].break;
    cycleIndicator.textContent = `${work}-${brk}`;

    // Start Timer
    startTimer();
}

function exitActiveMode() {
    stopTimer();

    // Switch View Back
    views.active.classList.add('hidden');
    views.selection.classList.remove('hidden');
    views.selection.style.display = 'flex'; // Restore flow

    // Reset Timer logic? User probably wants to reset if they hit stop. 
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
            // Timer finished
            // For MVP, just stop or handle phases. 
            // Specs: "Indication... 25-5". 
            // We'll just stop at 00:00 for now or flip to break -> out of scope for "visual redesign" request but good for UX.
            // Let's just stop and alert visually.
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
