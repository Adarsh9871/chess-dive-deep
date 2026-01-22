import { Chess, Move, Square, PieceSymbol } from "chess.js";

// Piece values for evaluation (centipawns)
const pieceValues: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Position tables for piece-square evaluation
const pawnTable = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 27, 27, 10, 5, 5],
  [0, 0, 0, 25, 25, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -25, -25, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const knightTable = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const bishopTable = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const rookTable = [
  [0, 0, 0, 5, 5, 0, 0, 0],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const queenTable = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 5, 0, -10],
  [-10, 0, 5, 5, 5, 5, 5, -10],
  [-5, 0, 5, 5, 5, 5, 0, 0],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const kingMiddleTable = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

const kingEndgameTable = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

const positionTables: Record<string, number[][]> = {
  p: pawnTable,
  n: knightTable,
  b: bishopTable,
  r: rookTable,
  q: queenTable,
  k: kingMiddleTable,
};

// Opening book for variety
const openingBook: Record<string, string[][]> = {
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1": [
    ["e2", "e4"], ["d2", "d4"], ["c2", "c4"], ["g1", "f3"]
  ],
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": [
    ["e7", "e5"], ["c7", "c5"], ["e7", "e6"], ["c7", "c6"], ["d7", "d5"]
  ],
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1": [
    ["d7", "d5"], ["g8", "f6"], ["e7", "e6"]
  ],
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": [
    ["g1", "f3"], ["f1", "c4"], ["b1", "c3"]
  ],
};

// Check if we're in endgame
function isEndgame(game: Chess): boolean {
  const board = game.board();
  let material = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type !== 'k' && piece.type !== 'p') {
        material += piece.type === 'q' ? 9 : (piece.type === 'r' ? 5 : 3);
      }
    }
  }
  
  return material <= 13;
}

// Simplified board evaluation - FAST
function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -99999 : 99999;
  }
  if (game.isDraw()) return 0;

  let score = 0;
  const board = game.board();
  const endgame = isEndgame(game);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = pieceValues[piece.type];
        const table = endgame && piece.type === 'k' ? kingEndgameTable : positionTables[piece.type];
        const tableValue = piece.color === "w" ? table[row][col] : table[7 - row][col];

        if (piece.color === "w") {
          score += value + tableValue;
        } else {
          score -= value + tableValue;
        }
      }
    }
  }

  // Mobility bonus (simplified)
  score += (game.turn() === 'w' ? 1 : -1) * game.moves().length * 2;

  return score;
}

// Move ordering for better pruning
function orderMoves(game: Chess, moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0, scoreB = 0;
    
    if (a.captured) scoreA += 1000 + pieceValues[a.captured] - pieceValues[a.piece];
    if (b.captured) scoreB += 1000 + pieceValues[b.captured] - pieceValues[b.piece];
    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;
    if (['d4', 'd5', 'e4', 'e5'].includes(a.to)) scoreA += 50;
    if (['d4', 'd5', 'e4', 'e5'].includes(b.to)) scoreB += 50;
    
    return scoreB - scoreA;
  });
}

// Simplified minimax with alpha-beta - optimized for speed
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = orderMoves(game, game.moves({ verbose: true }));

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      game.move(move);
      const score = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

// Get opening book move
function getOpeningMove(game: Chess): Move | null {
  const fen = game.fen();
  const bookMoves = openingBook[fen];
  
  if (bookMoves && bookMoves.length > 0) {
    const randomMove = bookMoves[Math.floor(Math.random() * bookMoves.length)];
    const [from, to] = randomMove;
    
    try {
      const move = game.move({ from: from as Square, to: to as Square });
      if (move) {
        game.undo();
        return move;
      }
    } catch {
      // Invalid move
    }
  }
  
  return null;
}

// Main bot move function - SIMPLIFIED and FAST
export function getBotMove(
  game: Chess,
  difficulty: "easy" | "medium" | "hard" | "expert" | "master"
): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Try opening book
  const bookMove = getOpeningMove(game);
  if (bookMove && Math.random() > 0.2) {
    return bookMove;
  }

  // Difficulty settings - FAST but stronger play
  const depths: Record<string, number> = {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 3,
    master: 4,
  };

  const randomFactors: Record<string, number> = {
    easy: 500,
    medium: 200,
    hard: 80,
    expert: 25,
    master: 5,
  };

  const depth = depths[difficulty];
  const isMaximizing = game.turn() === "w";
  const randomFactor = randomFactors[difficulty];

  // Score moves
  const scoredMoves: { move: Move; score: number }[] = [];

  for (const move of orderMoves(game, moves)) {
    game.move(move);
    let score = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
    score += (Math.random() - 0.5) * randomFactor;
    game.undo();
    scoredMoves.push({ move, score });
  }

  // Sort
  scoredMoves.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);

  // Add mistakes for easier difficulties
  if (difficulty === "easy" && scoredMoves.length > 2 && Math.random() < 0.4) {
    const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  if (difficulty === "medium" && scoredMoves.length > 2 && Math.random() < 0.2) {
    const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  return scoredMoves[0]?.move || null;
}

// Fast position analysis for suggestions with variety each time
export function analyzePositionFast(
  game: Chess,
  playerColor: "w" | "b",
  numSuggestions: number = 5
): { move: Move; score: number; label: string }[] {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return [];

  const opponentColor = playerColor === "w" ? "b" : "w";
  const scoredMoves: { move: Move; score: number; label: string }[] = [];

  // Randomize base variety factor for different suggestions each time
  const varietySeed = Math.random() * 100;

  for (const move of moves) {
    let score = 0;
    let label = "Safe";
    
    const testGame = new Chess(game.fen());
    testGame.move(move);
    
    if (testGame.isCheckmate()) {
      score = 100000;
      label = "Checkmate!";
    } else if (testGame.inCheck()) {
      score += 450 + Math.random() * 100;
      label = "Check";
    }
    
    if (move.captured) {
      const capturedValue = pieceValues[move.captured];
      const pieceValue = pieceValues[move.piece];
      const isRecapturable = testGame.isAttacked(move.to, opponentColor);
      
      if (!isRecapturable) {
        score += capturedValue * 140 + Math.random() * 50;
        label = "Free Capture";
      } else if (capturedValue > pieceValue) {
        score += (capturedValue - pieceValue) * 90 + Math.random() * 40;
        label = "Good Trade";
      } else if (capturedValue === pieceValue) {
        score += capturedValue * 40 + Math.random() * 30;
        label = "Trade";
      } else {
        score += capturedValue * 25 + Math.random() * 20;
        label = "Capture";
      }
    }
    
    if (move.flags.includes('k') || move.flags.includes('q')) {
      score += 280 + Math.random() * 60;
      if (label === "Safe") label = "Castle";
    }
    
    // Center control with variety
    if (['d4', 'd5', 'e4', 'e5'].includes(move.to)) {
      score += 70 + Math.random() * 40;
      if (label === "Safe") label = "Center";
    }
    
    // Piece development bonus
    if (move.piece === 'n' || move.piece === 'b') {
      const developSquares = ['c3', 'f3', 'c6', 'f6', 'c4', 'f4', 'b5', 'g5', 'd3', 'e3'];
      if (developSquares.includes(move.to)) {
        score += 60 + Math.random() * 30;
        if (label === "Safe") label = "Develop";
      }
    }

    // Attack bonus - does this move create new attacks?
    const attackedBefore = testGame.isAttacked(move.to, playerColor);
    if (!attackedBefore) {
      score += 20 + Math.random() * 20;
      if (label === "Safe") label = "Attack";
    }
    
    // HIGH random variance for different suggestions each time
    score += (Math.random() - 0.5) * 80 + varietySeed * (Math.random() - 0.5) * 0.5;
    
    scoredMoves.push({ move, score, label });
  }

  // Sort with slight randomization in equal scores
  scoredMoves.sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) < 15) return Math.random() - 0.5; // Randomize close scores
    return diff;
  });

  if (scoredMoves.length > 0) {
    scoredMoves[0].label = "Best";
  }

  // Ensure variety - if we have duplicates in types, shuffle slightly
  const topMoves = scoredMoves.slice(0, Math.min(numSuggestions + 2, scoredMoves.length));
  
  // Fisher-Yates partial shuffle for positions 1-3 to add variety
  for (let i = Math.min(3, topMoves.length - 1); i > 0; i--) {
    if (Math.random() < 0.3) { // 30% chance to swap
      const j = Math.floor(Math.random() * i) + 1;
      [topMoves[i], topMoves[j]] = [topMoves[j], topMoves[i]];
    }
  }

  return topMoves.slice(0, numSuggestions);
}

// Legacy alias
export function analyzePosition(
  game: Chess,
  playerColor: "w" | "b",
  numSuggestions: number = 5
): { move: Move; score: number; label: string }[] {
  return analyzePositionFast(game, playerColor, numSuggestions);
}
