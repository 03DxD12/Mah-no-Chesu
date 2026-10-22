/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/ui.js - Board Rendering, Inline SVG Pieces, Keyboard Navigation & Modal Controllers
 */

class UIManager {
    constructor(engine, effects, audio, settings) {
        this.engine = engine;
        this.effects = effects;
        this.audio = audio;
        this.settings = settings;

        this.boardEl = document.getElementById('chess-board');
        this.boardWrapper = document.getElementById('board-wrapper');
        this.historyBody = document.getElementById('move-history-body');
        this.historyScroll = document.getElementById('history-scroll-container');
        this.moveCountBadge = document.getElementById('move-count-badge');
        this.srAnnounce = document.getElementById('sr-announcements');

        this.whiteCapturedList = document.getElementById('white-captured-pieces');
        this.blackCapturedList = document.getElementById('black-captured-pieces');

        this.whitePlayerCard = document.getElementById('player-white-card');
        this.blackPlayerCard = document.getElementById('player-black-card');
        this.whiteTurnGem = document.getElementById('white-turn-indicator');
        this.blackTurnGem = document.getElementById('black-turn-indicator');

        this.gameStatusText = document.getElementById('game-status-text');
        this.thinkingSpinner = document.getElementById('ai-thinking-spinner');

        // State
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.lastMove = null;
        this.isFlipped = false;
        this.focusedSquare = 0; // for keyboard navigation

        // Callbacks hooked by main.js
        this.onPlayerMoveRequest = null; // (move) => Promise<void>
        this.onUndoRequest = null;
        this.onRestartRequest = null;
        this.onDrawOfferRequest = null;
        this.onResignRequest = null;

        this.initDOM();
        this.initKeyboardControls();
    }

    /**
     * Vector SVG definitions for chess pieces (Asset-Free, Consistent Rendering)
     */
    getPieceSVG(type, color) {
        const isWhite = color === 'w';
        const fill = isWhite ? 'url(#whitePieceGrad)' : 'url(#blackPieceGrad)';
        const stroke = isWhite ? '#cbd5e1' : '#475569';
        const aura = isWhite ? '#fef08a' : '#c084fc';

        const defs = `
            <defs>
                <linearGradient id="whitePieceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="60%" stop-color="#e2e8f0"/>
                    <stop offset="100%" stop-color="#94a3b8"/>
                </linearGradient>
                <linearGradient id="blackPieceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#334155"/>
                    <stop offset="50%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#090d16"/>
                </linearGradient>
            </defs>
        `;

        let paths = '';
        switch (type) {
            case 'p': // Pawn - Fire Core
                paths = `
                    <circle cx="25" cy="14" r="7" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <path d="M17 38 C17 28 33 28 33 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <rect x="13" y="38" width="24" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="10" y="42" width="30" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
            case 'n': // Knight - Lightning Core
                paths = `
                    <path d="M14 42 L36 42 L36 38 C36 34 33 32 30 30 C33 28 35 23 34 18 C33 13 28 10 24 10 C21 10 19 12 18 14 C17 12 15 11 13 13 C11 15 12 19 13 21 C11 23 11 27 13 30 L16 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <circle cx="21" cy="19" r="1.5" fill="${aura}"/>
                    <rect x="11" y="42" width="28" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
            case 'b': // Bishop - Wind Core
                paths = `
                    <circle cx="25" cy="10" r="3" fill="${aura}"/>
                    <path d="M18 38 C17 24 33 24 32 38 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <path d="M25 15 L25 34 M20 22 L30 22" stroke="${stroke}" stroke-width="1.5"/>
                    <rect x="14" y="38" width="22" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="11" y="42" width="28" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
            case 'r': // Rook - Earth Core
                paths = `
                    <path d="M14 16 L14 20 L17 20 L17 16 L21 16 L21 20 L25 20 L25 16 L29 16 L29 20 L33 20 L33 16 L36 16 L34 26 L16 26 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <path d="M16 26 L17 38 L33 38 L34 26 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <rect x="13" y="38" width="24" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="10" y="42" width="30" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
            case 'q': // Queen - Ice / Arcane Core
                paths = `
                    <circle cx="12" cy="14" r="2.5" fill="${aura}"/>
                    <circle cx="18" cy="11" r="2.5" fill="${aura}"/>
                    <circle cx="25" cy="9" r="3" fill="${aura}"/>
                    <circle cx="32" cy="11" r="2.5" fill="${aura}"/>
                    <circle cx="38" cy="14" r="2.5" fill="${aura}"/>
                    <path d="M12 17 L16 34 L34 34 L38 17 L30 25 L25 14 L20 25 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <rect x="14" y="34" width="22" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="11" y="38" width="28" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="9" y="42" width="32" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
            case 'k': // King - Sacred Light Core
                paths = `
                    <path d="M23 6 L27 6 L27 9 L30 9 L30 13 L27 13 L27 16 L23 16 L23 13 L20 13 L20 9 L23 9 Z" fill="${aura}" stroke="${stroke}" stroke-width="1"/>
                    <path d="M15 19 C18 17 32 17 35 19 C37 28 35 34 33 36 L17 36 C15 34 13 28 15 19 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
                    <circle cx="25" cy="27" r="3" fill="${aura}"/>
                    <rect x="13" y="36" width="24" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                    <rect x="10" y="40" width="30" height="4" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
                `;
                break;
        }

        return `<svg viewBox="0 0 50 50" class="piece-svg">${defs}${paths}</svg>`;
    }

    initDOM() {
        // Build 64 squares in the board
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const sqEl = document.createElement('div');
            sqEl.className = 'square';
            sqEl.dataset.square = i;
            sqEl.setAttribute('role', 'gridcell');
            sqEl.setAttribute('tabindex', '-1');

            sqEl.addEventListener('click', () => this.handleSquareClick(parseInt(sqEl.dataset.square, 10)));
            this.boardEl.appendChild(sqEl);
        }

        // Action Buttons
        document.getElementById('btn-flip')?.addEventListener('click', () => this.toggleFlip());
        document.getElementById('btn-undo')?.addEventListener('click', () => this.onUndoRequest && this.onUndoRequest());
        document.getElementById('btn-restart')?.addEventListener('click', () => this.onRestartRequest && this.onRestartRequest());
        document.getElementById('btn-draw')?.addEventListener('click', () => this.onDrawOfferRequest && this.onDrawOfferRequest());
        document.getElementById('btn-resign')?.addEventListener('click', () => this.onResignRequest && this.onResignRequest());
    }

    toggleFlip() {
        this.isFlipped = !this.isFlipped;
        this.audio.playUiClick();
        this.renderBoard();
        this.effects.initCanvasSize();
    }

    setFlipped(flipped) {
        if (this.isFlipped !== flipped) {
            this.isFlipped = flipped;
            this.renderBoard();
            this.effects.initCanvasSize();
        }
    }

    /**
     * Render entire board according to engine state and flipped status
     */
    renderBoard() {
        const board = this.engine.board;
        const kingInCheckSq = this.engine.isKingInCheck(this.engine.turn) ? this.engine.findKing(this.engine.turn) : -1;

        for (let visualIdx = 0; visualIdx < 64; visualIdx++) {
            const visualRow = Math.floor(visualIdx / 8);
            const visualCol = visualIdx % 8;

            const rank = this.isFlipped ? visualRow : (7 - visualRow);
            const file = this.isFlipped ? (7 - visualCol) : visualCol;
            const sq = rank * 8 + file;

            const sqEl = this.boardEl.children[visualIdx];
            sqEl.dataset.square = sq;

            // Square coloring (light / dark)
            const isLight = (file + rank) % 2 !== 0;
            sqEl.className = `square ${isLight ? 'light' : 'dark'}`;

            // Coordinates
            let coordHTML = '';
            if (visualRow === 7) {
                const fileLetter = String.fromCharCode('a'.charCodeAt(0) + file);
                coordHTML += `<span class="square-coord-file">${fileLetter}</span>`;
            }
            if (visualCol === 0) {
                coordHTML += `<span class="square-coord-rank">${rank + 1}</span>`;
            }

            // Piece
            const piece = board[sq];
            let pieceHTML = '';
            if (piece) {
                pieceHTML = `<div class="piece-svg-wrapper">${this.getPieceSVG(piece.type, piece.color)}</div>`;
            }

            sqEl.innerHTML = `${coordHTML}${pieceHTML}`;

            // Selection state
            if (this.selectedSquare === sq) {
                sqEl.classList.add('selected');
            }

            // Last move state
            if (this.lastMove && (this.lastMove.from === sq || this.lastMove.to === sq)) {
                sqEl.classList.add('last-move');
            }

            // King in check state
            if (sq === kingInCheckSq) {
                sqEl.classList.add('in-check');
            }

            // Accessibility label
            const fileLetter = String.fromCharCode('a'.charCodeAt(0) + file);
            const squareName = `${fileLetter}${rank + 1}`;
            if (piece) {
                const colorName = piece.color === 'w' ? 'White' : 'Black';
                const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
                sqEl.setAttribute('aria-label', `${colorName} ${pieceNames[piece.type]} on ${squareName}`);
            } else {
                sqEl.setAttribute('aria-label', `Empty square ${squareName}`);
            }
        }

        // Render legal move highlights
        this.renderMoveHints();
        this.updateActivePlayerIndicator();
    }

    renderMoveHints() {
        if (!this.settings.settings.moveHints || this.selectedSquare === null) return;

        for (let i = 0; i < this.legalMovesForSelected.length; i++) {
            const move = this.legalMovesForSelected[i];
            const targetSq = move.to;

            // Find visual element matching targetSq
            for (let v = 0; v < 64; v++) {
                const el = this.boardEl.children[v];
                if (parseInt(el.dataset.square, 10) === targetSq) {
                    const isCapture = !!(move.captured || move.isEnPassant || this.engine.board[targetSq]);
                    const marker = document.createElement('div');
                    marker.className = isCapture ? 'move-marker-ring' : 'move-marker-dot';
                    el.appendChild(marker);
                    break;
                }
            }
        }
    }

    handleSquareClick(sq) {
        if (this.isAnimating) return;

        const piece = this.engine.board[sq];

        // 1. If currently a piece is selected
        if (this.selectedSquare !== null) {
            // Clicking selected piece again deselects it
            if (this.selectedSquare === sq) {
                this.clearSelection();
                this.renderBoard();
                return;
            }

            // Check if clicking another friendly piece
            if (piece && piece.color === this.engine.turn) {
                this.selectSquare(sq);
                return;
            }

            // Check if clicked square is a legal destination
            const move = this.legalMovesForSelected.find(m => m.to === sq);
            if (move) {
                const chosenMove = { ...move };
                this.clearSelection();
                if (this.onPlayerMoveRequest) {
                    this.onPlayerMoveRequest(chosenMove);
                }
                return;
            }

            // Clicking an illegal empty square clears selection
            this.clearSelection();
            this.renderBoard();
            return;
        }

        // 2. No piece currently selected: select if piece belongs to active turn
        if (piece && piece.color === this.engine.turn) {
            this.selectSquare(sq);
        }
    }

    selectSquare(sq) {
        this.selectedSquare = sq;
        this.legalMovesForSelected = this.engine.getLegalMovesForSquare(sq);
        this.audio.playPieceSelect();
        this.renderBoard();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
    }

    updateActivePlayerIndicator() {
        const isWhiteTurn = this.engine.turn === 'w';
        if (this.whiteTurnGem && this.blackTurnGem) {
            this.whiteTurnGem.classList.toggle('active', isWhiteTurn);
            this.blackTurnGem.classList.toggle('active', !isWhiteTurn);
        }
        if (this.whitePlayerCard && this.blackPlayerCard) {
            this.whitePlayerCard.classList.toggle('turn-active', isWhiteTurn);
            this.blackPlayerCard.classList.toggle('turn-active', !isWhiteTurn);
        }
    }

    setStatus(text, isThinking = false) {
        if (this.gameStatusText) this.gameStatusText.textContent = text;
        if (this.thinkingSpinner) this.thinkingSpinner.classList.toggle('hidden', !isThinking);
    }

    announce(message) {
        if (this.srAnnounce) {
            this.srAnnounce.textContent = message;
        }
    }

    /**
     * Render Captured Pieces list
     */
    renderCapturedPieces() {
        if (!this.whiteCapturedList || !this.blackCapturedList) return;

        // Tally missing starting pieces
        const startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
        const currentWhite = { p: 0, n: 0, b: 0, r: 0, q: 0 };
        const currentBlack = { p: 0, n: 0, b: 0, r: 0, q: 0 };

        for (let i = 0; i < 64; i++) {
            const p = this.engine.board[i];
            if (p && p.type !== 'k') {
                if (p.color === 'w') currentWhite[p.type]++;
                else currentBlack[p.type]++;
            }
        }

        // Render pieces captured BY White (meaning black pieces captured)
        this.whiteCapturedList.innerHTML = '';
        ['q', 'r', 'b', 'n', 'p'].forEach(type => {
            const capturedCount = Math.max(0, startingCounts[type] - currentBlack[type]);
            for (let c = 0; c < capturedCount; c++) {
                const span = document.createElement('span');
                span.className = 'captured-icon';
                span.innerHTML = this.getPieceSVG(type, 'b');
                this.whiteCapturedList.appendChild(span);
            }
        });

        // Render pieces captured BY Black (meaning white pieces captured)
        this.blackCapturedList.innerHTML = '';
        ['q', 'r', 'b', 'n', 'p'].forEach(type => {
            const capturedCount = Math.max(0, startingCounts[type] - currentWhite[type]);
            for (let c = 0; c < capturedCount; c++) {
                const span = document.createElement('span');
                span.className = 'captured-icon';
                span.innerHTML = this.getPieceSVG(type, 'w');
                this.blackCapturedList.appendChild(span);
            }
        });
    }

    /**
     * Render Move History Table
     */
    renderMoveHistory(historyItems = []) {
        if (!this.historyBody) return;
        this.historyBody.innerHTML = '';

        for (let i = 0; i < historyItems.length; i += 2) {
            const moveNum = Math.floor(i / 2) + 1;
            const whiteItem = historyItems[i];
            const blackItem = historyItems[i + 1];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${moveNum}.</td>
                <td class="${!blackItem ? 'active-move' : ''}">${whiteItem?.san || ''}</td>
                <td class="${blackItem && (i + 2 >= historyItems.length) ? 'active-move' : ''}">${blackItem?.san || ''}</td>
            `;
            this.historyBody.appendChild(row);
        }

        if (this.moveCountBadge) {
            this.moveCountBadge.textContent = `${historyItems.length} moves`;
        }

        if (this.historyScroll) {
            this.historyScroll.scrollTop = this.historyScroll.scrollHeight;
        }
    }

    /**
     * Modal: Pawn Promotion Selection
     */
    promptPromotion(color) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-promotion');
            const container = document.getElementById('promo-choices-container');
            if (!modal || !container) {
                resolve('q');
                return;
            }

            container.innerHTML = '';
            const options = [
                { type: 'q', name: 'Queen (Ice)', elem: '❄️' },
                { type: 'r', name: 'Rook (Earth)', elem: '🪨' },
                { type: 'b', name: 'Bishop (Wind)', elem: '🌪️' },
                { type: 'n', name: 'Knight (Lightning)', elem: '⚡' }
            ];

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'promo-btn';
                btn.innerHTML = `
                    <div class="promo-piece-svg">${this.getPieceSVG(opt.type, color)}</div>
                    <span class="promo-label">${opt.name}</span>
                `;
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    this.audio.playPromotion();
                    resolve(opt.type);
                });
                container.appendChild(btn);
            });

            modal.classList.add('active');
        });
    }

    /**
     * Modal: Game Over / Victory Screen
     */
    showGameOver(status) {
        const modal = document.getElementById('modal-game-over');
        const titleEl = document.getElementById('victory-title');
        const subEl = document.getElementById('victory-subtitle');
        const reasonEl = document.getElementById('victory-reason');
        if (!modal) return;

        if (status.reason === 'checkmate') {
            const winnerName = status.winner === 'w' ? 'WHITE (Light)' : 'BLACK (Shadow)';
            if (titleEl) titleEl.textContent = 'CHECKMATE';
            if (subEl) subEl.textContent = `${winnerName} CLAIMS VICTORY`;
            if (reasonEl) reasonEl.textContent = 'The opposing King has fallen before the elemental onslaught.';
        } else if (status.reason === 'resignation') {
            const winnerName = status.winner === 'w' ? 'WHITE' : 'BLACK';
            if (titleEl) titleEl.textContent = 'RESIGNATION';
            if (subEl) subEl.textContent = `${winnerName} WINS BY FORFEIT`;
            if (reasonEl) reasonEl.textContent = 'The battlefield was conceded.';
        } else {
            if (titleEl) titleEl.textContent = 'TRUCE DECLARED';
            if (subEl) subEl.textContent = 'THE BATTLE ENDS IN A DRAW';
            if (reasonEl) reasonEl.textContent = status.description || 'Forces in perfect equilibrium.';
        }

        modal.classList.add('active');
    }

    /**
     * Keyboard Navigation Controls
     */
    initKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            // Ignore keystrokes inside inputs
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

            switch (e.key) {
                case 'ArrowRight': {
                    e.preventDefault();
                    this.focusedSquare = (this.focusedSquare + 1) % 64;
                    this.focusSquareVisual();
                    break;
                }
                case 'ArrowLeft': {
                    e.preventDefault();
                    this.focusedSquare = (this.focusedSquare + 63) % 64;
                    this.focusSquareVisual();
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    this.focusedSquare = (this.focusedSquare + 8) % 64;
                    this.focusSquareVisual();
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    this.focusedSquare = (this.focusedSquare + 56) % 64;
                    this.focusSquareVisual();
                    break;
                }
                case 'Enter':
                case ' ': {
                    e.preventDefault();
                    this.handleSquareClick(this.focusedSquare);
                    break;
                }
                case 'Escape': {
                    this.clearSelection();
                    this.renderBoard();
                    break;
                }
                case 'f':
                case 'F': {
                    this.toggleFlip();
                    break;
                }
                case 'z':
                case 'Z': {
                    if (this.onUndoRequest) this.onUndoRequest();
                    break;
                }
                case 'r':
                case 'R': {
                    if (this.onRestartRequest) this.onRestartRequest();
                    break;
                }
            }
        });
    }

    focusSquareVisual() {
        for (let i = 0; i < 64; i++) {
            const el = this.boardEl.children[i];
            const sq = parseInt(el.dataset.square, 10);
            if (sq === this.focusedSquare) {
                el.focus();
                break;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
