/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/ai.js - Chess AI Coordinator with Minimax, Alpha-Beta, Piece-Square Tables & Worker Fallback
 */

class ChessAI {
    constructor() {
        this.worker = null;
        this.initWorker();

        // Piece Base Values (Centipawns)
        this.pieceValues = {
            p: 100,
            n: 320,
            b: 330,
            r: 500,
            q: 900,
            k: 20000
        };

        // Positional Piece-Square Tables (from White's perspective)
        this.pst = {
            p: [
                 0,  0,  0,  0,  0,  0,  0,  0,
                50, 50, 50, 50, 50, 50, 50, 50,
                10, 10, 20, 30, 30, 20, 10, 10,
                 5,  5, 10, 25, 25, 10,  5,  5,
                 0,  0,  0, 20, 20,  0,  0,  0,
                 5, -5,-10,  0,  0,-10, -5,  5,
                 5, 10, 10,-20,-20, 10, 10,  5,
                 0,  0,  0,  0,  0,  0,  0,  0
            ],
            n: [
                -50,-40,-30,-30,-30,-30,-40,-50,
                -40,-20,  0,  0,  0,  0,-20,-40,
                -30,  0, 10, 15, 15, 10,  0,-30,
                -30,  5, 15, 20, 20, 15,  5,-30,
                -30,  0, 15, 20, 20, 15,  0,-30,
                -30,  5, 10, 15, 15, 10,  5,-30,
                -40,-20,  0,  5,  5,  0,-20,-40,
                -50,-40,-30,-30,-30,-30,-40,-50
            ],
            b: [
                -20,-10,-10,-10,-10,-10,-10,-20,
                -10,  0,  0,  0,  0,  0,  0,-10,
                -10,  0,  5, 10, 10,  5,  0,-10,
                -10,  5,  5, 10, 10,  5,  5,-10,
                -10,  0, 10, 10, 10, 10,  0,-10,
                -10, 10, 10, 10, 10, 10, 10,-10,
                -10,  5,  0,  0,  0,  0,  5,-10,
                -20,-10,-10,-10,-10,-10,-10,-20
            ],
            r: [
                  0,  0,  0,  0,  0,  0,  0,  0,
                  5, 10, 10, 10, 10, 10, 10,  5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                  0,  0,  0,  5,  5,  0,  0,  0
            ],
            q: [
                -20,-10,-10, -5, -5,-10,-10,-20,
                -10,  0,  0,  0,  0,  0,  0,-10,
                -10,  0,  5,  5,  5,  5,  0,-10,
                 -5,  0,  5,  5,  5,  5,  0, -5,
                  0,  0,  5,  5,  5,  5,  0, -5,
                -10,  5,  5,  5,  5,  5,  0,-10,
                -10,  0,  5,  0,  0,  0,  0,-10,
                -20,-10,-10, -5, -5,-10,-10,-20
            ],
            k: [
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -20,-30,-30,-40,-40,-30,-30,-20,
                -10,-20,-20,-20,-20,-20,-20,-10,
                 20, 20,  0,  0,  0,  0, 20, 20,
                 20, 30, 10,  0,  0, 10, 30, 20
            ]
        };
    }

    initWorker() {
        try {
            // Attempt to load Web Worker
            this.worker = new Worker('./worker/ai-worker.js');
        } catch (e) {
            console.warn('Web Worker initialization unavailable (likely local file:// protocol). Using synchronous search fallback.', e);
            this.worker = null;
        }
    }

    /**
     * Choose Best Move for given FEN and Difficulty
     */
    async getBestMove(fenOrEngine, difficulty = 'normal', engine = null) {
        let fen;
        if (typeof fenOrEngine === 'string') {
            fen = fenOrEngine;
        } else if (fenOrEngine && typeof fenOrEngine === 'object') {
            engine = fenOrEngine;
            fen = engine.exportFEN ? engine.exportFEN() : null;
        }
        if (!engine && fen && typeof ChessEngine !== 'undefined') {
            engine = new ChessEngine();
            engine.loadFEN(fen);
        }

        let depth = 3;
        if (difficulty === 'easy') depth = 2;
        else if (difficulty === 'hard') depth = 4;

        if (this.worker) {
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.warn('AI worker response timed out. Falling back to local search.');
                    resolve(this.searchLocal(engine, depth, difficulty));
                }, 8000);

                this.worker.onmessage = (e) => {
                    clearTimeout(timeout);
                    if (e.data && e.data.bestMove) {
                        resolve(e.data.bestMove);
                    } else {
                        resolve(this.searchLocal(engine, depth, difficulty));
                    }
                };

                this.worker.onerror = (err) => {
                    clearTimeout(timeout);
                    console.warn('AI worker error:', err);
                    resolve(this.searchLocal(engine, depth, difficulty));
                };

                this.worker.postMessage({ fen, depth, difficulty });
            });
        }

        // Fallback synchronous search
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.searchLocal(engine, depth, difficulty));
            }, 50);
        });
    }

    /**
     * Static Board Evaluation function
     */
    evaluateBoard(engine) {
        let score = 0;
        const board = engine.board;

        for (let sq = 0; sq < 64; sq++) {
            const piece = board[sq];
            if (!piece) continue;

            const val = this.pieceValues[piece.type];
            // Lookup PST (rank 7 down to 0)
            const rank = Math.floor(sq / 8);
            const file = sq % 8;
            const pstIndex = piece.color === 'w' ? (7 - rank) * 8 + file : rank * 8 + file;
            const pstVal = this.pst[piece.type][pstIndex] || 0;

            const total = val + pstVal;
            score += piece.color === 'w' ? total : -total;
        }

        return score;
    }

    /**
     * MVV-LVA Move Ordering
     */
    orderMoves(moves, engine) {
        return moves.sort((a, b) => {
            const pieceA = engine.board[a.from];
            const pieceB = engine.board[b.from];
            const targetA = a.captured || engine.board[a.to];
            const targetB = b.captured || engine.board[b.to];

            let scoreA = 0;
            let scoreB = 0;

            if (targetA) {
                scoreA = 10 * this.pieceValues[targetA.type] - this.pieceValues[pieceA.type];
            }
            if (targetB) {
                scoreB = 10 * this.pieceValues[targetB.type] - this.pieceValues[pieceB.type];
            }

            if (a.promotion) scoreA += 800;
            if (b.promotion) scoreB += 800;

            return scoreB - scoreA;
        });
    }

    /**
     * Minimax Search with Alpha-Beta Pruning
     */
    minimax(engine, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return this.evaluateBoard(engine);
        }

        const legalMoves = engine.generateLegalMoves(engine.turn);

        if (legalMoves.length === 0) {
            if (engine.isKingInCheck(engine.turn)) {
                // Checkmate
                return isMaximizing ? -99999 - depth : 99999 + depth;
            }
            // Stalemate
            return 0;
        }

        const ordered = this.orderMoves(legalMoves, engine);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < ordered.length; i++) {
                engine.makeMove(ordered[i]);
                const ev = this.minimax(engine, depth - 1, alpha, beta, false);
                engine.unmakeMove();
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break; // Beta cut-off
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < ordered.length; i++) {
                engine.makeMove(ordered[i]);
                const ev = this.minimax(engine, depth - 1, alpha, beta, true);
                engine.unmakeMove();
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break; // Alpha cut-off
            }
            return minEval;
        }
    }

    /**
     * Local Search Engine
     */
    searchLocal(engine, depth, difficulty) {
        if (!engine) return null;
        const color = engine.turn;
        const isWhite = color === 'w';
        const legalMoves = engine.generateLegalMoves(color);
        if (legalMoves.length === 0) return null;

        const ordered = this.orderMoves(legalMoves, engine);

        // Easy mode: inject deliberate random variance to top moves
        if (difficulty === 'easy' && Math.random() < 0.35) {
            const randomPick = ordered[Math.floor(Math.random() * Math.min(3, ordered.length))];
            return randomPick;
        }

        let bestMove = ordered[0];
        let bestValue = isWhite ? -Infinity : Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (let i = 0; i < ordered.length; i++) {
            const move = ordered[i];
            engine.makeMove(move);
            const moveValue = this.minimax(engine, depth - 1, alpha, beta, !isWhite);
            engine.unmakeMove();

            if (isWhite) {
                if (moveValue > bestValue) {
                    bestValue = moveValue;
                    bestMove = move;
                }
                alpha = Math.max(alpha, moveValue);
            } else {
                if (moveValue < bestValue) {
                    bestValue = moveValue;
                    bestMove = move;
                }
                beta = Math.min(beta, moveValue);
            }
        }

        return bestMove;
    }

    getPersonality(id) {
        return AI_PERSONALITIES[id] || AI_PERSONALITIES.lumina;
    }
}

const AI_PERSONALITIES = {
    kaen: {
        id: 'kaen',
        name: 'Kaen',
        title: 'The Inferno Warlord',
        element: 'fire',
        style: 'Aggressive',
        avatar: '🔥',
        desc: 'Relentless forward pressure favoring active pieces and tactical sacrifices.',
        loadout: { p: 'fire', n: 'fire', b: 'wind', r: 'earth', q: 'fire', k: 'light' }
    },
    raiden: {
        id: 'raiden',
        name: 'Raiden',
        title: 'The Storm Tactician',
        element: 'lightning',
        style: 'Tactical',
        avatar: '⚡',
        desc: 'Sharp, rapid counter-attacks and electric breakthroughs across open files.',
        loadout: { p: 'lightning', n: 'lightning', b: 'wind', r: 'water', q: 'lightning', k: 'light' }
    },
    fubuki: {
        id: 'fubuki',
        name: 'Fubuki',
        title: 'The Glacial Aegis',
        element: 'ice',
        style: 'Defensive',
        avatar: '❄️',
        desc: 'Solid fortress pawn structures, patient defense, and freezing counter-strikes.',
        loadout: { p: 'ice', n: 'ice', b: 'water', r: 'earth', q: 'ice', k: 'light' }
    },
    terra: {
        id: 'terra',
        name: 'Terra',
        title: 'The Mountain Sovereign',
        element: 'earth',
        style: 'Positional',
        avatar: '🪨',
        desc: 'Unshakable center control, deep outposts, and crushing positional weight.',
        loadout: { p: 'earth', n: 'earth', b: 'nature', r: 'earth', q: 'nature', k: 'light' }
    },
    noctis: {
        id: 'noctis',
        name: 'Noctis',
        title: 'The Void Harvester',
        element: 'shadow',
        style: 'Unpredictable',
        avatar: '🌑',
        desc: 'Unconventional maneuvers, mysterious piece paths, and elusive threats.',
        loadout: { p: 'shadow', n: 'shadow', b: 'arcane', r: 'shadow', q: 'arcane', k: 'light' }
    },
    lumina: {
        id: 'lumina',
        name: 'Lumina',
        title: 'The Sun Ascendant',
        element: 'light',
        style: 'Balanced',
        avatar: '☀️',
        desc: 'Harmonious classical play, pure principles, and radiant judgment.',
        loadout: { p: 'light', n: 'light', b: 'arcane', r: 'light', q: 'light', k: 'light' }
    }
};

if (typeof window !== 'undefined') {
    window.ChessAI = ChessAI;
    window.AI_PERSONALITIES = AI_PERSONALITIES;
}
