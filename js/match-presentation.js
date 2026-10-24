/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/match-presentation.js
 * 
 * Dedicated Match Presentation Controller, Combat Choreography, Replay Engine,
 * Match Statistics, Chess Clocks, and End-of-Match Polish.
 * 
 * Separates presentation (animations, audio, VFX, DOM) completely from the authoritative chess engine.
 */

class MatchStatsTracker {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = null;
        this.endTime = null;
        this.movesCount = 0;
        this.pliesCount = 0;
        this.captures = { white: 0, black: 0 };
        this.checks = { white: 0, black: 0 };
        this.promotions = { white: 0, black: 0 };
        this.castling = { white: false, black: false };
        this.elementCaptures = {};
        this.pieceCaptures = {};
        this.pieceActivity = {}; // e.g. "w_n": count
        this.longestCaptureChain = { white: 0, black: 0 };
        this.currentStreak = { white: 0, black: 0 };
        this.firstCapture = null;
        this.firstCheck = null;
        this.firstPromotion = null;
        this.finalAttack = null;
        this.timeline = []; // Array of move snapshots with full metadata
    }

    startMatch() {
        this.reset();
        this.startTime = Date.now();
    }

    endMatch(winner, reason) {
        this.endTime = Date.now();
        this.winner = winner;
        this.endReason = reason;
    }

    recordMove({ ply, san, color, pieceType, element, from, to, isCapture, capturedPiece, capturedElement, isCheck, isCheckmate, isPromotion, promotedTo, abilityName, fen }) {
        this.pliesCount = ply;
        this.movesCount = Math.ceil(ply / 2);

        // Activity score: legal moves + captures
        const pieceKey = `${color}_${pieceType}`;
        this.pieceActivity[pieceKey] = (this.pieceActivity[pieceKey] || 0) + 1;

        // Captures
        if (isCapture) {
            const side = color === 'w' ? 'white' : 'black';
            this.captures[side]++;
            this.currentStreak[side]++;
            if (this.currentStreak[side] > this.longestCaptureChain[side]) {
                this.longestCaptureChain[side] = this.currentStreak[side];
            }
            // Reset opponent capture streak
            const oppSide = color === 'w' ? 'black' : 'white';
            this.currentStreak[oppSide] = 0;

            // Element captures
            this.elementCaptures[element] = (this.elementCaptures[element] || 0) + 1;
            this.pieceCaptures[pieceType] = (this.pieceCaptures[pieceType] || 0) + 1;
            this.pieceActivity[pieceKey] = (this.pieceActivity[pieceKey] || 0) + 1; // bonus activity for capture

            if (!this.firstCapture) {
                this.firstCapture = {
                    ply,
                    color,
                    pieceType,
                    element,
                    abilityName,
                    capturedPiece,
                    capturedElement
                };
            }
        } else {
            // Non-capture resets streak
            const side = color === 'w' ? 'white' : 'black';
            this.currentStreak[side] = 0;
        }

        // Checks
        if (isCheck || isCheckmate) {
            const side = color === 'w' ? 'white' : 'black';
            this.checks[side]++;
            if (!this.firstCheck) {
                this.firstCheck = { ply, color, pieceType, element };
            }
        }

        // Promotions
        if (isPromotion) {
            const side = color === 'w' ? 'white' : 'black';
            this.promotions[side]++;
            if (!this.firstPromotion) {
                this.firstPromotion = { ply, color, promotedTo, element };
            }
        }

        // Final attack if checkmate
        if (isCheckmate) {
            this.finalAttack = {
                color,
                pieceType,
                element,
                abilityName
            };
        }

        // Add to timeline
        this.timeline.push({
            ply,
            san,
            color,
            pieceType,
            element,
            from,
            to,
            isCapture,
            capturedPiece,
            capturedElement,
            isCheck,
            isCheckmate,
            isPromotion,
            promotedTo,
            abilityName,
            fen
        });
    }

    getDurationString() {
        if (!this.startTime) return '00:00';
        const end = this.endTime || Date.now();
        const totalSecs = Math.max(0, Math.floor((end - this.startTime) / 1000));
        const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
        const secs = (totalSecs % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    getMostActivePiece() {
        let bestKey = null;
        let maxScore = 0;
        for (const [k, score] of Object.entries(this.pieceActivity)) {
            if (score > maxScore) {
                maxScore = score;
                bestKey = k;
            }
        }
        if (!bestKey) return { name: 'None', score: 0 };
        const [color, type] = bestKey.split('_');
        const names = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        return {
            color: color === 'w' ? 'White' : 'Black',
            pieceType: type,
            pieceName: names[type] || 'Piece',
            score: maxScore
        };
    }

    getMostUsedElement() {
        let bestElem = 'fire';
        let maxCaps = 0;
        for (const [elem, count] of Object.entries(this.elementCaptures)) {
            if (count > maxCaps) {
                maxCaps = count;
                bestElem = elem;
            }
        }
        return {
            element: bestElem,
            captures: maxCaps
        };
    }
}

class MatchPresentationController {
    constructor(app) {
        this.app = app;
        this.stats = new MatchStatsTracker();

        // Preset configurations (Spec 39 & 98-99)
        this.presets = {
            casual: {
                name: 'Casual',
                timer: 'none',
                increment: 0,
                animationSpeed: 'normal',
                effectsQuality: 'high',
                moveHints: true,
                undoAllowed: true,
                boardReactions: true,
                attackNames: true
            },
            competitive: {
                name: 'Competitive',
                timer: '5m',
                increment: 0,
                animationSpeed: 'fast',
                effectsQuality: 'medium',
                moveHints: false,
                undoAllowed: false,
                boardReactions: false,
                attackNames: false
            },
            cinematic: {
                name: 'Cinematic',
                timer: 'none',
                increment: 0,
                animationSpeed: 'cinematic',
                effectsQuality: 'high',
                moveHints: true,
                undoAllowed: true,
                boardReactions: true,
                attackNames: true
            },
            low_performance: {
                name: 'Low Performance',
                timer: 'none',
                increment: 0,
                animationSpeed: 'fast',
                effectsQuality: 'low',
                moveHints: true,
                undoAllowed: true,
                boardReactions: false,
                attackNames: true
            }
        };

        this.activePresetKey = 'casual';

        // Precise Clock Timestamps (Spec 35 - 38 & 108)
        this.clockState = {
            mode: 'none',
            increment: 0,
            whiteTimeMs: 0,
            blackTimeMs: 0,
            activeColor: null,
            lastTickTime: null,
            timerInterval: null
        };

        // Replay State (Spec 53 - 64)
        this.replayState = {
            active: false,
            currentPlyIndex: -1,
            isPlaying: false,
            speed: 1.0,
            cinematic: false,
            playTimer: null
        };

        // In-Match Board Reactions Tracking (Spec 32 - 34)
        this.boardReactionTimers = [];

        this.initDOMHooks();
    }

    initDOMHooks() {
        // Attack Banner Element
        this.attackBannerEl = document.getElementById('attack-banner');

        // Result Modal Buttons
        document.getElementById('btn-results-rematch')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-match-results')?.classList.remove('active');
            this.app.startNewMatch(this.app.gameMode);
        });

        document.getElementById('btn-results-replay')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-match-results')?.classList.remove('active');
            this.openReplayModal(false);
        });

        document.getElementById('btn-results-cinematic-replay')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-match-results')?.classList.remove('active');
            this.openReplayModal(true);
        });

        document.getElementById('btn-results-menu')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-match-results')?.classList.remove('active');
            document.getElementById('modal-main-menu')?.classList.add('active');
        });

        // Replay Controls Hooks
        document.getElementById('btn-replay-first')?.addEventListener('click', () => this.replayJumpToPly(0));
        document.getElementById('btn-replay-prev')?.addEventListener('click', () => this.replayStep(-1));
        document.getElementById('btn-replay-play')?.addEventListener('click', () => this.replayTogglePlay());
        document.getElementById('btn-replay-next')?.addEventListener('click', () => this.replayStep(1));
        document.getElementById('btn-replay-last')?.addEventListener('click', () => this.replayJumpToPly(this.stats.timeline.length - 1));
        document.getElementById('btn-replay-restart')?.addEventListener('click', () => this.replayRestart());
        document.getElementById('btn-replay-close')?.addEventListener('click', () => this.closeReplayModal());

        // Replay Speed Buttons
        document.querySelectorAll('.btn-replay-speed').forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.audio.playUiClick();
                document.querySelectorAll('.btn-replay-speed').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.replayState.speed = parseFloat(btn.dataset.speed || '1');
            });
        });

        // Replay Mode Toggle
        document.getElementById('btn-replay-mode-toggle')?.addEventListener('click', (e) => {
            this.app.audio.playUiClick();
            this.replayState.cinematic = !this.replayState.cinematic;
            e.currentTarget.classList.toggle('active', this.replayState.cinematic);
            e.currentTarget.textContent = this.replayState.cinematic ? 'CINEMATIC MODE: ON' : 'CINEMATIC MODE: OFF';
        });

        // Timeline Skip Buttons
        document.getElementById('btn-replay-skip-capture')?.addEventListener('click', () => this.replaySkipToEvent('isCapture'));
        document.getElementById('btn-replay-skip-check')?.addEventListener('click', () => this.replaySkipToEvent('isCheck'));
        document.getElementById('btn-replay-skip-promotion')?.addEventListener('click', () => this.replaySkipToEvent('isPromotion'));
        document.getElementById('btn-replay-skip-mate')?.addEventListener('click', () => this.replaySkipToEvent('isCheckmate'));

        // Match Pause Menu
        document.getElementById('btn-pause-match')?.addEventListener('click', () => this.openPauseMenu());
        document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.closePauseMenu());
        document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
            if (confirm('Restart match? Current game progress will be lost.')) {
                this.closePauseMenu();
                this.app.startNewMatch(this.app.gameMode);
            }
        });
        document.getElementById('btn-pause-resign')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to resign this match?')) {
                this.closePauseMenu();
                this.handleResignation(this.app.playerColor || 'w');
            }
        });
        document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
            this.closePauseMenu();
            document.getElementById('modal-main-menu')?.classList.add('active');
        });

        // Screenshot Mode / Focus Board
        document.getElementById('btn-toggle-focus-board')?.addEventListener('click', () => {
            document.getElementById('app')?.classList.toggle('focus-board-mode');
        });
        document.getElementById('btn-hide-ui-screenshot')?.addEventListener('click', () => {
            document.body.classList.toggle('screenshot-clean-view');
        });
    }

    // =========================================================================
    // 1. MATCH PRESENTATION PIPELINE (Spec 1 & 2)
    // =========================================================================
    async presentMove(move, context = {}) {
        // Spec 37 & 108: Stop player's clock immediately when legal move is committed!
        this.pauseActiveClock();

        // Spec 1 & 2: Lock board interaction to prevent race conditions
        this.app.ui.setBoardLocked(true);
        this.app.isAnimating = true;
        this.app.ui.isAnimating = true;

        try {
            const piece = move.piece || this.app.engine.board[move.from];
            if (!piece) return;

            const isCapture = Boolean(move.captured || move.isEnPassant || this.app.engine.board[move.to]);
            const toRank = Math.floor(move.to / 8);
            const isPawnPromotion = Boolean(move.promotion || (piece.type === 'p' && (toRank === 7 || toRank === 0)));
            const colorName = piece.color === 'w' ? 'white' : 'black';
            const loadout = colorName === 'white' ? this.app.loadout.whiteLoadout : this.app.loadout.blackLoadout;
            const element = this.app.loadout.getElementForPiece(piece, piece.color) || 'fire';
            const abilityDetails = this.app.loadout.getAbilityDetails(piece.type, element);

            // Step 1: Origin and Destination Highlights (Spec 12)
            this.app.ui.highlightMoveSquares(move.from, move.to);

            // Step 2: Piece-Specific Movement & Personality (Spec 3 & 4)
            const speedSetting = this.app.settings.settings.animationSpeed || 'normal';
            const moveDuration = speedSetting === 'fast' ? 140 : (speedSetting === 'cinematic' ? 360 : 220);

            // Play movement trail and sound
            if (!isCapture && !move.isCastling) {
                this.app.audio.playMoveSound();
                this.app.effects.moveTrail(piece, move.from, move.to, this.app.ui.isFlipped, element);
            }

            // Step 3: Capture Choreography (Spec 5 - 9)
            if (isCapture) {
                const defenderColor = piece.color === 'w' ? 'b' : 'w';
                const capturedTargetPiece = move.captured || this.app.engine.board[move.to] || (move.isEnPassant ? { type: 'p' } : null);
                const defenderElement = capturedTargetPiece ? (this.app.loadout.getElementForPiece(capturedTargetPiece, defenderColor) || 'fire') : 'fire';

                // Non-intrusive attack title announcement (Spec 10 & 11)
                this.showNonIntrusiveAttackBanner(abilityDetails.name, element);

                // Target piece reaction by element (Spec 8)
                const targetSq = move.isEnPassant ? (Math.floor(move.from / 8) * 8 + (move.to % 8)) : move.to;
                this.app.ui.triggerPieceTargetReaction(targetSq, `piece-target-${defenderElement}`);
                this.app.audio.playElementSound(element);

                // Real-match elemental reaction clash VFX (Spec 9)
                await this.app.effects.playElementalAttack({
                    pieceType: piece.type,
                    element,
                    defenderElement,
                    attackName: abilityDetails.name,
                    fromSq: move.from,
                    toSq: move.to,
                    color: piece.color,
                    isFlipped: this.app.ui.isFlipped,
                    synergyInfo: null
                });

                // Spawn temporary fading board reaction (Spec 32 - 34)
                this.spawnTemporaryBoardReaction(move.to, element);
            }

            // Animate piece gliding into position with personality motion
            await this.animatePieceWithPersonality(move.from, move.to, moveDuration, piece.type, element);

            // Step 4: Promotion Presentation (Ascension) (Spec 29 - 31)
            let promotedPieceType = null;
            if (isPawnPromotion) {
                const isHuman = this.app.gameMode === 'pvp' || (this.app.gameMode === 'pvc' && piece.color === this.app.playerColor);
                let promoChoice;

                if (isHuman) {
                    promoChoice = await this.app.ui.promptAscension({
                        color: piece.color,
                        pawnElement: element,
                        settings: this.app.settings.settings,
                        onPreview: (previewData) => {
                            this.app.effects.playAscensionSequence({
                                squareIndex: move.to,
                                isFlipped: this.app.ui.isFlipped,
                                element: previewData.element,
                                pieceType: previewData.pieceType,
                                style: previewData.style,
                                isReducedMotion: this.app.settings.settings.reducedMotion
                            });
                            this.app.audio.playAscensionSound(previewData.element, previewData.style);
                        }
                    });
                } else {
                    // AI auto selects Queen + AI Element
                    promoChoice = {
                        pieceType: 'q',
                        element: this.app.loadout.getPieceElement(piece.color === 'w' ? 'white' : 'black', 'q') || 'fire',
                        style: 'elemental'
                    };
                }

                promotedPieceType = promoChoice.pieceType || promoChoice.piece || 'q';
                move.promotion = promotedPieceType;
                move.element = promoChoice.element || element;
                move.ascensionStyle = promoChoice.style || 'elemental';

                this.showNonIntrusiveAttackBanner(`ASCENSION: ${promotedPieceType.toUpperCase()}`, move.element);
                this.app.audio.playAscensionSound(move.element, move.ascensionStyle);

                await this.app.effects.playAscensionSequence({
                    squareIndex: move.to,
                    isFlipped: this.app.ui.isFlipped,
                    element: move.element,
                    pieceType: promotedPieceType,
                    style: move.ascensionStyle,
                    isReducedMotion: this.app.settings.settings.reducedMotion
                });
            }

            // Generate SAN before state mutation
            const san = this.app.engine.generateSAN(move);
            move.san = san;

            // Commit move in chess engine
            this.app.engine.makeMove(move);
            this.app.ui.lastMove = move;
            this.app.moveHistoryLog.push({ san, move });

            // Step 5: Finalize Visual Board State
            this.app.updateBoardSynergyTheme();
            this.app.ui.renderBoard();
            this.app.ui.renderMoveHistory(this.app.moveHistoryLog);
            this.app.ui.renderCapturedPieces();

            // Screen reader announcement
            const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
            const actionWord = isCapture ? 'captures on' : 'moves to';
            const fromAlg = this.app.engine.squareToAlgebraic(move.from);
            const toAlg = this.app.engine.squareToAlgebraic(move.to);
            this.app.ui.announce(`${piece.color === 'w' ? 'White' : 'Black'} ${pieceNames[piece.type] || 'Piece'} from ${fromAlg} ${actionWord} ${toAlg}`);

            // Evaluate Check / Checkmate / Draw (Spec 18 - 28)
            const status = this.app.engine.getGameStatus();

            // Record Statistics & Timeline
            this.stats.recordMove({
                ply: this.app.engine.history.length,
                san: move.san || 'move',
                color: piece.color,
                pieceType: piece.type,
                element,
                from: move.from,
                to: move.to,
                isCapture,
                capturedPiece: move.captured ? move.captured.type : null,
                capturedElement: isCapture ? (this.app.loadout.getElementForPiece(move.captured, piece.color === 'w' ? 'b' : 'w') || 'fire') : null,
                isCheck: Boolean(status.inCheck && !status.gameOver),
                isCheckmate: Boolean(status.gameOver && status.reason === 'checkmate'),
                isPromotion: isPawnPromotion,
                promotedTo: promotedPieceType,
                abilityName: abilityDetails.name,
                fen: this.app.engine.exportFEN()
            });

            this.app.updateStatusDisplay();

            // Handle Check or Checkmate Presentation
            if (status.gameOver && status.reason === 'checkmate') {
                await this.presentCheckmateSequence({
                    winnerColor: piece.color,
                    winningPieceType: promotedPieceType || piece.type,
                    element: move.element || element,
                    abilityName: abilityDetails.name,
                    loserKingSq: this.app.engine.findKing(piece.color === 'w' ? 'b' : 'w')
                });
            } else if (status.inCheck) {
                await this.presentCheckSequence({
                    checkingColor: piece.color,
                    element: move.element || element,
                    targetKingSq: this.app.engine.findKing(piece.color === 'w' ? 'b' : 'w'),
                    isDoubleCheck: Boolean(this.app.engine.isDoubleCheck && this.app.engine.isDoubleCheck(this.app.engine.turn))
                });
            } else if (status.gameOver) {
                this.presentDrawSequence(status.reason || 'Draw');
            }

            // Transfer turn and transition player panels
            if (!status.gameOver) {
                this.updateActivePlayerPanel(this.app.engine.turn);
                this.startClockForActiveTurn();

                // Trigger AI reply if it's computer's turn in PvC
                if (this.app.gameMode === 'pvc' && this.app.engine.turn !== this.app.playerColor) {
                    setTimeout(() => this.app.triggerAIMove(), 350);
                }
            }

        } catch (err) {
            console.error('[MatchPresentationController] Animation error:', err);
        } finally {
            // Spec 106: Always unlock board in finally block!
            this.app.ui.setBoardLocked(false);
            this.app.isAnimating = false;
            this.app.ui.isAnimating = false;
        }
    }

    // =========================================================================
    // 2. PIECE MOVEMENT PERSONALITY (Spec 4)
    // =========================================================================
    async animatePieceWithPersonality(fromSq, toSq, duration, pieceType, element) {
        if (this.app.settings.settings.reducedMotion) return;

        let fromEl = null;
        let toEl = null;
        for (let i = 0; i < 64; i++) {
            const el = this.app.ui.boardEl.children[i];
            const sq = parseInt(el.dataset.square, 10);
            if (sq === fromSq) fromEl = el;
            if (sq === toSq) toEl = el;
        }

        if (!fromEl || !toEl || !this.app.ui.boardWrapper) return;

        const pieceWrapper = fromEl.querySelector('.piece-svg-wrapper');
        if (!pieceWrapper) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const boardRect = this.app.ui.boardWrapper.getBoundingClientRect();

        const dx = toRect.left - fromRect.left;
        const dy = toRect.top - fromRect.top;

        // Create floating piece actor
        const floating = document.createElement('div');
        floating.className = `floating-piece motion-piece-${pieceType}`;
        floating.innerHTML = pieceWrapper.innerHTML;
        floating.style.width = `${fromRect.width * 0.86}px`;
        floating.style.height = `${fromRect.height * 0.86}px`;
        floating.style.left = `${fromRect.left - boardRect.left + (fromRect.width * 0.07)}px`;
        floating.style.top = `${fromRect.top - boardRect.top + (fromRect.height * 0.07)}px`;
        floating.style.transition = `transform ${duration}ms ${this.getPieceEasing(pieceType)}`;

        pieceWrapper.style.visibility = 'hidden';
        this.app.ui.boardWrapper.appendChild(floating);

        void floating.offsetWidth; // Force reflow

        // Apply personality transform
        if (pieceType === 'n') {
            // Knight Jumping Arc (Spec 4)
            floating.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.16) translateY(-14px)`;
        } else if (pieceType === 'r') {
            // Rook Heavy straight glide
            floating.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.04)`;
        } else {
            floating.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        }

        await new Promise(res => setTimeout(res, duration));

        if (floating.parentNode) {
            floating.parentNode.removeChild(floating);
        }
    }

    getPieceEasing(pieceType) {
        switch (pieceType) {
            case 'n': return 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Spring jump
            case 'r': return 'cubic-bezier(0.25, 1, 0.5, 1)';      // Heavy punchy stop
            case 'b': return 'cubic-bezier(0.16, 1, 0.3, 1)';      // Graceful swift glide
            case 'q': return 'cubic-bezier(0.4, 0, 0.2, 1)';       // Smooth dominant glide
            case 'k': return 'cubic-bezier(0.2, 0.8, 0.2, 1)';     // Controlled authoritative
            default:  return 'ease-out';                            // Pawn determined
        }
    }

    // =========================================================================
    // 3. CHECK & CHECKMATE PRESENTATION (Spec 18 - 26)
    // =========================================================================
    async presentCheckSequence({ checkingColor, element, targetKingSq, isDoubleCheck }) {
        this.app.audio.playCheck();
        const kingSqEl = this.app.ui.getSquareElement(targetKingSq);
        const elemMeta = this.app.loadout.getElementMeta(element);

        this.showNonIntrusiveAttackBanner(isDoubleCheck ? '⚡ DOUBLE CHECK! ⚡' : `⚠️ CHECK! (${elemMeta.name.toUpperCase()})`, element);

        if (kingSqEl) {
            kingSqEl.classList.add('sq-check-pulse');
            setTimeout(() => kingSqEl.classList.remove('sq-check-pulse'), 1500);
        }
    }

    async presentCheckmateSequence({ winnerColor, winningPieceType, element, abilityName, loserKingSq }) {
        // Spec 95: Audio ducking during major finishers
        this.app.audio.duckBgm(0.15);

        const names = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        const pieceTitle = `${names[winningPieceType] || 'Hero'}`;
        const elemMeta = this.app.loadout.getElementMeta(element);

        // Announce finisher
        this.showNonIntrusiveAttackBanner(`✦ CHECKMATE ✦\nDELIVERED BY ${elemMeta.name.toUpperCase()} ${pieceTitle.toUpperCase()} • ${abilityName.toUpperCase()}`, element, 2200);

        // Spec 23 & 24: Defeated King remains on the board, surrounded by elemental finisher
        const kingSqEl = this.app.ui.getSquareElement(loserKingSq);
        if (kingSqEl) {
            kingSqEl.classList.add('sq-defeated-king-aura');
        }

        // Checkmate Finisher burst on effects canvas
        this.app.effects.playElementalAttack({
            pieceType: winningPieceType,
            element,
            defenderElement: 'shadow',
            attackName: `${abilityName} FINISHER`,
            fromSq: loserKingSq,
            toSq: loserKingSq,
            color: winnerColor,
            isFlipped: this.app.ui.isFlipped,
            synergyInfo: null
        });

        this.app.audio.playCheckmate();

        await new Promise(res => setTimeout(res, 1800));

        // Restore audio volume
        this.app.audio.duckBgm(1.0);

        // Open Results Modal
        this.showMatchResultsModal(winnerColor === 'w' ? 'White' : 'Black', 'Checkmate');
    }

    presentDrawSequence(reason) {
        this.app.audio.playDraw();
        this.showNonIntrusiveAttackBanner(`DRAW: ${reason.toUpperCase()}`, 'light', 2000);
        this.showMatchResultsModal('Draw', reason);
    }

    handleResignation(resigningColor) {
        const winner = resigningColor === 'w' ? 'Black' : 'White';
        this.app.audio.playGameOver();
        this.showNonIntrusiveAttackBanner(`${resigningColor === 'w' ? 'WHITE' : 'BLACK'} RESIGNS • ${winner.toUpperCase()} WINS`, 'light', 2000);
        this.showMatchResultsModal(winner, 'Resignation');
    }

    // =========================================================================
    // 4. TEMPORARY BOARD REACTIONS (Spec 32 - 34)
    // =========================================================================
    spawnTemporaryBoardReaction(squareIndex, element) {
        if (!this.presets[this.activePresetKey]?.boardReactions) return;

        const sqEl = this.app.ui.getSquareElement(squareIndex);
        if (!sqEl) return;

        const rxEl = document.createElement('div');
        rxEl.className = `temporary-board-rx rx-${element}`;
        sqEl.appendChild(rxEl);

        const timer = setTimeout(() => {
            if (rxEl.parentNode) rxEl.parentNode.removeChild(rxEl);
        }, 900);

        this.boardReactionTimers.push(timer);
    }

    clearAllBoardReactions() {
        this.boardReactionTimers.forEach(t => clearTimeout(t));
        this.boardReactionTimers = [];
        document.querySelectorAll('.temporary-board-rx').forEach(el => el.remove());
    }

    // =========================================================================
    // 5. ATTACK BANNER ANNOUNCEMENT (Spec 10 & 11)
    // =========================================================================
    showNonIntrusiveAttackBanner(text, element = 'fire', durationMs = 1200) {
        if (!this.presets[this.activePresetKey]?.attackNames) return;
        if (!this.attackBannerEl) return;

        const elemMeta = this.app.loadout.getElementMeta(element);
        this.attackBannerEl.textContent = text;
        this.attackBannerEl.style.color = elemMeta.color;
        this.attackBannerEl.style.borderColor = elemMeta.color;
        this.attackBannerEl.style.textShadow = `0 0 14px ${elemMeta.color}`;
        this.attackBannerEl.classList.add('visible');

        if (this.bannerTimer) clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
            this.attackBannerEl.classList.remove('visible');
        }, durationMs);
    }

    // =========================================================================
    // 6. TURN TRANSITIONS & PLAYER PANEL (Spec 14 - 17)
    // =========================================================================
    updateActivePlayerPanel(turn) {
        const whiteCard = document.getElementById('player-white-card');
        const blackCard = document.getElementById('player-black-card');

        if (whiteCard) {
            whiteCard.classList.toggle('active-turn', turn === 'w');
            whiteCard.classList.toggle('inactive-turn', turn === 'b');
        }
        if (blackCard) {
            blackCard.classList.toggle('active-turn', turn === 'b');
            blackCard.classList.toggle('inactive-turn', turn === 'w');
        }

        // Update Army Identity Banners in player cards
        const whiteArmyName = this.app.loadout.getEffectiveArmyName(this.app.loadout.whiteLoadout, 'white');
        const blackArmyName = this.app.loadout.getEffectiveArmyName(this.app.loadout.blackLoadout, 'black');

        const whitePlayerNameEl = document.getElementById('white-player-name');
        const blackPlayerNameEl = document.getElementById('black-player-name');

        if (whitePlayerNameEl) whitePlayerNameEl.textContent = `White (${whiteArmyName})`;
        if (blackPlayerNameEl) blackPlayerNameEl.textContent = `Black (${blackArmyName})`;
    }

    // =========================================================================
    // 7. PRECISE CHESS CLOCK CONTROLLER (Spec 35 - 38 & 108)
    // =========================================================================
    initClock(mode, incrementSecs = 0) {
        this.stopClock();
        this.clockState.mode = mode;
        this.clockState.increment = incrementSecs;

        const seconds = this.app.getTimerSeconds(mode);
        this.clockState.whiteTimeMs = seconds * 1000;
        this.clockState.blackTimeMs = seconds * 1000;
        this.clockState.activeColor = null;
        this.clockState.lastTickTime = null;

        this.renderClockDisplay();
    }

    startClockForActiveTurn() {
        if (this.clockState.mode === 'none' || this.clockState.whiteTimeMs <= 0) return;

        this.pauseActiveClock();
        this.clockState.activeColor = this.app.engine.turn;
        this.clockState.lastTickTime = performance.now();

        this.clockState.timerInterval = setInterval(() => {
            const now = performance.now();
            const delta = now - this.clockState.lastTickTime;
            this.clockState.lastTickTime = now;

            if (this.clockState.activeColor === 'w') {
                this.clockState.whiteTimeMs -= delta;
                if (this.clockState.whiteTimeMs <= 0) {
                    this.clockState.whiteTimeMs = 0;
                    this.stopClock();
                    this.renderClockDisplay();
                    this.app.handleTimeout('w');
                    return;
                }
            } else {
                this.clockState.blackTimeMs -= delta;
                if (this.clockState.blackTimeMs <= 0) {
                    this.clockState.blackTimeMs = 0;
                    this.stopClock();
                    this.renderClockDisplay();
                    this.app.handleTimeout('b');
                    return;
                }
            }

            this.renderClockDisplay();
        }, 100);
    }

    pauseActiveClock() {
        if (this.clockState.timerInterval) {
            clearInterval(this.clockState.timerInterval);
            this.clockState.timerInterval = null;
        }

        // Add increment if active
        if (this.clockState.activeColor && this.clockState.increment > 0) {
            if (this.clockState.activeColor === 'w') {
                this.clockState.whiteTimeMs += this.clockState.increment * 1000;
            } else {
                this.clockState.blackTimeMs += this.clockState.increment * 1000;
            }
        }

        this.clockState.activeColor = null;
        this.renderClockDisplay();
    }

    stopClock() {
        if (this.clockState.timerInterval) {
            clearInterval(this.clockState.timerInterval);
            this.clockState.timerInterval = null;
        }
    }

    renderClockDisplay() {
        const formatMs = (ms) => {
            const totalSec = Math.max(0, Math.ceil(ms / 1000));
            const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const s = (totalSec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const timeWhiteEl = document.getElementById('clock-white-time');
        const timeBlackEl = document.getElementById('clock-black-time');
        const clockWhite = document.getElementById('clock-white');
        const clockBlack = document.getElementById('clock-black');

        if (timeWhiteEl) timeWhiteEl.textContent = formatMs(this.clockState.whiteTimeMs);
        if (timeBlackEl) timeBlackEl.textContent = formatMs(this.clockState.blackTimeMs);

        if (clockWhite) {
            clockWhite.classList.toggle('active-turn', this.clockState.activeColor === 'w');
            clockWhite.classList.toggle('low-time', this.clockState.whiteTimeMs < 20000 && this.clockState.whiteTimeMs > 0);
        }
        if (clockBlack) {
            clockBlack.classList.toggle('active-turn', this.clockState.activeColor === 'b');
            clockBlack.classList.toggle('low-time', this.clockState.blackTimeMs < 20000 && this.clockState.blackTimeMs > 0);
        }
    }

    // =========================================================================
    // 8. MATCH RESULTS MODAL (Spec 26 & 50)
    // =========================================================================
    showMatchResultsModal(winner, reason) {
        this.stats.endMatch(winner, reason);

        // Save match to local history (Spec 77 - 79)
        this.saveCompletedMatchToHistory();

        // Feed completed match into Player Progression, Challenges & Achievements (Spec 83 & 84)
        if (this.app.progression) {
            this.app.progression.handleMatchCompleted({
                winner,
                reason,
                gameMode: this.app.gameMode,
                stats: this.stats,
                whiteLoadout: this.app.loadout.whiteLoadout,
                blackLoadout: this.app.loadout.blackLoadout
            });
        }

        const modal = document.getElementById('modal-match-results');
        if (!modal) return;

        const titleEl = document.getElementById('results-outcome-title');
        const descEl = document.getElementById('results-outcome-desc');
        const durationEl = document.getElementById('results-stat-duration');
        const movesEl = document.getElementById('results-stat-moves');
        const whiteCapsEl = document.getElementById('results-stat-white-caps');
        const blackCapsEl = document.getElementById('results-stat-black-caps');
        const checksEl = document.getElementById('results-stat-checks');
        const promosEl = document.getElementById('results-stat-promotions');
        const activePieceEl = document.getElementById('results-stat-active-piece');
        const topElemEl = document.getElementById('results-stat-top-elem');
        const finalAttackEl = document.getElementById('results-stat-final-attack');

        if (titleEl) {
            titleEl.textContent = winner === 'Draw' ? 'BATTLE DRAW' : `${winner.toUpperCase()} VICTORIOUS!`;
        }
        if (descEl) descEl.textContent = reason;
        if (durationEl) durationEl.textContent = this.stats.getDurationString();
        if (movesEl) movesEl.textContent = `${this.stats.movesCount} full moves (${this.stats.pliesCount} plies)`;
        if (whiteCapsEl) whiteCapsEl.textContent = this.stats.captures.white;
        if (blackCapsEl) blackCapsEl.textContent = this.stats.captures.black;
        if (checksEl) checksEl.textContent = `W: ${this.stats.checks.white} • B: ${this.stats.checks.black}`;
        if (promosEl) promosEl.textContent = `W: ${this.stats.promotions.white} • B: ${this.stats.promotions.black}`;

        const activePiece = this.stats.getMostActivePiece();
        if (activePieceEl) activePieceEl.textContent = `${activePiece.color} ${activePiece.pieceName} (${activePiece.score} pts)`;

        const topElem = this.stats.getMostUsedElement();
        if (topElemEl) topElemEl.textContent = `${topElem.element.toUpperCase()} (${topElem.captures} captures)`;

        if (finalAttackEl) {
            finalAttackEl.textContent = this.stats.finalAttack ? `${this.stats.finalAttack.element.toUpperCase()} • ${this.stats.finalAttack.abilityName}` : 'None';
        }

        modal.classList.add('active');
    }

    // =========================================================================
    // 9. INTERACTIVE REPLAY SYSTEM (Spec 53 - 64)
    // =========================================================================
    openReplayModal(cinematic = false) {
        const modal = document.getElementById('modal-replay');
        if (!modal) return;

        this.replayState.active = true;
        this.replayState.cinematic = cinematic;
        this.replayState.currentPlyIndex = 0;
        this.replayState.isPlaying = false;

        const modeBtn = document.getElementById('btn-replay-mode-toggle');
        if (modeBtn) {
            modeBtn.classList.toggle('active', cinematic);
            modeBtn.textContent = cinematic ? 'CINEMATIC MODE: ON' : 'CINEMATIC MODE: OFF';
        }

        this.renderReplayMoveList();
        this.renderReplayBoardAtPly(0);
        modal.classList.add('active');
    }

    closeReplayModal() {
        this.replayStopPlay();
        this.replayState.active = false;
        document.getElementById('modal-replay')?.classList.remove('active');
        // Restore active board
        this.app.ui.renderBoard();
    }

    renderReplayMoveList() {
        const container = document.getElementById('replay-move-list-body');
        if (!container) return;

        container.innerHTML = '';
        this.stats.timeline.forEach((step, idx) => {
            const row = document.createElement('div');
            row.className = `replay-move-item ${idx === this.replayState.currentPlyIndex ? 'active' : ''}`;
            const elemMeta = this.app.loadout.getElementMeta(step.element);

            let eventIcon = '';
            if (step.isCheckmate) eventIcon = '👑';
            else if (step.isCheck) eventIcon = '⚠️';
            else if (step.isCapture) eventIcon = '⚔️';
            else if (step.isPromotion) eventIcon = '✦';

            row.innerHTML = `
                <span class="replay-ply-num">${idx + 1}.</span>
                <span class="replay-san" style="color: ${elemMeta.color};">${step.san}</span>
                <span class="replay-elem-tag">${step.element.toUpperCase()}</span>
                <span class="replay-event-icon">${eventIcon}</span>
            `;

            row.addEventListener('click', () => {
                this.app.audio.playUiClick();
                this.replayJumpToPly(idx);
            });

            container.appendChild(row);
        });
    }

    renderReplayBoardAtPly(plyIndex) {
        if (plyIndex < 0 || plyIndex >= this.stats.timeline.length) return;

        this.replayState.currentPlyIndex = plyIndex;
        const step = this.stats.timeline[plyIndex];

        // Load position into visual board using FEN snapshot without modifying engine match state
        if (step.fen) {
            this.app.ui.renderBoardFromFEN(step.fen);
            this.app.ui.highlightMoveSquares(step.from, step.to);
        }

        // Update Replay Info HUD
        const plyBadge = document.getElementById('replay-current-ply-badge');
        const abilityText = document.getElementById('replay-current-ability-text');
        const clashText = document.getElementById('replay-current-clash-text');

        if (plyBadge) plyBadge.textContent = `Move ${Math.ceil(step.ply / 2)} (${step.color === 'w' ? 'White' : 'Black'}) • ${step.san}`;
        if (abilityText) {
            abilityText.textContent = `${step.element.toUpperCase()} • ${step.abilityName}`;
            const meta = this.app.loadout.getElementMeta(step.element);
            abilityText.style.color = meta.color;
        }
        if (clashText) {
            if (step.isCapture) {
                const rx = this.app.effects.getElementReaction(step.element, step.capturedElement || 'fire');
                clashText.textContent = `⚔️ ${rx.name}: ${step.element.toUpperCase()} struck ${step.capturedElement?.toUpperCase() || 'DEFENDER'}`;
            } else {
                clashText.textContent = 'Standard Tactical Advance';
            }
        }

        // Highlight active item in list
        document.querySelectorAll('.replay-move-item').forEach((el, i) => {
            el.classList.toggle('active', i === plyIndex);
        });
    }

    replayStep(direction) {
        const next = this.replayState.currentPlyIndex + direction;
        if (next >= 0 && next < this.stats.timeline.length) {
            this.renderReplayBoardAtPly(next);
        } else if (next >= this.stats.timeline.length) {
            this.replayStopPlay();
        }
    }

    replayJumpToPly(idx) {
        this.replayStopPlay();
        this.renderReplayBoardAtPly(idx);
    }

    replayRestart() {
        this.replayJumpToPly(0);
    }

    replayTogglePlay() {
        if (this.replayState.isPlaying) {
            this.replayStopPlay();
        } else {
            this.replayStartPlay();
        }
    }

    replayStartPlay() {
        this.replayState.isPlaying = true;
        const playBtn = document.getElementById('btn-replay-play');
        if (playBtn) playBtn.textContent = '⏸ PAUSE';

        const stepTime = Math.max(300, Math.floor(1000 / this.replayState.speed));
        this.replayState.playTimer = setInterval(() => {
            if (this.replayState.currentPlyIndex < this.stats.timeline.length - 1) {
                this.replayStep(1);
            } else {
                this.replayStopPlay();
            }
        }, stepTime);
    }

    replayStopPlay() {
        this.replayState.isPlaying = false;
        if (this.replayState.playTimer) {
            clearInterval(this.replayState.playTimer);
            this.replayState.playTimer = null;
        }
        const playBtn = document.getElementById('btn-replay-play');
        if (playBtn) playBtn.textContent = '▶ PLAY';
    }

    replaySkipToEvent(eventProp) {
        for (let i = this.replayState.currentPlyIndex + 1; i < this.stats.timeline.length; i++) {
            if (this.stats.timeline[i][eventProp]) {
                this.replayJumpToPly(i);
                return;
            }
        }
    }

    // =========================================================================
    // 10. LOCAL MATCH HISTORY & PROFILE STATS (Spec 77 - 83)
    // =========================================================================
    saveCompletedMatchToHistory() {
        try {
            const raw = localStorage.getItem('maho_match_history');
            const history = raw ? JSON.parse(raw) : [];

            const newEntry = {
                id: `match_${Date.now()}`,
                date: new Date().toLocaleDateString(),
                winner: this.stats.winner,
                reason: this.stats.endReason,
                gameMode: this.app.gameMode,
                moves: this.stats.movesCount,
                duration: this.stats.getDurationString(),
                whiteArmy: this.app.loadout.getEffectiveArmyName(this.app.loadout.whiteLoadout, 'white'),
                blackArmy: this.app.loadout.getEffectiveArmyName(this.app.loadout.blackLoadout, 'black'),
                topElement: this.stats.getMostUsedElement().element
            };

            history.unshift(newEntry);
            if (history.length > 20) history.pop(); // Cap at 20 (Spec 79)
            localStorage.setItem('maho_match_history', JSON.stringify(history));

            this.updateLifetimeProfileStats(newEntry);
        } catch (e) {
            console.warn('Could not save match history to localStorage:', e);
        }
    }

    updateLifetimeProfileStats(match) {
        try {
            const raw = localStorage.getItem('maho_lifetime_stats');
            const stats = raw ? JSON.parse(raw) : {
                games: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                checkmates: 0,
                promotions: 0,
                captures: 0
            };

            stats.games++;
            if (match.winner === 'White' && this.app.playerColor === 'w') stats.wins++;
            else if (match.winner === 'Black' && this.app.playerColor === 'b') stats.wins++;
            else if (match.winner === 'Draw') stats.draws++;
            else stats.losses++;

            if (match.reason === 'Checkmate') stats.checkmates++;
            stats.promotions += (this.stats.promotions.white + this.stats.promotions.black);
            stats.captures += (this.stats.captures.white + this.stats.captures.black);

            localStorage.setItem('maho_lifetime_stats', JSON.stringify(stats));
        } catch (e) {
            console.warn('Could not update lifetime stats:', e);
        }
    }

    // =========================================================================
    // 11. IN-MATCH PAUSE MENU
    // =========================================================================
    openPauseMenu() {
        this.pauseActiveClock();
        document.getElementById('modal-pause-menu')?.classList.add('active');
    }

    closePauseMenu() {
        document.getElementById('modal-pause-menu')?.classList.remove('active');
        this.startClockForActiveTurn();
    }
}

// Export to global window scope
window.MatchPresentationController = MatchPresentationController;
window.MatchStatsTracker = MatchStatsTracker;
