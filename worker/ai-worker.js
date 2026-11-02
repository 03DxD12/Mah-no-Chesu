/**
 * MAHŌ NO CHESU | Elemental Chess
 * worker/ai-worker.js - Dedicated Background Web Worker for Minimax & Alpha-Beta Search
 * Iterative Deepening with Hard Time Budgets, Move Ordering, and Quiescence Search
 */

/* global importScripts, ChessEngine */
try {
    importScripts('../js/chess.js');
} catch (e) {
    console.error('Failed to import chess engine in worker:', e);
}

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

const PST = {
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

// Static Evaluation
function evaluateBoard(engine) {
    let score = 0;
    const board = engine.board;

    for (let sq = 0; sq < 64; sq++) {
        const piece = board[sq];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type] || 0;
        const pstIndex = piece.color === 'w' ? (63 - sq) : sq;
        const pstVal = PST[piece.type] ? PST[piece.type][pstIndex] : 0;
        const total = val + pstVal;

        if (piece.color === 'w') {
            score += total;
        } else {
            score -= total;
        }
    }

    return score;
}

// Move Ordering: PV move, Captures (MVV-LVA), Killer moves
function scoreMove(move, engine, pvMove, killer1, killer2) {
    if (pvMove && move.from === pvMove.from && move.to === pvMove.to && move.promotion === pvMove.promotion) {
        return 1000000;
    }

    const piece = engine.board[move.from];
    const captured = engine.board[move.to] || (move.isEnPassant ? { type: 'p' } : null);

    if (captured) {
        const victimVal = PIECE_VALUES[captured.type] || 100;
        const attackerVal = piece ? (PIECE_VALUES[piece.type] || 100) : 100;
        return 100000 + (victimVal * 10) - attackerVal;
    }

    if (move.promotion) {
        return 90000 + (PIECE_VALUES[move.promotion] || 0);
    }

    if (killer1 && move.from === killer1.from && move.to === killer1.to) {
        return 80000;
    }
    if (killer2 && move.from === killer2.from && move.to === killer2.to) {
        return 70000;
    }

    return 0;
}

function sortMoves(moves, engine, pvMove, killer1, killer2) {
    const scores = moves.map(m => scoreMove(m, engine, pvMove, killer1, killer2));
    const indices = moves.map((_, i) => i);
    indices.sort((a, b) => scores[b] - scores[a]);
    return indices.map(i => moves[i]);
}

// Quiescence Search for Tactical Captures
function quiescence(engine, alpha, beta, isMaximizing, deadline, state) {
    state.nodes++;
    if ((state.nodes & 511) === 0 && Date.now() >= deadline) {
        state.timeout = true;
        return isMaximizing ? alpha : beta;
    }

    const standPat = evaluateBoard(engine);

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

    const ordered = sortMoves(captures, engine, null, null, null);

    if (isMaximizing) {
        for (let i = 0; i < ordered.length; i++) {
            const m = ordered[i];
            const searchState = engine.makeSearchMove(m);
            const score = quiescence(engine, alpha, beta, false, deadline, state);
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
            const score = quiescence(engine, alpha, beta, true, deadline, state);
            engine.unmakeSearchMove(searchState);

            if (state.timeout) return beta;
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
        return beta;
    }
}

// Alpha-Beta Minimax Search with Killer Moves
function search(engine, depth, ply, alpha, beta, isMaximizing, deadline, state, killers, pvMove) {
    state.nodes++;
    if ((state.nodes & 511) === 0 && Date.now() >= deadline) {
        state.timeout = true;
        return isMaximizing ? alpha : beta;
    }

    if (depth <= 0) {
        return quiescence(engine, alpha, beta, isMaximizing, deadline, state);
    }

    const moves = engine.generateLegalMoves(engine.turn);
    if (moves.length === 0) {
        if (engine.isKingInCheck(engine.turn)) {
            return isMaximizing ? (-50000 + ply) : (50000 - ply);
        }
        return 0; // Stalemate
    }

    const k1 = killers[ply] ? killers[ply][0] : null;
    const k2 = killers[ply] ? killers[ply][1] : null;
    const ordered = sortMoves(moves, engine, pvMove, k1, k2);

    let bestScore = isMaximizing ? -Infinity : Infinity;

    if (isMaximizing) {
        for (let i = 0; i < ordered.length; i++) {
            const m = ordered[i];
            const searchState = engine.makeSearchMove(m);
            const score = search(engine, depth - 1, ply + 1, alpha, beta, false, deadline, state, killers, null);
            engine.unmakeSearchMove(searchState);

            if (state.timeout) return bestScore;

            if (score > bestScore) {
                bestScore = score;
            }
            if (score > alpha) {
                alpha = score;
            }
            if (alpha >= beta) {
                // Killer move store
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
            const score = search(engine, depth - 1, ply + 1, alpha, beta, true, deadline, state, killers, null);
            engine.unmakeSearchMove(searchState);

            if (state.timeout) return bestScore;

            if (score < bestScore) {
                bestScore = score;
            }
            if (score < beta) {
                beta = score;
            }
            if (beta <= alpha) {
                // Killer move store
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

// Top-Level Iterative Deepening Search with Strict Time Limits
function findBestMove(fen, options = {}) {
    const engine = new ChessEngine(fen);
    const color = engine.turn;
    const isWhite = color === 'w';
    const legalMoves = engine.generateLegalMoves(color);

    if (legalMoves.length === 0) {
        return { bestMove: null, depth: 0, nodes: 0, time: 0, score: 0 };
    }

    if (legalMoves.length === 1) {
        return { bestMove: legalMoves[0], depth: 1, nodes: 1, time: 0, score: 0 };
    }

    const difficulty = options.difficulty || 'normal';

    // Easy mode random variation
    if (difficulty === 'easy') {
        if (Math.random() < 0.4) {
            const pick = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            return { bestMove: pick, depth: 1, nodes: legalMoves.length, time: 100, score: 0 };
        }
    }

    // Check for immediate mate-in-1
    for (let i = 0; i < legalMoves.length; i++) {
        const m = legalMoves[i];
        const s = engine.makeSearchMove(m);
        const oppMoves = engine.generateLegalMoves(engine.turn);
        const isMate = oppMoves.length === 0 && engine.isKingInCheck(engine.turn);
        engine.unmakeSearchMove(s);
        if (isMate) {
            return { bestMove: m, depth: 1, nodes: i + 1, time: 5, score: isWhite ? 50000 : -50000 };
        }
    }

    // Time budget by difficulty (Specs: Easy 400ms, Normal 1200ms, Hard/Arcane 3000ms max)
    let timeBudget = 1200;
    let maxSearchDepth = 4;
    if (difficulty === 'easy') {
        timeBudget = 350;
        maxSearchDepth = 2;
    } else if (difficulty === 'normal') {
        timeBudget = 1200;
        maxSearchDepth = 4;
    } else if (difficulty === 'hard' || difficulty === 'arcane') {
        timeBudget = 2800; // Hard ceiling 3.0s, giving ample safety on mobile
        maxSearchDepth = 6;
    }

    const startTime = Date.now();
    const deadline = startTime + timeBudget;

    let bestMoveOverall = legalMoves[0];
    let bestScoreOverall = isWhite ? -Infinity : Infinity;
    let completedDepth = 1;
    let totalNodes = 0;
    let pvMove = null;

    const killers = [];

    // Iterative Deepening
    for (let currentDepth = 1; currentDepth <= maxSearchDepth; currentDepth++) {
        if (Date.now() >= deadline) break;

        const state = { nodes: 0, timeout: false };
        const ordered = sortMoves(legalMoves, engine, pvMove, null, null);

        let depthBestMove = ordered[0];
        let depthBestScore = isWhite ? -Infinity : Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (let i = 0; i < ordered.length; i++) {
            const m = ordered[i];
            const searchState = engine.makeSearchMove(m);
            const score = search(engine, currentDepth - 1, 1, alpha, beta, !isWhite, deadline, state, killers, null);
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

        totalNodes += state.nodes;

        if (!state.timeout) {
            completedDepth = currentDepth;
            bestMoveOverall = depthBestMove;
            bestScoreOverall = depthBestScore;
            pvMove = depthBestMove;

            // Mate found: stop early
            if (Math.abs(bestScoreOverall) >= 40000) break;
        } else {
            break;
        }
    }

    const elapsed = Date.now() - startTime;
    const nps = elapsed > 0 ? Math.round((totalNodes / elapsed) * 1000) : totalNodes;

    return {
        bestMove: bestMoveOverall,
        depth: completedDepth,
        nodes: totalNodes,
        time: elapsed,
        nps,
        score: bestScoreOverall
    };
}

// Worker message handling with request ID and cancellation support
self.onmessage = function(e) {
    const { fen, depth, difficulty, personality, requestId } = e.data;
    try {
        const result = findBestMove(fen, { depth, difficulty, personality });
        self.postMessage({
            bestMove: result.bestMove,
            depth: result.depth,
            nodes: result.nodes,
            time: result.time,
            nps: result.nps,
            score: result.score,
            requestId
        });
    } catch (err) {
        console.error('Worker AI Search Error:', err);
        // Fallback to legal move if any uncaught error
        try {
            const fallbackEngine = new ChessEngine(fen);
            const legals = fallbackEngine.generateLegalMoves(fallbackEngine.turn);
            self.postMessage({
                bestMove: legals[0] || null,
                depth: 1,
                nodes: 1,
                time: 0,
                score: 0,
                requestId
            });
        } catch {
            self.postMessage({ bestMove: null, requestId });
        }
    }
};
