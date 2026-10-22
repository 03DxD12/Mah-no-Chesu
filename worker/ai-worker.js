/**
 * MAHŌ NO CHESU | Elemental Chess
 * worker/ai-worker.js - Dedicated Background Web Worker for Minimax & Alpha-Beta Search
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

function evaluateBoard(engine) {
    let score = 0;
    const board = engine.board;

    for (let sq = 0; sq < 64; sq++) {
        const piece = board[sq];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type];
        const rank = Math.floor(sq / 8);
        const file = sq % 8;
        const pstIndex = piece.color === 'w' ? (7 - rank) * 8 + file : rank * 8 + file;
        const pstVal = PST[piece.type][pstIndex] || 0;

        const total = val + pstVal;
        score += piece.color === 'w' ? total : -total;
    }
    return score;
}

function orderMoves(moves, engine) {
    return moves.sort((a, b) => {
        const pieceA = engine.board[a.from];
        const pieceB = engine.board[b.from];
        const targetA = a.captured || engine.board[a.to];
        const targetB = b.captured || engine.board[b.to];

        let scoreA = 0;
        let scoreB = 0;

        if (targetA) {
            scoreA = 10 * PIECE_VALUES[targetA.type] - PIECE_VALUES[pieceA.type];
        }
        if (targetB) {
            scoreB = 10 * PIECE_VALUES[targetB.type] - PIECE_VALUES[pieceB.type];
        }

        if (a.promotion) scoreA += 800;
        if (b.promotion) scoreB += 800;

        return scoreB - scoreA;
    });
}

function minimax(engine, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return evaluateBoard(engine);
    }

    const legalMoves = engine.generateLegalMoves(engine.turn);

    if (legalMoves.length === 0) {
        if (engine.isKingInCheck(engine.turn)) {
            return isMaximizing ? -99999 - depth : 99999 + depth;
        }
        return 0; // Stalemate
    }

    const ordered = orderMoves(legalMoves, engine);

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < ordered.length; i++) {
            engine.makeMove(ordered[i]);
            const ev = minimax(engine, depth - 1, alpha, beta, false);
            engine.unmakeMove();
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < ordered.length; i++) {
            engine.makeMove(ordered[i]);
            const ev = minimax(engine, depth - 1, alpha, beta, true);
            engine.unmakeMove();
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

self.onmessage = function(e) {
    const { fen, depth, difficulty } = e.data;
    if (!fen) {
        self.postMessage({ bestMove: null });
        return;
    }

    const engine = new ChessEngine();
    engine.loadFEN(fen);

    const color = engine.turn;
    const isWhite = color === 'w';
    const legalMoves = engine.generateLegalMoves(color);

    if (legalMoves.length === 0) {
        self.postMessage({ bestMove: null });
        return;
    }

    const ordered = orderMoves(legalMoves, engine);

    // Easy mode random variation
    if (difficulty === 'easy' && Math.random() < 0.35) {
        const randomPick = ordered[Math.floor(Math.random() * Math.min(3, ordered.length))];
        self.postMessage({ bestMove: randomPick });
        return;
    }

    let bestMove = ordered[0];
    let bestValue = isWhite ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (let i = 0; i < ordered.length; i++) {
        const move = ordered[i];
        engine.makeMove(move);
        const moveValue = minimax(engine, depth - 1, alpha, beta, !isWhite);
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

    self.postMessage({ bestMove });
};
