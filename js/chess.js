/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/chess.js - Standard Chess Engine with Full Rules, Draw Detection, SAN, and Perft Verification
 */

class ChessEngine {
    constructor() {
        this.reset();
    }

    reset() {
        // 64-square array, 0 = a1, 7 = h1, ..., 56 = a8, 63 = h8
        this.board = new Array(64).fill(null);
        this.turn = 'w'; // 'w' or 'b'
        this.castling = {
            w: { k: true, q: true },
            b: { k: true, q: true }
        };
        this.epSquare = null; // En passant target square index (or null)
        this.halfmoveClock = 0; // Moves since last capture or pawn push (for 50-move rule)
        this.fullmoveNumber = 1;
        
        // History of states for unmake and undo
        this.history = [];
        // Map of position keys for 3-fold repetition
        this.positionCounts = new Map();

        this.setupStartingPosition();
    }

    setupStartingPosition() {
        this.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }

    /**
     * Parse and load a standard FEN string
     */
    loadFEN(fen) {
        this.board = new Array(64).fill(null);
        this.history = [];
        this.positionCounts = new Map();

        const parts = fen.trim().split(/\s+/);
        const placement = parts[0];
        const turn = parts[1] || 'w';
        const castling = parts[2] || '-';
        const ep = parts[3] || '-';
        const halfmove = parts[4] || '0';
        const fullmove = parts[5] || '1';

        const rows = placement.split('/');
        for (let r = 0; r < 8; r++) {
            const rank = 7 - r; // rows[0] is rank 8 (index 7)
            let file = 0;
            for (let i = 0; i < rows[r].length; i++) {
                const char = rows[r][i];
                if (char >= '1' && char <= '8') {
                    file += parseInt(char, 10);
                } else {
                    const color = char === char.toUpperCase() ? 'w' : 'b';
                    const type = char.toLowerCase();
                    const sq = rank * 8 + file;
                    this.board[sq] = { type, color };
                    file++;
                }
            }
        }

        this.turn = turn;
        this.castling = {
            w: { k: castling.includes('K'), q: castling.includes('Q') },
            b: { k: castling.includes('k'), q: castling.includes('q') }
        };
        this.epSquare = ep !== '-' ? this.algebraicToSquare(ep) : null;
        this.halfmoveClock = parseInt(halfmove, 10);
        this.fullmoveNumber = parseInt(fullmove, 10);

        this.recordPosition();
    }

    /**
     * Export current board position as FEN
     */
    exportFEN() {
        let fen = '';
        for (let r = 7; r >= 0; r--) {
            let empty = 0;
            for (let f = 0; f < 8; f++) {
                const piece = this.board[r * 8 + f];
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    const char = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                    fen += char;
                }
            }
            if (empty > 0) fen += empty;
            if (r > 0) fen += '/';
        }

        fen += ` ${this.turn} `;
        let c = '';
        if (this.castling.w.k) c += 'K';
        if (this.castling.w.q) c += 'Q';
        if (this.castling.b.k) c += 'k';
        if (this.castling.b.q) c += 'q';
        fen += (c || '-') + ' ';

        fen += (this.epSquare !== null ? this.squareToAlgebraic(this.epSquare) : '-') + ' ';
        fen += `${this.halfmoveClock} ${this.fullmoveNumber}`;
        return fen;
    }

    squareToAlgebraic(sq) {
        const file = String.fromCharCode('a'.charCodeAt(0) + (sq % 8));
        const rank = Math.floor(sq / 8) + 1;
        return `${file}${rank}`;
    }

    algebraicToSquare(alg) {
        if (!alg || alg.length < 2) return null;
        const file = alg.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(alg[1], 10) - 1;
        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
        return rank * 8 + file;
    }

    getPositionKey() {
        let key = '';
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            key += p ? (p.color + p.type) : '.';
        }
        key += `_${this.turn}`;
        key += `_${this.castling.w.k ? 'K' : ''}${this.castling.w.q ? 'Q' : ''}${this.castling.b.k ? 'k' : ''}${this.castling.b.q ? 'q' : ''}`;
        key += `_${this.epSquare !== null ? this.epSquare : '-'}`;
        return key;
    }

    recordPosition() {
        const key = this.getPositionKey();
        const cnt = (this.positionCounts.get(key) || 0) + 1;
        this.positionCounts.set(key, cnt);
    }

    unrecordPosition(key) {
        const cnt = this.positionCounts.get(key);
        if (cnt) {
            if (cnt === 1) this.positionCounts.delete(key);
            else this.positionCounts.set(key, cnt - 1);
        }
    }

    /**
     * Check if a square is attacked by side 'attackerColor'
     */
    isSquareAttacked(sq, attackerColor) {
        const f = sq % 8;
        const r = Math.floor(sq / 8);

        // 1. Pawn attacks against sq
        const pawnDir = attackerColor === 'w' ? -1 : 1;
        const pawnRank = r + pawnDir;
        if (pawnRank >= 0 && pawnRank <= 7) {
            if (f > 0) {
                const p = this.board[pawnRank * 8 + (f - 1)];
                if (p && p.color === attackerColor && p.type === 'p') return true;
            }
            if (f < 7) {
                const p = this.board[pawnRank * 8 + (f + 1)];
                if (p && p.color === attackerColor && p.type === 'p') return true;
            }
        }

        // 2. Knight attacks
        const knightOffsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (let i = 0; i < 8; i++) {
            const [df, dr] = knightOffsets[i];
            const nf = f + df;
            const nr = r + dr;
            if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
                const p = this.board[nr * 8 + nf];
                if (p && p.color === attackerColor && p.type === 'n') return true;
            }
        }

        // 3. Orthogonal attacks (Rook & Queen)
        const orthoDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (let i = 0; i < 4; i++) {
            const [df, dr] = orthoDirs[i];
            let cf = f + df;
            let cr = r + dr;
            while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
                const p = this.board[cr * 8 + cf];
                if (p) {
                    if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
                    break;
                }
                cf += df;
                cr += dr;
            }
        }

        // 4. Diagonal attacks (Bishop & Queen)
        const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (let i = 0; i < 4; i++) {
            const [df, dr] = diagDirs[i];
            let cf = f + df;
            let cr = r + dr;
            while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
                const p = this.board[cr * 8 + cf];
                if (p) {
                    if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
                    break;
                }
                cf += df;
                cr += dr;
            }
        }

        // 5. King attacks
        for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
                if (df === 0 && dr === 0) continue;
                const kf = f + df;
                const kr = r + dr;
                if (kf >= 0 && kf <= 7 && kr >= 0 && kr <= 7) {
                    const p = this.board[kr * 8 + kf];
                    if (p && p.color === attackerColor && p.type === 'k') return true;
                }
            }
        }

        return false;
    }

    findKing(color) {
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (p && p.color === color && p.type === 'k') return i;
        }
        return -1;
    }

    isKingInCheck(color = this.turn) {
        const kingSq = this.findKing(color);
        if (kingSq === -1) return false;
        const opponentColor = color === 'w' ? 'b' : 'w';
        return this.isSquareAttacked(kingSq, opponentColor);
    }

    /**
     * Generate pseudo-legal moves for side 'color'
     */
    generatePseudoLegalMoves(color = this.turn) {
        const moves = [];
        const opponent = color === 'w' ? 'b' : 'w';
        const forward = color === 'w' ? 1 : -1;
        const startPawnRank = color === 'w' ? 1 : 6;
        const promoRank = color === 'w' ? 7 : 0;

        for (let sq = 0; sq < 64; sq++) {
            const piece = this.board[sq];
            if (!piece || piece.color !== color) continue;

            const f = sq % 8;
            const r = Math.floor(sq / 8);

            switch (piece.type) {
                case 'p': {
                    // One step forward
                    const nextRank = r + forward;
                    const oneStepSq = nextRank * 8 + f;
                    if (this.board[oneStepSq] === null) {
                        if (nextRank === promoRank) {
                            moves.push({ from: sq, to: oneStepSq, promotion: 'q' });
                            moves.push({ from: sq, to: oneStepSq, promotion: 'r' });
                            moves.push({ from: sq, to: oneStepSq, promotion: 'b' });
                            moves.push({ from: sq, to: oneStepSq, promotion: 'n' });
                        } else {
                            moves.push({ from: sq, to: oneStepSq });

                            // Two steps forward from starting rank
                            if (r === startPawnRank) {
                                const twoStepSq = (r + 2 * forward) * 8 + f;
                                if (this.board[twoStepSq] === null) {
                                    moves.push({ from: sq, to: twoStepSq, isDoublePawnPush: true });
                                }
                            }
                        }
                    }

                    // Diagonal captures (including en passant)
                    for (const df of [-1, 1]) {
                        const targetFile = f + df;
                        if (targetFile >= 0 && targetFile <= 7) {
                            const capSq = nextRank * 8 + targetFile;
                            const targetPiece = this.board[capSq];
                            if (targetPiece && targetPiece.color === opponent) {
                                if (nextRank === promoRank) {
                                    moves.push({ from: sq, to: capSq, promotion: 'q', captured: targetPiece });
                                    moves.push({ from: sq, to: capSq, promotion: 'r', captured: targetPiece });
                                    moves.push({ from: sq, to: capSq, promotion: 'b', captured: targetPiece });
                                    moves.push({ from: sq, to: capSq, promotion: 'n', captured: targetPiece });
                                } else {
                                    moves.push({ from: sq, to: capSq, captured: targetPiece });
                                }
                            } else if (capSq === this.epSquare) {
                                // En passant capture
                                const epCapturedSq = r * 8 + targetFile;
                                const epCapturedPiece = this.board[epCapturedSq];
                                moves.push({ from: sq, to: capSq, isEnPassant: true, captured: epCapturedPiece });
                            }
                        }
                    }
                    break;
                }

                case 'n': {
                    const knightOffsets = [
                        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                        [1, -2], [1, 2], [2, -1], [2, 1]
                    ];
                    for (let i = 0; i < 8; i++) {
                        const [df, dr] = knightOffsets[i];
                        const nf = f + df;
                        const nr = r + dr;
                        if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
                            const toSq = nr * 8 + nf;
                            const target = this.board[toSq];
                            if (!target) {
                                moves.push({ from: sq, to: toSq });
                            } else if (target.color === opponent) {
                                moves.push({ from: sq, to: toSq, captured: target });
                            }
                        }
                    }
                    break;
                }

                case 'b':
                case 'r':
                case 'q': {
                    const dirs = [];
                    if (piece.type === 'b' || piece.type === 'q') {
                        dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
                    }
                    if (piece.type === 'r' || piece.type === 'q') {
                        dirs.push([0, 1], [0, -1], [1, 0], [-1, 0]);
                    }

                    for (let i = 0; i < dirs.length; i++) {
                        const [df, dr] = dirs[i];
                        let cf = f + df;
                        let cr = r + dr;
                        while (cf >= 0 && cf <= 7 && cr >= 0 && cr <= 7) {
                            const toSq = cr * 8 + cf;
                            const target = this.board[toSq];
                            if (!target) {
                                moves.push({ from: sq, to: toSq });
                            } else {
                                if (target.color === opponent) {
                                    moves.push({ from: sq, to: toSq, captured: target });
                                }
                                break;
                            }
                            cf += df;
                            cr += dr;
                        }
                    }
                    break;
                }

                case 'k': {
                    for (let df = -1; df <= 1; df++) {
                        for (let dr = -1; dr <= 1; dr++) {
                            if (df === 0 && dr === 0) continue;
                            const kf = f + df;
                            const kr = r + dr;
                            if (kf >= 0 && kf <= 7 && kr >= 0 && kr <= 7) {
                                const toSq = kr * 8 + kf;
                                const target = this.board[toSq];
                                if (!target) {
                                    moves.push({ from: sq, to: toSq });
                                } else if (target.color === opponent) {
                                    moves.push({ from: sq, to: toSq, captured: target });
                                }
                            }
                        }
                    }

                    // Castling moves
                    if (color === 'w' && sq === 4) { // e1
                        if (this.castling.w.k && !this.board[5] && !this.board[6]) {
                            // Squares e1(4), f1(5), g1(6) must not be attacked
                            if (!this.isSquareAttacked(4, 'b') && !this.isSquareAttacked(5, 'b') && !this.isSquareAttacked(6, 'b')) {
                                moves.push({ from: 4, to: 6, isCastling: 'k' });
                            }
                        }
                        if (this.castling.w.q && !this.board[1] && !this.board[2] && !this.board[3]) {
                            // Squares e1(4), d1(3), c1(2) must not be attacked
                            if (!this.isSquareAttacked(4, 'b') && !this.isSquareAttacked(3, 'b') && !this.isSquareAttacked(2, 'b')) {
                                moves.push({ from: 4, to: 2, isCastling: 'q' });
                            }
                        }
                    } else if (color === 'b' && sq === 60) { // e8
                        if (this.castling.b.k && !this.board[61] && !this.board[62]) {
                            // Squares e8(60), f8(61), g8(62) must not be attacked
                            if (!this.isSquareAttacked(60, 'w') && !this.isSquareAttacked(61, 'w') && !this.isSquareAttacked(62, 'w')) {
                                moves.push({ from: 60, to: 62, isCastling: 'k' });
                            }
                        }
                        if (this.castling.b.q && !this.board[57] && !this.board[58] && !this.board[59]) {
                            // Squares e8(60), d8(59), c8(58) must not be attacked
                            if (!this.isSquareAttacked(60, 'w') && !this.isSquareAttacked(59, 'w') && !this.isSquareAttacked(58, 'w')) {
                                moves.push({ from: 60, to: 58, isCastling: 'q' });
                            }
                        }
                    }
                    break;
                }
            }
        }

        return moves;
    }

    /**
     * Commit a move to the board and save state for unmaking
     */
    makeMove(move) {
        const piece = this.board[move.from];
        const stateRecord = {
            move,
            piece,
            captured: this.board[move.to],
            castling: {
                w: { ...this.castling.w },
                b: { ...this.castling.b }
            },
            epSquare: this.epSquare,
            halfmoveClock: this.halfmoveClock,
            fullmoveNumber: this.fullmoveNumber,
            positionKey: this.getPositionKey()
        };

        // En passant capture removal
        let capturedPawnSq = null;
        if (move.isEnPassant) {
            const targetFile = move.to % 8;
            const attackerRank = Math.floor(move.from / 8);
            capturedPawnSq = attackerRank * 8 + targetFile;
            stateRecord.captured = this.board[capturedPawnSq];
            stateRecord.capturedPawnSq = capturedPawnSq;
            this.board[capturedPawnSq] = null;
        }

        // Halfmove clock reset condition
        if (piece.type === 'p' || stateRecord.captured) {
            this.halfmoveClock = 0;
        } else {
            this.halfmoveClock++;
        }

        // En passant square handling
        if (move.isDoublePawnPush) {
            this.epSquare = (move.from + move.to) / 2;
        } else {
            this.epSquare = null;
        }

        // Castling moves movement of rook
        if (move.isCastling) {
            if (move.isCastling === 'k') {
                if (piece.color === 'w') { // h1 -> f1
                    this.board[5] = this.board[7];
                    this.board[7] = null;
                } else { // h8 -> f8
                    this.board[61] = this.board[63];
                    this.board[63] = null;
                }
            } else if (move.isCastling === 'q') {
                if (piece.color === 'w') { // a1 -> d1
                    this.board[3] = this.board[0];
                    this.board[0] = null;
                } else { // a8 -> d8
                    this.board[59] = this.board[56];
                    this.board[56] = null;
                }
            }
        }

        // Update castling rights if King or Rook moved or rook captured
        if (piece.type === 'k') {
            this.castling[piece.color].k = false;
            this.castling[piece.color].q = false;
        } else if (piece.type === 'r') {
            if (move.from === 0) this.castling.w.q = false;
            else if (move.from === 7) this.castling.w.k = false;
            else if (move.from === 56) this.castling.b.q = false;
            else if (move.from === 63) this.castling.b.k = false;
        }

        // If a rook is captured on its original square, forfeit rights
        if (move.to === 0) this.castling.w.q = false;
        else if (move.to === 7) this.castling.w.k = false;
        else if (move.to === 56) this.castling.b.q = false;
        else if (move.to === 63) this.castling.b.k = false;

        // Move piece
        this.board[move.to] = piece;
        this.board[move.from] = null;

        // Handle promotion transformation
        if (move.promotion) {
            this.board[move.to] = {
                type: move.promotion,
                color: piece.color,
                element: move.element || piece.element,
                promoted: true,
                originalType: 'p',
                id: `${piece.color}-promoted-${move.promotion}-${Date.now()}`
            };
        }

        // Switch active color and fullmove count
        if (this.turn === 'b') {
            this.fullmoveNumber++;
            this.turn = 'w';
        } else {
            this.turn = 'b';
        }

        this.history.push(stateRecord);
        this.recordPosition();
    }

    /**
     * Unmake the most recent move
     */
    unmakeMove() {
        const stateRecord = this.history.pop();
        if (!stateRecord) return;

        this.unrecordPosition(this.getPositionKey());

        const move = stateRecord.move;
        const piece = stateRecord.piece;

        // Restore active color and clocks
        this.turn = piece.color;
        this.castling = stateRecord.castling;
        this.epSquare = stateRecord.epSquare;
        this.halfmoveClock = stateRecord.halfmoveClock;
        this.fullmoveNumber = stateRecord.fullmoveNumber;

        // Move piece back
        this.board[move.from] = piece;
        this.board[move.to] = stateRecord.captured && !move.isEnPassant ? stateRecord.captured : null;

        // Restore en passant captured pawn
        if (move.isEnPassant && stateRecord.capturedPawnSq !== undefined) {
            this.board[stateRecord.capturedPawnSq] = stateRecord.captured;
        }

        // Restore castling rook
        if (move.isCastling) {
            if (move.isCastling === 'k') {
                if (piece.color === 'w') {
                    this.board[7] = this.board[5];
                    this.board[5] = null;
                } else {
                    this.board[63] = this.board[61];
                    this.board[61] = null;
                }
            } else if (move.isCastling === 'q') {
                if (piece.color === 'w') {
                    this.board[0] = this.board[3];
                    this.board[3] = null;
                } else {
                    this.board[56] = this.board[59];
                    this.board[59] = null;
                }
            }
        }
    }

    /**
     * Generate strictly legal moves for side 'color'
     */
    generateLegalMoves(color = this.turn) {
        const pseudoMoves = this.generatePseudoLegalMoves(color);
        const legalMoves = [];

        for (let i = 0; i < pseudoMoves.length; i++) {
            const m = pseudoMoves[i];
            this.makeMove(m);
            // After making move, verify that the moving side's king is NOT in check
            if (!this.isKingInCheck(color)) {
                legalMoves.push(m);
            }
            this.unmakeMove();
        }

        return legalMoves;
    }

    /**
     * Generate legal moves originating specifically from 'sq'
     */
    getLegalMovesForSquare(sq) {
        const legal = this.generateLegalMoves(this.turn);
        return legal.filter(m => m.from === sq);
    }

    /**
     * Standard Algebraic Notation generator
     */
    generateSAN(move) {
        const piece = this.board[move.from];
        if (!piece) return '';

        // Castling
        if (move.isCastling === 'k') return 'O-O';
        if (move.isCastling === 'q') return 'O-O-O';

        let san = '';
        const dest = this.squareToAlgebraic(move.to);
        const isCapture = !!(move.captured || move.isEnPassant || this.board[move.to]);

        if (piece.type === 'p') {
            if (isCapture) {
                const fromFile = String.fromCharCode('a'.charCodeAt(0) + (move.from % 8));
                san += `${fromFile}x${dest}`;
            } else {
                san += dest;
            }
            if (move.promotion) {
                san += `=${move.promotion.toUpperCase()}`;
            }
        } else {
            san += piece.type.toUpperCase();

            // Disambiguation
            const allLegal = this.generateLegalMoves(this.turn);
            const candidates = allLegal.filter(m => 
                m.to === move.to && 
                m.from !== move.from && 
                this.board[m.from]?.type === piece.type
            );

            if (candidates.length > 0) {
                const sameFile = candidates.some(m => (m.from % 8) === (move.from % 8));
                const sameRank = candidates.some(m => Math.floor(m.from / 8) === Math.floor(move.from / 8));

                const fromFile = String.fromCharCode('a'.charCodeAt(0) + (move.from % 8));
                const fromRank = Math.floor(move.from / 8) + 1;

                if (!sameFile) {
                    san += fromFile;
                } else if (!sameRank) {
                    san += fromRank;
                } else {
                    san += `${fromFile}${fromRank}`;
                }
            }

            if (isCapture) san += 'x';
            san += dest;
        }

        // Test if move leads to check or checkmate
        this.makeMove(move);
        const nextColor = this.turn;
        const inCheck = this.isKingInCheck(nextColor);
        const nextLegal = this.generateLegalMoves(nextColor);

        if (inCheck) {
            if (nextLegal.length === 0) {
                san += '#';
            } else {
                san += '+';
            }
        }
        this.unmakeMove();

        return san;
    }

    /**
     * Game status evaluation
     */
    getGameStatus() {
        const legalMoves = this.generateLegalMoves(this.turn);
        const inCheck = this.isKingInCheck(this.turn);

        if (legalMoves.length === 0) {
            if (inCheck) {
                return {
                    gameOver: true,
                    winner: this.turn === 'w' ? 'b' : 'w',
                    reason: 'checkmate',
                    description: `Checkmate! ${this.turn === 'w' ? 'Black' : 'White'} wins.`
                };
            } else {
                return {
                    gameOver: true,
                    winner: null,
                    reason: 'stalemate',
                    description: 'Draw by Stalemate. King has no legal escape.'
                };
            }
        }

        // Draw by Threefold Repetition
        if (this.detectThreefoldRepetition()) {
            return {
                gameOver: true,
                winner: null,
                reason: 'threefold_repetition',
                description: 'Draw by Threefold Repetition.'
            };
        }

        // Draw by Fifty-Move Rule
        if (this.halfmoveClock >= 100) {
            return {
                gameOver: true,
                winner: null,
                reason: 'fifty_move_rule',
                description: 'Draw by Fifty-Move Rule without capture or pawn advance.'
            };
        }

        // Draw by Insufficient Material
        if (this.detectInsufficientMaterial()) {
            return {
                gameOver: true,
                winner: null,
                reason: 'insufficient_material',
                description: 'Draw by Insufficient Material.'
            };
        }

        return {
            gameOver: false,
            inCheck,
            turn: this.turn
        };
    }

    detectThreefoldRepetition() {
        for (const [key, count] of this.positionCounts.entries()) {
            if (count >= 3) return true;
        }
        return false;
    }

    detectInsufficientMaterial() {
        const pieces = [];
        for (let i = 0; i < 64; i++) {
            const p = this.board[i];
            if (p) pieces.push({ ...p, sq: i });
        }

        // K vs K
        if (pieces.length === 2) return true;

        // K+B vs K or K+N vs K
        if (pieces.length === 3) {
            const nonKing = pieces.find(p => p.type !== 'k');
            if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) return true;
        }

        // K+B vs K+B with bishops on the SAME color square
        if (pieces.length === 4) {
            const whiteB = pieces.find(p => p.color === 'w' && p.type === 'b');
            const blackB = pieces.find(p => p.color === 'b' && p.type === 'b');
            if (whiteB && blackB) {
                const whiteColor = ((whiteB.sq % 8) + Math.floor(whiteB.sq / 8)) % 2;
                const blackColor = ((blackB.sq % 8) + Math.floor(blackB.sq / 8)) % 2;
                if (whiteColor === blackColor) return true;
            }
        }

        return false;
    }

    /**
     * PERFT (Performance Test) move generator verification
     */
    perft(depth) {
        if (depth === 0) return 1;

        const moves = this.generateLegalMoves(this.turn);
        if (depth === 1) return moves.length;

        let totalNodes = 0;
        for (let i = 0; i < moves.length; i++) {
            this.makeMove(moves[i]);
            totalNodes += this.perft(depth - 1);
            this.unmakeMove();
        }
        return totalNodes;
    }

    /**
     * Perft Suite testing starter positions and returning console report
     */
    runPerftSuite() {
        const tests = [
            { depth: 1, expected: 20 },
            { depth: 2, expected: 400 },
            { depth: 3, expected: 8902 },
            { depth: 4, expected: 197281 }
        ];

        let results = '=== MAHŌ NO CHESU PERFT SUITE ===\n';
        for (const t of tests) {
            const start = performance.now();
            const nodes = this.perft(t.depth);
            const timeMs = (performance.now() - start).toFixed(2);
            const passed = nodes === t.expected;
            results += `Perft depth ${t.depth}: ${passed ? 'PASS' : 'FAIL'} (${nodes} nodes / expected ${t.expected}) [${timeMs}ms]\n`;
        }
        return results;
    }
}

// Global engine export
if (typeof globalThis !== 'undefined') {
    globalThis.ChessEngine = ChessEngine;
}
if (typeof window !== 'undefined') {
    window.ChessEngine = ChessEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}
