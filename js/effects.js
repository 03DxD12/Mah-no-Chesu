/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/effects.js - Cinematic Canvas FX, Particle System, Elemental Combat & Screen Shake
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

        // Particle & Effect Pools
        this.particles = [];
        this.ambientParticles = [];
        this.activeLightningArcs = [];
        this.activeMagicRings = [];
        this.activeShockwaves = [];
        this.activeFissures = [];

        // Quality Settings
        this.particleCap = 180;
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
        else if (level === 'low') this.particleCap = 40;
        else if (level === 'medium') this.particleCap = 90;
        else this.particleCap = 180;
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
        if (!this.screenShakeEnabled || this.photosensitive || !this.boardWrapper) return;
        const cls = `shake-${intensity}`;
        this.boardWrapper.classList.remove('shake-sm', 'shake-md', 'shake-lg');
        void this.boardWrapper.offsetWidth;
        this.boardWrapper.classList.add(cls);
        setTimeout(() => {
            this.boardWrapper?.classList.remove(cls);
        }, 500);
    }

    showAttackName(text, isCritical = false) {
        if (!this.attackBanner) return;
        this.attackBanner.textContent = text;
        this.attackBanner.className = 'attack-banner active';
        if (isCritical) {
            this.attackBanner.style.color = '#f43f5e';
            this.attackBanner.style.borderColor = '#f43f5e';
            this.attackBanner.style.boxShadow = '0 0 45px rgba(244, 63, 94, 0.85)';
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

    addShockwave(x, y, maxRadius, color, lineWidth = 3) {
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
     * 1. PAWN: FIRE BLAST (Spiraling fireball + Fiery shockwave explosion)
     */
    async fireBlast(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';

        const primaryCol = isWhite ? '#f97316' : '#dc2626';
        const secondaryCol = isWhite ? '#fbbf24' : '#9333ea';

        this.showAttackName('FIRE BLAST');
        this.screenShake('sm');

        // Spiraling dual fireball streams
        const steps = 15;
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;
            const wave = Math.sin(t * Math.PI * 4) * (to.width * 0.25);

            const ox1 = Math.cos(angle + Math.PI / 2) * wave;
            const oy1 = Math.sin(angle + Math.PI / 2) * wave;

            for (let p = 0; p < 3; p++) {
                this.spawnParticle({
                    x: cx + ox1 + (Math.random() - 0.5) * 8,
                    y: cy + oy1 + (Math.random() - 0.5) * 8,
                    vx: -Math.cos(angle) * 1.5 + (Math.random() - 0.5),
                    vy: -Math.sin(angle) * 1.5 - 0.5,
                    radius: 3 + Math.random() * 4,
                    color: Math.random() > 0.4 ? primaryCol : secondaryCol,
                    decay: 0.055
                });
            }
            await new Promise(r => setTimeout(r, 16));
        }

        // Fiery shockwave
        this.addShockwave(to.x, to.y, to.width * 0.85, primaryCol, 4);

        // Explosive burst on target
        for (let i = 0; i < 35; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 4 + Math.random() * 5,
                color: Math.random() > 0.3 ? primaryCol : secondaryCol,
                decay: 0.035,
                gravity: -0.05 // rise upward
            });
        }
    }

    /**
     * 2. KNIGHT: THUNDER STRIKE (Branching sky bolts + Electric ground flash)
     */
    async thunderStrike(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const arcColor = isWhite ? '#38bdf8' : '#c084fc';
        const boltColor = isWhite ? '#f0f9ff' : '#fdf4ff';

        this.showAttackName('THUNDER STRIKE');
        this.screenShake('md');

        // Create Main Bolt + 2 Branching Bolts
        const createBolt = (targetX, targetY, startX) => {
            const points = [];
            const segments = 9;
            const stepY = targetY / segments;
            let cx = startX;
            let cy = 0;
            points.push({ x: cx, y: cy });

            for (let s = 1; s <= segments; s++) {
                cy += stepY;
                cx = (s === segments) ? targetX : targetX + (Math.random() - 0.5) * 55;
                points.push({ x: cx, y: cy });
            }
            return points;
        };

        // Main bolt
        this.activeLightningArcs.push({
            points: createBolt(to.x, to.y, to.x + (Math.random() - 0.5) * 20),
            color: boltColor,
            glow: arcColor,
            alpha: 1,
            decay: 0.08
        });

        // Branch 1
        this.activeLightningArcs.push({
            points: createBolt(to.x - 15, to.y, to.x - 30),
            color: boltColor,
            glow: arcColor,
            alpha: 0.8,
            decay: 0.1
        });

        // Branch 2
        this.activeLightningArcs.push({
            points: createBolt(to.x + 15, to.y, to.x + 30),
            color: boltColor,
            glow: arcColor,
            alpha: 0.8,
            decay: 0.1
        });

        // Ground shockwave
        this.addShockwave(to.x, to.y, to.width * 0.9, arcColor, 3);

        // Sparks scattering
        for (let i = 0; i < 40; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 9;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 2 + Math.random() * 3,
                color: Math.random() > 0.4 ? boltColor : arcColor,
                decay: 0.045,
                shape: 'spark'
            });
        }
        await new Promise(r => setTimeout(r, 220));
    }

    /**
     * 3. BISHOP: WIND SLASH (Twin vacuum scythe blades + Aerodynamic slice)
     */
    async windSlash(fromSq, toSq, color = 'w', isFlipped = false) {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const windColor = isWhite ? '#34d399' : '#a78bfa';

        this.showAttackName('WIND SLASH');
        this.screenShake('sm');

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const steps = 14;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            // Two offset vacuum blade arcs
            for (let side of [-1, 1]) {
                const ox = Math.cos(angle + Math.PI / 2) * (side * 8);
                const oy = Math.sin(angle + Math.PI / 2) * (side * 8);

                this.spawnParticle({
                    x: cx + ox,
                    y: cy + oy,
                    vx: Math.cos(angle) * 5 + (Math.random() - 0.5) * 2,
                    vy: Math.sin(angle) * 5 + (Math.random() - 0.5) * 2,
                    radius: 3 + Math.random() * 3,
                    color: windColor,
                    decay: 0.065,
                    shape: 'streak'
                });
            }
            await new Promise(r => setTimeout(r, 15));
        }

        // Cross-slice visual burst at target
        for (let i = 0; i < 30; i++) {
            const a = angle + (Math.random() - 0.5) * 1.8;
            const speed = 4 + Math.random() * 7;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 3,
                color: '#ecfdf5',
                decay: 0.045,
                shape: 'streak'
            });
        }
    }

    /**
     * 4. ROOK: EARTH BREAKER (Tectonic fissure split + Rising stone pillars)
     */
    async earthBreaker(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const earthCol = isWhite ? '#d97706' : '#78350f';
        const rockCol = isWhite ? '#fef3c7' : '#475569';

        this.showAttackName('EARTH BREAKER');
        this.screenShake('lg');

        // Dynamic ground fissure crack
        this.activeFissures.push({
            cx: to.x,
            cy: to.y,
            length: to.width * 0.7,
            alpha: 1,
            decay: 0.02
        });

        this.addShockwave(to.x, to.y, to.width * 0.95, earthCol, 5);

        // Rising rock fragments and falling rubble
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            this.spawnParticle({
                x: to.x + (Math.random() - 0.5) * 24,
                y: to.y + (Math.random() - 0.5) * 24,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 3,
                radius: 3 + Math.random() * 7,
                color: Math.random() > 0.4 ? earthCol : rockCol,
                decay: 0.03,
                gravity: 0.3,
                shape: 'rock'
            });
        }
        await new Promise(r => setTimeout(r, 240));
    }

    /**
     * 5. QUEEN: FROZEN DOMINION (Hexagonal runic mandala + Ice shatter)
     */
    async frozenDominion(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const iceCol = isWhite ? '#38bdf8' : '#c084fc';
        const runeCol = isWhite ? '#e0f2fe' : '#f3e8ff';

        this.showAttackName('FROZEN DOMINION');
        this.screenShake('lg');

        // Summon rotating arcane runic mandala
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 8,
            maxRadius: to.width * 0.8,
            color: runeCol,
            rotation: 0,
            vRot: 0.08,
            alpha: 1,
            decay: 0.03
        });

        this.addShockwave(to.x, to.y, to.width * 0.9, iceCol, 4);

        // Explosive frost crystal shatter
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 8;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 6,
                color: Math.random() > 0.5 ? iceCol : runeCol,
                decay: 0.03,
                shape: 'crystal'
            });
        }
        await new Promise(r => setTimeout(r, 260));
    }

    /**
     * 6. KING: JUDGMENT OF LIGHT (Vertical solar pillar + Radiant halos)
     */
    async judgmentOfLight(fromSq, toSq, color = 'w', isFlipped = false) {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const lightCol = isWhite ? '#facc15' : '#f472b6';
        const beamCol = isWhite ? '#fef9c3' : '#fdf4ff';

        this.showAttackName('JUDGMENT OF LIGHT');
        this.screenShake('md');

        // Sacred descending beam from sky
        this.activeShockwaves.push({
            x: to.x,
            y: to.y,
            radius: 5,
            maxRadius: to.width * 0.85,
            color: lightCol,
            lineWidth: 4,
            alpha: 1,
            decay: 0.025
        });

        // Divine starburst particles
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 7;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: Math.random() > 0.3 ? lightCol : beamCol,
                decay: 0.028,
                shape: 'circle'
            });
        }
        await new Promise(r => setTimeout(r, 240));
    }

    fortressAura(kingSq, rookSq, isFlipped = false) {
        this.showAttackName('FORTRESS ACTIVATED');
        const kCenter = this.getSquareCenter(kingSq, isFlipped);
        const rCenter = this.getSquareCenter(rookSq, isFlipped);

        for (let pt of [kCenter, rCenter]) {
            this.addShockwave(pt.x, pt.y, pt.width * 0.7, '#facc15', 3);
        }
    }

    ascensionAura(sq, isFlipped = false) {
        this.showAttackName('ASCENSION');
        const center = this.getSquareCenter(sq, isFlipped);
        this.addShockwave(center.x, center.y, center.width * 0.9, '#fbbf24', 4);

        for (let i = 0; i < 45; i++) {
            this.spawnParticle({
                x: center.x + (Math.random() - 0.5) * 35,
                y: center.y + (Math.random() - 0.5) * 35,
                vx: (Math.random() - 0.5) * 3,
                vy: -2.5 - Math.random() * 5,
                radius: 3 + Math.random() * 4,
                color: '#fef08a',
                decay: 0.028
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

        const steps = 9;
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
     * Master Render Loop (60 FPS, Canvas Compositing)
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

        // 1. Ambient Particles
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

            // Ground Fissures (Earth)
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
                this.boardCtx.lineWidth = 2.5;
                this.boardCtx.beginPath();
                this.boardCtx.moveTo(fis.cx - fis.length / 2, fis.cy);
                this.boardCtx.lineTo(fis.cx - fis.length / 6, fis.cy + 6);
                this.boardCtx.lineTo(fis.cx + fis.length / 6, fis.cy - 6);
                this.boardCtx.lineTo(fis.cx + fis.length / 2, fis.cy);
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // Shockwave Rings
            for (let i = this.activeShockwaves.length - 1; i >= 0; i--) {
                const sw = this.activeShockwaves[i];
                sw.radius += (sw.maxRadius - sw.radius) * 0.16 + 1;
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
                this.boardCtx.shadowBlur = 10;
                this.boardCtx.beginPath();
                this.boardCtx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // Magic Circles & Mandalas
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
                this.boardCtx.lineWidth = 2;
                this.boardCtx.translate(ring.x, ring.y);
                if (ring.rotation !== undefined) this.boardCtx.rotate(ring.rotation);

                // Circular perimeter
                this.boardCtx.beginPath();
                this.boardCtx.arc(0, 0, ring.radius, 0, Math.PI * 2);
                this.boardCtx.stroke();

                // Hexagram mandala pattern
                for (let a = 0; a < 6; a++) {
                    const ang = (a * Math.PI) / 3;
                    this.boardCtx.beginPath();
                    this.boardCtx.moveTo(0, 0);
                    this.boardCtx.lineTo(Math.cos(ang) * ring.radius, Math.sin(ang) * ring.radius);
                    this.boardCtx.stroke();
                }

                this.boardCtx.restore();
            }

            // Lightning Arcs
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
                this.boardCtx.shadowBlur = 18;

                this.boardCtx.beginPath();
                for (let p = 0; p < arc.points.length; p++) {
                    const pt = arc.points[p];
                    if (p === 0) this.boardCtx.moveTo(pt.x, pt.y);
                    else this.boardCtx.lineTo(pt.x, pt.y);
                }
                this.boardCtx.stroke();
                this.boardCtx.restore();
            }

            // Particles
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
