// Configuration for each mode
const MODES = {
    standard: {
        work: 25,
        break: 5,
        long_break: 20,
        colors: { start: '#007AFF', end: '#00C6FF' },
        rgba: 'rgba(0, 122, 255, 0.5)'
    },
    light: {
        work: 15,
        break: 5,
        long_break: 15,
        colors: { start: '#28CD41', end: '#87EE85' },
        rgba: 'rgba(40, 205, 65, 0.5)'
    },
    deep_focus: {
        work: 50,
        break: 10,
        long_break: 30,
        colors: { start: '#AF52DE', end: '#D5A3FF' },
        rgba: 'rgba(175, 82, 222, 0.5)'
    },
    custom: {
        work: 25, // default initial
        break: 5,
        colors: { start: '#FF9500', end: '#FFCC00' },
        rgba: 'rgba(255, 149, 0, 0.5)'
    }
};

// State
let currentMode = 'standard';
let timerState = 'stopped'; // stopped, running, paused
let phase = 'work'; // work, break
let timeLeft = MODES.standard.work * 60;
let timerInterval = null;

// DOM Elements
const body = document.body;
const appContainer = document.querySelector('.app-container');
const modeBtns = document.querySelectorAll('.mode-btn');
const timerDisplay = document.getElementById('digitalTimer');
const statusLabel = document.getElementById('statusLabel');
const mainBtn = document.getElementById('mainActionBtn');
const playIcon = document.querySelector('.icon-play');
const pauseIcon = document.querySelector('.icon-pause');
const customControls = document.getElementById('customControls');
const workSlider = document.getElementById('workSlider');
const breakSlider = document.getElementById('breakSlider');
const workValue = document.getElementById('workValue');
const breakValue = document.getElementById('breakValue');

// Initialization
function init() {
    updateVisuals('standard');
    updateTimerDisplay();
    setupEventListeners();
}

// Logic
function setupEventListeners() {
    // Mode Switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            switchMode(mode);
        });
    });

    // Play/Pause
    mainBtn.addEventListener('click', toggleTimer);

    // Custom Sliders
    workSlider.addEventListener('input', (e) => {
        MODES.custom.work = parseInt(e.target.value);
        workValue.textContent = `${MODES.custom.work}m`;
        if (currentMode === 'custom' && timerState === 'stopped' && phase === 'work') {
            timeLeft = MODES.custom.work * 60;
            updateTimerDisplay();
        }
    });

    breakSlider.addEventListener('input', (e) => {
        MODES.custom.break = parseInt(e.target.value);
        breakValue.textContent = `${MODES.custom.break}m`;
        // If we were in break phase in custom mode (edge case), update it
    });
}

function switchMode(mode) {
    if (currentMode === mode) return;
    
    // Stop current timer
    stopTimer();
    
    currentMode = mode;
    phase = 'work'; // Reset to work phase on mode switch
    
    // Reset time based on mode
    const duration = mode === 'custom' ? MODES.custom.work : MODES[mode].work;
    timeLeft = duration * 60;
    
    updateVisuals(mode);
    updateTimerDisplay();
    
    // UI Updates for Custom Mode
    if (mode === 'custom') {
        customControls.classList.remove('hidden');
        timerDisplay.style.fontSize = '48px'; // Shrink slightly to fit
    } else {
        customControls.classList.add('hidden');
        timerDisplay.style.fontSize = '64px';
    }
}

function updateVisuals(mode) {
    const config = MODES[mode];
    
    // Update CSS Variables for Gradients
    document.documentElement.style.setProperty('--active-grad-start', config.colors.start);
    document.documentElement.style.setProperty('--active-grad-end', config.colors.end);
    document.documentElement.style.setProperty('--shadow-color', config.rgba);

    // Update Buttons
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function toggleTimer() {
    if (timerState === 'running') {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    timerState = 'running';
    toggleIcons(true); // show pause
    
    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            handleTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    timerState = 'paused';
    clearInterval(timerInterval);
    toggleIcons(false); // show play
}

function stopTimer() {
    timerState = 'stopped';
    clearInterval(timerInterval);
    toggleIcons(false);
}

function handleTimerComplete() {
    // Basic phase switching logic using alert/notification placeholders
    // For MVP: Switch phase and restart or stop
    stopTimer();
    
    if (phase === 'work') {
        phase = 'break';
        statusLabel.textContent = 'Break Time';
        
        let breakDuration = MODES[currentMode].break;
        if (currentMode === 'custom') breakDuration = MODES.custom.break;
        
        timeLeft = breakDuration * 60;
        updateTimerDisplay();
        startTimer(); // Auto-start break? usually yes in simple apps, or wait. Let's auto-start for fluidity.
    } else {
        phase = 'work';
        statusLabel.textContent = 'Focus';
        
        let workDuration = MODES[currentMode].work;
        if (currentMode === 'custom') workDuration = MODES.custom.work;
        
        timeLeft = workDuration * 60;
        updateTimerDisplay();
        // Wait for user to start work again
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function toggleIcons(isRunning) {
    if (isRunning) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

// Run
init();
