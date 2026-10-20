/**
 * Timer Application
 * Precise countdown timer with Web Audio API chime, progress ring and notification support.
 */

class TimerApp {
  constructor() {
    // DOM Elements
    this.appCard = document.querySelector('.app-card');
    this.timeText = document.getElementById('timeText');
    this.statusLabel = document.getElementById('statusLabel');
    this.progressCircle = document.getElementById('progressCircle');
    this.btnStartPause = document.getElementById('btnStartPause');
    this.startPauseText = document.getElementById('startPauseText');
    this.iconPlay = document.getElementById('iconPlay');
    this.iconPause = document.getElementById('iconPause');
    this.btnReset = document.getElementById('btnReset');
    this.soundToggle = document.getElementById('soundToggle');
    this.soundIconOn = document.getElementById('soundIconOn');
    this.soundIconOff = document.getElementById('soundIconOff');

    // Inputs
    this.inputHours = document.getElementById('inputHours');
    this.inputMinutes = document.getElementById('inputMinutes');
    this.inputSeconds = document.getElementById('inputSeconds');
    this.btnSetCustom = document.getElementById('btnSetCustom');
    this.presetButtons = document.querySelectorAll('.preset-btn');
    this.quickAdjustButtons = document.querySelectorAll('.btn-chip');

    // SVG Progress Setup
    this.radius = 130;
    this.circumference = 2 * Math.PI * this.radius;
    this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.progressCircle.style.strokeDashoffset = '0';

    // State Variables
    this.defaultSeconds = 300; // 5 minutes default
    this.totalSeconds = this.defaultSeconds;
    this.remainingSeconds = this.defaultSeconds;
    this.isRunning = false;
    this.isPaused = false;
    this.soundEnabled = true;
    this.timerId = null;
    this.endTime = null;

    // Audio Context (Initialized on user gesture)
    this.audioCtx = null;

    this.initEvents();
    this.updateDisplay();
    this.requestNotificationPermission();
  }

  initEvents() {
    this.btnStartPause.addEventListener('click', () => this.toggleStartPause());
    this.btnReset.addEventListener('click', () => this.resetTimer());
    this.soundToggle.addEventListener('click', () => this.toggleSound());

    // Custom Time Apply
    this.btnSetCustom.addEventListener('click', () => {
      const h = parseInt(this.inputHours.value, 10) || 0;
      const m = parseInt(this.inputMinutes.value, 10) || 0;
      const s = parseInt(this.inputSeconds.value, 10) || 0;
      const total = h * 3600 + m * 60 + s;

      if (total > 0) {
        this.clearActivePreset();
        this.setTimer(total);
      }
    });

    // Preset Buttons
    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const secs = parseInt(btn.dataset.seconds, 10);
        this.clearActivePreset();
        btn.classList.add('active');
        this.setTimer(secs);
      });
    });

    // Quick Add Buttons (+1m, +5m, +10m)
    this.quickAdjustButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const addSecs = parseInt(btn.dataset.add, 10);
        this.addTime(addSecs);
      });
    });
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      window.addEventListener('click', () => {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }, { once: true });
    }
  }

  clearActivePreset() {
    this.presetButtons.forEach(b => b.classList.remove('active'));
  }

  setTimer(seconds) {
    this.pauseTimer();
    this.totalSeconds = seconds;
    this.remainingSeconds = seconds;
    this.updateInputsFromSeconds(seconds);
    this.updateDisplay();
    this.setStatus('Pronto');
    this.appCard.classList.remove('running', 'paused', 'completed');
  }

  addTime(seconds) {
    this.remainingSeconds += seconds;
    this.totalSeconds = Math.max(this.totalSeconds, this.remainingSeconds);
    if (this.isRunning && !this.isPaused) {
      this.endTime += seconds * 1000;
    }
    this.updateDisplay();
  }

  updateInputsFromSeconds(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    this.inputHours.value = h;
    this.inputMinutes.value = m;
    this.inputSeconds.value = s;
  }

  toggleStartPause() {
    if (!this.isRunning) {
      this.startTimer();
    } else if (this.isPaused) {
      this.resumeTimer();
    } else {
      this.pauseTimer();
    }
  }

  startTimer() {
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = this.totalSeconds;
    }
    this.isRunning = true;
    this.isPaused = false;
    this.endTime = Date.now() + this.remainingSeconds * 1000;

    this.updateButtonUI(true);
    this.setStatus('Em andamento');
    this.appCard.classList.remove('completed', 'paused');
    this.appCard.classList.add('running');

    this.runTick();
  }

  pauseTimer() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    clearTimeout(this.timerId);

    // Recalculate remaining exact seconds
    this.remainingSeconds = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));

    this.updateButtonUI(false, true);
    this.setStatus('Pausado');
    this.appCard.classList.remove('running');
    this.appCard.classList.add('paused');
  }

  resumeTimer() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.endTime = Date.now() + this.remainingSeconds * 1000;

    this.updateButtonUI(true);
    this.setStatus('Em andamento');
    this.appCard.classList.remove('paused');
    this.appCard.classList.add('running');

    this.runTick();
  }

  resetTimer() {
    clearTimeout(this.timerId);
    this.isRunning = false;
    this.isPaused = false;
    this.remainingSeconds = this.totalSeconds;

    this.updateButtonUI(false);
    this.setStatus('Pronto');
    this.appCard.classList.remove('running', 'paused', 'completed');
    this.updateDisplay();
  }

  runTick() {
    clearTimeout(this.timerId);

    const now = Date.now();
    const msRemaining = this.endTime - now;

    if (msRemaining <= 0) {
      this.remainingSeconds = 0;
      this.updateDisplay();
      this.timerComplete();
      return;
    }

    this.remainingSeconds = Math.ceil(msRemaining / 1000);
    this.updateDisplay();

    // Next tick synchronized with millisecond drift
    const delay = msRemaining % 1000 || 1000;
    this.timerId = setTimeout(() => this.runTick(), Math.min(delay, 250));
  }

  timerComplete() {
    clearTimeout(this.timerId);
    this.isRunning = false;
    this.isPaused = false;

    this.updateButtonUI(false);
    this.setStatus('Finalizado!');
    this.appCard.classList.remove('running', 'paused');
    this.appCard.classList.add('completed');

    this.playAlarmSound();
    this.showNotification();
  }

  updateDisplay() {
    const formatted = this.formatTime(this.remainingSeconds);
    this.timeText.textContent = formatted;

    // Update document title
    if (this.isRunning && !this.isPaused) {
      document.title = `(${formatted}) Temporizador`;
    } else {
      document.title = 'Timer Online';
    }

    // Progress Ring offset
    const fraction = this.totalSeconds > 0 ? this.remainingSeconds / this.totalSeconds : 0;
    const offset = this.circumference * (1 - fraction);
    this.progressCircle.style.strokeDashoffset = `${offset}`;
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }

  setStatus(text) {
    this.statusLabel.textContent = text;
  }

  updateButtonUI(running, paused = false) {
    if (running) {
      this.startPauseText.textContent = 'Pausar';
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
    } else if (paused) {
      this.startPauseText.textContent = 'Retomar';
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
    } else {
      this.startPauseText.textContent = 'Iniciar';
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.soundIconOn.classList.toggle('hidden', !this.soundEnabled);
    this.soundIconOff.classList.toggle('hidden', this.soundEnabled);
  }

  // Synthesizes a clean chime using Web Audio API
  playAlarmSound() {
    if (!this.soundEnabled) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const notes = [
        { freq: 587.33, start: 0, duration: 0.18 },    // D5
        { freq: 880.00, start: 0.2, duration: 0.25 },   // A5
        { freq: 1174.66, start: 0.45, duration: 0.35 }, // D6
        { freq: 880.00, start: 0.85, duration: 0.18 },  // Repeat chime
        { freq: 1174.66, start: 1.05, duration: 0.4 }
      ];

      notes.forEach(note => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, this.audioCtx.currentTime + note.start);

        gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime + note.start);
        gain.gain.exponentialRampToValueAtTime(0.3, this.audioCtx.currentTime + note.start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + note.start + note.duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + note.start);
        osc.stop(this.audioCtx.currentTime + note.start + note.duration + 0.05);
      });
    } catch (e) {
      console.warn('Audio API unavailable:', e);
    }
  }

  showNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ Tempo esgotado!', {
          body: 'Seu temporizador chegou ao fim.',
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⏰</text></svg>'
        });
      } catch (err) {
        console.warn('Notification error:', err);
      }
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new TimerApp();
});
