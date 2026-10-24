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
        this.clockIncrement = 0; // 0, 1, 2, 5, 10
        this.whiteTimeSeconds = 0;
        this.blackTimeSeconds = 0;
        this.clockTimerInterval = null;

        // AI Personality Configuration (Specs 67 & 68)
        this.selectedPersonality = 'kaen'; // 'kaen' | 'raiden' | 'fubuki' | 'terra' | 'noctis' | 'lumina'

        // Match Presentation & Replay Coordinator (Spec 1)
        this.presentation = new MatchPresentationController(this);

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

        // Quick Match using Favorite or Last-Used Army (Specs 44 & 45)
        document.getElementById('menu-btn-quick-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modalMainMenu.classList.remove('active');
            const fav = this.loadout.getFavoriteArmy();
            if (fav && fav.loadout) {
                this.loadout.whiteLoadout = { ...fav.loadout };
                this.loadout.saveLoadouts();
            }
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

        // Match Presets (Spec 39)
        document.querySelectorAll('.btn-preset-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-preset-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.presentation) {
                    this.presentation.setPreset(btn.dataset.preset || 'casual');
                }
            });
        });

        // Timer Increments (Spec 35)
        document.querySelectorAll('.btn-increment-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-increment-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.clockIncrement = parseInt(btn.dataset.increment || '0', 10);
            });
        });

        // AI Personalities (Spec 67 & 68)
        document.querySelectorAll('.btn-ai-personality').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-ai-personality').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedPersonality = btn.dataset.personality || 'kaen';
            });
        });

        // Match Pause Menu (Spec 71)
        document.getElementById('btn-pause-match')?.addEventListener('click', () => {
            this.audio.playUiClick();
            if (this.presentation) {
                this.presentation.openPauseMenu();
            }
        });

        // Match History Modal (Spec 77 - 79)
        document.getElementById('btn-match-history-toggle')?.addEventListener('click', () => {
            this.audio.playUiClick();
            if (this.presentation) {
                this.presentation.openMatchHistoryModal();
            }
        });
        document.getElementById('menu-btn-match-history')?.addEventListener('click', () => {
            this.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            if (this.presentation) {
                this.presentation.openMatchHistoryModal();
            }
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
            if (this.presentation) {
                this.presentation.pauseActiveClock();
            }
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
                if (this.presentation) {
                    this.presentation.pauseActiveClock();
                    this.presentation.presentDrawSequence('Agreement');
                }
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
            if (this.presentation) {
                this.presentation.handleResignation(this.engine.turn);
            }
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
            const personality = this.ai.getPersonality ? this.ai.getPersonality(this.selectedPersonality) : null;
            const aiLoadout = personality && personality.loadout ? { ...personality.loadout } : this.loadout.resolveAiLoadout(this.playerColor);
            if (aiSide === 'b') {
                this.loadout.blackLoadout = aiLoadout;
            } else {
                this.loadout.whiteLoadout = aiLoadout;
            }

            const aiName = personality ? `${personality.name} (${personality.style})` : `Arcane AI (${this.aiDifficulty.toUpperCase()})`;
            if (this.playerColor === 'w') {
                if (whiteType) whiteType.textContent = 'Human';
                if (blackType) blackType.textContent = aiName;
                this.ui.setFlipped(false);
            } else {
                if (whiteType) whiteType.textContent = aiName;
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

        // Initialize and start match presentation statistics & clocks (Spec 36, 41, 108)
        if (this.presentation) {
            this.presentation.stats.startMatch();
            this.presentation.initClock(this.timerMode, this.clockIncrement);
            this.presentation.updateActivePlayerPanel('w');
            this.presentation.startClockForActiveTurn();
        }

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
     * Primary Move Execution & Presentation Flow (Spec 1 & 2)
     */
    async processMoveSequence(move) {
        if (this.presentation) {
            await this.presentation.presentMove(move);
        }
    }

    stopMatchClock() {
        if (this.presentation) {
            this.presentation.pauseActiveClock();
        }
    }

    startMatchClock() {
        if (this.presentation) {
            this.presentation.initClock(this.timerMode, this.clockIncrement);
            this.presentation.updateActivePlayerPanel(this.engine ? this.engine.turn : 'w');
            this.presentation.startClockForActiveTurn();
        }
    }

    updateClockDisplay() {
        if (this.presentation) {
            this.presentation.renderClocks();
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

        // State for loadout
        this.loadoutActiveSide = this.loadoutActiveSide || 'white';
        this.loadoutActivePiece = this.loadoutActivePiece || 'n';
        this.previewSlowMo = false;
        this.previewAnimationTimer = null;

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

        // 2. Custom Army Name (Spec 41)
        document.getElementById('btn-rename-army')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const currentName = this.loadout.getEffectiveArmyName(
                this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout,
                this.loadoutActiveSide
            );
            const newName = prompt(`Enter a custom name for your ${this.loadoutActiveSide.toUpperCase()} army:`, currentName);
            if (newName && newName.trim()) {
                this.loadout.setCustomArmyName(this.loadoutActiveSide, newName.trim());
                this.renderLoadoutAll();
                this.effects.showAttackName(`ARMY NAMED: ${newName.trim().toUpperCase()}`);
            }
        });

        // 3. Saved Armies Drawer Toggle & Actions (Specs 42 - 44)
        const savedDrawer = document.getElementById('drawer-saved-armies');
        document.getElementById('btn-toggle-saved-armies')?.addEventListener('click', () => {
            this.audio.playUiClick();
            savedDrawer?.classList.remove('hidden');
            this.renderSavedArmiesList();
        });

        document.getElementById('btn-close-saved-drawer')?.addEventListener('click', () => {
            this.audio.playUiClick();
            savedDrawer?.classList.add('hidden');
        });

        document.getElementById('btn-save-current-army')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const defaultName = this.loadout.getEffectiveArmyName(
                this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout,
                this.loadoutActiveSide
            );
            const armyName = prompt('Enter a name for this saved loadout:', defaultName);
            if (armyName && armyName.trim()) {
                const currentLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
                this.loadout.saveArmy(armyName.trim(), currentLoadout);
                this.renderSavedArmiesList();
                this.effects.showAttackName(`ARMY "${armyName.trim().toUpperCase()}" SAVED`);
            }
        });

        // 4. Randomize All Button (Specs 46 & 47)
        document.getElementById('btn-loadout-random')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const allowDup = document.getElementById('chk-allow-duplicates')?.checked ?? true;
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

        // 5. Reset Default Button
        document.getElementById('btn-loadout-reset')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const defaults = { p: 'fire', n: 'lightning', b: 'wind', r: 'earth', q: 'ice', k: 'light' };
            if (this.loadoutActiveSide === 'white') {
                this.loadout.whiteLoadout = { ...defaults };
            } else {
                this.loadout.blackLoadout = { ...defaults };
            }
            this.loadout.setCustomArmyName(this.loadoutActiveSide, null);
            this.loadout.saveLoadouts();
            this.renderLoadoutAll();
            this.effects.showAttackName('DEFAULT ELEMENTS RESTORED');
        });

        // 6. Save Loadout Button
        document.getElementById('btn-loadout-save')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.loadout.saveLoadouts();
            this.effects.showAttackName('LOADOUT SAVED LOCALLY');
        });

        // 7. Start Match Button
        document.getElementById('btn-loadout-start-match')?.addEventListener('click', () => {
            this.audio.playUiClick();
            modal?.classList.remove('active');
            this.loadout.saveLoadouts();
            this.startNewMatch(this.gameMode);
        });

        // 8. Customization Drawer Controls (Specs 1 - 3)
        const customizeDrawer = document.getElementById('drawer-piece-customize');
        document.getElementById('btn-close-customize-drawer')?.addEventListener('click', () => {
            this.audio.playUiClick();
            customizeDrawer?.classList.add('hidden');
        });

        // 9. Dedicated Live Preview Controls (Specs 4 - 6)
        const previewDrawer = document.getElementById('drawer-live-preview');
        document.getElementById('btn-close-preview-drawer')?.addEventListener('click', () => {
            this.audio.playUiClick();
            previewDrawer?.classList.add('hidden');
            this.resetDedicatedPreview();
        });

        document.getElementById('btn-preview-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runDedicatedPreview(this.previewActivePiece || 'n');
        });

        document.getElementById('btn-preview-replay')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runDedicatedPreview(this.previewActivePiece || 'n', true);
        });

        document.getElementById('btn-preview-pause')?.addEventListener('click', () => {
            this.audio.playUiClick();
            if (this.previewAnimationTimer) {
                clearTimeout(this.previewAnimationTimer);
                this.previewAnimationTimer = null;
            }
        });

        document.getElementById('btn-preview-reset')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.resetDedicatedPreview();
        });

        const slowMoBtn = document.getElementById('btn-preview-slowmo');
        slowMoBtn?.addEventListener('click', () => {
            this.previewSlowMo = !this.previewSlowMo;
            slowMoBtn.classList.toggle('active', this.previewSlowMo);
            slowMoBtn.textContent = this.previewSlowMo ? 'SLOW MO (0.5x)' : 'SLOW MOTION';
            this.audio.playUiClick();
        });
    }

    openLoadoutModal(defaultSide = 'white') {
        const modal = document.getElementById('modal-loadout');
        if (!modal) return;

        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'modal-loadout') m.classList.remove('active');
        });

        this.loadoutActiveSide = defaultSide;
        this.renderLoadoutAll();
        modal.classList.add('active');
    }

    renderLoadoutAll() {
        this.renderArmyIdentityBanner();
        this.renderArmyRosterGrid();
        this.renderSynergiesBreakdown();
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return '212, 175, 55';
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        if (isNaN(num)) return '212, 175, 55';
        return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }

    renderArmyIdentityBanner() {
        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const armyName = this.loadout.getEffectiveArmyName(activeLoadout, this.loadoutActiveSide);
        const syn = this.loadout.calculateElementSynergies(activeLoadout);
        const dominantMeta = this.loadout.getElementMeta(syn.dominantElement);

        const iconEl = document.getElementById('loadout-army-icon');
        const nameEl = document.getElementById('loadout-army-name');
        const badgeEl = document.getElementById('loadout-army-synergy-badge');

        if (iconEl) iconEl.textContent = dominantMeta.icon || '⚔️';
        if (nameEl) {
            nameEl.textContent = armyName.toUpperCase();
            nameEl.style.color = dominantMeta.color;
            nameEl.style.textShadow = `0 0 12px ${dominantMeta.color}`;
        }
        if (badgeEl) {
            if (syn.isPureArmy) {
                badgeEl.textContent = `PURE ${dominantMeta.name.toUpperCase()} ARMY`;
                badgeEl.style.background = dominantMeta.color;
                badgeEl.style.color = '#000';
            } else if (syn.isBalanced) {
                badgeEl.textContent = 'ELEMENTAL CONCORD (6 UNIQUE)';
                badgeEl.style.background = 'linear-gradient(90deg, #f97316, #38bdf8, #10b981, #ec4899)';
                badgeEl.style.color = '#fff';
            } else {
                badgeEl.textContent = `${dominantMeta.name.toUpperCase()} ${syn.dominantCount}/6 • ${syn.synergyTitle || 'BOND'}`;
                badgeEl.style.background = `rgba(${this.hexToRgb(dominantMeta.color)}, 0.2)`;
                badgeEl.style.color = dominantMeta.color;
            }
        }
    }

    /**
     * Renders the 3x2 Army Pieces Roster (Specs 1 & 2)
     * Desktop: 3 cols x 2 rows (Pawn, Knight, Bishop / Rook, Queen, King)
     */
    renderArmyRosterGrid() {
        const grid = document.getElementById('army-roster-grid');
        if (!grid) return;

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

        // Count element distribution for synergy indicator
        const elemCounts = {};
        Object.values(activeLoadout).forEach(el => { elemCounts[el] = (elemCounts[el] || 0) + 1; });

        grid.innerHTML = '';
        pieces.forEach(p => {
            const elemKey = activeLoadout[p.type] || 'fire';
            const elemMeta = this.loadout.getElementMeta(elemKey);
            const ability = this.loadout.getAbilityDetails(p.type, elemKey);
            const count = elemCounts[elemKey] || 1;

            const card = document.createElement('div');
            card.className = 'army-piece-card';
            card.style.setProperty('--card-element-glow', elemMeta.color);
            card.style.borderColor = `rgba(${this.hexToRgb(elemMeta.color)}, 0.35)`;

            card.innerHTML = `
                <div class="piece-card-header">
                    <span class="piece-card-title">${p.name}</span>
                    <span class="piece-card-elem-badge" style="color: ${elemMeta.color}; border-color: ${elemMeta.color}; background: rgba(${this.hexToRgb(elemMeta.color)}, 0.12);">
                        ${elemMeta.svg} <span>${elemMeta.name}</span>
                    </span>
                </div>
                <div class="piece-card-preview-stage">
                    <div class="piece-card-svg">${this.ui.getPieceSVG(p.type, color)}</div>
                </div>
                <div class="piece-card-info">
                    <div class="piece-card-attack-name" style="color: ${elemMeta.color};">${ability.name}</div>
                    <div class="piece-card-fx-row">
                        <span class="piece-card-fx-label">Move:</span>
                        <span>${ability.motionTrail}</span>
                    </div>
                    <div class="piece-card-fx-row">
                        <span class="piece-card-fx-label">Capture:</span>
                        <span>${ability.impact}</span>
                    </div>
                    <div class="piece-card-synergy-tag">
                        Synergy: ${elemMeta.name} ${count} / 6
                    </div>
                </div>
                <div class="piece-card-actions">
                    <button type="button" class="btn-card-change-elem" data-piece="${p.type}">
                        CHANGE ELEMENT
                    </button>
                    <button type="button" class="btn-card-preview" data-piece="${p.type}">
                        PREVIEW
                    </button>
                </div>
            `;

            card.querySelector('.btn-card-change-elem')?.addEventListener('click', () => {
                this.audio.playUiClick();
                this.openCustomizationDrawer(p.type);
            });

            card.querySelector('.btn-card-preview')?.addEventListener('click', () => {
                this.audio.playUiClick();
                this.openLivePreviewDrawer(p.type);
            });

            grid.appendChild(card);
        });
    }

    renderSynergiesBreakdown() {
        const container = document.getElementById('loadout-synergies-breakdown');
        if (!container) return;

        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const syn = this.loadout.calculateElementSynergies(activeLoadout);

        const breakdown = Object.entries(syn.elementCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([elemKey, count]) => {
                const meta = this.loadout.getElementMeta(elemKey);
                return `
                    <span class="saved-army-elem-pill" style="color: ${meta.color}; border-color: ${meta.color}; background: rgba(${this.hexToRgb(meta.color)}, 0.1);">
                        ${meta.name}: ${count}/6
                    </span>
                `;
            }).join('');

        container.innerHTML = `
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-gold); margin-bottom: 0.25rem;">
                ACTIVE SYNERGIES & BALANCE
            </div>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                ${breakdown}
            </div>
        `;
    }

    openCustomizationDrawer(pieceType) {
        const drawer = document.getElementById('drawer-piece-customize');
        if (!drawer) return;

        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        const color = this.loadoutActiveSide === 'white' ? 'w' : 'b';
        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;

        const nameEl = document.getElementById('customize-target-piece-name');
        const svgEl = document.getElementById('customize-target-piece-svg');
        const grid = document.getElementById('custom-elem-options-grid');

        if (nameEl) nameEl.textContent = `CUSTOMIZE ${pieceNames[pieceType].toUpperCase()}`;
        if (svgEl) svgEl.innerHTML = this.ui.getPieceSVG(pieceType, color);

        if (grid) {
            grid.innerHTML = '';
            Object.values(ELEMENTS).forEach(elem => {
                const btn = document.createElement('button');
                btn.type = 'button';
                const isSelected = activeLoadout[pieceType] === elem.id;
                btn.className = `custom-elem-btn ${isSelected ? 'active' : ''}`;
                btn.style.color = elem.color;

                btn.innerHTML = `
                    <div style="width: 22px; height: 22px;">${elem.svg}</div>
                    <span style="font-size: 0.68rem; font-weight: 700;">${elem.name}</span>
                `;

                btn.addEventListener('click', () => {
                    this.audio.playElementSound(elem.id);
                    activeLoadout[pieceType] = elem.id;
                    this.loadout.saveLoadouts();
                    this.renderLoadoutAll();
                    this.openCustomizationDrawer(pieceType);
                });

                grid.appendChild(btn);
            });
        }

        drawer.classList.remove('hidden');
    }

    openLivePreviewDrawer(pieceType) {
        const drawer = document.getElementById('drawer-live-preview');
        if (!drawer) return;

        this.previewActivePiece = pieceType;
        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const elemKey = activeLoadout[pieceType] || 'lightning';
        const elemMeta = this.loadout.getElementMeta(elemKey);
        const ability = this.loadout.getAbilityDetails(pieceType, elemKey);
        const color = this.loadoutActiveSide === 'white' ? 'w' : 'b';

        const heroPieceName = document.getElementById('preview-hero-piece-name');
        const heroElemName = document.getElementById('preview-hero-elem-name');
        const heroAttackName = document.getElementById('preview-hero-attack-name');
        const attackerActor = document.getElementById('preview-actor-attacker');

        if (heroPieceName) heroPieceName.textContent = pieceNames[pieceType].toUpperCase();
        if (heroElemName) {
            heroElemName.textContent = elemMeta.name.toUpperCase();
            heroElemName.style.color = elemMeta.color;
        }
        if (heroAttackName) {
            heroAttackName.textContent = ability.name;
            heroAttackName.style.color = elemMeta.color;
            heroAttackName.style.textShadow = `0 0 14px ${elemMeta.color}`;
        }

        if (attackerActor) {
            attackerActor.innerHTML = `
                <div class="preview-actor-svg" style="--actor-glow: ${elemMeta.color};">
                    ${this.ui.getPieceSVG(pieceType, color)}
                </div>
                <span class="preview-actor-label">${pieceNames[pieceType]}</span>
            `;
        }

        drawer.classList.remove('hidden');
        this.runDedicatedPreview(pieceType);
    }

    resetDedicatedPreview() {
        if (this.previewAnimationTimer) {
            clearTimeout(this.previewAnimationTimer);
            this.previewAnimationTimer = null;
        }
        const canvas = document.getElementById('preview-live-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const attackerBox = document.getElementById('preview-actor-attacker');
        if (attackerBox) attackerBox.style.transform = 'translateX(0) scale(1)';
        const dummyBox = document.getElementById('preview-actor-dummy');
        if (dummyBox) dummyBox.style.transform = 'translateX(0) scale(1)';
    }

    runDedicatedPreview(pieceType, isReplay = false) {
        this.resetDedicatedPreview();

        const canvas = document.getElementById('preview-live-canvas');
        if (!canvas) return;

        // Size canvas to container
        canvas.width = canvas.offsetWidth || 500;
        canvas.height = canvas.offsetHeight || 220;
        const ctx = canvas.getContext('2d');

        const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
        const elemKey = activeLoadout[pieceType] || 'lightning';
        const elemMeta = this.loadout.getElementMeta(elemKey);
        const ability = this.loadout.getAbilityDetails(pieceType, elemKey);

        const speedMult = this.previewSlowMo ? 2.0 : 1.0;
        this.audio.playElementSound(elemKey);
        this.effects.showAttackName(`${elemMeta.name.toUpperCase()} • ${ability.name}`);

        const attackerBox = document.getElementById('preview-actor-attacker');
        const dummyBox = document.getElementById('preview-actor-dummy');

        // Step 1: Piece motion & trail
        if (attackerBox) {
            attackerBox.style.transition = `transform ${0.28 * speedMult}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
            attackerBox.style.transform = 'translateX(110px) scale(1.18)';
        }

        // Draw particle trail on canvas
        const startX = canvas.width * 0.25;
        const endX = canvas.width * 0.72;
        const centerY = canvas.height * 0.5;

        for (let i = 0; i < 28; i++) {
            const t = i / 28;
            const x = startX + (endX - startX) * t;
            const y = centerY + (Math.sin(t * Math.PI * 3) * 16);
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = elemMeta.color;
            ctx.shadowColor = elemMeta.color;
            ctx.shadowBlur = 8;
            ctx.fill();
        }

        // Step 2: Impact on Crystal Target Dummy
        this.previewAnimationTimer = setTimeout(() => {
            if (dummyBox) {
                dummyBox.style.transition = `transform ${0.12 * speedMult}s ease-out`;
                dummyBox.style.transform = 'translateX(18px) scale(0.92)';
                setTimeout(() => {
                    dummyBox.style.transform = 'translateX(0) scale(1)';
                }, 180 * speedMult);
            }

            // Draw impact burst
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 36; i++) {
                const angle = (Math.PI * 2 * i) / 36;
                const r = 25 + Math.random() * 55;
                ctx.beginPath();
                ctx.arc(endX + Math.cos(angle) * r, centerY + Math.sin(angle) * r, 2.5 + Math.random() * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = elemMeta.color;
                ctx.shadowColor = elemMeta.color;
                ctx.shadowBlur = 12;
                ctx.fill();
            }

            if (attackerBox) {
                attackerBox.style.transform = 'translateX(0) scale(1)';
            }

            // Cleanup canvas
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 450 * speedMult);
        }, 220 * speedMult);
    }

    renderSavedArmiesList() {
        const container = document.getElementById('saved-armies-list-container');
        if (!container) return;

        const armies = this.loadout.getSavedArmies();
        container.innerHTML = '';

        armies.forEach(army => {
            const card = document.createElement('div');
            card.className = `saved-army-card ${army.isFavorite ? 'active' : ''}`;

            const pills = Object.entries(army.loadout).map(([p, el]) => {
                const meta = this.loadout.getElementMeta(el);
                return `<span class="saved-army-elem-pill" style="color: ${meta.color}; border-color: ${meta.color};">${p.toUpperCase()}: ${meta.name}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="saved-army-card-header">
                    <span class="saved-army-name">${army.name.toUpperCase()}</span>
                    <button type="button" class="saved-army-fav-btn ${army.isFavorite ? 'is-fav' : ''}" title="Toggle Favorite for Quick Match">
                        ★
                    </button>
                </div>
                <div class="saved-army-pieces-row">
                    ${pills}
                </div>
                <div class="saved-army-actions">
                    <button type="button" class="btn-army-action btn-use">USE</button>
                    <button type="button" class="btn-army-action btn-rename">RENAME</button>
                    <button type="button" class="btn-army-action btn-delete">DELETE</button>
                </div>
            `;

            card.querySelector('.saved-army-fav-btn')?.addEventListener('click', () => {
                this.audio.playUiClick();
                this.loadout.setFavoriteArmy(army.id);
                this.renderSavedArmiesList();
                this.effects.showAttackName(`FAVORITE: ${army.name.toUpperCase()}`);
            });

            card.querySelector('.btn-use')?.addEventListener('click', () => {
                this.audio.playUiClick();
                if (this.loadoutActiveSide === 'white') {
                    this.loadout.whiteLoadout = { ...army.loadout };
                } else {
                    this.loadout.blackLoadout = { ...army.loadout };
                }
                this.loadout.saveLoadouts();
                this.renderLoadoutAll();
                document.getElementById('drawer-saved-armies')?.classList.add('hidden');
                this.effects.showAttackName(`EQUIPPED: ${army.name.toUpperCase()}`);
            });

            card.querySelector('.btn-rename')?.addEventListener('click', () => {
                this.audio.playUiClick();
                const newName = prompt('Enter new name for this army:', army.name);
                if (newName && newName.trim()) {
                    this.loadout.renameArmy(army.id, newName.trim());
                    this.renderSavedArmiesList();
                }
            });

            card.querySelector('.btn-delete')?.addEventListener('click', () => {
                this.audio.playUiClick();
                if (confirm(`Delete loadout "${army.name}"?`)) {
                    this.loadout.deleteArmy(army.id);
                    this.renderSavedArmiesList();
                }
            });

            container.appendChild(card);
        });
    }

    /**
     * ==========================================================================
     * ELEMENT LABORATORY & EFFECT PREVIEW SYSTEM (Specs 7 - 19, 51 - 82)
     * ==========================================================================
     */
    initLaboratoryModal() {
        // Lab Sandbox State
        this.labState = {
            pieceType: 'n',
            element: 'lightning',
            targetType: 'crystal',
            targetElement: 'ice',
            action: 'capture',
            intensity: 'HIGH',
            slowMo: false,
            sound: true
        };

        // 1. Tab Switching (Sandbox, Promo Lab, Compare Mode, 60-Combo Gallery)
        document.querySelectorAll('.lab-tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.lab-tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetTab = tab.dataset.labTab;
                document.querySelectorAll('.lab-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`lab-tab-${targetTab}`)?.classList.remove('hidden');

                if (targetTab === 'sandbox') this.renderLabSandboxStage();
                if (targetTab === 'promo') this.renderPromotionLabWorkspace();
                if (targetTab === 'compare') this.renderCompareModeStage();
                if (targetTab === 'gallery') this.renderEffectGallery('all');
            });
        });

        // 2. Action Selector Bar (Idle Aura, Move, Capture, Check, Checkmate)
        document.querySelectorAll('.btn-lab-action').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-lab-action').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.labState.action = btn.dataset.action;
                this.renderLabSandboxStage();
            });
        });

        // 3. Stage Action Controls (Play, Replay, Reset, Slow Motion, Intensity)
        document.getElementById('btn-lab-play')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runLabAction();
        });

        document.getElementById('btn-lab-replay')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.runLabAction();
        });

        document.getElementById('btn-lab-reset')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.resetLabSandboxStage();
        });

        const slowMoBtn = document.getElementById('btn-lab-slowmo');
        slowMoBtn?.addEventListener('click', () => {
            this.labState.slowMo = !this.labState.slowMo;
            slowMoBtn.classList.toggle('active', this.labState.slowMo);
            slowMoBtn.textContent = this.labState.slowMo ? 'SLOW MO (0.5x)' : 'SLOW MOTION';
            this.audio.playUiClick();
        });

        const intensityBtn = document.getElementById('btn-lab-intensity');
        intensityBtn?.addEventListener('click', () => {
            const next = this.labState.intensity === 'HIGH' ? 'LOW' : (this.labState.intensity === 'LOW' ? 'MEDIUM' : 'HIGH');
            this.labState.intensity = next;
            intensityBtn.textContent = `INTENSITY: ${next}`;
            this.audio.playUiClick();
        });

        // 4. Target Dummy Type Selector (Crystal, Pawn, Knight, King)
        document.querySelectorAll('.btn-target-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                document.querySelectorAll('.btn-target-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.labState.targetType = btn.dataset.targetType;
                this.renderLabSandboxStage();
            });
        });

        // 5. Random Defender Element
        document.getElementById('btn-random-target-elem')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const keys = Object.keys(ELEMENTS);
            this.labState.targetElement = keys[Math.floor(Math.random() * keys.length)];
            this.renderLabTargetElements();
            this.renderLabSandboxStage();
        });

        // 6. Integration Buttons (Use in Loadout, Favorite Effect)
        document.getElementById('btn-lab-use-in-loadout')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const activeLoadout = this.loadoutActiveSide === 'white' ? this.loadout.whiteLoadout : this.loadout.blackLoadout;
            activeLoadout[this.labState.pieceType] = this.labState.element;
            this.loadout.saveLoadouts();
            this.effects.showAttackName(`ASSIGNED ${this.labState.element.toUpperCase()} TO ${this.labState.pieceType.toUpperCase()} IN LOADOUT`);
        });

        document.getElementById('btn-lab-fav-effect')?.addEventListener('click', () => {
            this.audio.playUiClick();
            const isFav = this.loadout.toggleFavoriteEffect(this.labState.pieceType, this.labState.element);
            const btn = document.getElementById('btn-lab-fav-effect');
            if (btn) btn.textContent = isFav ? '★ FAVORITE EFFECT' : '☆ FAVORITE EFFECT';
            this.effects.showAttackName(isFav ? 'MARKED AS FAVORITE' : 'REMOVED FAVORITE');
        });

        // 7. Developer HUD Drawer & Benchmark (Specs 52 - 54)
        document.getElementById('btn-toggle-dev-tools')?.addEventListener('click', () => {
            const drawer = document.getElementById('drawer-dev-tools');
            drawer?.classList.toggle('hidden');
        });

        document.getElementById('btn-run-perf-benchmark')?.addEventListener('click', () => {
            this.runPerformanceBenchmark();
        });
    }

    openLaboratoryModal() {
        const modal = document.getElementById('modal-laboratory');
        if (!modal) return;

        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'modal-laboratory') m.classList.remove('active');
        });

        this.renderLabAttackerPieces();
        this.renderLabElements();
        this.renderLabTargetElements();
        this.renderLabSandboxStage();
        this.renderRecentlyTestedChips();
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
            btn.className = `btn-lab-piece-chip ${p.type === this.labState.pieceType ? 'active' : ''}`;
            btn.innerHTML = `
                <div class="lab-chip-svg">${this.ui.getPieceSVG(p.type, 'w')}</div>
                <span>${p.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labState.pieceType = p.type;
                this.renderLabAttackerPieces();
                this.renderLabSandboxStage();
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
            const isSelected = elem.id === this.labState.element;
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
                this.labState.element = elem.id;
                this.renderLabElements();
                this.renderLabSandboxStage();
            });
            grid.appendChild(btn);
        });
    }

    renderLabTargetElements() {
        const container = document.getElementById('lab-target-element-chips');
        if (!container) return;

        container.innerHTML = '';
        Object.values(ELEMENTS).forEach(elem => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isSelected = elem.id === this.labState.targetElement;
            btn.className = `btn-promo-chip ${isSelected ? 'active' : ''}`;
            btn.style.color = elem.color;
            btn.textContent = elem.name;

            btn.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labState.targetElement = elem.id;
                this.renderLabTargetElements();
                this.renderLabSandboxStage();
            });

            container.appendChild(btn);
        });
    }

    renderLabSandboxStage() {
        const attackerActor = document.getElementById('lab-actor-attacker');
        const targetActor = document.getElementById('lab-actor-target');
        const elemMeta = this.loadout.getElementMeta(this.labState.element);
        const ability = this.loadout.getAbilityDetails(this.labState.pieceType, this.labState.element);
        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

        // Render attacker
        if (attackerActor) {
            attackerActor.innerHTML = `
                <div class="preview-actor-svg" style="--actor-glow: ${elemMeta.color};">
                    ${this.ui.getPieceSVG(this.labState.pieceType, 'w')}
                </div>
                <span class="preview-actor-label">${pieceNames[this.labState.pieceType]} (${elemMeta.name})</span>
            `;
        }

        // Render defender target
        if (targetActor) {
            const defMeta = this.loadout.getElementMeta(this.labState.targetElement);
            if (this.labState.targetType === 'crystal') {
                targetActor.innerHTML = `
                    <svg viewBox="0 0 100 100" class="crystal-dummy-svg" style="filter: drop-shadow(0 0 12px ${defMeta.color});">
                        <polygon points="50,10 85,35 85,65 50,90 15,65 15,35" fill="none" stroke="${defMeta.color}" stroke-width="3"/>
                        <polygon points="50,22 75,40 75,60 50,78 25,60 25,40" fill="${defMeta.color}" fill-opacity="0.35"/>
                        <circle cx="50" cy="50" r="10" fill="${defMeta.color}"/>
                    </svg>
                    <span class="preview-actor-label">CRYSTAL (${defMeta.name})</span>
                `;
            } else {
                targetActor.innerHTML = `
                    <div class="preview-actor-svg" style="--actor-glow: ${defMeta.color};">
                        ${this.ui.getPieceSVG(this.labState.targetType, 'b')}
                    </div>
                    <span class="preview-actor-label">${pieceNames[this.labState.targetType]} (${defMeta.name})</span>
                `;
            }
        }

        // Update Reaction Clash Banner (Specs 20 - 32)
        const reaction = this.effects.getElementReaction(this.labState.element, this.labState.targetElement);
        const rxTitle = document.getElementById('lab-reaction-title');
        const rxFx = document.getElementById('lab-reaction-fx');
        if (rxTitle) rxTitle.textContent = reaction.name;
        if (rxFx) rxFx.textContent = reaction.desc;

        // Update Favorite effect button
        const favBtn = document.getElementById('btn-lab-fav-effect');
        if (favBtn) {
            const isFav = this.loadout.isFavoriteEffect(this.labState.pieceType, this.labState.element);
            favBtn.textContent = isFav ? '★ FAVORITE EFFECT' : '☆ FAVORITE EFFECT';
        }

        // Reset canvas
        this.resetLabSandboxStage();
    }

    resetLabSandboxStage() {
        const canvas = document.getElementById('lab-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const attackerActor = document.getElementById('lab-actor-attacker');
        if (attackerActor) attackerActor.style.transform = 'translateX(0) scale(1)';
        const targetActor = document.getElementById('lab-actor-target');
        if (targetActor) targetActor.style.transform = 'translateX(0) scale(1)';
    }

    runLabAction() {
        this.resetLabSandboxStage();
        this.loadout.addRecentlyTested(this.labState.pieceType, this.labState.element);
        this.renderRecentlyTestedChips();

        const canvas = document.getElementById('lab-canvas');
        if (!canvas) return;

        canvas.width = canvas.offsetWidth || 560;
        canvas.height = canvas.offsetHeight || 220;
        const ctx = canvas.getContext('2d');

        const speedMult = this.labState.slowMo ? 2.0 : 1.0;
        const elemMeta = this.loadout.getElementMeta(this.labState.element);
        const ability = this.loadout.getAbilityDetails(this.labState.pieceType, this.labState.element);
        const attackerActor = document.getElementById('lab-actor-attacker');
        const targetActor = document.getElementById('lab-actor-target');

        this.audio.playElementSound(this.labState.element);
        this.effects.showAttackName(`${elemMeta.name.toUpperCase()} • ${ability.name}`);

        const startX = canvas.width * 0.22;
        const endX = canvas.width * 0.75;
        const centerY = canvas.height * 0.5;

        // Switch based on action (Specs 11 - 16)
        if (this.labState.action === 'idle') {
            // Idle Aura demonstration (Spec 12)
            for (let i = 0; i < 24; i++) {
                const angle = (Math.PI * 2 * i) / 24;
                const r = 28 + Math.random() * 15;
                ctx.beginPath();
                ctx.arc(startX + Math.cos(angle) * r, centerY + Math.sin(angle) * r, 2.5 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fillStyle = elemMeta.color;
                ctx.shadowColor = elemMeta.color;
                ctx.shadowBlur = 10;
                ctx.fill();
            }
            setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1200 * speedMult);
        } else if (this.labState.action === 'move') {
            // Movement trail demonstration (Spec 13)
            if (attackerActor) {
                attackerActor.style.transition = `transform ${0.35 * speedMult}s ease-out`;
                attackerActor.style.transform = 'translateX(65px)';
            }
            for (let i = 0; i < 30; i++) {
                const t = i / 30;
                const x = startX + 65 * t;
                const y = centerY + Math.sin(t * Math.PI * 2) * 12;
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = elemMeta.color;
                ctx.fill();
            }
            setTimeout(() => {
                if (attackerActor) attackerActor.style.transform = 'translateX(0)';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }, 750 * speedMult);
        } else if (this.labState.action === 'check') {
            // Check warning effect test (Spec 15)
            ctx.strokeStyle = elemMeta.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(endX - 35, centerY - 35, 70, 70);
            ctx.shadowColor = elemMeta.color;
            ctx.shadowBlur = 15;
            setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1000 * speedMult);
        } else if (this.labState.action === 'checkmate') {
            // Checkmate finisher effect test (Spec 16)
            this.effects.showAttackName(`FINISHER: ${elemMeta.name.toUpperCase()} EXECUTION!`);
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = 20 + Math.random() * 80;
                ctx.beginPath();
                ctx.arc(endX + Math.cos(angle) * r, centerY + Math.sin(angle) * r, 3 + Math.random() * 4, 0, Math.PI * 2);
                ctx.fillStyle = elemMeta.color;
                ctx.shadowColor = elemMeta.color;
                ctx.shadowBlur = 14;
                ctx.fill();
            }
            setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 1400 * speedMult);
        } else {
            // Standard Capture with Element Reaction Clash (Specs 14, 20 - 32)
            if (attackerActor) {
                attackerActor.style.transition = `transform ${0.25 * speedMult}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
                attackerActor.style.transform = 'translateX(110px) scale(1.15)';
            }

            // Motion trail
            for (let i = 0; i < 28; i++) {
                const t = i / 28;
                const x = startX + (endX - startX) * t;
                const y = centerY + Math.sin(t * Math.PI * 3) * 14;
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = elemMeta.color;
                ctx.fill();
            }

            setTimeout(() => {
                if (targetActor) {
                    targetActor.style.transition = `transform ${0.12 * speedMult}s ease-out`;
                    targetActor.style.transform = 'translateX(20px) scale(0.9)';
                    setTimeout(() => {
                        targetActor.style.transform = 'translateX(0) scale(1)';
                    }, 180 * speedMult);
                }

                // Element vs Element reaction clash on canvas
                const reaction = this.effects.getElementReaction(this.labState.element, this.labState.targetElement);
                this.effects.playElementReactionFX(reaction, endX, centerY, this.labState.intensity === 'HIGH');

                if (attackerActor) {
                    attackerActor.style.transform = 'translateX(0) scale(1)';
                }

                setTimeout(() => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }, 500 * speedMult);
            }, 200 * speedMult);
        }
    }

    renderRecentlyTestedChips() {
        const container = document.getElementById('lab-recent-chips-container');
        if (!container) return;

        const recents = this.loadout.getRecentlyTested();
        container.innerHTML = '';

        recents.forEach(item => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'btn-promo-chip';
            chip.textContent = `${item.piece.toUpperCase()} + ${item.element.toUpperCase()}`;

            chip.addEventListener('click', () => {
                this.audio.playUiClick();
                this.labState.pieceType = item.piece;
                this.labState.element = item.element;
                this.renderLabAttackerPieces();
                this.renderLabElements();
                this.renderLabSandboxStage();
            });

            container.appendChild(chip);
        });
    }

    renderPromotionLabWorkspace() {
        // Setup chips for Promotion Lab (Specs 17 - 19)
        const pawnElemsContainer = document.getElementById('promo-pawn-elem-chips');
        const targetPiecesContainer = document.getElementById('promo-target-piece-chips');
        const newElemsContainer = document.getElementById('promo-new-elem-chips');
        const stylesContainer = document.getElementById('promo-style-chips');

        this.promoLabState = this.promoLabState || {
            pawnElem: 'fire',
            targetPiece: 'q',
            newElem: 'shadow',
            style: 'Dark Awakening'
        };

        if (pawnElemsContainer) {
            pawnElemsContainer.innerHTML = '';
            Object.values(ELEMENTS).forEach(el => {
                const btn = document.createElement('button');
                btn.className = `btn-promo-chip ${el.id === this.promoLabState.pawnElem ? 'active' : ''}`;
                btn.style.color = el.color;
                btn.textContent = el.name;
                btn.addEventListener('click', () => {
                    this.audio.playUiClick();
                    this.promoLabState.pawnElem = el.id;
                    this.renderPromotionLabWorkspace();
                });
                pawnElemsContainer.appendChild(btn);
            });
        }

        if (targetPiecesContainer) {
            targetPiecesContainer.innerHTML = '';
            ['q', 'r', 'b', 'n'].forEach(p => {
                const names = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };
                const btn = document.createElement('button');
                btn.className = `btn-promo-chip ${p === this.promoLabState.targetPiece ? 'active' : ''}`;
                btn.textContent = names[p];
                btn.addEventListener('click', () => {
                    this.audio.playUiClick();
                    this.promoLabState.targetPiece = p;
                    this.renderPromotionLabWorkspace();
                });
                targetPiecesContainer.appendChild(btn);
            });
        }

        if (newElemsContainer) {
            newElemsContainer.innerHTML = '';
            Object.values(ELEMENTS).forEach(el => {
                const btn = document.createElement('button');
                btn.className = `btn-promo-chip ${el.id === this.promoLabState.newElem ? 'active' : ''}`;
                btn.style.color = el.color;
                btn.textContent = el.name;
                btn.addEventListener('click', () => {
                    this.audio.playUiClick();
                    this.promoLabState.newElem = el.id;
                    this.renderPromotionLabWorkspace();
                });
                newElemsContainer.appendChild(btn);
            });
        }

        if (stylesContainer) {
            stylesContainer.innerHTML = '';
            ['Elemental Ascension', 'Royal Ascension', 'Arcane Transformation', 'Celestial Awakening', 'Dark Awakening'].forEach(st => {
                const btn = document.createElement('button');
                btn.className = `btn-promo-chip ${st === this.promoLabState.style ? 'active' : ''}`;
                btn.textContent = st;
                btn.addEventListener('click', () => {
                    this.audio.playUiClick();
                    this.promoLabState.style = st;
                    this.renderPromotionLabWorkspace();
                });
                stylesContainer.appendChild(btn);
            });
        }

        document.getElementById('btn-play-promo-ascension')?.addEventListener('click', () => {
            this.audio.playUiClick();
            this.effects.showAttackName(`ASCENSION: ${this.promoLabState.style.toUpperCase()}`);
            this.effects.playPawnAscensionSequence({
                pawnSq: 'e7',
                promoPiece: this.promoLabState.targetPiece,
                chosenElement: this.promoLabState.newElem,
                ascensionStyle: this.promoLabState.style,
                color: 'w',
                isFlipped: false
            });
        });
    }

    renderCompareModeStage() {
        this.compareLeftElem = this.compareLeftElem || 'fire';
        this.compareRightElem = this.compareRightElem || 'lightning';
        this.comparePiece = this.comparePiece || 'n';

        const runLeft = () => {
            this.effects.showAttackName(`LEFT: ${this.compareLeftElem.toUpperCase()}`);
            this.audio.playElementSound(this.compareLeftElem);
        };

        const runRight = () => {
            this.effects.showAttackName(`RIGHT: ${this.compareRightElem.toUpperCase()}`);
            this.audio.playElementSound(this.compareRightElem);
        };

        document.getElementById('btn-compare-left')?.addEventListener('click', () => {
            this.audio.playUiClick();
            runLeft();
        });

        document.getElementById('btn-compare-right')?.addEventListener('click', () => {
            this.audio.playUiClick();
            runRight();
        });

        document.getElementById('btn-compare-both')?.addEventListener('click', () => {
            this.audio.playUiClick();
            runLeft();
            setTimeout(() => runRight(), 800);
        });
    }

    runPerformanceBenchmark() {
        const resultEl = document.getElementById('perf-benchmark-result');
        if (resultEl) resultEl.textContent = 'Running benchmark...';

        const start = performance.now();
        let frameCount = 0;
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 300;
        testCanvas.height = 300;
        const ctx = testCanvas.getContext('2d');

        const step = () => {
            for (let i = 0; i < 150; i++) {
                ctx.beginPath();
                ctx.arc(150 + Math.sin(i) * 60, 150 + Math.cos(i) * 60, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#d4af37';
                ctx.fill();
            }
            frameCount++;
            if (performance.now() - start < 1000) {
                requestAnimationFrame(step);
            } else {
                const fps = Math.round(frameCount);
                const rec = fps >= 50 ? 'HIGH' : (fps >= 30 ? 'MEDIUM' : 'LOW');
                if (resultEl) {
                    resultEl.textContent = `FPS: ${fps} • Recommended: ${rec}`;
                    resultEl.style.color = '#38bdf8';
                }
            }
        };
        requestAnimationFrame(step);
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
                this.labState.pieceType = combo.pieceType;
                this.labState.element = combo.elementKey;

                // Switch to sandbox tab
                document.querySelectorAll('.lab-tab-btn').forEach(t => t.classList.remove('active'));
                document.querySelector('[data-lab-tab="sandbox"]')?.classList.add('active');
                document.querySelectorAll('.lab-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById('lab-tab-sandbox')?.classList.remove('hidden');

                this.renderLabAttackerPieces();
                this.renderLabElements();
                this.renderLabSandboxStage();
                setTimeout(() => this.runLabAction(), 200);
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
