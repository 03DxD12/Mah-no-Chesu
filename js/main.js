/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/main.js - Application Entry Point, Game Coordination & Animation Sequencing
 */

class MahoNoChesuApp {
    constructor() {
        this.engine = new ChessEngine();
        this.effects = new EffectsManager();
        this.audio = new AudioManager();
        this.settings = new SettingsManager();
        this.loadout = new LoadoutManager();
        this.ui = new UIManager(this.engine, this.effects, this.audio, this.settings, this.loadout);
        this.ai = new ChessAI();

        // Game Configuration
        this.gameMode = 'pvp'; // 'pvp' | 'pvc'
        this.aiDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
        this.playerColor = 'w'; // 'w' | 'b' in PvC
        this.moveHistoryLog = []; // { san, move }
        this.isAnimating = false;
        this.consecutiveCaptures = 0;
        this.comboTracker = { player: null, lastElement: null, streak: 0, sameStreak: 0 };

        // Custom Element Loadout State
        this.loadoutActiveSide = 'white'; // 'white' | 'black'
        this.loadoutActivePiece = 'p'; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

        // Match Clock State (Point 15: 1m, 3m, 5m, 10m, 15m, none)
        this.timerMode = 'none'; // 'none' | '1m' | '3m' | '5m' | '10m' | '15m'
        this.whiteTimeSeconds = 0;
        this.blackTimeSeconds = 0;
        this.clockTimerInterval = null;

        // Element Laboratory Sandbox State (Point 27 & 28)
        this.labAttackerPiece = 'n';
        this.labAttackerColor = 'w';
        this.labAttackerElement = 'lightning';
        this.labTargetPiece = 'k';
        this.labActiveTab = 'sandbox'; // 'sandbox' | 'gallery'

        this.initSettingsHooks();
        this.initMenuModals();
        this.initLoadoutModal();
        this.initLaboratoryModal();
        this.initDeveloperPanel();
        this.initGameLoop();
    }

    initSettingsHooks() {
        this.settings.onChange((s) => {
            this.audio.setSfxEnabled(s.sfx);
            this.audio.setMusicEnabled(s.music);
            this.audio.setMasterVolume(s.volume);
            this.effects.setQuality(s.particles);
            this.effects.photosensitive = s.photosensitivity;
            this.effects.screenShakeEnabled = s.screenShake;
            this.ui.renderBoard();
        });
    }

    initMenuModals() {
        // Main Menu Buttons
        const modalMainMenu = document.getElementById('modal-main-menu');
        const modalModeSelect = document.getElementById('modal-mode-select');
        const modalGuide = document.getElementById('modal-element-guide');
        const modalHowTo = document.getElementById('modal-how-to-play');
        const modalSettings = document.getElementById('modal-settings');
        const modalAbout = document.getElementById('modal-about');
        const aiSubConfig = document.getElementById('ai-sub-config');

        document.getElementById('btn-home')?.addEventListener('click', () => {
            modalMainMenu.classList.add('active');
        });

        document.getElementById('menu-btn-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalMainMenu.classList.remove('active');
            modalModeSelect.classList.add('active');
        });

        // Quick Match using Last-Saved Loadout (Point 17)
        document.getElementById('menu-btn-quick-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalMainMenu.classList.remove('active');
            this.gameMode = 'pvp';
            this.startNewMatch('pvp');
        });

        // Element Laboratory & Effect Gallery (Point 27 & 28)
        document.getElementById('menu-btn-laboratory')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalMainMenu.classList.remove('active');
            this.openLaboratoryModal();
        });

        // Direct Loadout from Main Menu & Top Bar
        document.getElementById('menu-btn-loadout')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalMainMenu.classList.remove('active');
            this.openLoadoutModal(this.playerColor === 'w' ? 'white' : 'black');
        });

        document.getElementById('btn-loadout-toggle')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.openLoadoutModal(this.playerColor === 'w' ? 'white' : 'black');
        });

        document.getElementById('menu-btn-guide')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalGuide.classList.add('active');
        });

        document.getElementById('btn-guide-toggle')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalGuide.classList.add('active');
        });

        document.getElementById('menu-btn-how-to-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalHowTo.classList.add('active');
        });

        document.getElementById('menu-btn-settings')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalSettings.classList.add('active');
        });

        document.getElementById('btn-open-settings')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalSettings.classList.add('active');
        });

        document.getElementById('menu-btn-about')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalAbout.classList.add('active');
        });

        document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalModeSelect.classList.remove('active');
            modalMainMenu.classList.add('active');
        });

        // Close generic modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audio.playUiClick();
                e.target.closest('.modal-overlay')?.classList.remove('active');
            });
        });

        // Mode: PvP -> Opens Element Loadout (Spec 128)
        document.getElementById('btn-mode-pvp')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalModeSelect.classList.remove('active');
            this.gameMode = 'pvp';
            this.openLoadoutModal('white');
        });

        // Match Clock Timers (Point 15)
        document.querySelectorAll('.btn-timer-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-timer-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timerMode = btn.dataset.time || 'none';
            });
        });

        // Mode: PvC Toggle
        document.getElementById('btn-mode-pvc')?.addEventListener('click', () => {
            this.audio.playUiClick();
            aiSubConfig.classList.remove('hidden');
        });

        // AI Difficulty buttons
        document.querySelectorAll('.btn-diff').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-diff').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aiDifficulty = btn.dataset.diff;
            });
        });

        // AI Side buttons
        let chosenSide = 'white';
        document.querySelectorAll('.btn-side').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-side').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                chosenSide = btn.dataset.side;
            });
        });

        // Start PvC Match -> Opens Element Loadout (Spec 128)
        document.getElementById('btn-start-ai-game')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalModeSelect.classList.remove('active');
            this.gameMode = 'pvc';
            if (chosenSide === 'random') {
                this.playerColor = Math.random() > 0.5 ? 'w' : 'b';
            } else {
                this.playerColor = chosenSide === 'white' ? 'w' : 'b';
            }
            this.openLoadoutModal(this.playerColor === 'w' ? 'white' : 'black');
        });

        // Game Over Buttons
        document.getElementById('btn-game-over-rematch')?.addEventListener('click', () => {
            document.getElementById('modal-game-over')?.classList.remove('active');
            this.startNewMatch(this.gameMode);
        });

        document.getElementById('btn-game-over-new')?.addEventListener('click', () => {
            document.getElementById('modal-game-over')?.classList.remove('active');
            modalModeSelect.classList.add('active');
        });

        document.getElementById('btn-game-over-menu')?.addEventListener('click', () => {
            document.getElementById('modal-game-over')?.classList.remove('active');
            modalMainMenu.classList.add('active');
        });

        // Sound Toggle in Top Bar
        const btnSound = document.getElementById('btn-sound-toggle');
        const iconOn = document.getElementById('icon-sound-on');
        const iconOff = document.getElementById('icon-sound-off');
        btnSound?.addEventListener('click', () => {
            const newState = !this.settings.settings.sfx;
            this.settings.settings.sfx = newState;
            this.settings.settings.music = newState;
            this.settings.saveSettings();
            iconOn.classList.toggle('hidden', !newState);
            iconOff.classList.toggle('hidden', newState);
        });
    }

    initGameLoop() {
        this.ui.onPlayerMoveRequest = async (move) => {
            if (this.isAnimating) return;

            // In PvC mode, check if it's player's turn
            if (this.gameMode === 'pvc' && this.engine.turn !== this.playerColor) {
                return;
            }

            await this.processMoveSequence(move);
        };

        this.ui.onUndoRequest = () => {
            if (this.isAnimating) return;
            this.audio.playUiClick();

            if (this.gameMode === 'pvc') {
                // In PvC mode, undo 2 plies (AI move + Player move)
                if (this.engine.history.length >= 2) {
                    this.engine.unmakeMove();
                    this.engine.unmakeMove();
                    this.moveHistoryLog.pop();
                    this.moveHistoryLog.pop();
                } else if (this.engine.history.length === 1) {
                    this.engine.unmakeMove();
                    this.moveHistoryLog.pop();
                }
            } else {
                // In PvP mode, undo 1 ply
                if (this.engine.history.length > 0) {
                    this.engine.unmakeMove();
                    this.moveHistoryLog.pop();
                }
            }

            this.ui.lastMove = null;
            this.ui.renderBoard();
            this.ui.renderMoveHistory(this.moveHistoryLog);
            this.ui.renderCapturedPieces();
            this.updateStatusDisplay();
        };

        this.ui.onRestartRequest = () => {
            this.audio.playUiClick();
            this.stopMatchClock();
            this.startNewMatch(this.gameMode);
        };

        this.ui.onDrawOfferRequest = () => {
            if (this.isAnimating) return;
            this.audio.playUiClick();
            const modal = document.getElementById('modal-draw-offer');
            if (modal) modal.classList.add('active');

            const acceptBtn = document.getElementById('btn-draw-accept');
            const declineBtn = document.getElementById('btn-draw-decline');

            const cleanUp = () => {
                modal.classList.remove('active');
                acceptBtn?.removeEventListener('click', onAccept);
                declineBtn?.removeEventListener('click', onDecline);
            };

            const onAccept = () => {
                cleanUp();
                this.stopMatchClock();
                this.ui.showGameOver({
                    gameOver: true,
                    winner: null,
                    reason: 'draw_agreed',
                    description: 'Truce accepted by mutual agreement.'
                });
            };

            const onDecline = () => {
                cleanUp();
                this.ui.setStatus('Draw offer was declined.');
            };

            acceptBtn?.addEventListener('click', onAccept);
            declineBtn?.addEventListener('click', onDecline);
        };

        this.ui.onResignRequest = () => {
            if (this.isAnimating) return;
            this.audio.playUiClick();
            this.stopMatchClock();
            const resigningColor = this.engine.turn;
            const winner = resigningColor === 'w' ? 'b' : 'w';
            this.ui.showGameOver({
                gameOver: true,
                winner,
                reason: 'resignation',
                description: `${resigningColor === 'w' ? 'White' : 'Black'} has conceded the battlefield.`
            });
        };
    }

    startNewMatch(mode = 'pvp') {
        this.gameMode = mode;
        this.engine.reset();
        this.moveHistoryLog = [];
        this.consecutiveCaptures = 0;
        this.effects.resetCombo();

        // Update Player Card Labels
        const whiteType = document.getElementById('white-player-type');
        const blackType = document.getElementById('black-player-type');
        if (mode === 'pvc') {
            const aiSide = this.playerColor === 'w' ? 'b' : 'w';
            const aiLoadout = this.loadout.resolveAiLoadout(this.playerColor);
            if (aiSide === 'b') {
                this.loadout.blackLoadout = aiLoadout;
            } else {
                this.loadout.whiteLoadout = aiLoadout;
            }

            if (this.playerColor === 'w') {
                if (whiteType) whiteType.textContent = 'Human';
                if (blackType) blackType.textContent = `Arcane AI (${this.aiDifficulty.toUpperCase()})`;
                this.ui.setFlipped(false);
            } else {
                if (whiteType) whiteType.textContent = `Arcane AI (${this.aiDifficulty.toUpperCase()})`;
                if (blackType) blackType.textContent = 'Human';
                this.ui.setFlipped(true); // Flip for black player
            }
        } else {
            if (whiteType) whiteType.textContent = 'Human';
            if (blackType) blackType.textContent = 'Human';
            this.ui.setFlipped(false);
        }

        this.comboTracker = { player: null, lastElement: null, streak: 0, sameStreak: 0 };
        this.ui.lastMove = null;
        this.ui.clearSelection();
        this.updateBoardSynergyTheme();
        this.ui.renderBoard();
        this.ui.renderMoveHistory(this.moveHistoryLog);
        this.ui.renderCapturedPieces();
        this.updateStatusDisplay();
        this.startMatchClock();

        // If PvC and AI plays White, trigger AI first move
        if (this.gameMode === 'pvc' && this.playerColor === 'b') {
            setTimeout(() => this.triggerAIMove(), 600);
        }
    }

    /**
     * Update Grandmaster Board Frame Glow and Theming based on Active Army Synergy (Specs 146 - 151)
     */
    updateBoardSynergyTheme() {
        const frame = document.getElementById('board-frame');
        if (!frame) return;

        // Clear existing synergy/pure army classes
        const classesToRemove = Array.from(frame.classList).filter(c => 
            c.startsWith('pure-army-') || c.startsWith('synergy-theme-') || c === 'elemental-balance'
        );
        classesToRemove.forEach(c => frame.classList.remove(c));

        const turnColor = this.engine ? this.engine.turn : 'w';
        const currentLoadout = turnColor === 'w' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const themeCls = this.loadout.getBoardThemeClass(currentLoadout);
        if (themeCls) {
            frame.classList.add(themeCls);
        }
    }

    /**
     * Primary Move Execution & Elemental Animation Flow
     */
    async processMoveSequence(move) {
        this.isAnimating = true;
        this.ui.isAnimating = true;

        const piece = this.engine.board[move.from];
        const isCapture = !!(move.captured || move.isEnPassant || this.engine.board[move.to]);
        const isWhite = piece.color === 'w';

        // Check if pawn reaches the final rank (Specs 163 - 164, 190)
        const toRank = Math.floor(move.to / 8);
        const isPawnPromotion = piece.type === 'p' && (toRank === 7 || toRank === 0);

        // Determine smooth movement animation duration
        const animSpeed = this.settings.settings.animationSpeed;
        const slideDuration = animSpeed === 'fast' ? 140 : (animSpeed === 'cinematic' ? 360 : 220);

        // Look up piece's configured element & piece-specific attack name (Spec 109, 123, 186-188)
        const element = this.loadout.getElementForPiece(piece, piece.color);
        const attackName = this.loadout.getAttackName(piece.type, element);

        // Army synergy for moving player (Specs 144 - 153)
        const activeArmyLoadout = piece.color === 'w' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const synergyInfo = this.loadout.calculateElementSynergies(activeArmyLoadout);

        // 1. Play Elemental Attack FX & Smooth Movement (Spec 190: uses OLD element)
        if (isCapture) {
            this.consecutiveCaptures++;

            // Track same-element and cross-element combos (Specs 154 - 155)
            if (this.comboTracker.player === piece.color) {
                this.comboTracker.streak++;
                if (this.comboTracker.lastElement === element) {
                    this.comboTracker.sameStreak++;
                } else {
                    this.comboTracker.sameStreak = 1;
                }
            } else {
                this.comboTracker.player = piece.color;
                this.comboTracker.streak = 1;
                this.comboTracker.sameStreak = 1;
            }
            this.comboTracker.lastElement = element;

            if (this.comboTracker.streak >= 2) {
                const isSame = this.comboTracker.sameStreak >= 2;
                this.effects.showComboChain({
                    streak: isSame ? this.comboTracker.sameStreak : this.comboTracker.streak,
                    element,
                    isSameElement: isSame
                });
            }

            const targetSq = move.isEnPassant ? (Math.floor(move.from / 8) * 8 + (move.to % 8)) : move.to;

            const reactionMap = {
                fire: 'piece-target-burning',
                lightning: 'piece-target-electrocuted',
                wind: 'piece-target-slashed',
                earth: 'piece-target-crushed',
                ice: 'piece-target-frozen',
                water: 'piece-target-drowned',
                light: 'piece-target-dissolved',
                shadow: 'piece-target-void',
                nature: 'piece-target-entangled',
                arcane: 'piece-target-arcane'
            };

            this.ui.triggerPieceTargetReaction(targetSq, reactionMap[element] || 'piece-target-burning');
            this.audio.playElementSound(element);

            await this.effects.playElementalAttack({
                pieceType: piece.type,
                element,
                attackName,
                fromSq: move.from,
                toSq: move.to,
                color: piece.color,
                isFlipped: this.ui.isFlipped,
                synergyInfo
            });

            // Smooth gliding advance into conquered square (Pawn stands on promotion square)
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        } else if (move.isCastling) {
            this.comboTracker = { player: null, lastElement: null, streak: 0, sameStreak: 0 };
            this.audio.playCastling();
            this.effects.fortressAura(move.from, move.to, this.ui.isFlipped);
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        } else {
            this.consecutiveCaptures = 0;
            this.comboTracker = { player: null, lastElement: null, streak: 0, sameStreak: 0 };
            this.effects.resetCombo();
            this.audio.playMoveSound();
            this.effects.moveTrail(piece, move.from, move.to, this.ui.isFlipped, element);
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        }

        // 2. ASCENSION - Pawn Promotion Sequence (Specs 163 - 190)
        if (isPawnPromotion) {
            const isHumanPlayer = this.gameMode === 'pvp' || (this.gameMode === 'pvc' && piece.color === this.playerColor);
            let promoChoice;

            if (isHumanPlayer) {
                promoChoice = await this.ui.promptAscension({
                    color: piece.color,
                    pawnElement: element,
                    settings: this.settings.settings,
                    onPreview: (previewData) => {
                        this.effects.playAscensionSequence({
                            squareIndex: move.to,
                            isFlipped: this.ui.isFlipped,
                            element: previewData.element,
                            pieceType: previewData.pieceType,
                            style: previewData.style,
                            isReducedMotion: this.settings.settings.reducedMotion
                        });
                        this.audio.playAscensionSound(previewData.element, previewData.style);
                    }
                });
            } else {
                promoChoice = {
                    pieceType: move.promotion || 'q',
                    element: element,
                    style: 'elemental'
                };
            }

            move.promotion = promoChoice.pieceType;
            move.element = promoChoice.element;
            move.ascensionStyle = promoChoice.style;

            // Play the canonical Ascension animation & audio on the promotion square (Spec 170-176, 194)
            this.audio.playAscensionSound(move.element, move.ascensionStyle);
            await this.effects.playAscensionSequence({
                squareIndex: move.to,
                isFlipped: this.ui.isFlipped,
                element: move.element,
                pieceType: move.promotion,
                style: move.ascensionStyle,
                isReducedMotion: this.settings.settings.reducedMotion
            });
        }

        // Generate SAN notation after promotion piece is finalized
        const san = this.engine.generateSAN(move);

        // 3. Commit move in chess engine (preserves individual piece.element on promoted piece)
        this.engine.makeMove(move);
        this.ui.lastMove = move;

        // 4. Update Move History
        this.moveHistoryLog.push({ san, move });
        this.ui.renderMoveHistory(this.moveHistoryLog);
        this.ui.renderCapturedPieces();

        // 5. Screen reader announcement
        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        const actionWord = isCapture ? 'captures on' : 'moves to';
        const fromAlg = this.engine.squareToAlgebraic(move.from);
        const toAlg = this.engine.squareToAlgebraic(move.to);
        this.ui.announce(`${isWhite ? 'White' : 'Black'} ${pieceNames[piece.type]} from ${fromAlg} ${actionWord} ${toAlg}`);

        // 6. Check Game Over & Checks (Spec 191, 192, 193)
        const status = this.engine.getGameStatus();

        if (status.gameOver && (status.reason === 'checkmate' || status.checkmate) && isPawnPromotion) {
            // Spec 192 & 193: ASCENSION CHECKMATE SPECIAL FINISHER
            this.audio.playAscensionCheckmateSound(move.element);
            await this.effects.playAscensionCheckmate({
                squareIndex: move.to,
                isFlipped: this.ui.isFlipped,
                element: move.element,
                pieceType: move.promotion,
                winnerColor: piece.color
            });
            this.audio.playVictory();
            this.ui.showGameOver(status);
            this.isAnimating = false;
            this.ui.isAnimating = false;
            return;
        }

        if (status.inCheck && !status.gameOver) {
            this.audio.playCheck();
            const checkingColor = this.engine.turn === 'w' ? 'b' : 'w';
            const checkLoadout = checkingColor === 'w' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
            const checkSyn = this.loadout.calculateElementSynergies(checkLoadout);

            if (checkSyn.isPureArmy) {
                this.effects.playPureArmyCheckEffect(checkSyn.dominantElement, false);
            } else {
                this.effects.showAttackName('CHECK');
                this.effects.screenShake('sm');
            }
        }

        // 7. Auto-Rotate board in local PvP mode if enabled
        if (this.gameMode === 'pvp' && this.settings.settings.autoRotate) {
            this.ui.setFlipped(this.engine.turn === 'b');
        }

        this.updateBoardSynergyTheme();
        this.ui.renderBoard();
        this.updateStatusDisplay();
        this.updateClockDisplay();

        if (status.gameOver) {
            this.stopMatchClock();
            this.audio.playVictory();
            if (status.reason === 'checkmate' || status.checkmate) {
                const winningColor = this.engine.turn === 'w' ? 'b' : 'w';
                const winLoadout = winningColor === 'w' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
                const winSyn = this.loadout.calculateElementSynergies(winLoadout);
                if (winSyn.isPureArmy) {
                    this.effects.playPureArmyCheckEffect(winSyn.dominantElement, true);
                }
            }
            this.ui.showGameOver(status);
            this.isAnimating = false;
            this.ui.isAnimating = false;
            return;
        }

        this.isAnimating = false;
        this.ui.isAnimating = false;

        // 8. Trigger AI reply if it's computer's turn
        if (this.gameMode === 'pvc' && this.engine.turn !== this.playerColor) {
            setTimeout(() => this.triggerAIMove(), 350);
        }
    }

    /**
     * AI Move Trigger
     */
    async triggerAIMove() {
        if (this.isAnimating || this.engine.getGameStatus().gameOver) return;

        this.ui.setStatus('Arcane AI is calculating...', true);
        const bestMove = await this.ai.getBestMove(this.engine.exportFEN(), this.aiDifficulty, this.engine);

        if (bestMove) {
            await this.processMoveSequence(bestMove);
        }
    }

    updateStatusDisplay() {
        const status = this.engine.getGameStatus();
        if (status.gameOver) {
            this.ui.setStatus(status.description, false);
        } else if (status.inCheck) {
            const kingColor = this.engine.turn === 'w' ? 'White' : 'Black';
            this.ui.setStatus(`Check! ${kingColor} King is under attack!`, false);
        } else {
            const turnName = this.engine.turn === 'w' ? 'White' : 'Black';
            this.ui.setStatus(`${turnName} to move`, false);
        }
    }

    /**
     * ==========================================================================
     * CUSTOM ELEMENT LOADOUT SYSTEM CONTROLLER (Specs 101 - 129)
     * ==========================================================================
     */
    initLoadoutModal() {
        const modal = document.getElementById('modal-loadout');

        // 1. Army Side Tabs (White vs Black)
        const tabWhite = document.getElementById('tab-loadout-white');
        const tabBlack = document.getElementById('tab-loadout-black');

        tabWhite?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.loadoutActiveSide = 'white';
            tabWhite.classList.add('active');
            tabBlack?.classList.remove('active');
            this.renderLoadoutAll();
        });

        tabBlack?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.loadoutActiveSide = 'black';
            tabBlack.classList.add('active');
            tabWhite?.classList.remove('active');
            this.renderLoadoutAll();
        });

        // 2. Copy White Army to Black (Spec 112)
        document.getElementById('btn-copy-p1-loadout')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.loadout.blackLoadout = { ...this.loadout.whiteLoadout };
            this.loadout.saveLoadouts();
            this.renderLoadoutAll();
            this.effects.showAttackName('WHITE ARMY COPIED TO BLACK');
        });

        // 3. AI Legion Options (Spec 113)
        document.querySelectorAll('.btn-ai-loadout').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-ai-loadout').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadout.aiLoadoutType = btn.dataset.type;
                this.loadout.saveLoadouts();
            });
        });

        // 4. Randomize Button (Spec 114)
        document.getElementById('btn-loadout-randomize')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const allowDup = document.getElementById('check-allow-duplicates')?.checked ?? true;
            const randomized = this.loadout.generateRandomLoadout(allowDup);
            if (this.loadoutActiveSide === 'white') {
                this.loadout.whiteLoadout = randomized;
            } else {
                this.loadout.blackLoadout = randomized;
            }
            this.loadout.saveLoadouts();
            this.renderLoadoutAll();
            this.effects.showAttackName('ELEMENTS RANDOMIZED');
        });

        // 5. Reset Default Button (Spec 115)
        document.getElementById('btn-loadout-reset')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const defaults = { p: 'fire', n: 'lightning', b: 'wind', r: 'earth', q: 'ice', k: 'light' };
            if (this.loadoutActiveSide === 'white') {
                this.loadout.whiteLoadout = { ...defaults };
            } else {
                this.loadout.blackLoadout = { ...defaults };
            }
            this.loadout.saveLoadouts();
            this.renderLoadoutAll();
            this.effects.showAttackName('DEFAULT ELEMENTS RESTORED');
        });

        // 6. Save Loadout Button (Spec 116)
        document.getElementById('btn-loadout-save')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.loadout.saveLoadouts();
            this.effects.showAttackName('LOADOUT SAVED LOCALLY');
        });

        // 7. Custom Preset Management (Spec 118)
        document.getElementById('btn-save-custom-preset')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const presetName = prompt('Enter a name for this custom elemental preset:', 'My Element Legion');
            if (presetName && presetName.trim()) {
                const currentLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
                this.loadout.addCustomPreset(presetName.trim(), currentLoadout);
                this.populateCustomPresetsDropdown();
                this.effects.showAttackName(`PRESET "${presetName.trim().toUpperCase()}" SAVED`);
            }
        });

        document.getElementById('btn-delete-custom-preset')?.addEventListener('click', () => {
            const dropdown = document.getElementById('custom-presets-dropdown');
            const selectedId = dropdown?.value;
            if (selectedId) {
                this.audio.playUiClick();
                this.loadout.deleteCustomPreset(selectedId);
                this.populateCustomPresetsDropdown();
                this.effects.showAttackName('PRESET DELETED');
            }
        });

        document.getElementById('custom-presets-dropdown')?.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId && this.loadout.customPresets[selectedId]) {
                this.audio.playUiClick();
                const preset = this.loadout.customPresets[selectedId];
                if (this.loadoutActiveSide === 'white') {
                    this.loadout.whiteLoadout = { ...preset.loadout };
                } else {
                    this.loadout.blackLoadout = { ...preset.loadout };
                }
                this.loadout.saveLoadouts();
                this.renderLoadoutAll();
                this.effects.showAttackName(`LOADED: ${preset.name.toUpperCase()}`);
            }
        });

        // 8. Live Test Attack Preview (Point 2)
        document.getElementById('btn-preview-live-test')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runLoadoutPreviewTest();
        });

        // 9. Start Match Button
        document.getElementById('btn-loadout-start')?.addEventListener('click', () => {
            this.audio.playUiClick();
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            this.loadout.saveLoadouts();
            this.startNewMatch(this.gameMode);
        });
    }

    openLoadoutModal(defaultSide = 'white') {
        const modal = document.getElementById('modal-loadout');
        if (!modal) return;

        // Close any other active modal overlays
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'modal-loadout') m.classList.remove('active');
        });

        this.loadoutActiveSide = defaultSide;
        this.loadoutActivePiece = 'p';

        // Update tabs active state
        const tabWhite = document.getElementById('tab-loadout-white');
        const tabBlack = document.getElementById('tab-loadout-black');
        if (tabWhite && tabBlack) {
            tabWhite.classList.toggle('active', this.loadoutActiveSide === 'white');
            tabBlack.classList.toggle('active', this.loadoutActiveSide === 'black');
        }

        // In PvC mode, show AI options panel
        const aiPanel = document.getElementById('ai-legion-panel');
        if (aiPanel) {
            aiPanel.classList.toggle('hidden', this.gameMode !== 'pvc');
            // Sync AI mode button active state
            document.querySelectorAll('.btn-ai-loadout').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === this.loadout.aiLoadoutType);
            });
        }

        this.renderLoadoutAll();
        modal.classList.add('active');
    }

    renderLoadoutAll() {
        this.renderLoadoutPieceRoster();
        this.renderLoadoutElementsGrid();
        this.renderLoadoutPreview();
        this.renderLoadoutSynergies();
        this.renderLoadoutPresets();
        this.populateCustomPresetsDropdown();
    }

    /**
     * Render the 6 Chess Pieces with their active element pill (Spec 106)
     */
    renderLoadoutPieceRoster() {
        const container = document.getElementById('piece-roster-list');
        if (!container) return;

        const pieces = [
            { type: 'p', name: 'Pawn' },
            { type: 'n', name: 'Knight' },
            { type: 'b', name: 'Bishop' },
            { type: 'r', name: 'Rook' },
            { type: 'q', name: 'Queen' },
            { type: 'k', name: 'King' }
        ];

        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const color = this.loadoutActiveSide === 'white' ? 'w' : 'b';

        container.innerHTML = '';
        pieces.forEach(p => {
            const btn = document.createElement('button');
            btn.className = `piece-roster-btn ${p.type === this.loadoutActivePiece ? 'active' : ''}`;
            btn.dataset.piece = p.type;

            const elemKey = activeLoadout[p.type] || 'fire';
            const elemMeta = this.loadout.getElementMeta(elemKey);

            btn.innerHTML = `
                <div class="roster-piece-info">
                    <div class="roster-piece-svg">${this.ui.getPieceSVG(p.type, color)}</div>
                    <span class="roster-piece-name">${p.name}</span>
                </div>
                <div class="roster-elem-pill" style="color: ${elemMeta.color}; border-color: ${elemMeta.color}; background: rgba(${this.hexToRgb(elemMeta.color)}, 0.1);">
                    <span class="roster-elem-icon">${elemMeta.svg}</span>
                    <span>${elemMeta.name}</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                this.loadoutActivePiece = p.type;
                this.renderLoadoutPieceRoster();
                this.renderLoadoutElementsGrid();
                this.renderLoadoutPreview();
                this.renderLoadoutSynergies();
            });

            container.appendChild(btn);
        });
    }

    /**
     * Render 10 Element Selection Buttons (Spec 103, 106, 121, 122)
     */
    renderLoadoutElementsGrid() {
        const container = document.getElementById('elements-grid');
        const heading = document.getElementById('picker-piece-heading');
        if (!container) return;

        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        if (heading) {
            heading.textContent = `Assign ${pieceNames[this.loadoutActivePiece]} Element`;
        }

        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const currentAssignedElem = activeLoadout[this.loadoutActivePiece] || 'fire';

        container.innerHTML = '';
        Object.values(ELEMENTS).forEach(elem => {
            const btn = document.createElement('button');
            const isSelected = elem.id === currentAssignedElem;
            btn.className = `elem-select-btn ${isSelected ? 'active' : ''}`;
            btn.dataset.element = elem.id;
            btn.style.borderColor = isSelected ? elem.color : 'rgba(212, 175, 55, 0.15)';
            btn.style.color = elem.color;

            if (isSelected) {
                btn.style.background = `linear-gradient(135deg, rgba(${this.hexToRgb(elem.color)}, 0.18), var(--bg-surface))`;
            }

            btn.innerHTML = `
                <div class="elem-btn-icon" style="color: ${elem.color};">${elem.svg}</div>
                <div class="elem-btn-text">
                    <span class="elem-btn-name" style="color: ${elem.color};">${elem.name}</span>
                    <span class="elem-btn-trail">${elem.trailName}</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                this.audio.playElementSound(elem.id);

                const allowDup = document.getElementById('check-allow-duplicates')?.checked ?? true;
                if (!allowDup) {
                    // Check if another piece already has this element, if so, swap
                    const otherPieceKey = Object.keys(activeLoadout).find(k => k !== this.loadoutActivePiece && activeLoadout[k] === elem.id);
                    if (otherPieceKey) {
                        activeLoadout[otherPieceKey] = currentAssignedElem;
                    }
                }

                activeLoadout[this.loadoutActivePiece] = elem.id;
                this.loadout.saveLoadouts();

                this.renderLoadoutPieceRoster();
                this.renderLoadoutElementsGrid();
                this.renderLoadoutPreview();
                this.renderLoadoutSynergies();
            });

            container.appendChild(btn);
        });
    }

    /**
     * Live Combat Preview Card (Specs 107, 131, 157)
     */
    renderLoadoutPreview() {
        const svgContainer = document.getElementById('preview-svg-container');
        const badgeEl = document.getElementById('preview-elem-badge');
        const attackEl = document.getElementById('preview-attack-name');
        const descEl = document.getElementById('preview-desc-val');
        const trailEl = document.getElementById('preview-trail-val');
        const captureEl = document.getElementById('preview-capture-val');
        const auraEl = document.getElementById('preview-aura-val');

        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const color = this.loadoutActiveSide === 'white' ? 'w' : 'b';
        const pType = this.loadoutActivePiece;
        const elemKey = activeLoadout[pType] || 'fire';
        const elemMeta = this.loadout.getElementMeta(elemKey);
        const abilityDetails = this.loadout.getAbilityDetails(pType, elemKey);

        if (svgContainer) {
            svgContainer.innerHTML = this.ui.getPieceSVG(pType, color);
            svgContainer.style.filter = `drop-shadow(0 0 16px ${elemMeta.color})`;
        }

        if (badgeEl) {
            badgeEl.style.color = elemMeta.color;
            badgeEl.style.borderColor = elemMeta.color;
            badgeEl.style.background = `rgba(${this.hexToRgb(elemMeta.color)}, 0.12)`;
            badgeEl.innerHTML = `${elemMeta.svg} <span>${elemMeta.name}</span>`;
        }

        if (attackEl) {
            attackEl.textContent = abilityDetails.name;
            attackEl.style.color = elemMeta.color;
            attackEl.style.textShadow = `0 0 14px ${elemMeta.color}`;
        }

        if (descEl) {
            descEl.textContent = abilityDetails.desc;
        }

        if (trailEl) trailEl.textContent = abilityDetails.motionTrail;
        if (captureEl) captureEl.textContent = abilityDetails.impact;
        if (auraEl) auraEl.textContent = elemMeta.auraDesc;
    }

    /**
     * Render Element Synergies & Army Affinities (Specs 144 - 156, 160)
     */
    renderLoadoutSynergies() {
        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const syn = this.loadout.calculateElementSynergies(activeLoadout);

        const badgeMain = document.getElementById('synergy-badge-main');
        const titleEl = document.getElementById('synergy-title-text');
        const levelEl = document.getElementById('synergy-level-pill');
        const descEl = document.getElementById('synergy-desc-text');
        const chipsList = document.getElementById('synergy-chips-list');

        const dominantMeta = this.loadout.getElementMeta(syn.dominantElement);

        if (titleEl) {
            titleEl.textContent = syn.synergyTitle || 'NO SYNERGY';
            titleEl.style.color = dominantMeta.color;
        }

        if (levelEl) {
            if (syn.isPureArmy) {
                levelEl.textContent = 'PURE ARMY (Lvl 5)';
                levelEl.style.background = dominantMeta.color;
                levelEl.style.color = '#000000';
            } else if (syn.isBalanced) {
                levelEl.textContent = 'HARMONY';
                levelEl.style.background = 'linear-gradient(90deg, #f97316, #38bdf8, #10b981, #ec4899)';
                levelEl.style.color = '#ffffff';
            } else if (syn.synergyLevel > 0) {
                levelEl.textContent = `Level ${syn.synergyLevel} (${syn.dominantCount}/6)`;
                levelEl.style.background = `rgba(${this.hexToRgb(dominantMeta.color)}, 0.2)`;
                levelEl.style.color = dominantMeta.color;
            } else {
                levelEl.textContent = 'None';
                levelEl.style.background = 'rgba(255, 255, 255, 0.1)';
                levelEl.style.color = 'var(--text-muted)';
            }
        }

        if (descEl) {
            descEl.textContent = syn.synergyDesc;
        }

        // Thematic Army Name Generator (Point 48)
        const armyNameEl = document.getElementById('loadout-army-name-text');
        const armyPillEl = document.getElementById('loadout-army-pill');
        if (armyNameEl) {
            const generatedName = this.loadout.generateArmyName(activeLoadout);
            armyNameEl.textContent = generatedName;
            armyNameEl.style.color = dominantMeta.color;
            armyNameEl.style.textShadow = `0 0 14px ${dominantMeta.color}`;
        }
        if (armyPillEl) {
            armyPillEl.textContent = `${this.loadoutActiveSide.toUpperCase()} ARMY • ${dominantMeta.name.toUpperCase()} SYNERGY`;
            armyPillEl.style.borderColor = dominantMeta.color;
            armyPillEl.style.color = dominantMeta.color;
        }

        if (badgeMain) {
            badgeMain.style.borderColor = dominantMeta.color;
            if (syn.isPureArmy) {
                badgeMain.style.boxShadow = `0 0 20px ${dominantMeta.color}`;
            } else {
                badgeMain.style.boxShadow = 'none';
            }
        }

        if (chipsList) {
            chipsList.innerHTML = '';
            if (syn.activeHybrids && syn.activeHybrids.length > 0) {
                syn.activeHybrids.forEach(hybrid => {
                    const chip = document.createElement('span');
                    chip.className = 'synergy-hybrid-chip';
                    chip.textContent = hybrid.name;
                    chip.title = hybrid.desc;
                    chipsList.appendChild(chip);
                });
            } else {
                chipsList.innerHTML = `<span class="no-hybrids-text">None</span>`;
            }
        }
    }

    /**
     * Render Built-in Preset Buttons (Spec 117)
     */
    renderLoadoutPresets() {
        const container = document.getElementById('preset-buttons-container');
        if (!container) return;

        container.innerHTML = '';
        Object.entries(LOADOUT_PRESETS).forEach(([key, preset]) => {
            const btn = document.createElement('button');
            btn.className = 'preset-chip-btn';
            btn.textContent = preset.name;
            btn.title = preset.desc;

            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                if (this.loadoutActiveSide === 'white') {
                    this.loadout.whiteLoadout = { ...preset.loadout };
                } else {
                    this.loadout.blackLoadout = { ...preset.loadout };
                }
                this.loadout.saveLoadouts();
                this.renderLoadoutAll();
                this.effects.showAttackName(`PRESET APPLIED: ${preset.name.toUpperCase()}`);
            });

            container.appendChild(btn);
        });
    }

    /**
     * Populate Custom Presets Dropdown (Spec 118)
     */
    populateCustomPresetsDropdown() {
        const dropdown = document.getElementById('custom-presets-dropdown');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">-- Custom Presets --</option>';
        Object.values(this.loadout.customPresets).forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.id;
            opt.textContent = preset.name;
            dropdown.appendChild(opt);
        });
    }

    hexToRgb(hex) {
        let c = hex.substring(1);
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }

    /**
     * ==========================================================================
     * CHESS CLOCKS & MATCH TIMERS (Point 15)
     * ==========================================================================
     */
    getTimerSeconds(mode) {
        switch (mode) {
            case '1m': return 60;
            case '3m': return 180;
            case '5m': return 300;
            case '10m': return 600;
            case '15m': return 900;
            default: return 0;
        }
    }

    startMatchClock() {
        this.stopMatchClock();

        const seconds = this.getTimerSeconds(this.timerMode);
        const clockWhite = document.getElementById('clock-white');
        const clockBlack = document.getElementById('clock-black');

        if (seconds === 0 || this.timerMode === 'none') {
            if (clockWhite) clockWhite.style.display = 'none';
            if (clockBlack) clockBlack.style.display = 'none';
            return;
        }

        this.whiteTimeSeconds = seconds;
        this.blackTimeSeconds = seconds;

        if (clockWhite) clockWhite.style.display = 'inline-flex';
        if (clockBlack) clockBlack.style.display = 'inline-flex';

        this.updateClockDisplay();

        this.clockTimerInterval = setInterval(() => {
            if (this.engine.getGameStatus().gameOver) {
                this.stopMatchClock();
                return;
            }

            if (this.engine.turn === 'w') {
                this.whiteTimeSeconds--;
                if (this.whiteTimeSeconds <= 0) {
                    this.whiteTimeSeconds = 0;
                    this.updateClockDisplay();
                    this.handleTimeout('w');
                    return;
                }
            } else {
                this.blackTimeSeconds--;
                if (this.blackTimeSeconds <= 0) {
                    this.blackTimeSeconds = 0;
                    this.updateClockDisplay();
                    this.handleTimeout('b');
                    return;
                }
            }

            this.updateClockDisplay();
        }, 1000);
    }

    stopMatchClock() {
        if (this.clockTimerInterval) {
            clearInterval(this.clockTimerInterval);
            this.clockTimerInterval = null;
        }
    }

    updateClockDisplay() {
        if (this.timerMode === 'none') return;

        const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const timeWhiteEl = document.getElementById('clock-white-time');
        const timeBlackEl = document.getElementById('clock-black-time');
        const clockWhite = document.getElementById('clock-white');
        const clockBlack = document.getElementById('clock-black');

        if (timeWhiteEl) timeWhiteEl.textContent = formatTime(this.whiteTimeSeconds);
        if (timeBlackEl) timeBlackEl.textContent = formatTime(this.blackTimeSeconds);

        if (clockWhite) {
            clockWhite.classList.toggle('active-turn', this.engine.turn === 'w');
            clockWhite.classList.toggle('low-time', this.whiteTimeSeconds <= 20 && this.whiteTimeSeconds > 0);
        }
        if (clockBlack) {
            clockBlack.classList.toggle('active-turn', this.engine.turn === 'b');
            clockBlack.classList.toggle('low-time', this.blackTimeSeconds <= 20 && this.blackTimeSeconds > 0);
        }
    }

    handleTimeout(loserColor) {
        this.stopMatchClock();
        const winner = loserColor === 'w' ? 'Black' : 'White';
        this.ui.showGameOver({
            gameOver: true,
            winner,
            reason: 'timeout',
            description: `${loserColor === 'w' ? 'White' : 'Black'} ran out of time! ${winner} claims victory!`
        });
    }

    /**
     * Live Attack Preview in Loadout Builder (Point 2)
     */
    runLoadoutPreviewTest() {
        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const pType = this.loadoutActivePiece;
        const elemKey = activeLoadout[pType] || 'fire';
        const abilityDetails = this.loadout.getAbilityDetails(pType, elemKey);
        const elemMeta = this.loadout.getElementMeta(elemKey);

        this.audio.playElementSound(elemKey);
        this.effects.showAttackName(`${elemMeta.name.toUpperCase()} • ${abilityDetails.name}`);

        const previewContainer = document.getElementById('preview-svg-container');
        if (previewContainer) {
            previewContainer.style.transform = 'scale(1.25) translateY(-8px)';
            previewContainer.style.filter = `drop-shadow(0 0 28px ${elemMeta.color})`;
            setTimeout(() => {
                previewContainer.style.transform = 'scale(1) translateY(0)';
                previewContainer.style.filter = `drop-shadow(0 0 16px ${elemMeta.color})`;
            }, 350);
        }
    }

    /**
     * ==========================================================================
     * ELEMENT LABORATORY & COMBAT SANDBOX (Points 27 & 28)
     * ==========================================================================
     */
    initLaboratoryModal() {
        // Tab switching: Sandbox vs 60-Combination Gallery
        const tabSandbox = document.getElementById('tab-lab-sandbox');
        const tabGallery = document.getElementById('tab-lab-gallery');
        const viewSandbox = document.getElementById('lab-view-sandbox');
        const viewGallery = document.getElementById('lab-view-gallery');

        tabSandbox?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.labActiveTab = 'sandbox';
            tabSandbox.classList.add('active');
            tabGallery?.classList.remove('active');
            viewSandbox?.classList.remove('hidden');
            viewGallery?.classList.add('hidden');
            this.renderLabStage();
        });

        tabGallery?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.labActiveTab = 'gallery';
            tabGallery.classList.add('active');
            tabSandbox?.classList.remove('active');
            viewGallery?.classList.remove('hidden');
            viewSandbox?.classList.add('hidden');
            this.renderEffectGallery('all');
        });

        // Trigger Attack Button in Sandbox
        document.getElementById('btn-lab-fire-attack')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runLabAttack();
        });

        // Test Ascension Button in Sandbox
        document.getElementById('btn-lab-fire-ascension')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runLabAscension();
        });

        // Reset Stage Button in Sandbox
        document.getElementById('btn-lab-reset-stage')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.renderLabStage();
        });

        // Attacker Color Toggle
        document.getElementById('btn-lab-color-toggle')?.addEventListener('click', (e) => {
            this.audio.playUiClick();
            this.labAttackerColor = this.labAttackerColor === 'w' ? 'b' : 'w';
            e.target.textContent = `Color: ${this.labAttackerColor === 'w' ? 'White' : 'Black'}`;
            this.renderLabAttackerPieces();
            this.renderLabStage();
        });

        // Gallery Filter Chips
        document.querySelectorAll('.gallery-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.gallery-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.renderEffectGallery(chip.dataset.filter || 'all');
            });
        });
    }

    openLaboratoryModal() {
        const modal = document.getElementById('modal-laboratory');
        if (!modal) return;

        // Close other modals
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'modal-laboratory') m.classList.remove('active');
        });

        this.renderLabAttackerPieces();
        this.renderLabElements();
        this.renderLabTargetPieces();
        this.renderLabStage();
        modal.classList.add('active');
    }

    renderLabAttackerPieces() {
        const grid = document.getElementById('lab-attacker-pieces-grid');
        if (!grid) return;
        const pieces = [
            { type: 'p', name: 'Pawn' },
            { type: 'n', name: 'Knight' },
            { type: 'b', name: 'Bishop' },
            { type: 'r', name: 'Rook' },
            { type: 'q', name: 'Queen' },
            { type: 'k', name: 'King' }
        ];

        grid.innerHTML = '';
        pieces.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn-lab-piece-chip ${p.type === this.labAttackerPiece ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="lab-chip-svg">${this.ui.getPieceSVG(p.type, this.labAttackerColor)}</div>
                <span>${p.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labAttackerPiece = p.type;
                this.renderLabAttackerPieces();
                this.renderLabStage();
            });
            grid.appendChild(btn);
        });
    }

    renderLabElements() {
        const grid = document.getElementById('lab-elements-grid');
        if (!grid) return;

        grid.innerHTML = '';
        Object.values(ELEMENTS).forEach(elem => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSelected = elem.id === this.labAttackerElement;
            btn.className = `btn-lab-elem-chip ${isSelected ? 'active' : ''}`;
            btn.style.color = elem.color;
            btn.style.borderColor = isSelected ? elem.color : 'rgba(212, 175, 55, 0.2)';
            if (isSelected) {
                btn.style.background = `rgba(${this.hexToRgb(elem.color)}, 0.16)`;
            }
            btn.innerHTML = `
                <span class="lab-elem-svg">${elem.svg}</span>
                <span>${elem.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.audio.playElementSound(elem.id);
                this.labAttackerElement = elem.id;
                this.renderLabElements();
                this.renderLabStage();
            });
            grid.appendChild(btn);
        });
    }

    renderLabTargetPieces() {
        const grid = document.getElementById('lab-target-pieces-grid');
        if (!grid) return;
        const targetColor = this.labAttackerColor === 'w' ? 'b' : 'w';
        const pieces = [
            { type: 'p', name: 'Pawn' },
            { type: 'n', name: 'Knight' },
            { type: 'b', name: 'Bishop' },
            { type: 'r', name: 'Rook' },
            { type: 'q', name: 'Queen' },
            { type: 'k', name: 'King' }
        ];

        grid.innerHTML = '';
        pieces.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn-lab-piece-chip ${p.type === this.labTargetPiece ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="lab-chip-svg">${this.ui.getPieceSVG(p.type, targetColor)}</div>
                <span>${p.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labTargetPiece = p.type;
                this.renderLabTargetPieces();
                this.renderLabStage();
            });
            grid.appendChild(btn);
        });
    }

    renderLabStage() {
        const attackerSvgEl = document.getElementById('lab-attacker-svg');
        const attackerTagEl = document.getElementById('lab-attacker-tag');
        const attackerHaloEl = document.getElementById('lab-attacker-halo');
        const fighterAttacker = document.getElementById('lab-fighter-attacker');

        const targetSvgEl = document.getElementById('lab-target-svg');
        const targetTagEl = document.getElementById('lab-target-tag');
        const fighterTarget = document.getElementById('lab-fighter-target');

        const targetColor = this.labAttackerColor === 'w' ? 'b' : 'w';
        const elemMeta = this.loadout.getElementMeta(this.labAttackerElement);
        const ability = this.loadout.getAbilityDetails(this.labAttackerPiece, this.labAttackerElement);

        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

        if (attackerSvgEl) attackerSvgEl.innerHTML = this.ui.getPieceSVG(this.labAttackerPiece, this.labAttackerColor);
        if (attackerTagEl) attackerTagEl.textContent = `${this.labAttackerColor === 'w' ? 'White' : 'Black'} ${pieceNames[this.labAttackerPiece]}`;
        if (attackerHaloEl) {
            attackerHaloEl.style.background = `radial-gradient(circle, ${elemMeta.color} 0%, transparent 70%)`;
        }

        if (targetSvgEl) targetSvgEl.innerHTML = this.ui.getPieceSVG(this.labTargetPiece, targetColor);
        if (targetTagEl) targetTagEl.textContent = `${targetColor === 'w' ? 'White' : 'Black'} ${pieceNames[this.labTargetPiece]}`;

        if (fighterAttacker) {
            fighterAttacker.className = 'lab-stage-fighter';
            fighterAttacker.style.transform = '';
        }
        if (fighterTarget) {
            fighterTarget.className = 'lab-stage-fighter';
            fighterTarget.style.transform = '';
        }

        // Update Spec Card
        const badgeEl = document.getElementById('lab-spec-elem-badge');
        const titleEl = document.getElementById('lab-spec-title');
        const styleEl = document.getElementById('lab-spec-style');
        const trailEl = document.getElementById('lab-spec-trail');
        const impactEl = document.getElementById('lab-spec-impact');
        const descEl = document.getElementById('lab-spec-desc');

        if (badgeEl) {
            badgeEl.textContent = elemMeta.name.toUpperCase();
            badgeEl.style.color = elemMeta.color;
            badgeEl.style.borderColor = elemMeta.color;
            badgeEl.style.background = `rgba(${this.hexToRgb(elemMeta.color)}, 0.15)`;
        }
        if (titleEl) {
            titleEl.textContent = ability.name;
            titleEl.style.color = elemMeta.color;
            titleEl.style.textShadow = `0 0 14px ${elemMeta.color}`;
        }
        if (styleEl) styleEl.textContent = ability.style;
        if (trailEl) trailEl.textContent = ability.motionTrail;
        if (impactEl) impactEl.textContent = ability.impact;
        if (descEl) descEl.textContent = ability.desc;

        // Clear canvas
        const canvas = document.getElementById('lab-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    runLabAttack() {
        const fighterAttacker = document.getElementById('lab-fighter-attacker');
        const fighterTarget = document.getElementById('lab-fighter-target');
        const canvas = document.getElementById('lab-canvas');
        const elemMeta = this.loadout.getElementMeta(this.labAttackerElement);
        const ability = this.loadout.getAbilityDetails(this.labAttackerPiece, this.labAttackerElement);

        this.audio.playElementSound(this.labAttackerElement);
        this.effects.showAttackName(`${elemMeta.name.toUpperCase()} • ${ability.name}`);

        if (fighterAttacker) {
            fighterAttacker.style.transition = 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            fighterAttacker.style.transform = 'translateX(90px) scale(1.15)';
            setTimeout(() => {
                fighterAttacker.style.transform = 'translateX(0) scale(1)';
            }, 320);
        }

        setTimeout(() => {
            if (fighterTarget) {
                fighterTarget.classList.add('piece-target-hit');
                fighterTarget.style.transition = 'transform 0.15s ease-out';
                fighterTarget.style.transform = 'translateX(25px) scale(0.92)';
                setTimeout(() => {
                    fighterTarget.style.transform = 'translateX(0) scale(1)';
                    fighterTarget.classList.remove('piece-target-hit');
                }, 300);
            }

            // Draw energetic impact burst on sandbox canvas
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const targetX = canvas.width * 0.75;
                const targetY = canvas.height * 0.5;

                for (let i = 0; i < 24; i++) {
                    const angle = (Math.PI * 2 * i) / 24;
                    const dist = 30 + Math.random() * 45;
                    ctx.beginPath();
                    ctx.arc(targetX + Math.cos(angle) * dist, targetY + Math.sin(angle) * dist, 3 + Math.random() * 4, 0, Math.PI * 2);
                    ctx.fillStyle = elemMeta.color;
                    ctx.shadowColor = elemMeta.color;
                    ctx.shadowBlur = 12;
                    ctx.fill();
                }

                setTimeout(() => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }, 400);
            }
        }, 180);
    }

    runLabAscension() {
        const fighterAttacker = document.getElementById('lab-fighter-attacker');
        const elemMeta = this.loadout.getElementMeta(this.labAttackerElement);

        this.audio.playElementSound(this.labAttackerElement);
        this.effects.showAttackName(`ASCENSION • ${elemMeta.name.toUpperCase()}`);

        if (fighterAttacker) {
            fighterAttacker.style.transition = 'transform 0.4s ease-out, filter 0.4s ease-out';
            fighterAttacker.style.transform = 'scale(1.3) translateY(-14px)';
            fighterAttacker.style.filter = `drop-shadow(0 0 25px ${elemMeta.color})`;
            setTimeout(() => {
                fighterAttacker.style.transform = 'scale(1) translateY(0)';
                fighterAttacker.style.filter = '';
            }, 600);
        }
    }

    renderEffectGallery(filter = 'all') {
        const container = document.getElementById('gallery-cards-grid');
        if (!container) return;

        const allCombos = this.loadout.getAllCombinations();
        const filtered = filter === 'all' ? allCombos : allCombos.filter(c => c.pieceType === filter);

        container.innerHTML = '';
        filtered.forEach(combo => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.style.borderColor = `rgba(${this.hexToRgb(combo.elementColor)}, 0.25)`;

            card.innerHTML = `
                <div class="gallery-card-header">
                    <div class="gallery-card-svg">${this.ui.getPieceSVG(combo.pieceType, 'w')}</div>
                    <div class="gallery-card-meta">
                        <span class="gallery-elem-badge" style="color: ${combo.elementColor}; border-color: ${combo.elementColor}; background: rgba(${this.hexToRgb(combo.elementColor)}, 0.12);">
                            ${combo.elementName}
                        </span>
                        <h4 class="gallery-attack-title" style="color: ${combo.elementColor};">${combo.attackName}</h4>
                    </div>
                </div>
                <div class="gallery-card-body">
                    <p class="gallery-card-desc">${combo.description}</p>
                    <div class="gallery-card-tags">
                        <span class="gallery-tag">Trail: ${combo.motionTrail}</span>
                        <span class="gallery-tag">Impact: ${combo.impact}</span>
                    </div>
                </div>
                <button type="button" class="btn-gallery-test" style="border-color: ${combo.elementColor}; color: ${combo.elementColor};">
                    Test in Sandbox &rarr;
                </button>
            `;

            card.querySelector('.btn-gallery-test')?.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labAttackerPiece = combo.pieceType;
                this.labAttackerElement = combo.elementKey;

                // Switch to sandbox tab
                const tabSandbox = document.getElementById('tab-lab-sandbox');
                const tabGallery = document.getElementById('tab-lab-gallery');
                const viewSandbox = document.getElementById('lab-view-sandbox');
                const viewGallery = document.getElementById('lab-view-gallery');

                tabSandbox?.classList.add('active');
                tabGallery?.classList.remove('active');
                viewSandbox?.classList.remove('hidden');
                viewGallery?.classList.add('hidden');

                this.renderLabAttackerPieces();
                this.renderLabElements();
                this.renderLabTargetPieces();
                this.renderLabStage();
                setTimeout(() => this.runLabAttack(), 200);
            });

            container.appendChild(card);
        });
    }

    initDeveloperPanel() {
        const fenInput = document.getElementById('fen-input');
        const loadFenBtn = document.getElementById('btn-load-fen');
        const exportFenBtn = document.getElementById('btn-export-fen');
        const runPerftBtn = document.getElementById('btn-run-perft');
        const devConsole = document.getElementById('dev-console');

        exportFenBtn?.addEventListener('click', () => {
            if (fenInput) fenInput.value = this.engine.exportFEN();
        });

        loadFenBtn?.addEventListener('click', () => {
            if (fenInput?.value) {
                try {
                    this.engine.loadFEN(fenInput.value);
                    this.ui.renderBoard();
                    this.moveHistoryLog = [];
                    this.ui.renderMoveHistory([]);
                    this.updateStatusDisplay();
                    if (devConsole) devConsole.textContent = `Loaded FEN: ${fenInput.value}`;
                } catch (e) {
                    if (devConsole) devConsole.textContent = `Error loading FEN: ${e.message}`;
                }
            }
        });

        runPerftBtn?.addEventListener('click', () => {
            if (devConsole) {
                devConsole.textContent = 'Running Perft suite (Depths 1 to 4)...\nPlease wait.';
                setTimeout(() => {
                    const output = this.engine.runPerftSuite();
                    devConsole.textContent = output;
                }, 50);
            }
        });
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new MahoNoChesuApp();
});
