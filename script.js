const MODES = {
    standard: {
        work: 25,
        break: 5,
        long_break: 20,
        trigger: 4,
        gradientVar: '--grad-standard',
        primaryColor: 'var(--text-standard)'
    },
    light: {
        work: 15,
        break: 5,
        long_break: 15,
        trigger: 4,
        gradientVar: '--grad-light',
        primaryColor: 'var(--text-light)'
    },
    deep_focus: {
        work: 50,
        break: 10,
        long_break: 30,
        trigger: 4,
        gradientVar: '--grad-deep',
        primaryColor: 'var(--text-deep)'
    },
    custom: {
        work: 25,
        break: 5,
        long_break: 15,
        trigger: 4,
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

// Audio
const notificationSound = new Audio('transition.mp3');
notificationSound.volume = 0.4;
let audioDuration = 3; // Default fallback, updated on load
let isSoundTriggered = false;

notificationSound.addEventListener('loadedmetadata', () => {
    if (notificationSound.duration && isFinite(notificationSound.duration)) {
        audioDuration = Math.ceil(notificationSound.duration);
        console.log('Audio loaded, duration:', audioDuration);
    }
});

notificationSound.addEventListener('error', (e) => {
    console.error('Audio failed to load:', e);
    audioDuration = 3; // Fallback
});


// State for Cycle
let isWorkSession = true;
let cycleCount = 0;

// ... existing code ...

function startTimer() {
    if (isRunning) return;
    isRunning = true;

    // Reset sound trigger if starting fresh session (high time)
    if (timeLeft > audioDuration + 5) {
        isSoundTriggered = false;
    }

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            // Pre-transition Trigger check
            // Use ceil to ensure we catch it at an integer tick
            const triggerTime = Math.ceil(audioDuration);

            // Check if we reached the trigger point
            if (!isSoundTriggered && timeLeft <= triggerTime && timeLeft > triggerTime - 1.5) {
                // Play sound
                isSoundTriggered = true;
                notificationSound.currentTime = 0;
                notificationSound.play().catch(e => console.log("Audio play failed", e));
            }

            timeLeft--;
            updateTimerDisplay();
        } else {
            // Timer reached 0
            clearInterval(timerInterval);
            isRunning = false; // CRITICAL: Must set to false to allow restart
            handleSessionEnd();
        }
    }, 1000);
}

function handleSessionEnd() {
    // Clock is at 00:00 (Static).
    // Wait for sound to end.
    if (!notificationSound.paused && !notificationSound.ended) {
        notificationSound.onended = () => {
            completeTransition();
            notificationSound.onended = null; // cleanup
        };
    } else {
        // Sound already done or failed? Flip immediately.
        completeTransition();
    }
}

function completeTransition() {
    // Exact millisecond audio finished -> Flip to next Logic
    switchPhase();
}

function switchPhase() {
    // Toggle Work/Break
    if (isWorkSession) {
        // Work -> Break
        isWorkSession = false;

        // Check for long break logic (every 4 cycles)
        cycleCount++;
        const config = MODES[currentModeKey];
        let nextDuration = config.break;

        // Simple 4-cycle trigger for long break if defined
        if (config.long_break && cycleCount % (config.trigger || 4) === 0) {
            nextDuration = config.long_break;
        }

        timeLeft = nextDuration * 60;
        cycleIndicator.textContent = "Break"; // Or keep hidden

    } else {
        // Break -> Work
        isWorkSession = true;
        const config = MODES[currentModeKey];
        timeLeft = config.work * 60;
    }

    // Reset Sound Trigger for next run
    isSoundTriggered = false;

    // UI Update (The "Flip")
    updateTimerDisplayInstant();

    // Auto-Resume? Prompt implies "Loop for Work Resume", "synchronized hand-off".
    // Usually Pomodoros auto-start next phase?
    // "Loop for Work Resume" implies continuity.
    startTimer();
    updateToggleBtn(true);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    // If paused during sound, sound might continue? 
    // Usually pause should pause sound too strictly, but typically ok to let it finish or pause.
    if (!notificationSound.paused) {
        notificationSound.pause();
    }
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = false;
    isSoundTriggered = false;
    notificationSound.pause();
    notificationSound.currentTime = 0;
    // Reset to Work Session start
    isWorkSession = true;
    cycleCount = 0;
}

// DOM - Flip Clock
const flipDigits = {
    m1: document.getElementById('d-m1'),
    m2: document.getElementById('d-m2'),
    s1: document.getElementById('d-s1'),
    s2: document.getElementById('d-s2')
};

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
    digitEl.classList.remove('flipping');
    void digitEl.offsetWidth; // Trigger reflow
    digitEl.classList.add('flipping');

    // 4. After anim, commit state
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

function init() {
    setupListeners();
    selectMode('standard');
    updateTimerDisplayInstant();

    // Preload audio
    notificationSound.load();

    // Auto-Scale Logic (Upscale Only)
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
}

function handleResize() {
    // Exact Design Dimensions (Design Validé)
    const baseWidth = 330;  // 320 + slight padding buffer
    const baseHeight = 480; // Min height for active view with shadows

    // Available space in the iframe/window
    const availWidth = window.innerWidth;
    const availHeight = window.innerHeight;

    // Calculate Scale to FIT
    // We want the widget to maximize space but never overflow
    const scaleW = availWidth / baseWidth;
    const scaleH = availHeight / baseHeight;

    // Choose the smaller scale to ensure it fits both width and height (Contain)
    // Allow scaling DOWN (e.g. 0.5) and UP (e.g. 1.5)
    let scale = Math.min(scaleW, scaleH);

    // Cap slight oversizing to avoid blurriness if desired, 
    // but usually for widgets we let it grow. Capping at 2x is safe.
    scale = Math.min(scale, 2.5);

    // Apply Scale
    // We use translate(-50%, -50%) + left/top 50% on body/container to center, 
    // OR we can just use transform origin center.
    // The cleanest way for a single widget is to transform the container 
    // and rely on flexbox centering in body, but flex center breaks with scale if margin isn't handled.

    // Better approach:
    appContainer.style.transformOrigin = 'center center';
    appContainer.style.transform = `scale(${scale})`;

    // IMPORTANT: When scaling down, we don't need margins. 
    // When scaling up, flexbox handles centering naturally if body is flex.
    appContainer.style.margin = '0';
}

init();
