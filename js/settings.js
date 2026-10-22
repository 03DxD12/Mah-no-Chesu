/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/settings.js - Preferences, Storage, and Accessibility Configuration
 */

class SettingsManager {
    constructor() {
        this.STORAGE_KEY = 'maho_no_chesu_settings_v1';
        this.defaults = {
            sfx: true,
            music: true,
            volume: 0.75,
            animationSpeed: 'normal', // 'fast' | 'normal' | 'cinematic'
            particles: 'high',        // 'high' | 'medium' | 'low' | 'off'
            screenShake: true,
            moveHints: true,
            autoRotate: false,
            photosensitivity: false,
            reducedMotion: false,
            boardTheme: 'slate' // 'slate' | 'obsidian' | 'emerald' | 'wood' | 'ice'
        };

        this.settings = { ...this.defaults };
        this.listeners = [];

        this.loadSettings();
        this.checkSystemReducedMotion();
        this.applySettingsToDOM();
        this.initUI();
    }

    checkSystemReducedMotion() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.settings.reducedMotion = true;
            document.body.classList.add('reduced-motion');
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.defaults, ...parsed };
            }
        } catch (e) {
            console.warn('LocalStorage unavailable. Using default settings.', e);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
        this.applySettingsToDOM();
        this.notifyListeners();
    }

    applySettingsToDOM() {
        if (this.settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
        document.body.dataset.boardTheme = this.settings.boardTheme || 'slate';
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        for (const cb of this.listeners) {
            try { cb(this.settings); } catch (e) { console.error(e); }
        }
    }

    initUI() {
        // Form Controls
        const sfxCheckbox = document.getElementById('setting-sfx');
        const musicCheckbox = document.getElementById('setting-music');
        const volumeRange = document.getElementById('setting-volume');
        const volumeVal = document.getElementById('volume-val');
        const themeSelect = document.getElementById('setting-board-theme');
        const speedSelect = document.getElementById('setting-speed');
        const particlesSelect = document.getElementById('setting-particles');
        const shakeCheckbox = document.getElementById('setting-shake');
        const hintsCheckbox = document.getElementById('setting-hints');
        const autoRotateCheckbox = document.getElementById('setting-autorotate');
        const photoCheckbox = document.getElementById('setting-photosensitivity');
        const motionCheckbox = document.getElementById('setting-reduced-motion');

        // Populate values
        if (sfxCheckbox) sfxCheckbox.checked = this.settings.sfx;
        if (musicCheckbox) musicCheckbox.checked = this.settings.music;
        if (volumeRange) {
            volumeRange.value = Math.round(this.settings.volume * 100);
            if (volumeVal) volumeVal.textContent = `${volumeRange.value}%`;
        }
        if (themeSelect) themeSelect.value = this.settings.boardTheme || 'slate';
        if (speedSelect) speedSelect.value = this.settings.animationSpeed;
        if (particlesSelect) particlesSelect.value = this.settings.particles;
        if (shakeCheckbox) shakeCheckbox.checked = this.settings.screenShake;
        if (hintsCheckbox) hintsCheckbox.checked = this.settings.moveHints;
        if (autoRotateCheckbox) autoRotateCheckbox.checked = this.settings.autoRotate;
        if (photoCheckbox) photoCheckbox.checked = this.settings.photosensitivity;
        if (motionCheckbox) motionCheckbox.checked = this.settings.reducedMotion;

        // Event listeners
        themeSelect?.addEventListener('change', (e) => {
            this.settings.boardTheme = e.target.value;
            this.saveSettings();
        });

        // Event listeners
        sfxCheckbox?.addEventListener('change', (e) => {
            this.settings.sfx = e.target.checked;
            this.saveSettings();
        });

        musicCheckbox?.addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
        });

        volumeRange?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            this.settings.volume = val / 100;
            if (volumeVal) volumeVal.textContent = `${val}%`;
            this.saveSettings();
        });

        speedSelect?.addEventListener('change', (e) => {
            this.settings.animationSpeed = e.target.value;
            this.saveSettings();
        });

        particlesSelect?.addEventListener('change', (e) => {
            this.settings.particles = e.target.value;
            this.saveSettings();
        });

        shakeCheckbox?.addEventListener('change', (e) => {
            this.settings.screenShake = e.target.checked;
            this.saveSettings();
        });

        hintsCheckbox?.addEventListener('change', (e) => {
            this.settings.moveHints = e.target.checked;
            this.saveSettings();
        });

        autoRotateCheckbox?.addEventListener('change', (e) => {
            this.settings.autoRotate = e.target.checked;
            this.saveSettings();
        });

        photoCheckbox?.addEventListener('change', (e) => {
            this.settings.photosensitivity = e.target.checked;
            this.saveSettings();
        });

        motionCheckbox?.addEventListener('change', (e) => {
            this.settings.reducedMotion = e.target.checked;
            this.saveSettings();
        });

        this.applySettingsToDOM();
    }
}

if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
}
