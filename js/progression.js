/**
 * MAHŌ NO CHESU | Elemental Chess
 * js/progression.js - Player Progression, Interactive Academy, Chess Puzzles, Challenges & Mastery
 */

// =============================================================================
// 1. DATA DEFINITIONS: TUTORIAL LESSONS (Specs 5 - 26)
// =============================================================================
const TUTORIAL_LESSONS = [
    {
        id: 'lesson_board',
        title: '1. The Chessboard',
        category: 'basics',
        description: 'Learn the 64 squares, files (a-h), and ranks (1-8).',
        objective: 'Select the center square e4 to understand algebraic coordinates.',
        fen: '8/8/8/8/8/8/8/8 w - - 0 1',
        targetSquare: 28, // e4
        hints: [
            'Look at the bottom file labels (a-h) and side rank numbers (1-8).',
            'Find file "e" (5th column) and rank 4 (4th row from White side).',
            'Click on square e4.'
        ],
        type: 'select_square'
    },
    {
        id: 'lesson_pawn',
        title: '2. Pawn Movement',
        category: 'pieces',
        description: 'Pawns march forward one square, or two squares on their very first move.',
        objective: 'Advance your White Pawn two squares from e2 to e4.',
        fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
        solution: ['e2e4'],
        hints: [
            'Click on your White Pawn at e2.',
            'Notice the green legal destination dot on e4.',
            'Move the pawn to e4.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_knight',
        title: '3. Knight Movement',
        category: 'pieces',
        description: 'Knights leap in a distinct L-shape: two squares in one direction, then one square perpendicular.',
        objective: 'Leap your Knight from g1 to f3.',
        fen: '4k3/8/8/8/8/8/8/4K1N1 w - - 0 1',
        solution: ['g1f3'],
        hints: [
            'Knights can jump over other pieces.',
            'From g1, move 2 squares up and 1 square left.',
            'Move the Knight to f3.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_bishop',
        title: '4. Bishop Movement',
        category: 'pieces',
        description: 'Bishops glide diagonally any number of open squares across their native color.',
        objective: 'Glide your Light-squared Bishop from f1 to c4.',
        fen: '4k3/8/8/8/8/8/8/4KB2 w - - 0 1',
        solution: ['f1c4'],
        hints: [
            'Bishops always remain on squares of their starting color.',
            'Follow the open diagonal toward the center.',
            'Move your Bishop to c4.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_rook',
        title: '5. Rook Movement',
        category: 'pieces',
        description: 'Rooks command horizontal ranks and vertical files with heavy straight-line advances.',
        objective: 'Deploy your Rook from a1 to d1 along rank 1.',
        fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
        solution: ['a1d1'],
        hints: [
            'Rooks move straight horizontally or vertically.',
            'Slide your Rook toward the center along rank 1.',
            'Move your Rook to d1.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_queen',
        title: '6. Queen Movement',
        category: 'pieces',
        description: 'The Queen combines the straight power of the Rook and diagonal grace of the Bishop.',
        objective: 'Glide your Queen diagonally from d1 to h5.',
        fen: '4k3/8/8/8/8/8/8/3QK3 w - - 0 1',
        solution: ['d1h5'],
        hints: [
            'The Queen can move in any straight or diagonal line as far as the path is open.',
            'Locate the high kingside diagonal.',
            'Move your Queen to h5.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_king',
        title: '7. King Movement',
        category: 'pieces',
        description: 'The King steps exactly one square in any direction and must never step into an attack.',
        objective: 'Step your King safely from e1 to e2.',
        fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        solution: ['e1e2'],
        hints: [
            'The King is royal and moves with deliberate single steps.',
            'Step one square straight forward.',
            'Move your King to e2.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_capturing',
        title: '8. Capturing Pieces',
        category: 'combat',
        description: 'Capture enemy pieces by moving into their occupied square and claiming the ground.',
        objective: 'Capture the defenseless Black Pawn on d5 using your Bishop on c4.',
        fen: '4k3/8/8/3p4/2B5/8/8/4K3 w - - 0 1',
        solution: ['c4d5'],
        hints: [
            'Look at your Bishop at c4.',
            'The Black pawn on d5 lies directly along the diagonal.',
            'Move Bishop from c4 to d5 to capture.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_check',
        title: '9. Delivering Check',
        category: 'combat',
        description: 'Check means the enemy King is under direct elemental threat and must respond immediately.',
        objective: 'Give check to the Black King by moving your Queen to e7.',
        fen: '4k3/8/8/8/8/8/8/4QK2 w - - 0 1',
        solution: ['e1e7'],
        hints: [
            'A checking move directly threatens the enemy King square.',
            'Align your Queen on the same file as the Black King.',
            'Move Queen to e7 to deliver Check.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_escape_check',
        title: '10. Escaping Check',
        category: 'combat',
        description: 'When in check, you must respond: Move the King, Capture the attacker, or Block the line.',
        objective: 'Escape check by stepping your King from e1 to f1 away from the attacking Rook.',
        fen: '4r3/8/8/8/8/8/8/4K3 w - - 0 1',
        solution: ['e1f1'],
        hints: [
            'The Black Rook on e8 attacks the entire e-file.',
            'You cannot stay on the e-file.',
            'Move your King to f1.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_checkmate',
        title: '11. Checkmate',
        category: 'tactics',
        description: 'Checkmate occurs when the King is attacked and has no legal escape. The game concludes in victory!',
        objective: 'Deliver checkmate with Queen to f7.',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
        solution: ['f3f7'],
        hints: [
            'Look at the vulnerable f7 square protected only by the King.',
            'Your Bishop on c4 supports an attack on f7.',
            'Move Queen from f3 to f7 for checkmate.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_castling',
        title: '12. Castling',
        category: 'tactics',
        description: 'Castling shelters the King and activates the Rook in a single legal maneuver.',
        objective: 'Castle Kingside (O-O) by moving your King from e1 to g1.',
        fen: '4k3/8/8/8/8/8/8/4K2R w K - 0 1',
        solution: ['e1g1'],
        hints: [
            'Neither King nor Rook has moved, and the path between them is clear.',
            'Click King on e1 and target the g1 square.',
            'Castle kingside!'
        ],
        type: 'move'
    },
    {
        id: 'lesson_en_passant',
        title: '13. En Passant',
        category: 'tactics',
        description: 'If an enemy pawn leaps two squares past your pawn on rank 5, you may capture it diagonally behind.',
        objective: 'Execute the en passant capture with your pawn from e5 to d6.',
        fen: '4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1',
        solution: ['e5d6'],
        hints: [
            'Black just played e7-e5, bypassing d6.',
            'Your pawn on e5 can capture diagonally onto d6.',
            'Move pawn from e5 to d6.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_promotion',
        title: '14. Pawn Promotion',
        category: 'tactics',
        description: 'When a humble pawn reaches the 8th rank, it transforms into a Queen, Rook, Bishop, or Knight.',
        objective: 'Push your pawn from e7 to e8 to trigger Promotion.',
        fen: '4k3/4P3/8/8/8/8/8/4K3 w - - 0 1',
        solution: ['e7e8'],
        hints: [
            'The promotion square is directly ahead on e8.',
            'Advance your pawn to the final rank.',
            'Choose your ascended piece.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_draws',
        title: '15. Draws & Stalemate',
        category: 'tactics',
        description: 'Learn the conditions for a draw: Stalemate, 3-fold repetition, 50-move rule, or insufficient material.',
        objective: 'Step King to f7. Since Black King has no legal moves and is not in check, it is Stalemate!',
        fen: 'k7/8/1K6/8/8/8/8/8 w - - 0 1',
        solution: ['b6c7', 'b6a6'],
        hints: [
            'Stalemate occurs when a player has no legal moves but is NOT in check.',
            'Move King to c7 to leave the Black King without legal squares.',
            'Observe the stalemate draw.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_element_loadouts',
        title: '16. Element Loadouts',
        category: 'elements',
        description: 'Each piece can be imbued with one of 10 elemental affinities, altering its visual personality.',
        objective: 'In Mahō no Chesu, elemental magic enhances presentation while chess rules remain pristine.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        hints: [
            'Open the Element Loadout from the main menu or top bar.',
            'Try customizing your Knight to Lightning or Fire.',
            'Click Complete to finalize this lesson.'
        ],
        type: 'informational'
    },
    {
        id: 'lesson_element_reactions',
        title: '17. Element Reactions',
        category: 'elements',
        description: 'When an attacker clashes with a defending element, a cosmetic reaction erupts (e.g., Fire + Ice = Steam Burst).',
        objective: 'Test elemental reactions in real matches or in the Element Laboratory sandbox.',
        fen: '4k3/8/8/3b4/8/8/4N3/4K3 w - - 0 1',
        solution: ['e2d4'],
        hints: [
            'Captures showcase real-time elemental clashes.',
            'Capture the Bishop on d5 to trigger a reaction.',
            'Enjoy the elemental spectacle.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_element_synergy',
        title: '18. Element Synergy',
        category: 'elements',
        description: 'Equipping 3 or more pieces with the same element activates Army Synergy themes and custom board glows.',
        objective: 'A Pure Army (all 6 piece types of the same element) unlocks the ultimate elemental aura!',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        hints: [
            'Look at the golden board frame.',
            'When moving, your active synergy lights up the battlefield.',
            'Click Complete to finish this lesson.'
        ],
        type: 'informational'
    },
    {
        id: 'lesson_ascension',
        title: '19. Custom Ascension',
        category: 'elements',
        description: 'When promoting a pawn, you can choose its ascended piece, custom element, and visual transformation style.',
        objective: 'Ascend your pawn from b7 to b8 and witness the transformation.',
        fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1',
        solution: ['b7b8'],
        hints: [
            'Advance pawn to b8.',
            'Select your desired piece and element.',
            'Watch the Ascension sequence.'
        ],
        type: 'move'
    },
    {
        id: 'lesson_practice_match',
        title: '20. Complete Practice Match',
        category: 'practice',
        description: 'Test all your knowledge in a casual practice match against the Apprentice AI.',
        objective: 'Play a full game. Move hints are available to guide you to victory.',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        hints: [
            'Control the center with your pawns (e4 or d4).',
            'Develop your Knights and Bishops.',
            'Keep your King safe through castling.'
        ],
        type: 'informational'
    }
];

// =============================================================================
// 2. DATA DEFINITIONS: CHESS PUZZLES (Specs 30 - 37)
// =============================================================================
const CHESS_PUZZLES = [
    {
        id: 'puzzle_m1_01',
        title: 'Scholar\'s Lightning Strike',
        category: 'mate-in-1',
        difficulty: 'beginner',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
        sideToMove: 'w',
        solution: ['f3f7'],
        objective: 'Checkmate in 1 move',
        hint: 'Target the defenseless f7 pawn with your Queen, supported by the Bishop.',
        xpReward: 15
    },
    {
        id: 'puzzle_m1_02',
        title: 'Back Rank Tempest',
        category: 'back-rank',
        difficulty: 'beginner',
        fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
        sideToMove: 'w',
        solution: ['a1a8'],
        objective: 'Checkmate in 1 move',
        hint: 'The Black King is trapped behind its own shield of pawns.',
        xpReward: 15
    },
    {
        id: 'puzzle_m1_03',
        title: 'Smothered Shadow',
        category: 'mate-in-1',
        difficulty: 'intermediate',
        fen: '6rk/6pp/7N/8/8/8/8/4K3 w - - 0 1',
        sideToMove: 'w',
        solution: ['h6f7'],
        objective: 'Find the lethal checkmate',
        hint: 'A Knight leaps over all defenders to deliver checkmate to a trapped King.',
        xpReward: 20
    },
    {
        id: 'puzzle_m1_04',
        title: 'Queen & Bishop Battery',
        category: 'mate-in-1',
        difficulty: 'beginner',
        fen: '5rk1/5ppp/8/8/8/8/4Q3/6K1 w - - 0 1',
        sideToMove: 'w',
        solution: ['e2e8'],
        objective: 'Deliver checkmate on the baseline',
        hint: 'Directly assault the back rank.',
        xpReward: 15
    },
    {
        id: 'puzzle_fork_01',
        title: 'Royal Knight Fork',
        category: 'fork',
        difficulty: 'beginner',
        fen: 'r3k3/8/4N3/8/8/8/8/4K3 w - - 0 1',
        sideToMove: 'w',
        solution: ['e6c7'],
        objective: 'Fork King and Rook simultaneously',
        hint: 'Look for square c7 where the Knight threatens both King and Rook.',
        xpReward: 20
    },
    {
        id: 'puzzle_pin_01',
        title: 'Absolute Pin',
        category: 'pin',
        difficulty: 'intermediate',
        fen: '4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1',
        sideToMove: 'w',
        solution: ['e2e7'],
        objective: 'Exploit the absolute pin on the e-file',
        hint: 'The Black Rook cannot legally move away from the file of its King.',
        xpReward: 20
    },
    {
        id: 'puzzle_skewer_01',
        title: 'Celestial Skewer',
        category: 'skewer',
        difficulty: 'intermediate',
        fen: '4k2r/8/8/8/8/8/8/B3K3 b - - 0 1',
        sideToMove: 'b',
        solution: ['h8h1'],
        objective: 'Skewer King and Bishop',
        hint: 'Attack along the rank so the King must move, leaving the piece behind vulnerable.',
        xpReward: 25
    },
    {
        id: 'puzzle_promo_01',
        title: 'Ascension Breakthrough',
        category: 'promotion',
        difficulty: 'beginner',
        fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1',
        sideToMove: 'w',
        solution: ['b7b8q', 'b7b8'],
        objective: 'Promote pawn to Queen for overwhelming victory',
        hint: 'Push the pawn to the final rank.',
        xpReward: 15
    },
    {
        id: 'puzzle_m2_01',
        title: 'Anastasia\'s Mate in 2',
        category: 'mate-in-2',
        difficulty: 'advanced',
        fen: '5rk1/1p3ppp/8/3N4/8/8/5PPP/4R1K1 w - - 0 1',
        sideToMove: 'w',
        solution: ['d5e7', 'g8h8', 'e1e8'],
        followUpMove: 'g8h8',
        objective: 'Deliver checkmate in 2 moves',
        hint: 'Start with check from your Knight, forcing the King to the corner.',
        xpReward: 35
    },
    {
        id: 'puzzle_m2_02',
        title: 'Corridor Mate in 2',
        category: 'mate-in-2',
        difficulty: 'intermediate',
        fen: 'r4rk1/5ppp/8/8/8/8/1R6/1R4K1 w - - 0 1',
        sideToMove: 'w',
        solution: ['b2b8', 'a8b8', 'b1b8'],
        followUpMove: 'a8b8',
        objective: 'Break through the back rank in 2 moves',
        hint: 'Sacrifice or trade on b8 to clear the back rank.',
        xpReward: 30
    }
];

// =============================================================================
// 3. DATA DEFINITIONS: ACHIEVEMENTS (Specs 66 - 72)
// =============================================================================
const ACHIEVEMENTS_DEF = [
    {
        id: 'first_victory',
        name: 'First Victory',
        category: 'chess',
        description: 'Conquer your first completed match in any mode.',
        icon: '🏆',
        target: 1,
        xpReward: 50
    },
    {
        id: 'checkmate_master',
        name: 'Checkmate Finisher',
        category: 'chess',
        description: 'Deliver checkmate 5 times.',
        icon: '⚔️',
        target: 5,
        xpReward: 80
    },
    {
        id: 'castle_defense',
        name: 'Fortress Walls',
        category: 'chess',
        description: 'Castle kingside or queenside in a live match.',
        icon: '🏰',
        target: 1,
        xpReward: 30
    },
    {
        id: 'underpromotion',
        name: 'Tactical Metamorphosis',
        category: 'promotion',
        description: 'Promote a Pawn to a Knight, Bishop, or Rook instead of a Queen.',
        icon: '⚡',
        target: 1,
        xpReward: 60
    },
    {
        id: 'puzzle_initiate',
        name: 'Puzzle Initiate',
        category: 'puzzles',
        description: 'Solve 5 chess puzzles in the Training Academy.',
        icon: '🧩',
        target: 5,
        xpReward: 60
    },
    {
        id: 'tactical_mind',
        name: 'Tactical Mind',
        category: 'puzzles',
        description: 'Solve 10 chess puzzles without using hints.',
        icon: '🧠',
        target: 10,
        xpReward: 100
    },
    {
        id: 'pure_army_conquest',
        name: 'Pure Element Legion',
        category: 'elements',
        description: 'Complete a match using a Pure Element Army (all pieces same element).',
        icon: '🔥',
        target: 1,
        xpReward: 90
    },
    {
        id: 'master_of_elements',
        name: 'Elemental Concord',
        category: 'elements',
        description: 'Complete a match using an army with 6 unique elements.',
        icon: '🌈',
        target: 1,
        xpReward: 90
    },
    {
        id: 'academy_graduate',
        name: 'Grand Academy Graduate',
        category: 'special',
        description: 'Complete all 20 lessons in the Training Academy.',
        icon: '🎓',
        target: 20,
        xpReward: 200
    }
];

// =============================================================================
// 4. PROGRESSION MANAGER CLASS
// =============================================================================
class ProgressionManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'maho_chesu_progression_v1';
        this.schemaVersion = 1;

        // Default Progression State
        this.state = {
            schemaVersion: 1,
            playerLevel: 1,
            playerXp: 0,
            playerName: 'PLAYER',
            playerTitle: 'Apprentice',
            playerBadge: 'novice',
            favoriteElement: 'fire',
            completedLessons: [],
            solvedPuzzles: {}, // id -> { stars, bestScore, solvedAt }
            puzzleStreak: 0,
            lastDailyPuzzleDate: '',
            dailyChallenges: {
                dateKey: this.getTodayDateKey(),
                challenges: this.generateDailyChallenges(this.getTodayDateKey())
            },
            achievements: {},
            elementMastery: {
                fire: 0, lightning: 0, wind: 0, earth: 0, ice: 0,
                water: 0, light: 0, shadow: 0, nature: 0, arcane: 0
            },
            pieceMastery: {
                p: 0, n: 0, b: 0, r: 0, q: 0, k: 0
            },
            stats: {
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                checks: 0,
                checkmates: 0,
                promotions: 0,
                underpromotions: 0,
                captures: 0,
                pureArmiesPlayed: 0,
                concordArmiesPlayed: 0
            }
        };

        // Non-intrusive notification queue (Spec 110 & 111)
        this.rewardQueue = [];
        this.isProcessingQueue = false;

        this.loadProgression();
        this.checkDailyReset();
    }

    getTodayDateKey() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // =========================================================================
    // STORAGE & MIGRATION (Specs 79 - 82)
    // =========================================================================
    loadProgression() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                this.state = {
                    ...this.state,
                    ...parsed,
                    stats: { ...this.state.stats, ...(parsed.stats || {}) },
                    elementMastery: { ...this.state.elementMastery, ...(parsed.elementMastery || {}) },
                    pieceMastery: { ...this.state.pieceMastery, ...(parsed.pieceMastery || {}) }
                };
            }
        } catch (e) {
            console.error('[ProgressionManager] Failed to load progression:', e);
        }
    }

    saveProgression() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('[ProgressionManager] Save error:', e);
        }
    }

    resetProgression() {
        localStorage.removeItem(this.storageKey);
        window.location.reload();
    }

    // =========================================================================
    // LEVEL & XP PROGRESSION (Specs 49 - 56, 137)
    // =========================================================================
    getXpRequiredForNextLevel(level) {
        // Spec 50 formula: 100 + (level - 1) * 25
        return 100 + (Math.max(1, level) - 1) * 25;
    }

    addPlayerXp(amount, reason = '') {
        if (amount <= 0) return;

        let curLevel = this.state.playerLevel;
        let curXp = this.state.playerXp + amount;
        let leveledUp = false;

        // Multi-level-up safe overflow resolution (Spec 137)
        while (true) {
            const req = this.getXpRequiredForNextLevel(curLevel);
            if (curXp >= req) {
                curXp -= req;
                curLevel++;
                leveledUp = true;
            } else {
                break;
            }
        }

        this.state.playerLevel = curLevel;
        this.state.playerXp = curXp;
        this.saveProgression();

        if (leveledUp) {
            this.enqueueNotification({
                type: 'level_up',
                title: 'LEVEL UP!',
                subtitle: `You have reached Level ${curLevel}!`,
                icon: '⭐'
            });
            this.app.audio.playVictory();
        }

        this.updateProfileUI();
    }

    addMasteryXp(element, pieceType, amount = 10) {
        if (element && this.state.elementMastery[element] !== undefined) {
            this.state.elementMastery[element] += amount;
        }
        if (pieceType && this.state.pieceMastery[pieceType] !== undefined) {
            this.state.pieceMastery[pieceType] += amount;
        }
        this.saveProgression();
    }

    getMasteryLevel(xp) {
        return Math.floor(Math.sqrt((xp || 0) / 25)) + 1;
    }

    // =========================================================================
    // DAILY CHALLENGES SYSTEM (Specs 44 - 48, 94)
    // =========================================================================
    checkDailyReset() {
        const today = this.getTodayDateKey();
        if (this.state.dailyChallenges.dateKey !== today) {
            this.state.dailyChallenges = {
                dateKey: today,
                challenges: this.generateDailyChallenges(today)
            };
            this.saveProgression();
        }
    }

    generateDailyChallenges(dateKey) {
        const pool = [
            { id: 'win_match', text: 'Win 1 Match in any mode', type: 'wins', target: 1, current: 0, completed: false, xpReward: 35 },
            { id: 'solve_puzzles', text: 'Solve 3 Academy Puzzles', type: 'puzzles', target: 3, current: 0, completed: false, xpReward: 40 },
            { id: 'deliver_checks', text: 'Deliver 5 Checks to enemy Kings', type: 'checks', target: 5, current: 0, completed: false, xpReward: 30 },
            { id: 'promote_pawn', text: 'Promote 1 Pawn into any piece', type: 'promotions', target: 1, current: 0, completed: false, xpReward: 45 },
            { id: 'play_pure_army', text: 'Play a match with Pure Element Army', type: 'pure_army', target: 1, current: 0, completed: false, xpReward: 50 }
        ];

        let seed = 0;
        for (let i = 0; i < dateKey.length; i++) seed += dateKey.charCodeAt(i);
        const shuffled = [...pool].sort((a, b) => ((seed * 17) % 7) - ((seed * 13) % 5));
        return shuffled.slice(0, 3);
    }

    updateChallengeProgress(type, amount = 1) {
        this.checkDailyReset();
        let changed = false;

        this.state.dailyChallenges.challenges.forEach(ch => {
            if (ch.type === type && !ch.completed) {
                ch.current = Math.min(ch.target, ch.current + amount);
                if (ch.current >= ch.target) {
                    ch.completed = true;
                    this.addPlayerXp(ch.xpReward, `Challenge Completed: ${ch.text}`);
                    this.enqueueNotification({
                        type: 'challenge',
                        title: 'CHALLENGE COMPLETED',
                        subtitle: `${ch.text} (+${ch.xpReward} XP)`,
                        icon: '🎯'
                    });
                }
                changed = true;
            }
        });

        if (changed) this.saveProgression();
    }

    // =========================================================================
    // ACHIEVEMENTS TRACKER (Specs 66 - 73, 120)
    // =========================================================================
    checkAchievements(type, val = 1) {
        ACHIEVEMENTS_DEF.forEach(ach => {
            const currentAch = this.state.achievements[ach.id] || { progress: 0, unlocked: false };
            if (currentAch.unlocked) return;

            let updatedProgress = currentAch.progress;
            if (ach.id === 'first_victory' && type === 'win') updatedProgress = 1;
            if (ach.id === 'checkmate_master' && type === 'checkmate') updatedProgress += val;
            if (ach.id === 'castle_defense' && type === 'castle') updatedProgress = 1;
            if (ach.id === 'underpromotion' && type === 'underpromotion') updatedProgress = 1;
            if (ach.id === 'puzzle_initiate' && type === 'puzzle_solved') updatedProgress = Object.keys(this.state.solvedPuzzles).length;
            if (ach.id === 'pure_army_conquest' && type === 'pure_army') updatedProgress = 1;
            if (ach.id === 'master_of_elements' && type === 'concord_army') updatedProgress = 1;
            if (ach.id === 'academy_graduate' && type === 'lesson_completed') updatedProgress = this.state.completedLessons.length;

            currentAch.progress = updatedProgress;
            if (updatedProgress >= ach.target && !currentAch.unlocked) {
                currentAch.unlocked = true;
                currentAch.unlockedAt = new Date().toISOString();
                this.addPlayerXp(ach.xpReward, `Achievement: ${ach.name}`);
                this.enqueueNotification({
                    type: 'achievement',
                    title: 'ACHIEVEMENT UNLOCKED!',
                    subtitle: `${ach.name}: ${ach.description}`,
                    icon: ach.icon
                });
            }

            this.state.achievements[ach.id] = currentAch;
        });

        this.saveProgression();
    }

    // =========================================================================
    // MATCH REWARD & MASTERY AGGREGATOR (Specs 41 - 52, 83 - 86)
    // =========================================================================
    handleMatchCompleted({ winner, reason, gameMode, stats, whiteLoadout, blackLoadout }) {
        this.state.stats.gamesPlayed++;
        const isWin = (winner === 'White' || winner === 'Black');
        const isDraw = (winner === 'Draw');

        if (isDraw) {
            this.state.stats.draws++;
        } else if (winner === 'White') {
            this.state.stats.wins++;
        } else {
            this.state.stats.losses++;
        }

        if (reason && reason.toLowerCase().includes('checkmate')) {
            this.state.stats.checkmates++;
            this.checkAchievements('checkmate');
        }

        // Calculate XP (Spec 52)
        const matchXp = 20;
        const resultBonus = isDraw ? 8 : (isWin ? 15 : 5);
        const totalXp = matchXp + resultBonus;
        this.addPlayerXp(totalXp, `Completed Match (${winner})`);

        // Check Daily Challenges
        if (isWin) this.updateChallengeProgress('wins', 1);

        // Army Composition Achievements & Challenges
        if (whiteLoadout) {
            const whiteElems = Object.values(whiteLoadout);
            const isPure = new Set(whiteElems).size === 1;
            const isConcord = new Set(whiteElems).size >= 6;
            if (isPure) {
                this.state.stats.pureArmiesPlayed++;
                this.updateChallengeProgress('pure_army', 1);
                this.checkAchievements('pure_army');
            }
            if (isConcord) {
                this.state.stats.concordArmiesPlayed++;
                this.checkAchievements('concord_army');
            }
            // Add element mastery for used pieces
            whiteElems.forEach(elem => this.addMasteryXp(elem, null, 5));
        }

        // Stats tracking
        if (stats && stats.captures) {
            this.state.stats.captures += (stats.captures.white || 0) + (stats.captures.black || 0);
        }
        if (stats && stats.checks) {
            const checksCount = (stats.checks.white || 0) + (stats.checks.black || 0);
            this.state.stats.checks += checksCount;
            this.updateChallengeProgress('checks', checksCount);
        }
        if (stats && stats.promotions) {
            const promosCount = (stats.promotions.white || 0) + (stats.promotions.black || 0);
            this.state.stats.promotions += promosCount;
            this.updateChallengeProgress('promotions', promosCount);
        }

        if (isWin) this.checkAchievements('win');
        this.saveProgression();
    }

    // =========================================================================
    // NOTIFICATION QUEUE (Specs 110 & 111)
    // =========================================================================
    enqueueNotification(notif) {
        this.rewardQueue.push(notif);
        this.processQueue();
    }

    processQueue() {
        if (this.isProcessingQueue || this.rewardQueue.length === 0) return;
        this.isProcessingQueue = true;

        const notif = this.rewardQueue.shift();
        let container = document.getElementById('progression-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'progression-toast-container';
            container.className = 'progression-toast-container';
            document.body.appendChild(container);
        }

        let popup = document.getElementById('progression-toast');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'progression-toast';
            popup.className = 'progression-toast';
            container.appendChild(popup);
        }

        popup.innerHTML = `
            <div class="toast-icon">${notif.icon || '✨'}</div>
            <div class="toast-body">
                <span class="toast-title">${notif.title}</span>
                <span class="toast-sub">${notif.subtitle}</span>
            </div>
        `;
        popup.classList.add('visible');

        setTimeout(() => {
            popup.classList.remove('visible');
            setTimeout(() => {
                this.isProcessingQueue = false;
                this.processQueue();
            }, 300);
        }, 3200);
    }

    updateProfileUI() {
        const lvlEl = document.getElementById('profile-hud-level');
        if (lvlEl) lvlEl.textContent = `LVL ${this.state.playerLevel}`;
    }
}

// =============================================================================
// 5. LEARNING & PUZZLES CONTROLLER (ACADEMY MANAGER)
// =============================================================================
class LearningManager {
    constructor(app, progression) {
        this.app = app;
        this.progression = progression;

        this.activeMode = null; // null | 'tutorial' | 'puzzle'
        this.currentLesson = null;
        this.currentPuzzle = null;
        this.puzzleHintLevel = 0;
        this.puzzleAttempts = 0;
        this.puzzleMoveStep = 0;

        this.initDOMHooks();
    }

    initDOMHooks() {
        // Academy / Tutorials triggers
        const handleOpenAcademy = () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            this.openAcademyModal();
        };
        document.getElementById('menu-btn-academy')?.addEventListener('click', handleOpenAcademy);
        document.getElementById('menu-btn-tutorial')?.addEventListener('click', handleOpenAcademy);
        document.getElementById('btn-academy-toggle')?.addEventListener('click', handleOpenAcademy);

        // Puzzles triggers
        const handleOpenPuzzles = () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            this.openPuzzlesModal();
        };
        document.getElementById('menu-btn-puzzles')?.addEventListener('click', handleOpenPuzzles);
        document.getElementById('btn-puzzles-toggle')?.addEventListener('click', handleOpenPuzzles);

        // Daily Challenges triggers
        const handleOpenChallenges = () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            this.openChallengesModal();
        };
        document.getElementById('menu-btn-challenges')?.addEventListener('click', handleOpenChallenges);
        document.getElementById('btn-challenges-toggle')?.addEventListener('click', handleOpenChallenges);

        // Achievements triggers
        document.getElementById('menu-btn-achievements')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            this.openAchievementsModal();
        });

        // Profile triggers
        const handleOpenProfile = () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-main-menu')?.classList.remove('active');
            this.openProfileModal();
        };
        document.getElementById('menu-btn-profile')?.addEventListener('click', handleOpenProfile);
        document.getElementById('btn-profile-toggle')?.addEventListener('click', handleOpenProfile);

        // HUD Banner Action Buttons
        document.getElementById('btn-learning-hint')?.addEventListener('click', () => this.handleHintRequest());
        document.getElementById('btn-learning-restart')?.addEventListener('click', () => this.restartCurrentActivity());
        document.getElementById('btn-learning-exit')?.addEventListener('click', () => this.exitLearningMode());
        document.getElementById('btn-learning-skip')?.addEventListener('click', () => this.skipCurrentLesson());

        // Play Daily Puzzle button
        document.getElementById('btn-play-daily-puzzle')?.addEventListener('click', () => {
            this.app.audio.playUiClick();
            document.getElementById('modal-puzzles')?.classList.remove('active');
            const daily = this.getTodayDailyPuzzle();
            if (daily) this.startPuzzle(daily);
        });

        // Academy Category Filter Chips
        document.querySelectorAll('.academy-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.app.audio.playUiClick();
                document.querySelectorAll('.academy-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.openAcademyModal(e.currentTarget.dataset.filter || 'all');
            });
        });

        // Puzzle Category Filter Chips
        document.querySelectorAll('.puzzle-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.app.audio.playUiClick();
                document.querySelectorAll('.puzzle-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.openPuzzlesModal(e.currentTarget.dataset.category || 'all');
            });
        });

        // Achievements Filter Chips
        document.querySelectorAll('.ach-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.app.audio.playUiClick();
                document.querySelectorAll('.ach-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.openAchievementsModal(e.currentTarget.dataset.filter || 'all');
            });
        });

        // Profile Tab Switches
        document.querySelectorAll('.profile-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.app.audio.playUiClick();
                document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.profile-tab-pane').forEach(p => p.classList.add('hidden'));
                e.currentTarget.classList.add('active');
                const targetTab = e.currentTarget.dataset.tab;
                document.getElementById(`profile-tab-${targetTab}`)?.classList.remove('hidden');
            });
        });

        // Profile Name Editing
        const nameInput = document.getElementById('profile-name-input');
        nameInput?.addEventListener('change', (e) => {
            const val = (e.target.value || '').trim();
            if (val) {
                this.progression.state.playerName = val.toUpperCase().slice(0, 16);
                this.progression.saveProgression();
            }
        });

        // Profile Title Selection
        const titleSelect = document.getElementById('profile-title-select');
        titleSelect?.addEventListener('change', (e) => {
            this.progression.state.playerTitle = e.target.value;
            this.progression.saveProgression();
            const badge = document.getElementById('profile-title-badge');
            if (badge) badge.textContent = e.target.value;
        });

        // Profile Element Selection
        const elemSelect = document.getElementById('profile-element-select');
        elemSelect?.addEventListener('change', (e) => {
            this.progression.state.favoriteElement = e.target.value;
            this.progression.saveProgression();
            this.updateProfileAvatar(e.target.value);
        });

        // Reset Progression Confirmation
        document.getElementById('btn-reset-progression')?.addEventListener('click', () => {
            if (confirm('Reset all local progression? This will erase levels, mastery, achievements, and puzzle progress. This cannot be undone.')) {
                this.progression.resetProgression();
            }
        });
    }

    getTodayDailyPuzzle() {
        const today = this.progression.getTodayDateKey();
        let seed = 0;
        for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);
        const idx = seed % CHESS_PUZZLES.length;
        return CHESS_PUZZLES[idx] || CHESS_PUZZLES[0];
    }

    updateProfileAvatar(element) {
        const iconMap = {
            fire: '🔥', lightning: '⚡', wind: '🌪️', earth: '🛡️',
            ice: '❄️', water: '🌊', light: '✨', shadow: '🌑',
            nature: '🌿', arcane: '🔮'
        };
        const el = document.getElementById('profile-avatar-elem');
        if (el) el.textContent = iconMap[element] || '⚡';
    }

    // =========================================================================
    // TRAINING ACADEMY (TUTORIALS) (Specs 4 - 29)
    // =========================================================================
    openAcademyModal(filter = 'all') {
        const modal = document.getElementById('modal-academy');
        if (!modal) return;

        const listEl = document.getElementById('academy-lessons-grid');
        const progressVal = document.getElementById('academy-progress-val');
        const progressFill = document.getElementById('academy-progress-fill');
        const completedCount = this.progression.state.completedLessons.length;
        const total = TUTORIAL_LESSONS.length;
        const pct = Math.round((completedCount / total) * 100);

        if (progressVal) {
            progressVal.textContent = `${completedCount} / ${total} Lessons Complete (${pct}%)`;
        }
        if (progressFill) {
            progressFill.style.width = `${pct}%`;
        }

        if (listEl) {
            listEl.innerHTML = '';
            const filtered = filter === 'all'
                ? TUTORIAL_LESSONS
                : TUTORIAL_LESSONS.filter(l => l.category === filter);

            filtered.forEach((lesson) => {
                const globalIndex = TUTORIAL_LESSONS.findIndex(l => l.id === lesson.id);
                const isCompleted = this.progression.state.completedLessons.includes(lesson.id);
                const isLocked = globalIndex > 0 && !this.progression.state.completedLessons.includes(TUTORIAL_LESSONS[globalIndex - 1].id) && globalIndex > 2;

                const item = document.createElement('div');
                item.className = `academy-lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
                item.innerHTML = `
                    <div class="lesson-num">${globalIndex + 1}</div>
                    <div class="lesson-info">
                        <span class="lesson-title">${lesson.title}</span>
                        <span class="lesson-desc">${lesson.description}</span>
                    </div>
                    <div class="lesson-badge">${isCompleted ? '✓ DONE' : (isLocked ? '🔒' : 'START')}</div>
                `;

                if (!isLocked) {
                    item.addEventListener('click', () => {
                        this.app.audio.playUiClick();
                        modal.classList.remove('active');
                        this.startLesson(lesson);
                    });
                }
                listEl.appendChild(item);
            });
        }

        modal.classList.add('active');
    }

    startLesson(lesson) {
        this.activeMode = 'tutorial';
        this.currentLesson = lesson;
        this.puzzleHintLevel = 0;

        this.app.engine.loadFEN(lesson.fen);
        this.app.ui.setFlipped(false);
        this.app.ui.renderBoard();

        this.showLearningHUD({
            title: lesson.title,
            objective: lesson.objective,
            category: 'TRAINING LESSON',
            canSkip: true
        });
    }

    handleTutorialMove(move) {
        if (!this.currentLesson) return;

        const moveAlg = `${this.app.engine.squareToAlgebraic(move.from)}${this.app.engine.squareToAlgebraic(move.to)}`;
        const isMatch = this.currentLesson.solution && this.currentLesson.solution.some(s => s.startsWith(moveAlg));

        if (isMatch || this.currentLesson.type === 'informational' || this.currentLesson.type === 'select_square') {
            this.app.presentation.presentMove(move).then(() => {
                this.completeLesson(this.currentLesson);
            });
        } else {
            this.app.audio.playError();
            this.app.ui.setStatus('That move is legal, but not the requested lesson action. Follow the lesson objective!', false);
        }
    }

    completeLesson(lesson) {
        const isFirstTime = !this.progression.state.completedLessons.includes(lesson.id);
        if (isFirstTime) {
            this.progression.state.completedLessons.push(lesson.id);
            this.progression.addPlayerXp(15, `Lesson Completed: ${lesson.title}`);
            this.progression.checkAchievements('lesson_completed');
        }

        this.app.audio.playVictory();
        this.showLearningHUD({
            title: `✓ ${lesson.title} COMPLETE!`,
            objective: 'Lesson goal reached! Click NEXT to proceed.',
            nextBtnText: 'NEXT LESSON',
            onNext: () => {
                const nextIdx = TUTORIAL_LESSONS.findIndex(l => l.id === lesson.id) + 1;
                if (nextIdx < TUTORIAL_LESSONS.length) {
                    this.startLesson(TUTORIAL_LESSONS[nextIdx]);
                } else {
                    this.exitLearningMode();
                    this.openAcademyModal();
                }
            }
        });
    }

    skipCurrentLesson() {
        this.app.audio.playUiClick();
        const nextIdx = TUTORIAL_LESSONS.findIndex(l => l.id === this.currentLesson.id) + 1;
        if (nextIdx < TUTORIAL_LESSONS.length) {
            this.startLesson(TUTORIAL_LESSONS[nextIdx]);
        } else {
            this.exitLearningMode();
        }
    }

    // =========================================================================
    // CHESS PUZZLES ENGINE (Specs 30 - 43)
    // =========================================================================
    openPuzzlesModal(categoryFilter = 'all') {
        const modal = document.getElementById('modal-puzzles');
        if (!modal) return;

        const listEl = document.getElementById('puzzles-grid') || document.getElementById('puzzles-cards-grid');
        const today = this.progression.getTodayDateKey();
        const daily = this.getTodayDailyPuzzle();

        // Daily Banner Info
        const dailyTitle = document.getElementById('daily-puzzle-title');
        const dailyDesc = document.getElementById('daily-puzzle-desc');
        const dailyBadge = document.getElementById('daily-puzzle-status');

        if (dailyTitle) dailyTitle.textContent = daily ? daily.title : 'Daily Puzzle';
        if (dailyDesc) dailyDesc.textContent = daily ? daily.objective : 'Checkmate in one move.';
        if (dailyBadge) {
            const isDailyDone = this.progression.state.lastDailyPuzzleDate === today;
            dailyBadge.textContent = isDailyDone ? '✓ Solved Today (+30 XP claimed)' : 'Ready for Battle (+30 XP)';
        }

        if (listEl) {
            listEl.innerHTML = '';
            const filtered = categoryFilter === 'all'
                ? CHESS_PUZZLES
                : CHESS_PUZZLES.filter(p => p.category === categoryFilter);

            filtered.forEach((puzzle) => {
                const record = this.progression.state.solvedPuzzles[puzzle.id];
                const card = document.createElement('div');
                card.className = `puzzle-browser-card ${record ? 'solved' : ''}`;
                card.innerHTML = `
                    <div class="puzzle-header-row">
                        <span class="puzzle-cat-badge">${puzzle.category.toUpperCase()}</span>
                        <span class="puzzle-diff-tag diff-${puzzle.difficulty}">${puzzle.difficulty.toUpperCase()}</span>
                    </div>
                    <h4 class="puzzle-name">${puzzle.title}</h4>
                    <p class="puzzle-obj">${puzzle.objective}</p>
                    <div class="puzzle-footer-row">
                        <span class="puzzle-stars">${record ? '★'.repeat(record.stars || 3) : '☆☆☆'}</span>
                        <button type="button" class="btn-play-puzzle">${record ? 'RETRY' : 'SOLVE'}</button>
                    </div>
                `;

                card.querySelector('.btn-play-puzzle')?.addEventListener('click', () => {
                    this.app.audio.playUiClick();
                    modal.classList.remove('active');
                    this.startPuzzle(puzzle);
                });

                listEl.appendChild(card);
            });
        }

        modal.classList.add('active');
    }

    startPuzzle(puzzle) {
        this.activeMode = 'puzzle';
        this.currentPuzzle = puzzle;
        this.puzzleHintLevel = 0;
        this.puzzleAttempts = 0;
        this.puzzleMoveStep = 0;

        this.app.engine.loadFEN(puzzle.fen);
        this.app.ui.setFlipped(puzzle.sideToMove === 'b');
        this.app.ui.renderBoard();

        this.showLearningHUD({
            title: puzzle.title,
            objective: `${puzzle.objective} (${puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move)`,
            category: `PUZZLE • ${puzzle.difficulty.toUpperCase()}`,
            canSkip: false
        });
    }

    handlePuzzleMove(move) {
        if (!this.currentPuzzle) return;

        const moveAlg = `${this.app.engine.squareToAlgebraic(move.from)}${this.app.engine.squareToAlgebraic(move.to)}`;
        const expectedMove = this.currentPuzzle.solution[this.puzzleMoveStep];

        if (expectedMove && (expectedMove === moveAlg || expectedMove.startsWith(moveAlg))) {
            this.app.presentation.presentMove(move).then(() => {
                this.puzzleMoveStep++;

                if (this.currentPuzzle.followUpMove && this.puzzleMoveStep === 1) {
                    setTimeout(() => {
                        const oppFrom = this.app.engine.algebraicToSquare(this.currentPuzzle.followUpMove.slice(0, 2));
                        const oppTo = this.app.engine.algebraicToSquare(this.currentPuzzle.followUpMove.slice(2, 4));
                        const oppMove = { from: oppFrom, to: oppTo };
                        this.app.presentation.presentMove(oppMove).then(() => {
                            this.puzzleMoveStep++;
                            this.showLearningHUD({
                                title: this.currentPuzzle.title,
                                objective: 'Opponent responded! Now deliver the finishing strike!',
                                category: 'PUZZLE'
                            });
                        });
                    }, 500);
                } else if (this.puzzleMoveStep >= this.currentPuzzle.solution.length) {
                    this.completePuzzle(this.currentPuzzle);
                }
            });
        } else {
            this.puzzleAttempts++;
            this.app.audio.playError();
            this.app.ui.setStatus('Legal move, but not the puzzle solution. Try again!', false);

            setTimeout(() => {
                this.app.engine.loadFEN(this.currentPuzzle.fen);
                this.app.ui.renderBoard();
            }, 600);
        }
    }

    completePuzzle(puzzle) {
        const isFirstTime = !this.progression.state.solvedPuzzles[puzzle.id];
        const stars = Math.max(1, 3 - this.puzzleHintLevel);
        const score = Math.max(10, 100 - (this.puzzleHintLevel * 20) - (this.puzzleAttempts * 10));

        this.progression.state.solvedPuzzles[puzzle.id] = {
            stars,
            bestScore: score,
            solvedAt: new Date().toISOString()
        };

        const today = this.progression.getTodayDateKey();
        if (this.progression.state.lastDailyPuzzleDate !== today) {
            this.progression.state.lastDailyPuzzleDate = today;
            this.progression.state.puzzleStreak++;
        }

        if (isFirstTime) {
            this.progression.addPlayerXp(puzzle.xpReward || 20, `Puzzle Solved: ${puzzle.title}`);
            this.progression.updateChallengeProgress('puzzles', 1);
            this.progression.checkAchievements('puzzle_solved');
        }

        this.app.audio.playVictory();
        this.showLearningHUD({
            title: `✓ PUZZLE SOLVED! (${stars}★)`,
            objective: `Score: ${score}/100 • Stars: ${'★'.repeat(stars)}`,
            nextBtnText: 'PUZZLE BROWSER',
            onNext: () => {
                this.exitLearningMode();
                this.openPuzzlesModal();
            }
        });
    }

    // =========================================================================
    // HUD BAR & INTERACTIONS
    // =========================================================================
    showLearningHUD({ title, objective, category, canSkip = false, nextBtnText = null, onNext = null }) {
        const bar = document.getElementById('learning-action-hud');
        if (!bar) return;

        const catEl = document.getElementById('learning-hud-cat');
        const titleEl = document.getElementById('learning-hud-title');
        const objEl = document.getElementById('learning-hud-obj');
        const nextBtn = document.getElementById('btn-learning-next');
        const skipBtn = document.getElementById('btn-learning-skip');

        if (catEl) catEl.textContent = category || 'ACADEMY';
        if (titleEl) titleEl.textContent = title || '';
        if (objEl) objEl.textContent = objective || '';

        if (nextBtn) {
            if (nextBtnText) {
                nextBtn.classList.remove('hidden');
                nextBtn.textContent = nextBtnText;
                nextBtn.onclick = () => onNext && onNext();
            } else {
                nextBtn.classList.add('hidden');
            }
        }

        if (skipBtn) {
            skipBtn.classList.toggle('hidden', !canSkip);
        }

        bar.classList.add('visible');
    }

    handleHintRequest() {
        this.app.audio.playUiClick();
        this.puzzleHintLevel++;

        let hintText = 'No hint available.';
        if (this.activeMode === 'tutorial' && this.currentLesson) {
            const h = this.currentLesson.hints;
            const idx = Math.min(this.puzzleHintLevel - 1, h.length - 1);
            hintText = `Hint ${idx + 1}: ${h[idx]}`;
        } else if (this.activeMode === 'puzzle' && this.currentPuzzle) {
            hintText = `Hint: ${this.currentPuzzle.hint || 'Examine pieces controlling the enemy King.'}`;
        }

        this.app.ui.setStatus(hintText, false);
    }

    restartCurrentActivity() {
        this.app.audio.playUiClick();
        if (this.activeMode === 'tutorial' && this.currentLesson) {
            this.startLesson(this.currentLesson);
        } else if (this.activeMode === 'puzzle' && this.currentPuzzle) {
            this.startPuzzle(this.currentPuzzle);
        }
    }

    exitLearningMode() {
        this.app.audio.playUiClick();
        this.activeMode = null;
        this.currentLesson = null;
        this.currentPuzzle = null;

        const bar = document.getElementById('learning-action-hud');
        if (bar) bar.classList.remove('visible');

        this.app.startNewMatch(this.app.gameMode || 'pvp');
    }

    // =========================================================================
    // MODALS: CHALLENGES, ACHIEVEMENTS, PROFILE
    // =========================================================================
    openChallengesModal() {
        const modal = document.getElementById('modal-challenges');
        if (!modal) return;

        const listEl = document.getElementById('challenges-list') || document.getElementById('daily-challenges-list');
        const dateTag = document.getElementById('challenges-calendar-date') || document.getElementById('challenges-date-key');
        if (dateTag) dateTag.textContent = this.progression.state.dailyChallenges.dateKey;

        if (listEl) {
            listEl.innerHTML = '';
            this.progression.state.dailyChallenges.challenges.forEach(ch => {
                const item = document.createElement('div');
                item.className = `challenge-row-card ${ch.completed ? 'completed' : ''}`;
                const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
                item.innerHTML = `
                    <div class="ch-info">
                        <span class="ch-text">${ch.text}</span>
                        <div class="ch-bar-wrap">
                            <div class="ch-bar-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                    <div class="ch-progress-tag">${ch.current} / ${ch.target} (${ch.completed ? '✓ CLAIMED' : `+${ch.xpReward} XP`})</div>
                `;
                listEl.appendChild(item);
            });
        }

        modal.classList.add('active');
    }

    openAchievementsModal(filter = 'all') {
        const modal = document.getElementById('modal-achievements');
        if (!modal) return;

        const listEl = document.getElementById('achievements-grid') || document.getElementById('achievements-cards-grid');
        const countDisplay = document.getElementById('achievements-count-display');

        const unlockedCount = Object.values(this.progression.state.achievements).filter(a => a.unlocked).length;
        if (countDisplay) {
            countDisplay.textContent = `${unlockedCount} / ${ACHIEVEMENTS_DEF.length} Unlocked`;
        }

        if (listEl) {
            listEl.innerHTML = '';
            const filtered = filter === 'all'
                ? ACHIEVEMENTS_DEF
                : ACHIEVEMENTS_DEF.filter(a => a.category === filter);

            filtered.forEach(ach => {
                const record = this.progression.state.achievements[ach.id] || { progress: 0, unlocked: false };
                const item = document.createElement('div');
                item.className = `achievement-card ${record.unlocked ? 'unlocked' : ''}`;
                item.innerHTML = `
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-details">
                        <span class="ach-name">${ach.name}</span>
                        <span class="ach-desc">${ach.description}</span>
                        <div class="ach-progress-sub">${record.unlocked ? '✓ UNLOCKED' : `Progress: ${record.progress} / ${ach.target}`}</div>
                    </div>
                    <div class="ach-reward">+${ach.xpReward} XP</div>
                `;
                listEl.appendChild(item);
            });
        }

        modal.classList.add('active');
    }

    openProfileModal() {
        const modal = document.getElementById('modal-profile');
        if (!modal) return;

        const p = this.progression.state;
        const reqXp = this.progression.getXpRequiredForNextLevel(p.playerLevel);
        const winRate = p.stats.gamesPlayed > 0 ? Math.round((p.stats.wins / p.stats.gamesPlayed) * 100) : 0;

        // Populate Hero Card
        const nameInput = document.getElementById('profile-name-input');
        if (nameInput) nameInput.value = p.playerName || 'PLAYER';

        const lvlBadge = document.getElementById('profile-level-badge');
        if (lvlBadge) lvlBadge.textContent = `Level ${p.playerLevel}`;

        const titleBadge = document.getElementById('profile-title-badge');
        if (titleBadge) titleBadge.textContent = p.playerTitle || 'Apprentice';

        const xpCounter = document.getElementById('profile-xp-counter');
        if (xpCounter) xpCounter.textContent = `${p.playerXp} / ${reqXp} XP`;

        const xpFill = document.getElementById('profile-xp-fill');
        if (xpFill) xpFill.style.width = `${Math.min(100, Math.round((p.playerXp / reqXp) * 100))}%`;

        this.updateProfileAvatar(p.favoriteElement || 'fire');

        // Available Titles Dropdown
        const titleSelect = document.getElementById('profile-title-select');
        if (titleSelect && titleSelect.options.length === 0) {
            const titles = ['Apprentice', 'Tactician', 'Element Adept', 'Board Scholar', 'Knight Specialist', 'Ascension Master', 'Elemental Strategist', 'Grand Conjurer'];
            titles.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                titleSelect.appendChild(opt);
            });
            titleSelect.value = p.playerTitle || 'Apprentice';
        }

        // Available Elements Dropdown
        const elemSelect = document.getElementById('profile-element-select');
        if (elemSelect && elemSelect.options.length === 0) {
            const elems = ['fire', 'lightning', 'wind', 'earth', 'ice', 'water', 'light', 'shadow', 'nature', 'arcane'];
            elems.forEach(el => {
                const opt = document.createElement('option');
                opt.value = el;
                opt.textContent = el.toUpperCase();
                elemSelect.appendChild(opt);
            });
            elemSelect.value = p.favoriteElement || 'fire';
        }

        // Tab 1: Stats Grid
        const statsGrid = document.getElementById('profile-stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-box"><span class="sb-label">GAMES PLAYED</span><strong class="sb-val">${p.stats.gamesPlayed}</strong></div>
                <div class="stat-box"><span class="sb-label">VICTORIES</span><strong class="sb-val">${p.stats.wins}</strong></div>
                <div class="stat-box"><span class="sb-label">WIN RATE</span><strong class="sb-val">${p.stats.gamesPlayed > 0 ? winRate + '%' : 'N/A'}</strong></div>
                <div class="stat-box"><span class="sb-label">TOTAL CAPTURES</span><strong class="sb-val">${p.stats.captures}</strong></div>
                <div class="stat-box"><span class="sb-label">CHECKS DELIVERED</span><strong class="sb-val">${p.stats.checks}</strong></div>
                <div class="stat-box"><span class="sb-label">CHECKMATES</span><strong class="sb-val">${p.stats.checkmates}</strong></div>
                <div class="stat-box"><span class="sb-label">PUZZLES SOLVED</span><strong class="sb-val">${Object.keys(p.solvedPuzzles).length}</strong></div>
                <div class="stat-box"><span class="sb-label">PUZZLE STREAK</span><strong class="sb-val">${p.puzzleStreak} Days</strong></div>
                <div class="stat-box"><span class="sb-label">ACADEMY LESSONS</span><strong class="sb-val">${p.completedLessons.length} / ${TUTORIAL_LESSONS.length}</strong></div>
            `;
        }

        // Tab 2: Element Mastery Grid (10 Elements)
        const elemMasteryGrid = document.getElementById('profile-element-mastery-grid') || document.getElementById('profile-elem-mastery-grid');
        if (elemMasteryGrid) {
            elemMasteryGrid.innerHTML = '';
            const allElements = ['fire', 'lightning', 'wind', 'earth', 'ice', 'water', 'light', 'shadow', 'nature', 'arcane'];
            allElements.forEach(elem => {
                const xp = p.elementMastery[elem] || 0;
                const lvl = this.progression.getMasteryLevel(xp);
                const item = document.createElement('div');
                item.className = 'mastery-card';
                item.innerHTML = `
                    <div class="m-card-head">
                        <span class="m-elem-name">${elem.toUpperCase()}</span>
                        <span class="m-lvl-tag">LVL ${lvl}</span>
                    </div>
                    <div class="m-xp-text">${xp} XP</div>
                    <div class="m-bar"><div class="m-fill" style="width: ${Math.min(100, (xp % 100))}%"></div></div>
                `;
                elemMasteryGrid.appendChild(item);
            });
        }

        // Tab 3: Piece Mastery Grid (6 Pieces)
        const pieceMasteryGrid = document.getElementById('profile-piece-mastery-grid');
        if (pieceMasteryGrid) {
            pieceMasteryGrid.innerHTML = '';
            const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
            Object.keys(pieceNames).forEach(pt => {
                const xp = p.pieceMastery[pt] || 0;
                const lvl = this.progression.getMasteryLevel(xp);
                const item = document.createElement('div');
                item.className = 'mastery-card';
                item.innerHTML = `
                    <div class="m-card-head">
                        <span class="m-elem-name">${pieceNames[pt]}</span>
                        <span class="m-lvl-tag">LVL ${lvl}</span>
                    </div>
                    <div class="m-xp-text">${xp} XP</div>
                    <div class="m-bar"><div class="m-fill" style="width: ${Math.min(100, (xp % 100))}%"></div></div>
                `;
                pieceMasteryGrid.appendChild(item);
            });
        }

        modal.classList.add('active');
    }
}
