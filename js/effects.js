/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/effects.js - Canvas Particle System, Elemental Attacks, Screen Shake & Combo Visuals
 */

class EffectsManager {
    constructor() {
        this.boardCanvas = document.getElementById('effects-canvas');
        this.boardCtx = this.boardCanvas ? this.boardCanvas.getContext('2d') : null;

        this.ambientCanvas = document.getElementById('ambient-canvas');
        this.ambientCtx = this.ambientCanvas ? this.ambientCanvas.getContext('2d') : null;

        this.boardWrapper = document.getElementById('board-wrapper');
        this.attackBanner = document.getElementById('attack-banner');
        this.comboBanner = document.getElementById('combo-banner');

        // Particle Pools
        this.particles = [];
        this.ambientParticles = [];
        this.activeLightningArcs = [];
        this.activeMagicRings = [];

        // Quality Settings
        this.particleCap = 150;
        this.quality = 'high';
        this.photosensitive = false;
        this.screenShakeEnabled = true;

        // Combos
        this.comboCount = 0;
        this.comboTimeout = null;

        // Performance monitoring
        this.lastFrameTime = performance.now();
        this.fpsHistory = [];
        this.autoDegraded = false;

        this.initCanvasSize();
        window.addEventListener('resize', () => this.initCanvasSize());

        this.initAmbientParticles();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initCanvasSize() {
        if (this.boardCanvas && this.boardWrapper) {
            const rect = this.boardWrapper.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            this.boardCanvas.width = rect.width * dpr;
            this.boardCanvas.height = rect.height * dpr;
            if (this.boardCtx) {
                this.boardCtx.scale(dpr, dpr);
            }
            this.boardWidth = rect.width;
            this.boardHeight = rect.height;
        }

        if (this.ambientCanvas) {
            const dpr = window.devicePixelRatio || 1;
            this.ambientCanvas.width = window.innerWidth * dpr;
            this.ambientCanvas.height = window.innerHeight * dpr;
            if (this.ambientCtx) {
                this.ambientCtx.scale(dpr, dpr);
            }
        }
    }

    setQuality(level) {
        this.quality = level;
        if (level === 'off') this.particleCap = 0;
        else if (level === 'low') this.particleCap = 40;
        else if (level === 'medium') this.particleCap = 80;
        else this.particleCap = 150;
    }

    initAmbientParticles() {
        const count = 35;
        this.ambientParticles = [];
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.2 - Math.random() * 0.5,
                radius: 1 + Math.random() * 2,
                color: Math.random() > 0.5 ? '#d4af37' : '#38bdf8',
                alpha: 0.2 + Math.random() * 0.5,
                decay: 0.001 + Math.random() * 0.003
            });
        }
    }

    /**
     * Compute pixel coordinates of square center relative to board
     */
    getSquareCenter(sq, isFlipped = false) {
        if (!this.boardWidth || !this.boardHeight) {
            this.initCanvasSize();
        }
        const file = sq % 8;
        const rank = Math.floor(sq / 8);

        const visualFile = isFlipped ? (7 - file) : file;
        const visualRank = isFlipped ? rank : (7 - rank);

        const sqW = this.boardWidth / 8;
        const sqH = this.boardHeight / 8;

        return {
            x: visualFile * sqW + sqW / 2,
            y: visualRank * sqH + sqH / 2,
            width: sqW,
            height: sqH
        };
    }

    /**
     * Trigger Screen Shake
     */
    screenShake(intensity = 'md') {
        if (!this.screenShakeEnabled || this.photosensitive || !this.boardWrapper) return;
        const cls = `shake-${intensity}`;
        this.boardWrapper.classList.remove('shake-sm', 'shake-md', 'shake-lg');
        void this.boardWrapper.offsetWidth; // Force reflow
        this.boardWrapper.classList.add(cls);
        setTimeout(() => {
            this.boardWrapper.classList.remove(cls);
        }, 500);
    }

    /**
     * Show Attack Name Announcement Banner
     */
    showAttackName(text, isCritical = false) {
        if (!this.attackBanner) return;
        this.attackBanner.textContent = text;
        this.attackBanner.className = 'attack-banner active';
        if (isCritical) {
            this.attackBanner.style.color = '#f43f5e';
            this.attackBanner.style.borderColor = '#f43f5e';
            this.attackBanner.style.boxShadow = '0 0 40px rgba(244, 63, 94, 0.7)';
        } else {
            this.attackBanner.style.color = 'var(--text-gold)';
            this.attackBanner.style.borderColor = 'var(--border-gold)';
            this.attackBanner.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.5)';
        }

        setTimeout(() => {
            this.attackBanner.classList.remove('active');
        }, 1100);
    }

    /**
     * Update Capture Combo Streak
     */
    incrementCombo() {
        this.comboCount++;
        clearTimeout(this.comboTimeout);
        if (this.comboCount >= 2 && this.comboBanner) {
            let label = `${this.comboCount} HIT COMBO!`;
            if (this.comboCount >= 4) label = `ELEMENTAL RAMPAGE! (${this.comboCount} HITS)`;
            this.comboBanner.textContent = label;
            this.comboBanner.classList.add('active');
        }
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 5000);
    }

    resetCombo() {
        this.comboCount = 0;
        if (this.comboBanner) {
            this.comboBanner.classList.remove('active');
        }
    }

    /**
     * Spawn Particle Helper with hard capacity cap
     */
    spawnParticle(config) {
        if (this.particles.length >= this.particleCap) {
            this.particles.shift(); // Evict oldest
        }
        this.particles.push({
            x: config.x,
            y: config.y,
            vx: config.vx || (Math.random() - 0.5) * 4,
            vy: config.vy || (Math.random() - 0.5) * 4,
            radius: config.radius || 3,
            color: config.color || '#f97316',
            alpha: config.alpha || 1,
            decay: config.decay || 0.03,
            gravity: config.gravity || 0,
            shape: config.shape || 'circle',
            rotation: config.rotation || 0,
            vRot: (Math.random() - 0.5) * 0.2
        });
    }

    /**
     * 1. PAWN: FIRE BLAST
     */
    async fireBlast(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';

        const primaryCol = isWhite ? '#f97316' : '#dc2626';
        const secondaryCol = isWhite ? '#fbbf24' : '#7c3aed';

        this.showAttackName('FIRE BLAST');
        this.screenShake('sm');

        // Travel fireball
        const steps = 14;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            for (let p = 0; p < 4; p++) {
                this.spawnParticle({
                    x: cx + (Math.random() - 0.5) * 12,
                    y: cy + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    radius: 3 + Math.random() * 4,
                    color: Math.random() > 0.4 ? primaryCol : secondaryCol,
                    decay: 0.06
                });
            }
            await new Promise(r => setTimeout(r, 16));
        }

        // Explosion on target
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 5,
                color: Math.random() > 0.3 ? primaryCol : secondaryCol,
                decay: 0.04,
                gravity: 0.08
            });
        }
    }

    /**
     * 2. KNIGHT: THUNDER STRIKE
     */
    async thunderStrike(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const arcColor = isWhite ? '#38bdf8' : '#a855f7';
        const boltColor = isWhite ? '#f0f9ff' : '#e9d5ff';

        this.showAttackName('THUNDER STRIKE');
        this.screenShake('md');

        // Arc Lightning Path from sky to target
        const boltPoints = [];
        const startY = 0;
        const segments = 8;
        const stepY = to.y / segments;

        let curX = to.x + (Math.random() - 0.5) * 20;
        let curY = startY;
        boltPoints.push({ x: curX, y: curY });

        for (let i = 1; i <= segments; i++) {
            curY += stepY;
            curX = (i === segments) ? to.x : to.x + (Math.random() - 0.5) * 60;
            boltPoints.push({ x: curX, y: curY });
        }

        this.activeLightningArcs.push({
            points: boltPoints,
            color: boltColor,
            glow: arcColor,
            alpha: 1,
            decay: 0.12
        });

        // Burst sparks
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: Math.random() > 0.4 ? boltColor : arcColor,
                decay: 0.05,
                shape: 'spark'
            });
        }
        await new Promise(r => setTimeout(r, 200));
    }

    /**
     * 3. BISHOP: WIND SLASH
     */
    async windSlash(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const windColor = isWhite ? '#34d399' : '#8b5cf6';

        this.showAttackName('WIND SLASH');
        this.screenShake('sm');

        // Angle between from and to
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        // Crescent vacuum blades travelling along diagonal
        const steps = 12;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            for (let p = 0; p < 3; p++) {
                this.spawnParticle({
                    x: cx + (Math.random() - 0.5) * 15,
                    y: cy + (Math.random() - 0.5) * 15,
                    vx: Math.cos(angle + (Math.random() - 0.5)) * 4,
                    vy: Math.sin(angle + (Math.random() - 0.5)) * 4,
                    radius: 2 + Math.random() * 4,
                    color: windColor,
                    decay: 0.07,
                    shape: 'streak'
                });
            }
            await new Promise(r => setTimeout(r, 16));
        }

        // Radial slice burst
        for (let i = 0; i < 25; i++) {
            const a = angle + (Math.random() - 0.5) * 1.5;
            const spd = 3 + Math.random() * 6;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: 3,
                color: '#ecfdf5',
                decay: 0.05,
                shape: 'streak'
            });
        }
    }

    /**
     * 4. ROOK: EARTH BREAKER
     */
    async earthBreaker(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const earthCol = isWhite ? '#d97706' : '#78350f';
        const rockCol = isWhite ? '#fef3c7' : '#334155';

        this.showAttackName('EARTH BREAKER');
        this.screenShake('lg');

        // Fissure lines and stone eruption
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            this.spawnParticle({
                x: to.x + (Math.random() - 0.5) * 20,
                y: to.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 2, // erupt upward
                radius: 3 + Math.random() * 6,
                color: Math.random() > 0.4 ? earthCol : rockCol,
                decay: 0.035,
                gravity: 0.25,
                shape: 'rock'
            });
        }
        await new Promise(r => setTimeout(r, 220));
    }

    /**
     * 5. QUEEN: FROZEN DOMINION
     */
    async frozenDominion(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const iceCol = isWhite ? '#38bdf8' : '#c084fc';
        const runeCol = isWhite ? '#e0f2fe' : '#f3e8ff';

        this.showAttackName('FROZEN DOMINION');
        this.screenShake('lg');

        // Summon arcane runic ice circle
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 5,
            maxRadius: to.width * 0.7,
            color: runeCol,
            alpha: 1,
            decay: 0.035
        });

        // Frost crystal shatter explosion
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: Math.random() > 0.5 ? iceCol : runeCol,
                decay: 0.035,
                shape: 'crystal'
            });
        }
        await new Promise(r => setTimeout(r, 250));
    }

    /**
     * 6. KING: JUDGMENT OF LIGHT
     */
    async judgmentOfLight(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const lightCol = isWhite ? '#facc15' : '#e879f9';
        const beamCol = isWhite ? '#fef9c3' : '#fdf4ff';

        this.showAttackName('JUDGMENT OF LIGHT');
        this.screenShake('md');

        // Divine sacred pillar
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 10,
            maxRadius: to.width * 0.85,
            color: lightCol,
            alpha: 1,
            decay: 0.03
        });

        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 6;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 4,
                color: Math.random() > 0.3 ? lightCol : beamCol,
                decay: 0.03,
                shape: 'circle'
            });
        }
        await new Promise(r => setTimeout(r, 220));
    }

    /**
     * Castling: Fortress Activated Aura
     */
    fortressAura(kingSq, rookSq, isFlipped = false) {
        this.showAttackName('FORTRESS ACTIVATED');
        const kCenter = this.getSquareCenter(kingSq, isFlipped);
        const rCenter = this.getSquareCenter(rookSq, isFlipped);

        for (let pt of [kCenter, rCenter]) {
            this.activeMagicRings.push({
                x: pt.x,
                y: pt.y,
                radius: 5,
                maxRadius: pt.width * 0.6,
                color: '#facc15',
                alpha: 1,
                decay: 0.04
            });
        }
    }

    /**
     * Promotion: Ascension Aura
     */
    ascensionAura(sq, isFlipped = false) {
        this.showAttackName('ASCENSION');
        const center = this.getSquareCenter(sq, isFlipped);
        this.activeMagicRings.push({
            x: center.x,
            y: center.y,
            radius: 5,
            maxRadius: center.width * 0.9,
            color: '#fbbf24',
            alpha: 1,
            decay: 0.025
        });

        for (let i = 0; i < 40; i++) {
            this.spawnParticle({
                x: center.x + (Math.random() - 0.5) * 30,
                y: center.y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 3,
                vy: -2 - Math.random() * 4, // ascending beam
                radius: 3 + Math.random() * 3,
                color: '#fef08a',
                decay: 0.03
            });
        }
    }

    /**
     * Normal Move Trail FX
     */
    moveTrail(piece, fromSq, toSq, isFlipped = false) {
        if (this.quality === 'off') return;
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);

        let color = '#38bdf8';
        if (piece.type === 'p') color = '#f97316';
        if (piece.type === 'n') color = '#38bdf8';
        if (piece.type === 'b') color = '#34d399';
        if (piece.type === 'r') color = '#d97706';
        if (piece.type === 'q') color = '#a855f7';
        if (piece.type === 'k') color = '#facc15';

        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.spawnParticle({
                x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 8,
                y: from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 8,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: 2 + Math.random() * 2,
                color,
                decay: 0.06
            });
        }
    }

    /**
     * Main Animation Loop
     */
    animate(timestamp) {
        // Frame time measurement
        const delta = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        if (delta > 0) {
            const currentFps = 1000 / delta;
            this.fpsHistory.push(currentFps);
            if (this.fpsHistory.length > 60) this.fpsHistory.shift();

            // Check if degrading is necessary
            if (this.fpsHistory.length >= 60 && !this.autoDegraded) {
                const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
                if (avgFps < 28 && this.quality === 'high') {
                    this.setQuality('medium');
                    this.autoDegraded = true;
                    console.log('Visual quality dynamically lowered for smoother framerate.');
                }
            }
        }

        // Render Ambient Background Particles
        if (this.ambientCtx && this.ambientParticles.length > 0) {
            this.ambientCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (let i = 0; i < this.ambientParticles.length; i++) {
                const p = this.ambientParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0 || p.y < 0 || p.x < 0 || p.x > window.innerWidth) {
                    p.x = Math.random() * window.innerWidth;
                    p.y = window.innerHeight + 10;
                    p.alpha = 0.3 + Math.random() * 0.4;
                }

                this.ambientCtx.save();
                this.ambientCtx.globalAlpha = p.alpha;
                this.ambientCtx.fillStyle = p.color;
                this.ambientCtx.beginPath();
                this.ambientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ambientCtx.fill();
                this.ambientCtx.restore();
            }
        }

        // Render Chessboard FX Canvas
        if (this.boardCtx && this.boardWidth) {
            this.boardCtx.clearRect(0, 0, this.boardWidth, this.boardHeight);

            // 1. Render Magic Circles
            for (let i = this.activeMagicRings.length - 1; i >= 0; i--) {
                const ring = this.activeMagicRings[i];
                ring.radius += (ring.maxRadius - ring.radius) * 0.12;
                ring.alpha -= ring.decay;

                if (ring.alpha <= 0) {
                    this.activeMagicRings.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, ring.alpha);
                this.boardCtx.strokeStyle = ring.color;
                this.boardCtx.lineWidth = 2.5;
                this.boardCtx.beginPath();
                this.boardCtx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // 2. Render Lightning Arcs
            for (let i = this.activeLightningArcs.length - 1; i >= 0; i--) {
                const arc = this.activeLightningArcs[i];
                arc.alpha -= arc.decay;
                if (arc.alpha <= 0) {
                    this.activeLightningArcs.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, arc.alpha);
                this.boardCtx.strokeStyle = arc.color;
                this.boardCtx.lineWidth = 3;
                this.boardCtx.shadowColor = arc.glow;
                this.boardCtx.shadowBlur = 15;

                this.boardCtx.beginPath();
                for (let p = 0; p < arc.points.length; p++) {
                    const pt = arc.points[p];
                    if (p === 0) this.boardCtx.moveTo(pt.x, pt.y);
                    else this.boardCtx.lineTo(pt.x, pt.y);
                }
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // 3. Render Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.alpha -= p.decay;
                p.rotation += p.vRot;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, p.alpha);
                this.boardCtx.fillStyle = p.color;

                if (p.shape === 'spark' || p.shape === 'streak') {
                    this.boardCtx.translate(p.x, p.y);
                    this.boardCtx.rotate(p.rotation);
                    this.boardCtx.fillRect(-p.radius, -1, p.radius * 2, 2);
                } else if (p.shape === 'rock' || p.shape === 'crystal') {
                    this.boardCtx.translate(p.x, p.y);
                    this.boardCtx.rotate(p.rotation);
                    this.boardCtx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius);
                } else {
                    this.boardCtx.beginPath();
                    this.boardCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    this.boardCtx.fill();
                }
                this.boardCtx.restore();
            }
        }

        requestAnimationFrame(this.animate);
    }
}

if (typeof window !== 'undefined') {
    window.EffectsManager = EffectsManager;
}
