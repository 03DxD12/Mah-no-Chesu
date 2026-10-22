/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/audio.js - Procedural Web Audio API Sound Effects & Dark Fantasy Ambient Synth
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.75;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicInterval = null;
        this.musicOscillators = [];
        this.hasUserInteracted = false;

        // Auto-initialize AudioContext on first user interaction
        const initOnGesture = () => {
            this.initContext();
            this.hasUserInteracted = true;
            window.removeEventListener('click', initOnGesture);
            window.removeEventListener('keydown', initOnGesture);
            window.removeEventListener('touchstart', initOnGesture);
        };
        window.addEventListener('click', initOnGesture);
        window.addEventListener('keydown', initOnGesture);
        window.addEventListener('touchstart', initOnGesture);
    }

    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();

                // Master & Channel Gains
                this.masterGainNode = this.ctx.createGain();
                this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
                this.masterGainNode.connect(this.ctx.destination);

                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 1 : 0, this.ctx.currentTime);
                this.sfxGain.connect(this.masterGainNode);

                this.musicGain = this.ctx.createGain();
                this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
                this.musicGain.connect(this.masterGainNode);

                if (this.musicEnabled) {
                    this.startAmbientMusic();
                }
            }
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGainNode && this.ctx) {
            this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(enabled ? 1 : 0, this.ctx.currentTime);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(enabled ? 0.35 : 0, this.ctx.currentTime);
        }
        if (enabled) {
            this.startAmbientMusic();
        } else {
            this.stopAmbientMusic();
        }
    }

    /**
     * Helper: Create noise buffer for elemental swooshes & impacts
     */
    createNoiseBuffer(duration = 1.0) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playUiClick() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playPieceSelect() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(1040, t + 0.12);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playMoveSound() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.14);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.14);
    }

    /**
     * PAWN: Fire Blast Sound (Flames & Detonation)
     */
    playFireBlast() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Low impact boom
        const boom = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(140, t);
        boom.frequency.exponentialRampToValueAtTime(30, t + 0.45);
        boomGain.gain.setValueAtTime(0.6, t);
        boomGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        boom.connect(boomGain);
        boomGain.connect(this.sfxGain);
        boom.start(t);
        boom.stop(t + 0.45);

        // Noise burst with lowpass filter
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.65);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, t);
        filter.frequency.exponentialRampToValueAtTime(90, t + 0.6);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.55, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);
    }

    /**
     * KNIGHT: Thunder Strike (Electric Zap + Sub Bass Rumble)
     */
    playThunderStrike() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Sharp crack transient
        const snap = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snap.type = 'sawtooth';
        snap.frequency.setValueAtTime(3200, t);
        snap.frequency.exponentialRampToValueAtTime(200, t + 0.12);
        snapGain.gain.setValueAtTime(0.5, t);
        snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        snap.connect(snapGain);
        snapGain.connect(this.sfxGain);
        snap.start(t);
        snap.stop(t + 0.12);

        // Electric arc sizzling noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.4);
        const bpf = this.ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(2400, t);
        bpf.Q.value = 5.0;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.4, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        noise.connect(bpf);
        bpf.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);

        // Heavy sub thunder rumble
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'triangle';
        sub.frequency.setValueAtTime(110, t);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.75);
        subGain.gain.setValueAtTime(0.65, t);
        subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(t);
        sub.stop(t + 0.75);
    }

    /**
     * BISHOP: Wind Slash (Blade Whoosh & Whistle)
     */
    playWindSlash() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Dual sweeping razor wind filters
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.5);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(3200, t + 0.14);
        filter.frequency.exponentialRampToValueAtTime(250, t + 0.45);
        filter.Q.value = 5.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(t);

        // Whistle blade harmonic
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, t);
        osc.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.35);
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    /**
     * ROOK: Earth Breaker (Heavy Ground Quake Thump & Rubble)
     */
    playEarthBreaker() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Sub bass tectonic drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(22, t + 0.65);

        gain.gain.setValueAtTime(0.75, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.65);

        // Crushing rock debris rattle
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.5);
        const lpf = this.ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(450, t);
        lpf.frequency.exponentialRampToValueAtTime(80, t + 0.5);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.4, t);
        nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        noise.connect(lpf);
        lpf.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
    }

    /**
     * QUEEN: Frozen Dominion (Glass Shatter & Crystalline Chime)
     */
    playFrozenDominion() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Triple crystalline icy overtones
        [1864, 2349, 3729].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + 0.55);
            gain.gain.setValueAtTime(0.25 - idx * 0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.55);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.55);
        });
    }

    /**
     * KING: Judgment of Light (Holy Radiant Chord & Bell Resonance)
     */
    playJudgmentOfLight() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;

        // Radiant harmonic choir stack
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.2 - idx * 0.02, t);
            gain.gain.exponentialRampToValueAtTime(0.005, t + 0.75);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.75);
        });
    }

    /**
     * Castling Sound
     */
    playCastling() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        [220, 440].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * 0.08);
            gain.gain.setValueAtTime(0.3, t + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + idx * 0.08);
            osc.stop(t + idx * 0.08 + 0.25);
        });
    }

    /**
     * Promotion Sound (Ascending Arpeggio)
     */
    playPromotion() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + idx * 0.09);
            gain.gain.setValueAtTime(0.25, t + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.09 + 0.3);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + idx * 0.09);
            osc.stop(t + idx * 0.09 + 0.3);
        });
    }

    /**
     * Check Warning (Ominous Bell)
     */
    playCheck() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(311.13, t); // D#4 ominous
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    /**
     * Checkmate / Victory Fanfare
     */
    playVictory() {
        if (!this.sfxEnabled || !this.ctx) return;
        this.initContext();
        const t = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + idx * 0.12);
            gain.gain.setValueAtTime(0.28, t + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.6);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t + idx * 0.12);
            osc.stop(t + idx * 0.12 + 0.6);
        });
    }

    /**
     * Dark Fantasy Ambient Synth Background Generator
     * Generates soothing, mysterious, low-pass ambient chords
     */
    startAmbientMusic() {
        if (this.musicInterval || !this.ctx) return;

        // Dark fantasy chord progressions in D minor / A minor
        const chords = [
            [146.83, 220.00, 261.63], // Dm
            [130.81, 196.00, 246.94], // C
            [116.54, 174.61, 220.00], // Bb
            [110.00, 164.81, 220.00]  // Am
        ];
        let chordIndex = 0;

        const playNextChord = () => {
            if (!this.musicEnabled || !this.ctx) return;
            const currentChord = chords[chordIndex];
            chordIndex = (chordIndex + 1) % chords.length;

            const t = this.ctx.currentTime;
            currentChord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(350, t);

                // Smooth slow swell & decay
                gain.gain.setValueAtTime(0.001, t);
                gain.gain.linearRampToValueAtTime(0.08, t + 2.5);
                gain.gain.linearRampToValueAtTime(0.001, t + 5.8);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);

                osc.start(t);
                osc.stop(t + 6.0);
            });
        };

        playNextChord();
        this.musicInterval = setInterval(playNextChord, 6000);
    }

    stopAmbientMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.AudioManager = AudioManager;
}
