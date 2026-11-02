/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/ai.js - Chess AI Coordinator with Minimax, Alpha-Beta, Piece-Square Tables & Worker Fallback
 * Optimized for 1 to 4 Seconds Response Time with Iterative Deepening and Cancellation
 */

class ChessAI {
    constructor() {
        this.worker = null;
        this.currentRequestId = 0;
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
        if (typeof Worker !== 'undefined') {
            try {
                this.worker = new Worker('worker/ai-worker.js');
            } catch (e) {
                console.warn('Could not initialize AI Web Worker, using main thread fallback:', e);
                this.worker = null;
            }
        }
    }

    /**
     * Cancel any pending background search immediately (on restart, undo, menu navigation)
     */
    cancelPendingSearch() {
        this.currentRequestId++;
        if (this.worker) {
            try {
                this.worker.terminate();
            } catch {
                // Ignore termination errors
            }
            this.worker = null;
            this.initWorker();
        }
    }

    /**
     * Compute the optimal move with strict time limits (Easy: 350ms, Normal: 1.2s, Hard/Arcane: 1-3s, max 4s)
     */
    async getBestMove(engine, difficulty = 'normal', personality = null) {
        const fen = (typeof engine === 'string') ? engine : engine.exportFEN();
        const engineObj = (typeof engine === 'string') ? new ChessEngine(engine) : engine;
        const requestId = ++this.currentRequestId;

        // Try Web Worker first for non-blocking UI
        if (this.worker) {
            return new Promise((resolve) => {
                let resolved = false;

                // Safety fallback timeout: 4.5s ceiling for mobile
                const timeout = setTimeout(() => {
                    if (!resolved && requestId === this.currentRequestId) {
                        resolved = true;
                        console.warn('AI worker search timed out, falling back to instant search');
                        resolve(this.searchLocal(engineObj, difficulty));
                    }
                }, 4500);

                this.worker.onmessage = (e) => {
                    if (resolved) return;
                    if (e.data && e.data.requestId !== undefined && e.data.requestId !== requestId) {
                        return; // Discard stale request
                    }
                    resolved = true;
                    clearTimeout(timeout);
                    if (e.data && e.data.bestMove) {
                        resolve(e.data.bestMove);
                    } else {
                        resolve(this.searchLocal(engineObj, difficulty));
                    }
                };

                this.worker.onerror = (err) => {
                    if (resolved) return;
                    resolved = true;
                    clearTimeout(timeout);
                    console.warn('AI worker error:', err);
                    resolve(this.searchLocal(engineObj, difficulty));
                };

                this.worker.postMessage({ fen, difficulty, personality, requestId });
            });
        }

        // Main-thread fallback (asynchronous to allow UI render)
        return new Promise((resolve) => {
            setTimeout(() => {
                if (requestId !== this.currentRequestId) return resolve(null);
                resolve(this.searchLocal(engineObj, difficulty));
            }, 30);
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

            const val = this.pieceValues[piece.type] || 0;
            const pstIndex = piece.color === 'w' ? (63 - sq) : sq;
            const pstVal = this.pst[piece.type] ? this.pst[piece.type][pstIndex] : 0;
            const total = val + pstVal;

            if (piece.color === 'w') {
                score += total;
            } else {
                score -= total;
            }
        }

        return score;
    }

    /**
     * Move score for MVV-LVA, PV, and Killer Moves
     */
    scoreMove(move, engine, pvMove, k1, k2) {
        if (pvMove && move.from === pvMove.from && move.to === pvMove.to && move.promotion === pvMove.promotion) {
            return 1000000;
        }

        const piece = engine.board[move.from];
        const captured = engine.board[move.to] || (move.isEnPassant ? { type: 'p' } : null);

        if (captured) {
            const victimVal = this.pieceValues[captured.type] || 100;
            const attackerVal = piece ? (this.pieceValues[piece.type] || 100) : 100;
            return 100000 + (victimVal * 10) - attackerVal;
        }

        if (move.promotion) {
            return 90000 + (this.pieceValues[move.promotion] || 0);
        }

        if (k1 && move.from === k1.from && move.to === k1.to) return 80000;
        if (k2 && move.from === k2.from && move.to === k2.to) return 70000;

        return 0;
    }

    sortMoves(moves, engine, pvMove, k1, k2) {
        const scores = moves.map(m => this.scoreMove(m, engine, pvMove, k1, k2));
        const indices = moves.map((_, i) => i);
        indices.sort((a, b) => scores[b] - scores[a]);
        return indices.map(i => moves[i]);
    }

    quiescence(engine, alpha, beta, isMaximizing, deadline, state) {
        state.nodes++;
        if ((state.nodes & 511) === 0 && Date.now() >= deadline) {
            state.timeout = true;
            return isMaximizing ? alpha : beta;
        }

        const standPat = this.evaluateBoard(engine);

        if (isMaximizing) {
            if (standPat >= beta) return beta;
            if (standPat > alpha) alpha = standPat;
        } else {
            if (standPat <= alpha) return alpha;
            if (standPat < beta) beta = standPat;
        }

        const moves = engine.generateLegalMoves(engine.turn);
        const captures = moves.filter(m => m.captured || m.isEnPassant || engine.board[m.to]);
        if (captures.length === 0) return standPat;

        const ordered = this.sortMoves(captures, engine, null, null, null);

        if (isMaximizing) {
            for (let i = 0; i < ordered.length; i++) {
                const m = ordered[i];
                const searchState = engine.makeSearchMove(m);
                const score = this.quiescence(engine, alpha, beta, false, deadline, state);
                engine.unmakeSearchMove(searchState);

                if (state.timeout) return alpha;
                if (score >= beta) return beta;
                if (score > alpha) alpha = score;
            }
            return alpha;
        } else {
            for (let i = 0; i < ordered.length; i++) {
                const m = ordered[i];
                const searchState = engine.makeSearchMove(m);
                const score = this.quiescence(engine, alpha, beta, true, deadline, state);
                engine.unmakeSearchMove(searchState);

                if (state.timeout) return beta;
                if (score <= alpha) return alpha;
                if (score < beta) beta = score;
            }
            return beta;
        }
    }

    search(engine, depth, ply, alpha, beta, isMaximizing, deadline, state, killers, pvMove) {
        state.nodes++;
        if ((state.nodes & 511) === 0 && Date.now() >= deadline) {
            state.timeout = true;
            return isMaximizing ? alpha : beta;
        }

        if (depth <= 0) {
            return this.quiescence(engine, alpha, beta, isMaximizing, deadline, state);
        }

        const moves = engine.generateLegalMoves(engine.turn);
        if (moves.length === 0) {
            if (engine.isKingInCheck(engine.turn)) {
                return isMaximizing ? (-50000 + ply) : (50000 - ply);
            }
            return 0;
        }

        const k1 = killers[ply] ? killers[ply][0] : null;
        const k2 = killers[ply] ? killers[ply][1] : null;
        const ordered = this.sortMoves(moves, engine, pvMove, k1, k2);

        let bestScore = isMaximizing ? -Infinity : Infinity;

        if (isMaximizing) {
            for (let i = 0; i < ordered.length; i++) {
                const m = ordered[i];
                const searchState = engine.makeSearchMove(m);
                const score = this.search(engine, depth - 1, ply + 1, alpha, beta, false, deadline, state, killers, null);
                engine.unmakeSearchMove(searchState);

                if (state.timeout) return bestScore;

                if (score > bestScore) bestScore = score;
                if (score > alpha) alpha = score;
                if (alpha >= beta) {
                    if (!m.captured && !m.isEnPassant) {
                        if (!killers[ply]) killers[ply] = [null, null];
                        killers[ply][1] = killers[ply][0];
                        killers[ply][0] = m;
                    }
                    break;
                }
            }
            return bestScore;
        } else {
            for (let i = 0; i < ordered.length; i++) {
                const m = ordered[i];
                const searchState = engine.makeSearchMove(m);
                const score = this.search(engine, depth - 1, ply + 1, alpha, beta, true, deadline, state, killers, null);
                engine.unmakeSearchMove(searchState);

                if (state.timeout) return bestScore;

                if (score < bestScore) bestScore = score;
                if (score < beta) beta = score;
                if (beta <= alpha) {
                    if (!m.captured && !m.isEnPassant) {
                        if (!killers[ply]) killers[ply] = [null, null];
                        killers[ply][1] = killers[ply][0];
                        killers[ply][0] = m;
                    }
                    break;
                }
            }
            return bestScore;
        }
    }

    /**
     * Local Search Engine (synchronous / fallback) with strict time budget
     */
    searchLocal(engine, difficulty = 'normal') {
        if (!engine) return null;
        const color = engine.turn;
        const isWhite = color === 'w';
        const legalMoves = engine.generateLegalMoves(color);
        if (legalMoves.length === 0) return null;
        if (legalMoves.length === 1) return legalMoves[0];

        if (difficulty === 'easy' && Math.random() < 0.4) {
            return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        // Mate in 1 quick check
        for (let i = 0; i < legalMoves.length; i++) {
            const m = legalMoves[i];
            const s = engine.makeSearchMove(m);
            const oppMoves = engine.generateLegalMoves(engine.turn);
            const isMate = oppMoves.length === 0 && engine.isKingInCheck(engine.turn);
            engine.unmakeSearchMove(s);
            if (isMate) return m;
        }

        let timeBudget = 1200;
        let maxSearchDepth = 4;
        if (difficulty === 'easy') {
            timeBudget = 350;
            maxSearchDepth = 2;
        } else if (difficulty === 'normal') {
            timeBudget = 1200;
            maxSearchDepth = 4;
        } else if (difficulty === 'hard' || difficulty === 'arcane') {
            timeBudget = 2500;
            maxSearchDepth = 5;
        }

        const deadline = Date.now() + timeBudget;
        let bestMoveOverall = legalMoves[0];
        let bestScoreOverall = isWhite ? -Infinity : Infinity;
        let pvMove = null;
        const killers = [];

        for (let currentDepth = 1; currentDepth <= maxSearchDepth; currentDepth++) {
            if (Date.now() >= deadline) break;

            const state = { nodes: 0, timeout: false };
            const ordered = this.sortMoves(legalMoves, engine, pvMove, null, null);

            let depthBestMove = ordered[0];
            let depthBestScore = isWhite ? -Infinity : Infinity;
            let alpha = -Infinity;
            let beta = Infinity;

            for (let i = 0; i < ordered.length; i++) {
                const m = ordered[i];
                const searchState = engine.makeSearchMove(m);
                const score = this.search(engine, currentDepth - 1, 1, alpha, beta, !isWhite, deadline, state, killers, null);
                engine.unmakeSearchMove(searchState);

                if (state.timeout) break;

                if (isWhite) {
                    if (score > depthBestScore) {
                        depthBestScore = score;
                        depthBestMove = m;
                    }
                    if (score > alpha) alpha = score;
                } else {
                    if (score < depthBestScore) {
                        depthBestScore = score;
                        depthBestMove = m;
                    }
                    if (score < beta) beta = score;
                }
            }

            if (!state.timeout) {
                bestMoveOverall = depthBestMove;
                bestScoreOverall = depthBestScore;
                pvMove = depthBestMove;
                if (Math.abs(bestScoreOverall) >= 40000) break;
            } else {
                break;
            }
        }

        return bestMoveOverall;
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
