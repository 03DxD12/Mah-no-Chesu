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
        this.ui = new UIManager(this.engine, this.effects, this.audio, this.settings);
        this.ai = new ChessAI();

        // Game Configuration
        this.gameMode = 'pvp'; // 'pvp' | 'pvc'
        this.aiDifficulty = 'normal'; // 'easy' | 'normal' | 'hard'
        this.playerColor = 'w'; // 'w' | 'b' in PvC
        this.moveHistoryLog = []; // { san, move }
        this.isAnimating = false;
        this.consecutiveCaptures = 0;

        this.initSettingsHooks();
        this.initMenuModals();
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

        // Mode: PvP
        document.getElementById('btn-mode-pvp')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalModeSelect.classList.remove('active');
            this.startNewMatch('pvp');
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

        // Start PvC Match
        document.getElementById('btn-start-ai-game')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalModeSelect.classList.remove('active');
            if (chosenSide === 'random') {
                this.playerColor = Math.random() > 0.5 ? 'w' : 'b';
            } else {
                this.playerColor = chosenSide === 'white' ? 'w' : 'b';
            }
            this.startNewMatch('pvc');
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

        this.ui.lastMove = null;
        this.ui.clearSelection();
        this.ui.renderBoard();
        this.ui.renderMoveHistory(this.moveHistoryLog);
        this.ui.renderCapturedPieces();
        this.updateStatusDisplay();

        // If PvC and AI plays White, trigger AI first move
        if (this.gameMode === 'pvc' && this.playerColor === 'b') {
            setTimeout(() => this.triggerAIMove(), 600);
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

        // Pawn promotion prompt if not already specified
        const toRank = Math.floor(move.to / 8);
        if (piece.type === 'p' && (toRank === 7 || toRank === 0) && !move.promotion) {
            move.promotion = await this.ui.promptPromotion(piece.color);
        }

        // Generate SAN notation before committing move
        const san = this.engine.generateSAN(move);

        // Determine smooth movement animation duration
        const animSpeed = this.settings.settings.animationSpeed;
        const slideDuration = animSpeed === 'fast' ? 140 : (animSpeed === 'cinematic' ? 360 : 220);

        // 1. Play Elemental Attack FX & Smooth Movement
        if (isCapture) {
            this.consecutiveCaptures++;
            if (this.consecutiveCaptures >= 2) {
                this.effects.incrementCombo();
            }

            // Route elemental attack based on piece type
            switch (piece.type) {
                case 'p':
                    this.audio.playFireBlast();
                    await this.effects.fireBlast(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
                case 'n':
                    this.audio.playThunderStrike();
                    await this.effects.thunderStrike(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
                case 'b':
                    this.audio.playWindSlash();
                    await this.effects.windSlash(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
                case 'r':
                    this.audio.playEarthBreaker();
                    await this.effects.earthBreaker(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
                case 'q':
                    this.audio.playFrozenDominion();
                    await this.effects.frozenDominion(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
                case 'k':
                    this.audio.playJudgmentOfLight();
                    await this.effects.judgmentOfLight(move.from, move.to, piece.color, this.ui.isFlipped);
                    break;
            }

            // Smooth gliding advance into conquered square
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        } else if (move.isCastling) {
            this.audio.playCastling();
            this.effects.fortressAura(move.from, move.to, this.ui.isFlipped);
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        } else {
            this.consecutiveCaptures = 0;
            this.effects.resetCombo();
            this.audio.playMoveSound();
            this.effects.moveTrail(piece, move.from, move.to, this.ui.isFlipped);
            await this.ui.animatePieceMove(move.from, move.to, slideDuration);
        }

        // 2. Commit move in chess engine
        this.engine.makeMove(move);
        this.ui.lastMove = move;

        // 3. Promotion Aura
        if (move.promotion) {
            this.effects.ascensionAura(move.to, this.ui.isFlipped);
        }

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

        // 6. Check Game Over & Checks
        const status = this.engine.getGameStatus();

        if (status.inCheck && !status.gameOver) {
            this.audio.playCheck();
            this.effects.showAttackName('CHECK');
            this.effects.screenShake('sm');
        }

        // 7. Auto-Rotate board in local PvP mode if enabled
        if (this.gameMode === 'pvp' && this.settings.settings.autoRotate) {
            this.ui.setFlipped(this.engine.turn === 'b');
        }

        this.ui.renderBoard();
        this.updateStatusDisplay();

        if (status.gameOver) {
            this.audio.playVictory();
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
