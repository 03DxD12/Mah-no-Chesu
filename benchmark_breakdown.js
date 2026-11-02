const fs = require('fs');
globalThis.window = globalThis;
eval(fs.readFileSync('js/chess.js', 'utf8'));

const engine = new ChessEngine();
console.log('Benchmarking 100,000 makeMove + unmakeMove cycles:');

const start1 = performance.now();
const m = { from: 12, to: 28, isDoublePawnPush: true }; // e2-e4
for (let i = 0; i < 50000; i++) {
    engine.makeMove(m);
    engine.unmakeMove();
}
const elapsed1 = performance.now() - start1;
console.log('50,000 makeMove/unmakeMove with getPositionKey():', elapsed1.toFixed(1), 'ms');

// Now test with a lightweight makeSearchMove / unmakeSearchMove
ChessEngine.prototype.makeSearchMove = function(move) {
    const piece = this.board[move.from];
    const captured = this.board[move.to];
    this.searchStack = this.searchStack || [];
    this.searchStack.push({
        move,
        piece,
        captured,
        castlingWk: this.castling.w.k,
        castlingWq: this.castling.w.q,
        castlingBk: this.castling.b.k,
        castlingBq: this.castling.b.q,
        epSquare: this.epSquare,
        turn: this.turn
    });

    if (move.isDoublePawnPush) {
        this.epSquare = (move.from + move.to) >> 1;
    } else {
        this.epSquare = null;
    }

    if (piece.type === 'k') {
        this.castling[piece.color].k = false;
        this.castling[piece.color].q = false;
    } else if (piece.type === 'r') {
        if (move.from === 0) this.castling.w.q = false;
        else if (move.from === 7) this.castling.w.k = false;
        else if (move.from === 56) this.castling.b.q = false;
        else if (move.from === 63) this.castling.b.k = false;
    }

    this.board[move.to] = move.promotion ? { type: move.promotion, color: piece.color } : piece;
    this.board[move.from] = null;
    this.turn = this.turn === 'w' ? 'b' : 'w';
};

ChessEngine.prototype.unmakeSearchMove = function() {
    const s = this.searchStack.pop();
    this.turn = s.turn;
    this.board[s.move.from] = s.piece;
    this.board[s.move.to] = s.captured;
    this.castling.w.k = s.castlingWk;
    this.castling.w.q = s.castlingWq;
    this.castling.b.k = s.castlingBk;
    this.castling.b.q = s.castlingBq;
    this.epSquare = s.epSquare;
};

const start2 = performance.now();
for (let i = 0; i < 50000; i++) {
    engine.makeSearchMove(m);
    engine.unmakeSearchMove();
}
const elapsed2 = performance.now() - start2;
console.log('50,000 makeSearchMove/unmakeSearchMove:', elapsed2.toFixed(1), 'ms');
console.log('Speedup factor:', (elapsed1 / elapsed2).toFixed(1) + 'x faster!');

