/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/effects.js - Cinematic Elemental Attacks, Canvas Particle System, Combat FX & Screen Shake
 */

class EffectsManager {
    constructor() {
        this.boardCanvas = document.getElementById('effects-canvas');
        this.boardCtx = this.boardCanvas ? this.boardCanvas.getContext('2d') : null;

        this.ambientCanvas = document.getElementById('ambient-canvas');
        this.ambientCtx = this.ambientCanvas ? this.ambientCanvas.getContext('2d') : null;

        this.boardWrapper = document.getElementById('board-wrapper');
        this.boardFrame = document.getElementById('board-frame') || this.boardWrapper;
        this.attackBanner = document.getElementById('attack-banner');
        this.comboBanner = document.getElementById('combo-banner');

        // Particle & Effect Entities
        this.particles = [];
        this.ambientParticles = [];
        this.activeLightningArcs = [];
        this.activeMagicRings = [];
        this.activeShockwaves = [];
        this.activeFissures = [];
        this.activeProjectiles = [];
        this.activeBeams = [];
        this.activeStoneSpikes = [];

        // Quality Settings
        this.particleCap = 200;
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
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.boardCanvas.width = rect.width * dpr;
            this.boardCanvas.height = rect.height * dpr;
            if (this.boardCtx) {
                this.boardCtx.resetTransform?.();
                this.boardCtx.scale(dpr, dpr);
            }
            this.boardWidth = rect.width;
            this.boardHeight = rect.height;
        }

        if (this.ambientCanvas) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.ambientCanvas.width = window.innerWidth * dpr;
            this.ambientCanvas.height = window.innerHeight * dpr;
            if (this.ambientCtx) {
                this.ambientCtx.resetTransform?.();
                this.ambientCtx.scale(dpr, dpr);
            }
        }
    }

    setQuality(level) {
        this.quality = level;
        if (level === 'off') this.particleCap = 0;
        else if (level === 'low') this.particleCap = 50;
        else if (level === 'medium') this.particleCap = 100;
        else this.particleCap = 200;
    }

    initAmbientParticles() {
        const count = 40;
        this.ambientParticles = [];
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -0.2 - Math.random() * 0.5,
                radius: 1 + Math.random() * 2.2,
                color: Math.random() > 0.5 ? '#d4af37' : '#38bdf8',
                alpha: 0.15 + Math.random() * 0.45,
                decay: 0.001 + Math.random() * 0.002
            });
        }
    }

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

    screenShake(intensity = 'md') {
        const target = this.boardFrame || this.boardWrapper;
        if (!this.screenShakeEnabled || this.photosensitive || !target) return;
        const cls = `shake-${intensity}`;
        target.classList.remove('shake-sm', 'shake-md', 'shake-lg');
        void target.offsetWidth;
        target.classList.add(cls);
        setTimeout(() => {
            target?.classList.remove(cls);
        }, 500);
    }

    showAttackName(text, isCritical = false) {
        if (!this.attackBanner) return;
        this.attackBanner.textContent = text;
        this.attackBanner.className = 'attack-banner active';
        if (isCritical) {
            this.attackBanner.style.color = '#f43f5e';
            this.attackBanner.style.borderColor = '#f43f5e';
            this.attackBanner.style.boxShadow = '0 0 50px rgba(244, 63, 94, 0.9)';
        } else {
            this.attackBanner.style.color = 'var(--text-gold)';
            this.attackBanner.style.borderColor = 'var(--border-gold)';
            this.attackBanner.style.boxShadow = '0 0 35px rgba(212, 175, 55, 0.6)';
        }

        setTimeout(() => {
            this.attackBanner?.classList.remove('active');
        }, 1100);
    }

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

    spawnParticle(config) {
        if (this.particles.length >= this.particleCap) {
            this.particles.shift();
        }
        this.particles.push({
            x: config.x,
            y: config.y,
            vx: config.vx || (Math.random() - 0.5) * 4,
            vy: config.vy || (Math.random() - 0.5) * 4,
            radius: config.radius || 3,
            color: config.color || '#f97316',
            alpha: config.alpha !== undefined ? config.alpha : 1,
            decay: config.decay || 0.03,
            gravity: config.gravity || 0,
            friction: config.friction || 0.98,
            shape: config.shape || 'circle',
            rotation: config.rotation || 0,
            vRot: (Math.random() - 0.5) * 0.25
        });
    }

    addShockwave(x, y, maxRadius, color, lineWidth = 3.5) {
        this.activeShockwaves.push({
            x,
            y,
            radius: 4,
            maxRadius,
            color,
            lineWidth,
            alpha: 1,
            decay: 0.04
        });
    }

    /**
     * 1. PAWN: FIRE BLAST (Blazing plasma comet + Explosive Fire Nova)
     */
    async fireBlast(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';

        const primaryCol = isWhite ? '#f97316' : '#dc2626';
        const secondaryCol = isWhite ? '#fbbf24' : '#9333ea';
        const coreCol = isWhite ? '#fef08a' : '#f43f5e';

        this.showAttackName('FIRE BLAST');
        this.screenShake('sm');

        // Blazing projectile flying across board
        const steps = 16;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            // Fiery core particle
            this.spawnParticle({
                x: cx,
                y: cy,
                vx: -Math.cos(angle) * 2 + (Math.random() - 0.5),
                vy: -Math.sin(angle) * 2 + (Math.random() - 0.5),
                radius: 6 + Math.random() * 4,
                color: coreCol,
                decay: 0.08
            });

            // Trailing spiral sparks
            for (let p = 0; p < 4; p++) {
                const spread = (Math.random() - 0.5) * 14;
                this.spawnParticle({
                    x: cx + spread,
                    y: cy + spread,
                    vx: -Math.cos(angle) * 3 + (Math.random() - 0.5) * 3,
                    vy: -Math.sin(angle) * 3 + (Math.random() - 0.5) * 3 - 0.5,
                    radius: 3 + Math.random() * 4,
                    color: Math.random() > 0.4 ? primaryCol : secondaryCol,
                    decay: 0.05
                });
            }
            await new Promise(r => setTimeout(r, 14));
        }

        // Dual expanding shockwave rings on impact
        this.addShockwave(to.x, to.y, to.width * 0.95, primaryCol, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.65, coreCol, 3);

        // Exploding fire nova
        for (let i = 0; i < 45; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 8.5;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 4 + Math.random() * 6,
                color: Math.random() > 0.35 ? primaryCol : secondaryCol,
                decay: 0.032,
                gravity: -0.06 // rising heat
            });
        }
        await new Promise(r => setTimeout(r, 180));
    }

    /**
     * 2. KNIGHT: THUNDER STRIKE (Fractal Lightning Forks + Plasma Ground Scorch)
     */
    async thunderStrike(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const arcColor = isWhite ? '#38bdf8' : '#c084fc';
        const boltColor = isWhite ? '#ffffff' : '#fdf4ff';

        this.showAttackName('THUNDER STRIKE');
        this.screenShake('md');

        const createBolt = (targetX, targetY, startX, jitter = 45) => {
            const points = [];
            const segments = 10;
            const stepY = targetY / segments;
            let cx = startX;
            let cy = 0;
            points.push({ x: cx, y: cy });

            for (let s = 1; s <= segments; s++) {
                cy += stepY;
                cx = (s === segments) ? targetX : targetX + (Math.random() - 0.5) * jitter;
                points.push({ x: cx, y: cy });
            }
            return points;
        };

        // 1 Main central bolt
        this.activeLightningArcs.push({
            points: createBolt(to.x, to.y, to.x + (Math.random() - 0.5) * 15, 45),
            color: boltColor,
            glow: arcColor,
            alpha: 1,
            decay: 0.075
        });

        // 2 Branching side bolts
        this.activeLightningArcs.push({
            points: createBolt(to.x - 18, to.y, to.x - 35, 35),
            color: boltColor,
            glow: arcColor,
            alpha: 0.85,
            decay: 0.09
        });
        this.activeLightningArcs.push({
            points: createBolt(to.x + 18, to.y, to.x + 35, 35),
            color: boltColor,
            glow: arcColor,
            alpha: 0.85,
            decay: 0.09
        });

        // Ground plasma shockwaves
        this.addShockwave(to.x, to.y, to.width * 1.05, arcColor, 4);
        this.addShockwave(to.x, to.y, to.width * 0.7, boltColor, 2.5);

        // Bursting plasma sparks
        for (let i = 0; i < 50; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 10;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 2.5 + Math.random() * 3.5,
                color: Math.random() > 0.4 ? boltColor : arcColor,
                decay: 0.042,
                shape: 'spark'
            });
        }
        await new Promise(r => setTimeout(r, 220));
    }

    /**
     * 3. BISHOP: WIND SLASH (Twin Vacuum Scythe Blades + Aerodynamic Cross Cleave)
     */
    async windSlash(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const windColor = isWhite ? '#34d399' : '#a78bfa';
        const streakColor = isWhite ? '#ecfdf5' : '#f3e8ff';

        this.showAttackName('WIND SLASH');
        this.screenShake('sm');

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const steps = 15;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            // Dual offset vacuum scythe arcs
            for (let side of [-1, 1]) {
                const ox = Math.cos(angle + Math.PI / 2) * (side * 10);
                const oy = Math.sin(angle + Math.PI / 2) * (side * 10);

                this.spawnParticle({
                    x: cx + ox,
                    y: cy + oy,
                    vx: Math.cos(angle) * 5 + (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * 5 + (Math.random() - 0.5) * 2,
                    radius: 3.5 + Math.random() * 3.5,
                    color: windColor,
                    decay: 0.065,
                    shape: 'streak'
                });
            }
            await new Promise(r => setTimeout(r, 13));
        }

        // Violent cross-slice pressure wave
        this.addShockwave(to.x, to.y, to.width * 0.9, windColor, 3.5);

        for (let i = 0; i < 40; i++) {
            const a = angle + (Math.random() - 0.5) * 2.2;
            const speed = 4 + Math.random() * 8;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 3.2,
                color: streakColor,
                decay: 0.04,
                shape: 'streak'
            });
        }
        await new Promise(r => setTimeout(r, 160));
    }

    /**
     * 4. ROOK: EARTH BREAKER (Tectonic Fissures + Massive Rising Stone Spikes)
     */
    async earthBreaker(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const earthCol = isWhite ? '#d97706' : '#78350f';
        const rockCol = isWhite ? '#fef3c7' : '#475569';

        this.showAttackName('EARTH BREAKER');
        this.screenShake('lg');

        // Multi-branching ground fissures
        this.activeFissures.push({
            cx: to.x,
            cy: to.y,
            length: to.width * 0.8,
            alpha: 1,
            decay: 0.018
        });

        // 3D rising stone spikes
        for (let i = 0; i < 4; i++) {
            const ox = (i - 1.5) * (to.width * 0.2);
            this.activeStoneSpikes.push({
                x: to.x + ox,
                y: to.y + (Math.random() - 0.5) * 10,
                width: 14 + Math.random() * 6,
                maxHeight: 28 + Math.random() * 14,
                currentHeight: 0,
                color: earthCol,
                accentColor: rockCol,
                alpha: 1,
                decay: 0.02
            });
        }

        this.addShockwave(to.x, to.y, to.width * 1.1, earthCol, 5);

        // Bouncing rock fragments & pulverized stone
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 9;
            this.spawnParticle({
                x: to.x + (Math.random() - 0.5) * 30,
                y: to.y + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 3.5,
                radius: 3.5 + Math.random() * 7,
                color: Math.random() > 0.4 ? earthCol : rockCol,
                decay: 0.028,
                gravity: 0.35,
                shape: 'rock'
            });
        }
        await new Promise(r => setTimeout(r, 260));
    }

    /**
     * 5. QUEEN: FROZEN DOMINION (Rotating Arcane Mandala + Crystalline Shatter)
     */
    async frozenDominion(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const iceCol = isWhite ? '#38bdf8' : '#c084fc';
        const runeCol = isWhite ? '#e0f2fe' : '#f3e8ff';

        this.showAttackName('FROZEN DOMINION');
        this.screenShake('lg');

        // Rotating 12-point arcane runic mandala
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 8,
            maxRadius: to.width * 0.85,
            color: runeCol,
            rotation: 0,
            vRot: 0.07,
            alpha: 1,
            decay: 0.026
        });

        this.addShockwave(to.x, to.y, to.width * 0.95, iceCol, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.65, runeCol, 2.5);

        // Frost crystal shatter explosion
        for (let i = 0; i < 55; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 9;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3.5 + Math.random() * 6.5,
                color: Math.random() > 0.45 ? iceCol : runeCol,
                decay: 0.028,
                shape: 'crystal'
            });
        }
        await new Promise(r => setTimeout(r, 260));
    }

    /**
     * 6. KING: JUDGMENT OF LIGHT (Vertical Solar Pillar + Concentric Sacred Halos)
     */
    async judgmentOfLight(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const lightCol = isWhite ? '#facc15' : '#f472b6';
        const beamCol = isWhite ? '#ffffff' : '#fdf4ff';

        this.showAttackName('JUDGMENT OF LIGHT');
        this.screenShake('md');

        // Celestial vertical solar pillar from sky to ground
        this.activeBeams.push({
            x: to.x,
            y: to.y,
            width: to.width * 0.75,
            color: lightCol,
            coreColor: beamCol,
            alpha: 1,
            decay: 0.028
        });

        // Triple concentric sacred shockwave halos
        this.addShockwave(to.x, to.y, to.width * 1.05, lightCol, 4);
        this.addShockwave(to.x, to.y, to.width * 0.75, beamCol, 3);
        this.addShockwave(to.x, to.y, to.width * 0.45, lightCol, 2);

        // Radiant starburst particles
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3.5 + Math.random() * 5.5,
                color: Math.random() > 0.35 ? lightCol : beamCol,
                decay: 0.025,
                shape: 'circle'
            });
        }
        await new Promise(r => setTimeout(r, 260));
    }

    fortressAura(kingSq, rookSq, isFlipped = false) {
        this.showAttackName('FORTRESS ACTIVATED');
        const kCenter = this.getSquareCenter(kingSq, isFlipped);
        const rCenter = this.getSquareCenter(rookSq, isFlipped);

        for (let pt of [kCenter, rCenter]) {
            this.addShockwave(pt.x, pt.y, pt.width * 0.75, '#facc15', 3.5);
        }
    }

    ascensionAura(sq, isFlipped = false) {
        this.showAttackName('ASCENSION');
        const center = this.getSquareCenter(sq, isFlipped);
        this.addShockwave(center.x, center.y, center.width * 0.95, '#fbbf24', 4.5);

        for (let i = 0; i < 50; i++) {
            this.spawnParticle({
                x: center.x + (Math.random() - 0.5) * 35,
                y: center.y + (Math.random() - 0.5) * 35,
                vx: (Math.random() - 0.5) * 3,
                vy: -3 - Math.random() * 5.5,
                radius: 3.5 + Math.random() * 4,
                color: '#fef08a',
                decay: 0.025
            });
        }
    }

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

        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.spawnParticle({
                x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 6,
                y: from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: 2 + Math.random() * 2.5,
                color,
                decay: 0.055
            });
        }
    }

    /**
     * Master Render Loop (60 FPS, Multi-Layer Canvas Compositing)
     */
    animate(timestamp) {
        const delta = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        if (delta > 0) {
            const currentFps = 1000 / delta;
            this.fpsHistory.push(currentFps);
            if (this.fpsHistory.length > 60) this.fpsHistory.shift();

            if (this.fpsHistory.length >= 60 && !this.autoDegraded) {
                const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
                if (avgFps < 28 && this.quality === 'high') {
                    this.setQuality('medium');
                    this.autoDegraded = true;
                }
            }
        }

        // 1. Ambient Background Particles
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
                    p.alpha = 0.25 + Math.random() * 0.4;
                }

                this.ambientCtx.save();
                this.ambientCtx.globalAlpha = Math.max(0, p.alpha);
                this.ambientCtx.fillStyle = p.color;
                this.ambientCtx.beginPath();
                this.ambientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ambientCtx.fill();
                this.ambientCtx.restore();
            }
        }

        // 2. Board Battlefield FX Canvas
        if (this.boardCtx && this.boardWidth) {
            this.boardCtx.clearRect(0, 0, this.boardWidth, this.boardHeight);

            // A. Celestial Light Beams (King)
            for (let i = this.activeBeams.length - 1; i >= 0; i--) {
                const bm = this.activeBeams[i];
                bm.alpha -= bm.decay;
                if (bm.alpha <= 0) {
                    this.activeBeams.splice(i, 1);
                    continue;
                }
                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, bm.alpha);

                const grad = this.boardCtx.createLinearGradient(bm.x, 0, bm.x, bm.y);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                grad.addColorStop(0.7, bm.color);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

                this.boardCtx.fillStyle = grad;
                this.boardCtx.fillRect(bm.x - bm.width / 2, 0, bm.width, bm.y);

                // Central white-hot core
                this.boardCtx.fillStyle = bm.coreColor;
                this.boardCtx.globalAlpha = Math.max(0, bm.alpha * 0.85);
                this.boardCtx.fillRect(bm.x - bm.width / 6, 0, bm.width / 3, bm.y);
                this.boardCtx.restore();
            }

            // B. Ground Fissures (Earth Breaker)
            for (let i = this.activeFissures.length - 1; i >= 0; i--) {
                const fis = this.activeFissures[i];
                fis.alpha -= fis.decay;
                if (fis.alpha <= 0) {
                    this.activeFissures.splice(i, 1);
                    continue;
                }
                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, fis.alpha);
                this.boardCtx.strokeStyle = '#b45309';
                this.boardCtx.lineWidth = 3;
                this.boardCtx.shadowColor = '#f59e0b';
                this.boardCtx.shadowBlur = 10;
                this.boardCtx.beginPath();
                this.boardCtx.moveTo(fis.cx - fis.length / 2, fis.cy);
                this.boardCtx.lineTo(fis.cx - fis.length / 6, fis.cy + 7);
                this.boardCtx.lineTo(fis.cx + fis.length / 6, fis.cy - 7);
                this.boardCtx.lineTo(fis.cx + fis.length / 2, fis.cy);
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // C. 3D Rising Stone Spikes (Earth Breaker)
            for (let i = this.activeStoneSpikes.length - 1; i >= 0; i--) {
                const spk = this.activeStoneSpikes[i];
                if (spk.currentHeight < spk.maxHeight) {
                    spk.currentHeight += (spk.maxHeight - spk.currentHeight) * 0.25 + 2;
                } else {
                    spk.alpha -= spk.decay;
                }

                if (spk.alpha <= 0) {
                    this.activeStoneSpikes.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, spk.alpha);
                this.boardCtx.fillStyle = spk.color;
                this.boardCtx.beginPath();
                this.boardCtx.moveTo(spk.x - spk.width / 2, spk.y);
                this.boardCtx.lineTo(spk.x, spk.y - spk.currentHeight);
                this.boardCtx.lineTo(spk.x + spk.width / 2, spk.y);
                this.boardCtx.closePath();
                this.boardCtx.fill();

                // Highlight edge
                this.boardCtx.strokeStyle = spk.accentColor;
                this.boardCtx.lineWidth = 1.5;
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // D. Shockwave Rings
            for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
                const sw = this.activeShockwaves[i];
                sw.radius += (sw.maxRadius - sw.radius) * 0.16 + 1.2;
                sw.alpha -= sw.decay;

                if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                    this.activeShockwaves.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, sw.alpha);
                this.boardCtx.strokeStyle = sw.color;
                this.boardCtx.lineWidth = sw.lineWidth;
                this.boardCtx.shadowColor = sw.color;
                this.boardCtx.shadowBlur = 12;
                this.boardCtx.beginPath();
                this.boardCtx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // E. Magic Arcane Rings & Mandalas (Frozen Dominion)
            for (let i = this.activeMagicRings.length - 1; i >= 0; i--) {
                const ring = this.activeMagicRings[i];
                ring.radius += (ring.maxRadius - ring.radius) * 0.12;
                ring.alpha -= ring.decay;
                if (ring.rotation !== undefined) ring.rotation += ring.vRot;

                if (ring.alpha <= 0) {
                    this.activeMagicRings.splice(i, 1);
                    continue;
                }

                this.boardCtx.save();
                this.boardCtx.globalAlpha = Math.max(0, ring.alpha);
                this.boardCtx.strokeStyle = ring.color;
                this.boardCtx.lineWidth = 2.2;
                this.boardCtx.shadowColor = ring.color;
                this.boardCtx.shadowBlur = 14;
                this.boardCtx.translate(ring.x, ring.y);
                if (ring.rotation !== undefined) this.boardCtx.rotate(ring.rotation);

                // Circular outer ring
                this.boardCtx.beginPath();
                this.boardCtx.arc(0, 0, ring.radius, 0, Math.PI * 2);
                this.boardCtx.stroke();

                // 12-point intricate mandala spokes
                for (let a = 0; a < 12; a++) {
                    const ang = (a * Math.PI) / 6;
                    this.boardCtx.beginPath();
                    this.boardCtx.moveTo(0, 0);
                    this.boardCtx.lineTo(Math.cos(ang) * ring.radius, Math.sin(ang) * ring.radius);
                    this.boardCtx.stroke();
                }

                this.boardCtx.restore();
            }

            // F. Lightning Bolts (Thunder Strike)
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
                this.boardCtx.lineWidth = 3.5;
                this.boardCtx.shadowColor = arc.glow;
                this.boardCtx.shadowBlur = 20;

                this.boardCtx.beginPath();
                for (let p = 0; p < arc.points.length; p++) {
                    const pt = arc.points[p];
                    if (p === 0) this.boardCtx.moveTo(pt.x, pt.y);
                    else this.boardCtx.lineTo(pt.x, pt.y);
                }
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // G. Particles (All Elements)
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.friction;
                p.vy *= p.friction;
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
                    this.boardCtx.fillRect(-p.radius, -1.2, p.radius * 2, 2.4);
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
