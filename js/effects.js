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

    showAttackName(text, isCritical = false, isPure = false, element = null) {
        if (!this.attackBanner) return;
        this.attackBanner.textContent = text;
        this.attackBanner.className = 'attack-banner active';
        const elemMeta = element && window.ELEMENTS ? window.ELEMENTS[element] : null;

        if (isPure && elemMeta) {
            this.attackBanner.style.color = elemMeta.color;
            this.attackBanner.style.borderColor = elemMeta.color;
            this.attackBanner.style.boxShadow = `0 0 60px ${elemMeta.color}, inset 0 0 20px ${elemMeta.color}`;
        } else if (isCritical) {
            this.attackBanner.style.color = '#f43f5e';
            this.attackBanner.style.borderColor = '#f43f5e';
            this.attackBanner.style.boxShadow = '0 0 50px rgba(244, 63, 94, 0.9)';
        } else if (elemMeta) {
            this.attackBanner.style.color = elemMeta.color;
            this.attackBanner.style.borderColor = elemMeta.color;
            this.attackBanner.style.boxShadow = `0 0 35px ${elemMeta.color}`;
        } else {
            this.attackBanner.style.color = 'var(--text-gold)';
            this.attackBanner.style.borderColor = 'var(--border-gold)';
            this.attackBanner.style.boxShadow = '0 0 35px rgba(212, 175, 55, 0.6)';
        }

        setTimeout(() => {
            this.attackBanner?.classList.remove('active');
        }, 1100);
    }

    /**
     * Same-Element and Cross-Element Combo Chain Announcements (Specs 154 - 155)
     */
    showComboChain({ streak, element, isSameElement, recentElements = [] }) {
        if (!this.comboBanner || streak < 2) return;
        clearTimeout(this.comboTimeout);

        const elemMeta = window.ELEMENTS && element ? window.ELEMENTS[element] : null;
        const elemName = elemMeta ? elemMeta.name.toUpperCase() : 'ELEMENTAL';
        const color = elemMeta ? elemMeta.color : '#fbbf24';

        let text = '';
        if (isSameElement) {
            if (streak === 2) text = `${elemName} CHAIN x2`;
            else if (streak === 3) text = `${elemName} SURGE x3`;
            else if (streak === 4) text = `${elemName} RAMPAGE x4`;
            else text = `${elemName} DOMINATION x${streak}`;
        } else {
            text = `ELEMENTAL CHAIN x${streak}`;
        }

        this.comboBanner.textContent = text;
        this.comboBanner.style.borderColor = color;
        this.comboBanner.style.color = color;
        this.comboBanner.style.boxShadow = `0 0 35px ${color}`;
        this.comboBanner.classList.add('active');

        // Spawn combo celebration sparks
        const cx = this.boardWidth ? this.boardWidth / 2 : 250;
        for (let i = 0; i < 24; i++) {
            this.spawnParticle({
                x: cx + (Math.random() - 0.5) * 160,
                y: 50 + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 1.5,
                radius: 3 + Math.random() * 4.5,
                color: color,
                decay: 0.035
            });
        }

        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 4500);
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
     * 1. FIRE: Fire Nova / Blazing Comet / Volcanic Surge
     */
    async fireBlast(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'FIRE BLAST', pieceType = 'p') {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';

        const primaryCol = isWhite ? '#f97316' : '#dc2626';
        const secondaryCol = isWhite ? '#fbbf24' : '#9333ea';
        const coreCol = isWhite ? '#fef08a' : '#f43f5e';

        const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';
        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'sm');

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
                radius: 6 + Math.random() * (isHeavy ? 6 : 4),
                color: coreCol,
                decay: 0.08
            });

            // Trailing spiral sparks
            for (let p = 0; p < (isHeavy ? 6 : 4); p++) {
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
            await new Promise(r => setTimeout(r, 13));
        }

        // Dual expanding shockwave rings on impact
        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.2 : 0.95), primaryCol, isHeavy ? 5.5 : 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.65, coreCol, 3);

        // Exploding fire nova
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * (isHeavy ? 11 : 8.5);
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                radius: 4 + Math.random() * (isHeavy ? 8 : 6),
                color: Math.random() > 0.35 ? primaryCol : secondaryCol,
                decay: 0.032,
                gravity: -0.06 // rising heat
            });
        }
        await new Promise(r => setTimeout(r, 180));
    }

    /**
     * 2. LIGHTNING: Thunder Strike / Electric Discharge
     */
    async thunderStrike(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'THUNDER STRIKE', pieceType = 'n') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const arcColor = isWhite ? '#38bdf8' : '#c084fc';
        const boltColor = isWhite ? '#ffffff' : '#fdf4ff';
        const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

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
        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.25 : 1.05), arcColor, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.7, boltColor, 2.5);

        // Bursting plasma sparks
        const pCount = isHeavy ? 65 : 50;
        for (let i = 0; i < pCount; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * (isHeavy ? 12 : 10);
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
     * 3. WIND: Wind Slash / Tempest Sever / Vortex Gale
     */
    async windSlash(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'WIND SLASH', pieceType = 'b') {
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const windColor = isWhite ? '#34d399' : '#a78bfa';
        const streakColor = isWhite ? '#ecfdf5' : '#f3e8ff';
        const isHeavy = pieceType === 'q' || pieceType === 'k';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'md' : 'sm');

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const steps = 15;

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = from.x + (to.x - from.x) * t;
            const cy = from.y + (to.y - from.y) * t;

            // Dual offset vacuum scythe arcs
            for (let side of [-1, 1]) {
                const ox = Math.cos(angle + Math.PI / 2) * (side * 12);
                const oy = Math.sin(angle + Math.PI / 2) * (side * 12);

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
        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.2 : 0.95), windColor, 3.8);

        const pCount = isHeavy ? 60 : 40;
        for (let i = 0; i < pCount; i++) {
            const a = angle + (Math.random() - 0.5) * 2.2;
            const speed = 4 + Math.random() * 9;
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
        await new Promise(r => setTimeout(r, 170));
    }

    /**
     * 4. EARTH: Earth Breaker / Seismic Slam / Stone Spikes
     */
    async earthBreaker(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'EARTH BREAKER', pieceType = 'r') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const earthCol = isWhite ? '#d97706' : '#78350f';
        const rockCol = isWhite ? '#fef3c7' : '#475569';
        const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Multi-branching ground fissures
        this.activeFissures.push({
            cx: to.x,
            cy: to.y,
            length: to.width * (isHeavy ? 1.1 : 0.8),
            alpha: 1,
            decay: 0.018
        });

        // 3D rising stone spikes
        const spikeCount = isHeavy ? 6 : 4;
        for (let i = 0; i < spikeCount; i++) {
            const ox = (i - (spikeCount - 1) / 2) * (to.width * 0.18);
            this.activeStoneSpikes.push({
                x: to.x + ox,
                y: to.y + (Math.random() - 0.5) * 12,
                width: 14 + Math.random() * 6,
                maxHeight: 28 + Math.random() * (isHeavy ? 22 : 14),
                currentHeight: 0,
                color: earthCol,
                accentColor: rockCol,
                alpha: 1,
                decay: 0.02
            });
        }

        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.25 : 1.1), earthCol, 5);

        // Bouncing rock fragments & pulverized stone
        const pCount = isHeavy ? 65 : 50;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 9.5;
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
     * 5. ICE: Frozen Dominion / Glacial Pierce / Absolute Zero
     */
    async frozenDominion(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'FROZEN DOMINION', pieceType = 'q') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const iceCol = isWhite ? '#06b6d4' : '#67e8f9';
        const runeCol = isWhite ? '#e0f2fe' : '#ffffff';
        const isHeavy = pieceType === 'q' || pieceType === 'k';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Rotating 12-point arcane runic mandala
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 8,
            maxRadius: to.width * (isHeavy ? 0.95 : 0.8),
            color: runeCol,
            rotation: 0,
            vRot: 0.07,
            alpha: 1,
            decay: 0.026
        });

        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.15 : 0.95), iceCol, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.65, runeCol, 2.5);

        // Frost crystal shatter explosion
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 9.5;
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
     * 6. LIGHT: Judgment of Light / Radiant Dominion / Solar Ray
     */
    async judgmentOfLight(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'JUDGMENT OF LIGHT', pieceType = 'k') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const lightCol = isWhite ? '#facc15' : '#f472b6';
        const beamCol = isWhite ? '#ffffff' : '#fdf4ff';
        const isHeavy = pieceType === 'k' || pieceType === 'q';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Celestial vertical solar pillar from sky to ground
        this.activeBeams.push({
            x: to.x,
            y: to.y,
            width: to.width * (isHeavy ? 0.85 : 0.65),
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
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8.5;
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3.5 + Math.random() * 5.5,
                color: Math.random() > 0.35 ? lightCol : beamCol,
                decay: 0.025,
                shape: 'spark'
            });
        }
        await new Promise(r => setTimeout(r, 260));
    }

    /**
     * 7. WATER: Tidal Crush / Tsunami Impact / Aqua Burst
     */
    async waterCrush(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'TIDAL CRUSH', pieceType = 'p') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const waterCol = isWhite ? '#0284c7' : '#0369a1';
        const foamCol = isWhite ? '#bae6fd' : '#e0f2fe';
        const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Expanding aquatic whirlpool rings
        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.25 : 1.05), waterCol, 5);
        this.addShockwave(to.x, to.y, to.width * 0.75, foamCol, 3.5);
        this.addShockwave(to.x, to.y, to.width * 0.45, waterCol, 2);

        // Splashing hydro spray and water droplet particles
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * (isHeavy ? 10 : 8);
            this.spawnParticle({
                x: to.x + (Math.random() - 0.5) * 20,
                y: to.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: -Math.abs(Math.sin(angle) * speed) - 2.5,
                radius: 3 + Math.random() * 5.5,
                color: Math.random() > 0.4 ? waterCol : foamCol,
                decay: 0.03,
                gravity: 0.22,
                shape: 'circle'
            });
        }
        await new Promise(r => setTimeout(r, 240));
    }

    /**
     * 8. SHADOW: Void Strike / Abyssal Crush / Phantom Strike
     */
    async voidStrike(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'VOID STRIKE', pieceType = 'p') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const voidCol = isWhite ? '#8b5cf6' : '#6d28d9';
        const darkCol = isWhite ? '#2e1065' : '#1e1b4b';
        const isHeavy = pieceType === 'q' || pieceType === 'k';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Imploding shadow portal ring
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: to.width * 0.85,
            maxRadius: to.width * 1.1,
            color: voidCol,
            rotation: 0,
            vRot: -0.1,
            alpha: 1,
            decay: 0.032
        });

        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.2 : 0.95), voidCol, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.6, darkCol, 3);

        // Dark mist and swirling void wisps
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * (isHeavy ? 9 : 7);
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 6,
                color: Math.random() > 0.35 ? voidCol : darkCol,
                decay: 0.026,
                shape: 'circle'
            });
        }
        await new Promise(r => setTimeout(r, 240));
    }

    /**
     * 9. NATURE: Verdant Judgment / Overgrowth Slam / Thorn Shot
     */
    async natureBloom(fromSq, toSq, color = 'w', isFlipped = false, attackName = "NATURE'S WRATH", pieceType = 'p') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const natureCol = isWhite ? '#10b981' : '#059669';
        const goldLeafCol = isWhite ? '#fef08a' : '#d1fae5';
        const isHeavy = pieceType === 'q' || pieceType === 'k' || pieceType === 'r';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Entangling botanical shockwaves
        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.2 : 1.0), natureCol, 4.5);
        this.addShockwave(to.x, to.y, to.width * 0.7, goldLeafCol, 3);

        // Floating leaf streaks and organic spore particles
        const pCount = isHeavy ? 65 : 45;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * (isHeavy ? 9.5 : 7.5);
            this.spawnParticle({
                x: to.x + (Math.random() - 0.5) * 20,
                y: to.y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                radius: 3.5 + Math.random() * 5,
                color: Math.random() > 0.4 ? natureCol : goldLeafCol,
                decay: 0.03,
                gravity: -0.04, // floating upward leaves
                shape: 'streak'
            });
        }
        await new Promise(r => setTimeout(r, 240));
    }

    /**
     * 10. ARCANE: Arcane Singularity / Cosmic Decrees / Mystic Surge
     */
    async arcaneSingularity(fromSq, toSq, color = 'w', isFlipped = false, attackName = 'ARCANE BURST', pieceType = 'p') {
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';
        const arcaneCol = isWhite ? '#ec4899' : '#d946ef';
        const starCol = isWhite ? '#fbcfe8' : '#ffffff';
        const isHeavy = pieceType === 'q' || pieceType === 'k';

        this.showAttackName(attackName);
        this.screenShake(isHeavy ? 'lg' : 'md');

        // Rotating astral arcane circle
        this.activeMagicRings.push({
            x: to.x,
            y: to.y,
            radius: 10,
            maxRadius: to.width * (isHeavy ? 1.0 : 0.8),
            color: starCol,
            rotation: 0,
            vRot: 0.09,
            alpha: 1,
            decay: 0.026
        });

        this.addShockwave(to.x, to.y, to.width * (isHeavy ? 1.25 : 1.0), arcaneCol, 5);
        this.addShockwave(to.x, to.y, to.width * 0.65, starCol, 3);

        // Exploding astral spark particles
        const pCount = isHeavy ? 70 : 50;
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * (isHeavy ? 11 : 8.5);
            this.spawnParticle({
                x: to.x,
                y: to.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 6,
                color: Math.random() > 0.4 ? arcaneCol : starCol,
                decay: 0.028,
                shape: 'spark'
            });
        }
        await new Promise(r => setTimeout(r, 250));
    }

    // Reusable elemental methods (Spec 124)
    async playFireEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.fireBlast(fromSq, toSq, color, isFlipped, name, piece); }
    async playLightningEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.thunderStrike(fromSq, toSq, color, isFlipped, name, piece); }
    async playWindEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.windSlash(fromSq, toSq, color, isFlipped, name, piece); }
    async playEarthEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.earthBreaker(fromSq, toSq, color, isFlipped, name, piece); }
    async playIceEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.frozenDominion(fromSq, toSq, color, isFlipped, name, piece); }
    async playWaterEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.waterCrush(fromSq, toSq, color, isFlipped, name, piece); }
    async playLightEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.judgmentOfLight(fromSq, toSq, color, isFlipped, name, piece); }
    async playShadowEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.voidStrike(fromSq, toSq, color, isFlipped, name, piece); }
    async playNatureEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.natureBloom(fromSq, toSq, color, isFlipped, name, piece); }
    async playArcaneEffect(fromSq, toSq, color, isFlipped, name, piece) { return this.arcaneSingularity(fromSq, toSq, color, isFlipped, name, piece); }

    /**
     * Master Capture Attack Dispatcher (Specs 123, 131, 132, 134 - 143, 158 - 159)
     * Piece + Selected Element + Synergy = Unique Ability & Distinct Animation
     */
    async playElementalAttack({ pieceType, element, defenderElement = null, attackName, fromSq, toSq, color, isFlipped, synergyInfo = null }) {
        const elem = (element || 'fire').toLowerCase();
        const pType = (pieceType || 'p').toLowerCase();
        const aName = attackName || `${pType.toUpperCase()} ${elem.toUpperCase()} STRIKE`;

        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);
        const isWhite = color === 'w';

        const elemMeta = window.ELEMENTS ? (window.ELEMENTS[elem] || window.ELEMENTS.fire) : {
            color: '#f97316', secondaryColor: '#fbbf24', accentColor: '#dc2626'
        };

        const primaryCol = elemMeta.color;
        const secondaryCol = elemMeta.secondaryColor || '#ffffff';
        const accentCol = elemMeta.accentColor || primaryCol;

        const isPure = synergyInfo?.isPureArmy;
        const synLevel = synergyInfo?.synergyLevel || 0;

        // 1. Show dynamic attack banner with element glow
        this.showAttackName(aName, false, isPure, elem);

        // Screen shake magnitude
        const shakeMag = (pType === 'q' || pType === 'k') ? 'lg' : ((pType === 'r' || pType === 'n') ? 'md' : 'sm');
        this.screenShake(shakeMag);

        // 2. Piece-Specific Delivery Trajectory (Spec 131, 132)
        if (pType === 'p') {
            // PAWN: Fast Direct Linear Shot / Projectile
            const steps = 12;
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const cx = from.x + (to.x - from.x) * t;
                const cy = from.y + (to.y - from.y) * t;

                this.spawnParticle({
                    x: cx,
                    y: cy,
                    vx: -Math.cos(angle) * 1.5 + (Math.random() - 0.5),
                    vy: -Math.sin(angle) * 1.5 + (Math.random() - 0.5),
                    radius: 5 + Math.random() * 3,
                    color: primaryCol,
                    decay: 0.08,
                    shape: elem === 'lightning' || elem === 'arcane' ? 'spark' : 'circle'
                });

                for (let s = 0; s < 2; s++) {
                    this.spawnParticle({
                        x: cx + (Math.random() - 0.5) * 8,
                        y: cy + (Math.random() - 0.5) * 8,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: 2 + Math.random() * 2.5,
                        color: secondaryCol,
                        decay: 0.06
                    });
                }
                await new Promise(r => setTimeout(r, 10));
            }
        } else if (pType === 'n') {
            // KNIGHT: High-Arched Airborne Leap & Landing Crater / Lightning
            const steps = 18;
            const arcHeight = Math.min(120, Math.max(65, Math.hypot(to.x - from.x, to.y - from.y) * 0.45));
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const cx = from.x + (to.x - from.x) * t;
                const cy = from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * arcHeight;

                // Dense airborne trail
                for (let k = 0; k < 3; k++) {
                    this.spawnParticle({
                        x: cx + (Math.random() - 0.5) * 12,
                        y: cy + (Math.random() - 0.5) * 12,
                        vx: (Math.random() - 0.5) * 2.5,
                        vy: (Math.random() - 0.5) * 2.5,
                        radius: 4.5 + Math.random() * 3.5,
                        color: Math.random() > 0.4 ? primaryCol : secondaryCol,
                        decay: 0.05,
                        shape: elem === 'lightning' ? 'spark' : (elem === 'nature' || elem === 'wind' ? 'streak' : 'circle')
                    });
                }
                await new Promise(r => setTimeout(r, 12));
            }
        } else if (pType === 'b') {
            // BISHOP: Diagonal Razor Slicing Blade across Path
            const dist = Math.hypot(to.x - from.x, to.y - from.y);
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            const perpAngle = angle + Math.PI / 2;

            const sliceSteps = 16;
            for (let i = 0; i <= sliceSteps; i++) {
                const t = i / sliceSteps;
                const cx = from.x + (to.x - from.x) * t;
                const cy = from.y + (to.y - from.y) * t;

                // Slicing wings
                for (let w = -1; w <= 1; w += 2) {
                    const wingOffset = w * 16 * Math.sin(t * Math.PI);
                    this.spawnParticle({
                        x: cx + Math.cos(perpAngle) * wingOffset,
                        y: cy + Math.sin(perpAngle) * wingOffset,
                        vx: Math.cos(angle) * 3 + (Math.random() - 0.5),
                        vy: Math.sin(angle) * 3 + (Math.random() - 0.5),
                        radius: 3 + Math.random() * 3,
                        color: Math.random() > 0.3 ? primaryCol : secondaryCol,
                        decay: 0.065,
                        shape: 'streak',
                        rotation: angle
                    });
                }
                await new Promise(r => setTimeout(r, 9));
            }
        } else if (pType === 'r') {
            // ROOK: Heavy Linear Shockwave / Rolling Tremor along Rank/File
            const steps = 14;
            const angle = Math.atan2(to.y - from.y, to.x - from.x);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const cx = from.x + (to.x - from.x) * t;
                const cy = from.y + (to.y - from.y) * t;

                // Ground shockwave pulses
                if (i % 3 === 0) {
                    this.addShockwave(cx, cy, 26, primaryCol, 2.8);
                }

                for (let p = 0; p < 3; p++) {
                    this.spawnParticle({
                        x: cx + (Math.random() - 0.5) * 18,
                        y: cy + (Math.random() - 0.5) * 18,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3 - 0.5,
                        radius: 4 + Math.random() * 4,
                        color: Math.random() > 0.4 ? primaryCol : accentCol,
                        decay: 0.05,
                        shape: elem === 'earth' ? 'rock' : 'circle'
                    });
                }
                await new Promise(r => setTimeout(r, 13));
            }
        } else if (pType === 'q') {
            // QUEEN: Expanding Arcane Mandala & Cataclysmic Convergence
            this.activeMagicRings.push({
                x: to.x,
                y: to.y,
                radius: 12,
                maxRadius: to.width * 1.35,
                color: primaryCol,
                rotation: 0,
                vRot: 0.08,
                alpha: 1,
                decay: 0.02
            });

            // 8 Converging orbital rays from outer periphery
            for (let r = 0; r < 8; r++) {
                const ang = (r * Math.PI) / 4;
                const ox = to.x + Math.cos(ang) * to.width * 1.1;
                const oy = to.y + Math.sin(ang) * to.width * 1.1;
                for (let p = 0; p < 4; p++) {
                    this.spawnParticle({
                        x: ox + (Math.random() - 0.5) * 10,
                        y: oy + (Math.random() - 0.5) * 10,
                        vx: -Math.cos(ang) * 4,
                        vy: -Math.sin(ang) * 4,
                        radius: 3.5 + Math.random() * 3,
                        color: secondaryCol,
                        decay: 0.04
                    });
                }
            }
            await new Promise(r => setTimeout(r, 110));
        } else if (pType === 'k') {
            // KING: Sovereign Celestial / Royal Beam descending from Above
            this.activeBeams.push({
                x: to.x,
                y: to.y,
                width: to.width * 1.15,
                color: primaryCol,
                coreColor: secondaryCol,
                alpha: 1,
                decay: 0.028
            });

            this.addShockwave(to.x, to.y, to.width * 1.3, '#facc15', 5);
            await new Promise(r => setTimeout(r, 90));
        }

        // 3. Elemental Impact Detonation at Target (Spec 108 & 124)
        const densityMultiplier = synLevel >= 4 ? 1.6 : (synLevel >= 3 ? 1.3 : 1.0);
        const pCount = Math.floor((pType === 'q' || pType === 'k' || pType === 'r' ? 65 : 45) * densityMultiplier);

        // Expanding elemental shockwaves
        this.addShockwave(to.x, to.y, to.width * (pType === 'q' || pType === 'k' ? 1.25 : 0.95), primaryCol, 5);
        this.addShockwave(to.x, to.y, to.width * 0.65, secondaryCol, 3.5);

        // Element-Specific Particle Manifestation
        for (let i = 0; i < pCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * (pType === 'q' || pType === 'k' ? 11 : 8);

            let particleConfig = {
                x: to.x + (Math.random() - 0.5) * 15,
                y: to.y + (Math.random() - 0.5) * 15,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 5,
                color: Math.random() > 0.35 ? primaryCol : secondaryCol,
                decay: 0.032,
                shape: 'circle',
                gravity: 0
            };

            switch (elem) {
                case 'fire':
                    particleConfig.gravity = -0.06;
                    break;
                case 'lightning':
                    particleConfig.shape = 'spark';
                    particleConfig.decay = 0.045;
                    break;
                case 'wind':
                    particleConfig.shape = 'streak';
                    particleConfig.rotation = angle;
                    break;
                case 'earth':
                    particleConfig.shape = 'rock';
                    particleConfig.gravity = 0.25;
                    break;
                case 'ice':
                    particleConfig.shape = 'crystal';
                    particleConfig.gravity = 0.04;
                    break;
                case 'water':
                    particleConfig.gravity = 0.22;
                    particleConfig.vy = -Math.abs(particleConfig.vy) - 2;
                    break;
                case 'light':
                    particleConfig.shape = 'spark';
                    particleConfig.gravity = -0.02;
                    break;
                case 'shadow':
                    particleConfig.gravity = -0.04;
                    particleConfig.color = Math.random() > 0.4 ? primaryCol : '#2e1065';
                    break;
                case 'nature':
                    particleConfig.shape = 'streak';
                    particleConfig.gravity = -0.04;
                    break;
                case 'arcane':
                    particleConfig.shape = 'spark';
                    break;
            }

            this.spawnParticle(particleConfig);
        }

        // Additional Element Spikes/Arcs
        if (elem === 'earth' && (pType === 'r' || pType === 'b' || pType === 'k')) {
            const spikeCols = ['#78350f', '#d97706', '#92400e'];
            for (let s = -2; s <= 2; s++) {
                this.activeStoneSpikes.push({
                    x: to.x + s * 14 + (Math.random() - 0.5) * 6,
                    y: to.y + 15,
                    width: 12 + Math.random() * 6,
                    maxHeight: 25 + Math.random() * 35,
                    currentHeight: 0,
                    growSpeed: 7,
                    alpha: 1,
                    decay: 0.028,
                    color: spikeCols[Math.floor(Math.random() * spikeCols.length)],
                    accentColor: '#fef3c7'
                });
            }
        } else if (elem === 'lightning') {
            for (let b = 0; b < (pType === 'q' ? 3 : 1); b++) {
                const points = [];
                const segments = 8;
                for (let s = 0; s <= segments; s++) {
                    const t = s / segments;
                    points.push({
                        x: to.x + (Math.random() - 0.5) * 40 * (1 - t),
                        y: (to.y - to.width * 1.8) + (to.width * 1.8) * t
                    });
                }
                this.activeLightningArcs.push({
                    points,
                    color: '#ffffff',
                    glow: primaryCol,
                    alpha: 1,
                    decay: 0.075
                });
            }
        }

        // 4. Element vs Element Reaction Clash (Sections 20 - 37)
        if (defenderElement) {
            const reaction = this.getElementReaction(elem, defenderElement);
            if (reaction) {
                this.playElementReactionFX(reaction, to.x, to.y, pType === 'q' || pType === 'k' || pType === 'r');
            }
        }

        await new Promise(r => setTimeout(r, 220));
    }

    /**
     * Element vs Element Reactions (Sections 20 - 37)
     * Attacker Element + Defender Element = Reaction Effect
     */
    getElementReaction(attackerElement, defenderElement) {
        if (!attackerElement || !defenderElement || attackerElement === defenderElement) {
            return null;
        }
        const a = (attackerElement || '').toLowerCase();
        const d = (defenderElement || '').toLowerCase();
        const pair = [a, d].sort().join('+');

        if (pair === 'fire+ice') {
            return {
                id: 'steam_burst',
                name: 'STEAM BURST',
                desc: 'Fire melts Ice, erupting thick boiling vapor clouds.',
                primaryColor: '#e0f2fe',
                secondaryColor: '#f97316',
                impactType: 'steam'
            };
        }
        if (pair === 'fire+water') {
            return {
                id: 'steam_impact',
                name: 'STEAM IMPACT',
                desc: 'Boiling water and sputtering embers create a high-pressure steam wave.',
                primaryColor: '#38bdf8',
                secondaryColor: '#f97316',
                impactType: 'steam'
            };
        }
        if (pair === 'earth+fire') {
            return {
                id: 'magma_impact',
                name: 'MAGMA IMPACT',
                desc: 'Intense heat melts stone into glowing molten fissures and smoke.',
                primaryColor: '#ea580c',
                secondaryColor: '#78350f',
                impactType: 'magma'
            };
        }
        if (pair === 'fire+wind') {
            return {
                id: 'firestorm',
                name: 'FIRESTORM',
                desc: 'Gale currents fan the blaze into an expanding fire vortex.',
                primaryColor: '#f97316',
                secondaryColor: '#34d399',
                impactType: 'firestorm'
            };
        }
        if (pair === 'lightning+water') {
            return {
                id: 'storm_surge',
                name: 'STORM SURGE',
                desc: 'Electrical currents arc violently through splashing water droplets.',
                primaryColor: '#0284c7',
                secondaryColor: '#38bdf8',
                impactType: 'surge'
            };
        }
        if (pair === 'earth+lightning') {
            return {
                id: 'ground_discharge',
                name: 'GROUND DISCHARGE',
                desc: 'Electric bolts ground through stone, illuminating glowing fractures.',
                primaryColor: '#facc15',
                secondaryColor: '#b45309',
                impactType: 'discharge'
            };
        }
        if (pair === 'lightning+wind') {
            return {
                id: 'thunderstorm',
                name: 'THUNDERSTORM',
                desc: 'Cyclonic wind spirals entangle with crackling lightning forks.',
                primaryColor: '#38bdf8',
                secondaryColor: '#a78bfa',
                impactType: 'thunderstorm'
            };
        }
        if (pair === 'ice+water') {
            return {
                id: 'frozen_tide',
                name: 'FROZEN TIDE',
                desc: 'Swirling water flash-freezes into crystalline ice shells that shatter.',
                primaryColor: '#bae6fd',
                secondaryColor: '#0284c7',
                impactType: 'frozentide'
            };
        }
        if (pair === 'earth+nature') {
            return {
                id: 'living_fortress',
                name: 'LIVING FORTRESS',
                desc: 'Ancient roots and vines burst through cracked stone, scattering foliage.',
                primaryColor: '#22c55e',
                secondaryColor: '#854d0e',
                impactType: 'fortress'
            };
        }
        if (pair === 'light+shadow') {
            return {
                id: 'eclipse_clash',
                name: 'ECLIPSE CLASH',
                desc: 'Divine luminescence collides with the void, creating an annular shockwave.',
                primaryColor: '#fef08a',
                secondaryColor: '#a855f7',
                impactType: 'eclipse'
            };
        }
        if (a === 'arcane' || d === 'arcane') {
            const otherElem = a === 'arcane' ? d : a;
            const otherMeta = window.ELEMENTS ? window.ELEMENTS[otherElem] : { name: 'Elemental', color: '#c084fc' };
            return {
                id: 'runic_resonance',
                name: `RUNIC ${otherMeta.name.toUpperCase()}`,
                desc: `Arcane geometric runes orbit and amplify the ${otherMeta.name} power.`,
                primaryColor: '#ec4899',
                secondaryColor: otherMeta.color || '#a855f7',
                impactType: 'runic'
            };
        }

        return null;
    }

    /**
     * Play Elemental Reaction Clashing Visual FX (Sections 20 - 37)
     */
    playElementReactionFX(reaction, x, y, isHeavy = false) {
        if (!reaction) return;

        // Subtitle notification on attack banner
        if (this.attackBanner && this.attackBanner.classList.contains('active')) {
            const sub = document.createElement('span');
            sub.className = 'reaction-subtitle';
            sub.textContent = ` [REACTION: ${reaction.name}]`;
            sub.style.color = reaction.primaryColor;
            this.attackBanner.appendChild(sub);
        }

        const count = isHeavy ? 35 : 22;

        switch (reaction.impactType) {
            case 'steam':
                // Rising dense steam vapor clouds
                this.addShockwave(x, y, 60, reaction.primaryColor, 3);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 1.5 + Math.random() * 3.5;
                    this.spawnParticle({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: Math.cos(ang) * spd,
                        vy: -2 - Math.random() * 3.5,
                        radius: 6 + Math.random() * 8,
                        color: reaction.primaryColor,
                        decay: 0.02,
                        shape: 'circle'
                    });
                }
                break;

            case 'magma':
                // Molten lava fissures and glowing debris
                this.addShockwave(x, y, 65, reaction.primaryColor, 4.5);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 6;
                    this.spawnParticle({
                        x,
                        y,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd - 2,
                        radius: 4 + Math.random() * 4,
                        color: Math.random() > 0.4 ? reaction.primaryColor : reaction.secondaryColor,
                        decay: 0.03,
                        shape: 'spark'
                    });
                }
                break;

            case 'firestorm':
                // Spiraling vortex flame ring
                this.addShockwave(x, y, 75, reaction.primaryColor, 4);
                for (let i = 0; i < count; i++) {
                    const ang = (i * Math.PI * 2) / count;
                    this.spawnParticle({
                        x: x + Math.cos(ang) * 15,
                        y: y + Math.sin(ang) * 15,
                        vx: -Math.sin(ang) * 5 + Math.cos(ang) * 2,
                        vy: Math.cos(ang) * 5 + Math.sin(ang) * 2,
                        radius: 5 + Math.random() * 4,
                        color: Math.random() > 0.5 ? reaction.primaryColor : reaction.secondaryColor,
                        decay: 0.035,
                        shape: 'streak'
                    });
                }
                break;

            case 'surge':
                // Water splash with lightning arcs
                this.addShockwave(x, y, 70, reaction.secondaryColor, 3.5);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 3 + Math.random() * 7;
                    this.spawnParticle({
                        x,
                        y,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        radius: 3 + Math.random() * 4,
                        color: Math.random() > 0.3 ? reaction.secondaryColor : reaction.primaryColor,
                        decay: 0.04,
                        shape: 'spark'
                    });
                }
                break;

            case 'discharge':
                // Ground fissures glowing with electric bolts
                this.addShockwave(x, y, 65, reaction.primaryColor, 4);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: x + (Math.random() - 0.5) * 25,
                        y: y + (Math.random() - 0.5) * 25,
                        vx: Math.cos(ang) * 4,
                        vy: Math.sin(ang) * 4,
                        radius: 3 + Math.random() * 3,
                        color: reaction.primaryColor,
                        decay: 0.045,
                        shape: 'spark'
                    });
                }
                break;

            case 'frozentide':
                // Shattering crystalline ice shell
                this.addShockwave(x, y, 70, reaction.primaryColor, 4);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const spd = 3 + Math.random() * 6;
                    this.spawnParticle({
                        x,
                        y,
                        vx: Math.cos(ang) * spd,
                        vy: Math.sin(ang) * spd,
                        radius: 3.5 + Math.random() * 4,
                        color: Math.random() > 0.4 ? reaction.primaryColor : reaction.secondaryColor,
                        decay: 0.035,
                        shape: 'spark'
                    });
                }
                break;

            case 'fortress':
                // Roots and leaves bursting through stone
                this.addShockwave(x, y, 65, reaction.primaryColor, 3.5);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: x + (Math.random() - 0.5) * 20,
                        y: y + (Math.random() - 0.5) * 20,
                        vx: Math.cos(ang) * 3,
                        vy: -2 - Math.random() * 4,
                        radius: 4 + Math.random() * 4,
                        color: Math.random() > 0.4 ? reaction.primaryColor : reaction.secondaryColor,
                        decay: 0.03,
                        shape: 'streak'
                    });
                }
                break;

            case 'eclipse':
                // Annular light vs shadow shockwave (photosensitive friendly)
                this.addShockwave(x, y, 80, reaction.primaryColor, 4);
                this.addShockwave(x, y, 55, reaction.secondaryColor, 3);
                for (let i = 0; i < count; i++) {
                    const ang = (i * Math.PI * 2) / count;
                    this.spawnParticle({
                        x: x + Math.cos(ang) * 25,
                        y: y + Math.sin(ang) * 25,
                        vx: Math.cos(ang) * 4,
                        vy: Math.sin(ang) * 4,
                        radius: 3.5 + Math.random() * 3.5,
                        color: (i % 2 === 0) ? reaction.primaryColor : reaction.secondaryColor,
                        decay: 0.03,
                        shape: 'circle'
                    });
                }
                break;

            case 'runic':
            default:
                // Rotating geometric glyphs
                this.addMagicRing(x, y, 45, reaction.primaryColor, 20);
                for (let i = 0; i < count; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: x + Math.cos(ang) * 20,
                        y: y + Math.sin(ang) * 20,
                        vx: Math.cos(ang) * 3,
                        vy: Math.sin(ang) * 3,
                        radius: 3 + Math.random() * 3,
                        color: reaction.primaryColor,
                        decay: 0.035,
                        shape: 'spark'
                    });
                }
                break;
        }
    }

    /**
     * Pure Element Army Check & Checkmate Finisher (Specs 146 - 149, 162)
     */
    playPureArmyCheckEffect(element, isCheckmate = false) {
        const elemMeta = window.ELEMENTS ? (window.ELEMENTS[element] || window.ELEMENTS.fire) : {
            name: 'Elemental', color: '#f97316'
        };
        const color = elemMeta.color;
        const elemName = elemMeta.name.toUpperCase();

        const title = isCheckmate ? `PURE ${elemName} CHECKMATE` : `PURE ${elemName} CHECK`;
        this.showAttackName(title, isCheckmate, true, element);
        this.screenShake(isCheckmate ? 'lg' : 'md');

        const count = isCheckmate ? 70 : 40;
        const w = this.boardWidth || 600;
        const h = this.boardHeight || 600;

        for (let i = 0; i < count; i++) {
            this.spawnParticle({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                radius: 3 + Math.random() * 5.5,
                color: color,
                decay: 0.025,
                shape: element === 'lightning' || element === 'arcane' ? 'spark' : (element === 'nature' || element === 'wind' ? 'streak' : 'circle')
            });
        }
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

    /**
     * Elemental Movement Trails for All 10 Elements (Spec 108 & 124)
     */
    moveTrail(piece, fromSq, toSq, isFlipped = false, element = null) {
        if (this.quality === 'off') return;
        const from = this.getSquareCenter(fromSq, isFlipped);
        const to = this.getSquareCenter(toSq, isFlipped);

        // Fallback default element by piece if not passed
        let elem = element;
        if (!elem) {
            const defaults = { p: 'fire', n: 'lightning', b: 'wind', r: 'earth', q: 'ice', k: 'light' };
            elem = defaults[piece.type] || 'fire';
        }

        const elemConfigs = {
            fire: { color: '#f97316', shape: 'circle', gravity: -0.05, radius: 2.8 },
            lightning: { color: '#38bdf8', shape: 'spark', gravity: 0, radius: 2.5 },
            wind: { color: '#34d399', shape: 'streak', gravity: 0, radius: 2.8 },
            earth: { color: '#d97706', shape: 'rock', gravity: 0.12, radius: 2.6 },
            ice: { color: '#06b6d4', shape: 'crystal', gravity: 0.02, radius: 2.5 },
            water: { color: '#0284c7', shape: 'circle', gravity: 0.08, radius: 2.6 },
            light: { color: '#facc15', shape: 'spark', gravity: 0, radius: 2.7 },
            shadow: { color: '#8b5cf6', shape: 'circle', gravity: -0.02, radius: 3.0 },
            nature: { color: '#10b981', shape: 'streak', gravity: -0.02, radius: 2.6 },
            arcane: { color: '#ec4899', shape: 'spark', gravity: 0, radius: 2.8 }
        };

        const cfg = elemConfigs[elem] || elemConfigs.fire;
        const steps = 11;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.spawnParticle({
                x: from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 6,
                y: from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: cfg.radius + Math.random() * 2,
                color: cfg.color,
                decay: 0.055,
                shape: cfg.shape,
                gravity: cfg.gravity
            });
        }
    }

    /**
     * ASCENSION TRANSFORMATION SEQUENCE (Specs 163 - 181, 190)
     */
    async playPawnAscensionSequence(options) {
        return this.playAscensionSequence(options);
    }

    async playAscensionSequence({ squareIndex, isFlipped = false, element = 'fire', pieceType = 'q', style = 'elemental', isReducedMotion = false }) {
        const pt = this.getSquareCenter(squareIndex, isFlipped);
        const elem = (element || 'fire').toLowerCase();
        const elemMeta = window.ELEMENTS && window.ELEMENTS[elem] ? window.ELEMENTS[elem] : { color: '#f97316', secondaryColor: '#fbbf24' };
        const primaryCol = elemMeta.color || '#f97316';
        const secCol = elemMeta.secondaryColor || '#fbbf24';

        if (isReducedMotion) {
            this.addShockwave(pt.x, pt.y, pt.width * 0.9, primaryCol, 2);
            for (let i = 0; i < 12; i++) {
                this.spawnParticle({
                    x: pt.x + (Math.random() - 0.5) * pt.width * 0.5,
                    y: pt.y + (Math.random() - 0.5) * pt.height * 0.5,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: -1 - Math.random(),
                    radius: 2 + Math.random() * 2,
                    color: primaryCol,
                    decay: 0.04
                });
            }
            await new Promise(r => setTimeout(r, 400));
            return;
        }

        this.screenShake('md');

        // Style Overlays (Specs 170 - 175)
        if (style === 'royal') {
            this.addShockwave(pt.x, pt.y, pt.width * 1.5, '#d4af37', 4.5);
            this.activeBeams.push({
                x: pt.x,
                y: pt.y,
                width: pt.width * 0.65,
                color: '#fbbf24',
                coreColor: '#ffffff',
                alpha: 1,
                decay: 0.035
            });
        } else if (style === 'arcane') {
            this.activeMagicRings.push({
                x: pt.x,
                y: pt.y,
                radius: 4,
                maxRadius: pt.width * 0.9,
                color: '#ec4899',
                alpha: 1,
                decay: 0.03,
                rotation: 0,
                vRot: 0.08
            });
            this.activeMagicRings.push({
                x: pt.x,
                y: pt.y,
                radius: 4,
                maxRadius: pt.width * 1.25,
                color: '#a855f7',
                alpha: 1,
                decay: 0.025,
                rotation: 0,
                vRot: -0.06
            });
        } else if (style === 'celestial') {
            this.activeBeams.push({
                x: pt.x,
                y: pt.y,
                width: pt.width * 0.8,
                color: '#facc15',
                coreColor: '#ffffff',
                alpha: 1,
                decay: 0.028
            });
            this.addShockwave(pt.x, pt.y, pt.width * 1.3, '#fef08a', 3);
        } else if (style === 'dark') {
            this.activeMagicRings.push({
                x: pt.x,
                y: pt.y,
                radius: pt.width * 0.7,
                maxRadius: pt.width * 1.4,
                color: '#8b5cf6',
                alpha: 1,
                decay: 0.03,
                rotation: 0,
                vRot: 0.1
            });
            this.addShockwave(pt.x, pt.y, pt.width * 1.1, '#1e1b4b', 5);
        }

        // Element-Specific Ascension Effects (Spec 176)
        switch (elem) {
            case 'fire': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.2, '#f97316', 4);
                for (let i = 0; i < 40; i++) {
                    const angle = (i / 40) * Math.PI * 4;
                    const r = (i / 40) * (pt.width * 0.45);
                    this.spawnParticle({
                        x: pt.x + Math.cos(angle) * r,
                        y: pt.y + Math.sin(angle) * r,
                        vx: Math.cos(angle) * 1.5,
                        vy: -3.5 - Math.random() * 3,
                        radius: 3.5 + Math.random() * 4,
                        color: Math.random() > 0.4 ? primaryCol : secCol,
                        decay: 0.028
                    });
                }
                break;
            }
            case 'lightning': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.3, '#38bdf8', 4);
                for (let a = 0; a < 3; a++) {
                    const pts = [];
                    let curX = pt.x + (Math.random() - 0.5) * pt.width * 0.4;
                    let curY = 0;
                    pts.push({ x: curX, y: curY });
                    while (curY < pt.y) {
                        curY += 20 + Math.random() * 25;
                        curX += (Math.random() - 0.5) * 30;
                        pts.push({ x: curX, y: Math.min(curY, pt.y) });
                    }
                    this.activeLightningArcs.push({
                        points: pts,
                        color: '#ffffff',
                        glow: '#38bdf8',
                        alpha: 1,
                        decay: 0.05
                    });
                }
                for (let i = 0; i < 35; i++) {
                    this.spawnParticle({
                        x: pt.x + (Math.random() - 0.5) * pt.width * 0.6,
                        y: pt.y + (Math.random() - 0.5) * pt.height * 0.6,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        radius: 4,
                        color: Math.random() > 0.3 ? '#38bdf8' : '#ffffff',
                        shape: 'spark',
                        decay: 0.035
                    });
                }
                break;
            }
            case 'wind': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.4, '#34d399', 3);
                for (let i = 0; i < 40; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: pt.x + Math.cos(angle) * (pt.width * 0.35),
                        y: pt.y + Math.sin(angle) * (pt.height * 0.35),
                        vx: -Math.sin(angle) * 4.5,
                        vy: Math.cos(angle) * 4.5 - 2,
                        radius: 2.5 + Math.random() * 3,
                        color: Math.random() > 0.5 ? '#34d399' : '#ecfdf5',
                        shape: 'streak',
                        decay: 0.03
                    });
                }
                break;
            }
            case 'earth': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.1, '#d97706', 4.5);
                this.activeFissures.push({
                    cx: pt.x,
                    cy: pt.y,
                    length: pt.width * 1.2,
                    alpha: 1,
                    decay: 0.02
                });
                for (let i = 0; i < 30; i++) {
                    this.spawnParticle({
                        x: pt.x + (Math.random() - 0.5) * pt.width * 0.5,
                        y: pt.y + (Math.random() - 0.5) * pt.height * 0.5,
                        vx: (Math.random() - 0.5) * 4.5,
                        vy: -2 - Math.random() * 3,
                        radius: 3 + Math.random() * 4,
                        color: Math.random() > 0.5 ? '#d97706' : '#78350f',
                        shape: 'rock',
                        gravity: 0.15,
                        decay: 0.025
                    });
                }
                break;
            }
            case 'ice': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.3, '#06b6d4', 3.5);
                this.activeMagicRings.push({
                    x: pt.x,
                    y: pt.y,
                    radius: 2,
                    maxRadius: pt.width * 0.8,
                    color: '#67e8f9',
                    alpha: 1,
                    decay: 0.03,
                    rotation: 0,
                    vRot: 0.05
                });
                for (let i = 0; i < 36; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: pt.x,
                        y: pt.y,
                        vx: Math.cos(angle) * (3 + Math.random() * 4),
                        vy: Math.sin(angle) * (3 + Math.random() * 4),
                        radius: 3 + Math.random() * 3.5,
                        color: Math.random() > 0.4 ? '#06b6d4' : '#e0f2fe',
                        shape: 'crystal',
                        decay: 0.03
                    });
                }
                break;
            }
            case 'water': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.25, '#0284c7', 3.5);
                for (let i = 0; i < 35; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: pt.x + Math.cos(angle) * (pt.width * 0.2),
                        y: pt.y + Math.sin(angle) * (pt.height * 0.2),
                        vx: Math.cos(angle) * 3,
                        vy: -2.5 - Math.random() * 3,
                        radius: 3.5 + Math.random() * 3,
                        color: Math.random() > 0.4 ? '#0284c7' : '#bae6fd',
                        decay: 0.03
                    });
                }
                break;
            }
            case 'light': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.4, '#facc15', 4);
                this.activeBeams.push({
                    x: pt.x,
                    y: pt.y,
                    width: pt.width * 0.7,
                    color: '#facc15',
                    coreColor: '#ffffff',
                    alpha: 1,
                    decay: 0.03
                });
                for (let i = 0; i < 35; i++) {
                    this.spawnParticle({
                        x: pt.x + (Math.random() - 0.5) * pt.width * 0.6,
                        y: pt.y + (Math.random() - 0.5) * pt.height * 0.6,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -1.5 - Math.random() * 3,
                        radius: 2.5 + Math.random() * 3.5,
                        color: Math.random() > 0.3 ? '#facc15' : '#ffffff',
                        decay: 0.025
                    });
                }
                break;
            }
            case 'shadow': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.3, '#8b5cf6', 4);
                for (let i = 0; i < 35; i++) {
                    this.spawnParticle({
                        x: pt.x + (Math.random() - 0.5) * pt.width * 0.4,
                        y: pt.y + (Math.random() - 0.5) * pt.height * 0.4,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        radius: 4 + Math.random() * 4,
                        color: Math.random() > 0.4 ? '#8b5cf6' : '#2e1065',
                        decay: 0.028
                    });
                }
                break;
            }
            case 'nature': {
                this.addShockwave(pt.x, pt.y, pt.width * 1.25, '#10b981', 3.5);
                for (let i = 0; i < 35; i++) {
                    this.spawnParticle({
                        x: pt.x + (Math.random() - 0.5) * pt.width * 0.5,
                        y: pt.y + (Math.random() - 0.5) * pt.height * 0.5,
                        vx: (Math.random() - 0.5) * 3.5,
                        vy: -2 - Math.random() * 2.5,
                        radius: 3 + Math.random() * 3,
                        color: Math.random() > 0.4 ? '#10b981' : '#6ee7b7',
                        shape: 'spark',
                        decay: 0.028
                    });
                }
                break;
            }
            case 'arcane':
            default: {
                this.addShockwave(pt.x, pt.y, pt.width * 1.35, '#ec4899', 4);
                for (let i = 0; i < 35; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    this.spawnParticle({
                        x: pt.x,
                        y: pt.y,
                        vx: Math.cos(angle) * (2.5 + Math.random() * 3.5),
                        vy: Math.sin(angle) * (2.5 + Math.random() * 3.5),
                        radius: 3.5 + Math.random() * 3.5,
                        color: Math.random() > 0.4 ? '#ec4899' : '#a855f7',
                        shape: 'crystal',
                        decay: 0.028
                    });
                }
                break;
            }
        }

        await new Promise(r => setTimeout(r, 700));
    }

    /**
     * ASCENSION CHECKMATE SPECIAL FINISHER (Spec 193)
     */
    async playAscensionCheckmate({ squareIndex, isFlipped = false, element = 'fire', pieceType = 'q', winnerColor = 'w' }) {
        const pt = this.getSquareCenter(squareIndex, isFlipped);
        const elemMeta = window.ELEMENTS && window.ELEMENTS[element] ? window.ELEMENTS[element] : { color: '#f97316' };
        const color = elemMeta.color || '#f97316';

        this.screenShake('lg');

        // Sequence of banners (Spec 193)
        this.showAttackName('ASCENSION', true, true, element);
        await new Promise(r => setTimeout(r, 800));

        this.showAttackName('A NEW POWER AWAKENS', true, true, element);
        await new Promise(r => setTimeout(r, 800));

        this.showAttackName('CHECKMATE', true, true, element);

        // Huge grand board shockwaves
        this.addShockwave(pt.x, pt.y, this.boardWidth ? this.boardWidth * 0.9 : 400, color, 6);
        this.addShockwave(pt.x, pt.y, this.boardWidth ? this.boardWidth * 1.4 : 600, '#ffffff', 4);

        for (let i = 0; i < 70; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 4 + Math.random() * 8;
            this.spawnParticle({
                x: pt.x,
                y: pt.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: 4 + Math.random() * 5,
                color: Math.random() > 0.3 ? color : '#ffffff',
                decay: 0.02
            });
        }

        await new Promise(r => setTimeout(r, 900));
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
