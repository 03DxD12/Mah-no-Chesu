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
     * Vector SVG definitions for chess pieces matching the reference design
     * High-contrast, iconic silhouettes with crisp detail lines & authentic crowns
     */
    getPieceSVG(type, color) {
        const isWhite = color === 'w';
        const mainFill = isWhite ? '#ffffff' : '#111726';
        const lineStroke = isWhite ? '#111726' : '#ffffff';
        const strokeW = 3.2;
        const innerDetail = isWhite ? '#111726' : '#ffffff';

        let paths = '';
        switch (type) {
            case 'p': // Pawn
                paths = `
                    <!-- Head Sphere -->
                    <circle cx="50" cy="24" r="14.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Collar Ring -->
                    <path d="M36 39.5 C36 37 64 37 64 39.5 C64 42 36 42 36 39.5 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <!-- Flared Curved Body -->
                    <path d="M41 42 C44 60 25 76 22 83 L78 83 C75 76 56 60 59 42 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                    <!-- Stepped Base Tier 1 -->
                    <rect x="18" y="83" width="64" height="6" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 2 -->
                    <rect x="13" y="89" width="74" height="6.5" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;

            case 'r': // Rook
                paths = `
                    <!-- Rampart Battlements (3 Crenels) -->
                    <path d="M23 15 L35 15 L35 24 L45 24 L45 15 L55 15 L55 24 L65 24 L65 15 L77 15 L77 31 L23 31 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linejoin="miter"/>
                    <!-- Upper Rim Band -->
                    <rect x="20" y="31" width="60" height="7" rx="1.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Inset Tower Body -->
                    <path d="M26 38 L29 73 L71 73 L74 38 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Tower Horizontal Grooves -->
                    <line x1="28" y1="49" x2="72" y2="49" stroke="${lineStroke}" stroke-width="3"/>
                    <line x1="29" y1="61" x2="71" y2="61" stroke="${lineStroke}" stroke-width="3"/>
                    <!-- Stepped Base Tier 1 -->
                    <rect x="23" y="73" width="54" height="7" rx="1.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 2 -->
                    <rect x="18" y="80" width="64" height="7" rx="1.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 3 -->
                    <rect x="12" y="87" width="76" height="8" rx="2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;

            case 'n': // Knight (Stylized modern emblem matching reference)
                paths = `
                    <!-- Outer Horse Silhouette -->
                    <path d="M44 12 L48 23 L33 42 C30 46 34 48 38 45 L44 40 C46 38 49 39 51 40 C47 48 42 58 38 68 L38 74 L56 74 C58 68 62 60 66 52 C71 42 71 31 66 22 L44 12 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                    
                    <!-- Back Neck Arched Crest & Foot Spur -->
                    <path d="M44 12 C58 20 73 34 74 52 C75 62 74 68 76 68 L76 74 L62 74 L62 68 C66 68 67 62 67 52 C67 38 58 24 44 12 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>

                    <!-- Inner Contour / Ribbon Line -->
                    <path d="M51 40 C58 48 62 58 55 68 L49 74" fill="none" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linecap="round"/>

                    <!-- Stepped Two-Tier Pedestal Bars -->
                    <rect x="26" y="81" width="48" height="5.5" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <rect x="18" y="88.5" width="64" height="5.5" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;

            case 'b': // Bishop
                paths = `
                    <!-- Top Finial Ball -->
                    <circle cx="50" cy="11" r="3.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <!-- Mitre Headpiece -->
                    <path d="M50 14 C36 24 32 44 34 56 C34 59 66 59 66 56 C68 44 64 24 50 14 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Inset Cross on Mitre Face -->
                    <line x1="50" y1="24" x2="50" y2="44" stroke="${lineStroke}" stroke-width="3.5" stroke-linecap="square"/>
                    <line x1="42" y1="32" x2="58" y2="32" stroke="${lineStroke}" stroke-width="3.5" stroke-linecap="square"/>
                    <!-- Mitre Base Collar -->
                    <rect x="32" y="58" width="36" height="6" rx="2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <!-- Lower Body -->
                    <path d="M38 64 C40 73 38 77 36 81 L64 81 C62 77 60 73 62 64 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Signature Curved Ribbons/Wings Spreading Outward -->
                    <path d="M37 81 C26 81 16 83 13 87 C9 91 18 93 25 88 C30 85 35 83 40 83 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <path d="M63 81 C74 81 84 83 87 87 C91 91 82 93 75 88 C70 85 65 83 60 83 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <!-- Pedestal Base -->
                    <rect x="22" y="88" width="56" height="7.5" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;

            case 'q': // Queen
                paths = `
                    <!-- 5 Crown Spheres / Pearls -->
                    <circle cx="17" cy="22" r="3.2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.2"/>
                    <circle cx="32" cy="15" r="3.2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.2"/>
                    <circle cx="50" cy="11" r="3.8" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.4"/>
                    <circle cx="68" cy="15" r="3.2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.2"/>
                    <circle cx="83" cy="22" r="3.2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.2"/>
                    <!-- 5-Pointed Crown Radiating Spikes & Cup -->
                    <path d="M17 25 L26 49 L37 30 L50 47 L63 30 L74 49 L83 25 C79 57 75 65 68 69 L32 69 C25 65 21 57 17 25 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
                    <!-- Ornate Crown Jewel Band -->
                    <path d="M26 62 L74 62 L71 69 L29 69 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <circle cx="37" cy="65.5" r="2" fill="${innerDetail}"/>
                    <circle cx="50" cy="65.5" r="2.5" fill="${innerDetail}"/>
                    <circle cx="63" cy="65.5" r="2" fill="${innerDetail}"/>
                    <!-- Stem -->
                    <path d="M35 69 L34 79 L66 79 L65 69 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 1 -->
                    <rect x="23" y="79" width="54" height="7" rx="2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 2 -->
                    <rect x="15" y="86" width="70" height="8.5" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;

            case 'k': // King
                paths = `
                    <!-- Finial Cross on Top -->
                    <path d="M46 7 L54 7 L54 11 L58 11 L58 17 L54 17 L54 22 L46 22 L46 17 L42 17 L42 11 L46 11 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.2"/>
                    <rect x="48" y="12" width="4" height="4" fill="${innerDetail}"/>
                    <!-- Lobed Trefoil Crown Body -->
                    <path d="M50 22 C42 22 34 26 27 32 C19 39 15 52 23 64 L77 64 C85 52 81 39 73 32 C66 26 58 22 50 22 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Crown Lobes Internal Curved Ribs -->
                    <path d="M50 22 C45 36 38 52 27 64" stroke="${lineStroke}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
                    <path d="M50 22 C55 36 62 52 73 64" stroke="${lineStroke}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
                    <!-- Ornate Crown Belt with Geometric Accents -->
                    <rect x="22" y="64" width="56" height="8" rx="1.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="2.5"/>
                    <rect x="32" y="66" width="4" height="4" fill="${innerDetail}"/>
                    <circle cx="50" cy="68" r="2.5" fill="${innerDetail}"/>
                    <rect x="64" y="66" width="4" height="4" fill="${innerDetail}"/>
                    <!-- Stem -->
                    <path d="M33 72 L31 81 L69 81 L67 72 Z" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 1 -->
                    <rect x="21" y="81" width="58" height="6.5" rx="2" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                    <!-- Stepped Base Tier 2 -->
                    <rect x="13" y="87.5" width="74" height="8" rx="2.5" fill="${mainFill}" stroke="${lineStroke}" stroke-width="${strokeW}"/>
                `;
                break;
        }

        return `<svg viewBox="0 0 100 100" class="piece-svg">${paths}</svg>`;
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

        const historyPanel = document.getElementById('history-panel');
        document.getElementById('btn-history')?.addEventListener('click', () => {
            this.audio.playUiClick();
            historyPanel?.classList.toggle('history-open');
        });
        document.getElementById('btn-close-history')?.addEventListener('click', () => {
            this.audio.playUiClick();
            historyPanel?.classList.remove('history-open');
        });
    }

    toggleFlip() {
        this.isFlipped = !this.isFlipped;
        this.audio.playUiClick();
        const gameView = document.getElementById('game-view');
        if (gameView) {
            gameView.classList.toggle('flipped', this.isFlipped);
        }
        this.renderBoard();
        this.effects.initCanvasSize();
    }

    setFlipped(flipped) {
        if (this.isFlipped !== flipped) {
            this.isFlipped = flipped;
            const gameView = document.getElementById('game-view');
            if (gameView) {
                gameView.classList.toggle('flipped', this.isFlipped);
            }
            this.renderBoard();
            this.effects.initCanvasSize();
        }
    }

    /**
     * Render 4-sided coordinate margins (top, bottom, left, right)
     */
    renderCoordinates() {
        const topEl = document.getElementById('board-coords-top');
        const bottomEl = document.getElementById('board-coords-bottom');
        const leftEl = document.getElementById('board-coords-left');
        const rightEl = document.getElementById('board-coords-right');

        const files = this.isFlipped ? ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const ranks = this.isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

        const filesHTML = files.map(f => `<span class="coord-cell">${f}</span>`).join('');
        const ranksHTML = ranks.map(r => `<span class="coord-cell">${r}</span>`).join('');

        if (topEl) topEl.innerHTML = filesHTML;
        if (bottomEl) bottomEl.innerHTML = filesHTML;
        if (leftEl) leftEl.innerHTML = ranksHTML;
        if (rightEl) rightEl.innerHTML = ranksHTML;
    }

    /**
     * Render entire board according to engine state and flipped status
     */
    renderBoard() {
        this.renderCoordinates();

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

            // Piece
            const piece = board[sq];
            let pieceHTML = '';
            if (piece) {
                pieceHTML = `<div class="piece-svg-wrapper piece-${piece.type}">${this.getPieceSVG(piece.type, piece.color)}</div>`;
            }

            sqEl.innerHTML = pieceHTML;

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
     * Smoothly animate a piece gliding from fromSq to toSq across the board
     */
    async animatePieceMove(fromSq, toSq, duration = 240) {
        if (this.settings.settings.reducedMotion) return;

        let fromEl = null;
        let toEl = null;
        for (let i = 0; i < 64; i++) {
            const el = this.boardEl.children[i];
            const sq = parseInt(el.dataset.square, 10);
            if (sq === fromSq) fromEl = el;
            if (sq === toSq) toEl = el;
        }

        if (!fromEl || !toEl || !this.boardWrapper) return;

        const pieceWrapper = fromEl.querySelector('.piece-svg-wrapper');
        if (!pieceWrapper) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const boardRect = this.boardWrapper.getBoundingClientRect();

        const dx = toRect.left - fromRect.left;
        const dy = toRect.top - fromRect.top;

        // Create floating piece
        const floating = document.createElement('div');
        floating.className = 'floating-piece';
        floating.innerHTML = pieceWrapper.innerHTML;
        floating.style.width = `${fromRect.width * 0.86}px`;
        floating.style.height = `${fromRect.height * 0.86}px`;
        floating.style.left = `${fromRect.left - boardRect.left + (fromRect.width * 0.07)}px`;
        floating.style.top = `${fromRect.top - boardRect.top + (fromRect.height * 0.07)}px`;
        floating.style.transitionDuration = `${duration}ms`;

        // Hide original during slide
        pieceWrapper.style.visibility = 'hidden';
        this.boardWrapper.appendChild(floating);

        // Force reflow
        void floating.offsetWidth;

        // Slide to destination
        floating.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

        await new Promise(resolve => setTimeout(resolve, duration));

        if (floating.parentNode) {
            floating.parentNode.removeChild(floating);
        }
    }

    /**
     * Trigger dramatic elemental dissolution / reaction on target piece
     */
    triggerPieceTargetReaction(sq, reactionClass) {
        let targetEl = null;
        for (let i = 0; i < 64; i++) {
            const el = this.boardEl.children[i];
            if (parseInt(el.dataset.square, 10) === sq) {
                targetEl = el;
                break;
            }
        }
        if (!targetEl) return;
        const wrapper = targetEl.querySelector('.piece-svg-wrapper');
        if (wrapper) {
            wrapper.classList.add(reactionClass);
        }
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
