import { useState, useCallback, useMemo, memo } from "react";
import { Chess, Square, PieceSymbol, Color } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  playerColor: Color;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  showHints?: boolean;
  highlightedSquares?: { from: Square; to: Square } | null;
}

// Premium chess piece symbols using Unicode
const pieceSymbols: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

const ChessBoard = memo(({
  game,
  onMove,
  playerColor,
  disabled = false,
  lastMove,
  showHints = true,
  highlightedSquares,
}: ChessBoardProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [promotionSquare, setPromotionSquare] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<Square | null>(null);

  const isFlipped = playerColor === "b";

  // Memoize the board state
  const boardState = useMemo(() => {
    const state: Record<string, { type: string; color: string } | null> = {};
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const square = `${files[f]}${ranks[r]}` as Square;
        const piece = game.get(square);
        state[square] = piece ? { type: piece.type, color: piece.color } : null;
      }
    }
    return state;
  }, [game.fen()]);

  // Find king in check
  const kingInCheckSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const square = `${files[f]}${ranks[r]}` as Square;
        const piece = game.get(square);
        if (piece?.type === "k" && piece.color === turn) return square;
      }
    }
    return null;
  }, [game.fen()]);

  // Arrow coordinates for suggestions
  const arrowCoords = useMemo(() => {
    if (!highlightedSquares) return null;
    const { from, to } = highlightedSquares;
    const fromFile = files.indexOf(from[0]);
    const fromRank = ranks.indexOf(from[1]);
    const toFile = files.indexOf(to[0]);
    const toRank = ranks.indexOf(to[1]);

    const getCoord = (fileIdx: number, rankIdx: number) => {
      const x = isFlipped ? 7 - fileIdx : fileIdx;
      const y = isFlipped ? 7 - rankIdx : rankIdx;
      return { x: x * 12.5 + 6.25, y: y * 12.5 + 6.25 };
    };

    const start = getCoord(fromFile, fromRank);
    const end = getCoord(toFile, toRank);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return {
      startX: start.x + (dx / length) * 2,
      startY: start.y + (dy / length) * 2,
      endX: end.x - (dx / length) * 4,
      endY: end.y - (dy / length) * 4,
    };
  }, [highlightedSquares, isFlipped]);

  const getLegalMovesForSquare = useCallback((square: Square): Square[] => {
    return game.moves({ square, verbose: true }).map((m) => m.to);
  }, [game.fen()]);

  const handleSquareClick = useCallback((square: Square) => {
    if (disabled) return;

    const piece = boardState[square];

    if (piece && piece.color === playerColor && game.turn() === playerColor) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(square));
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      const selectedPiece = boardState[selectedSquare];
      if (
        selectedPiece?.type === "p" &&
        ((selectedPiece.color === "w" && square[1] === "8") ||
          (selectedPiece.color === "b" && square[1] === "1"))
      ) {
        setPromotionSquare({ from: selectedSquare, to: square });
        return;
      }

      if (onMove(selectedSquare, square)) {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    setSelectedSquare(null);
    setLegalMoves([]);
  }, [disabled, boardState, playerColor, game.turn(), selectedSquare, legalMoves, getLegalMovesForSquare, onMove]);

  const handlePromotion = useCallback((piece: PieceSymbol) => {
    if (promotionSquare) {
      onMove(promotionSquare.from, promotionSquare.to, piece);
      setPromotionSquare(null);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [promotionSquare, onMove]);

  const getSquareClasses = useCallback((square: Square, fileIdx: number, rankIdx: number): string => {
    const isLight = (fileIdx + rankIdx) % 2 === 0;
    
    // Premium wood-like colors
    const lightColor = "bg-[#f0d9b5]"; // Light wood
    const darkColor = "bg-[#b58863]"; // Dark wood
    const baseColor = isLight ? lightColor : darkColor;
    
    let highlight = "";
    if (highlightedSquares?.from === square) {
      highlight = "ring-2 ring-emerald-400/70 ring-inset bg-emerald-400/30";
    } else if (highlightedSquares?.to === square) {
      highlight = "ring-2 ring-amber-400/70 ring-inset bg-amber-400/30";
    } else if (selectedSquare === square) {
      highlight = "ring-4 ring-primary ring-inset bg-primary/30";
    } else if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      highlight = isLight ? "bg-[#cdd26a]" : "bg-[#aaa23a]"; // Yellow-green highlight
    } else if (kingInCheckSquare === square) {
      highlight = "bg-red-500/60";
    }

    return `${baseColor} ${highlight}`;
  }, [highlightedSquares, selectedSquare, lastMove, kingInCheckSquare]);

  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="relative w-full max-w-[min(92vw,400px)] sm:max-w-[480px] md:max-w-[520px] mx-auto">
      {/* Board shadow and frame */}
      <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 sm:border-[6px] border-amber-800/40 bg-gradient-to-br from-amber-900/30 to-amber-950/40">
        {/* Inner board */}
        <div className="relative">
          {displayRanks.map((rank, rankIndex) => (
            <div key={rank} className="flex">
              {displayFiles.map((file, fileIndex) => {
                const square = `${file}${rank}` as Square;
                const piece = boardState[square];
                const isLegalMove = showHints && legalMoves.includes(square);
                const actualFileIndex = isFlipped ? 7 - fileIndex : fileIndex;
                const actualRankIndex = isFlipped ? 7 - rankIndex : rankIndex;

                return (
                  <motion.div
                    key={square}
                    className={`
                      relative aspect-square flex-1
                      flex items-center justify-center cursor-pointer 
                      transition-all duration-150 ease-out
                      ${getSquareClasses(square, actualFileIndex, actualRankIndex)}
                      ${!disabled && piece?.color === playerColor ? "hover:brightness-110" : ""}
                    `}
                    onClick={() => handleSquareClick(square)}
                    whileHover={!disabled && piece?.color === playerColor ? { scale: 1.02 } : {}}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                  >
                    {/* Coordinates */}
                    {fileIndex === 0 && (
                      <span className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold text-amber-900/60 select-none">
                        {rank}
                      </span>
                    )}
                    {rankIndex === 7 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold text-amber-900/60 select-none">
                        {file}
                      </span>
                    )}

                    {/* Legal move indicator - dot for empty, ring for capture */}
                    {isLegalMove && !piece && (
                      <motion.div 
                        className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-black/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      />
                    )}
                    {isLegalMove && piece && (
                      <motion.div 
                        className="absolute inset-1 sm:inset-1.5 ring-[3px] sm:ring-4 ring-black/20 ring-inset rounded-full"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      />
                    )}

                    {/* Chess piece */}
                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.span
                          key={`${square}-${piece.color}${piece.type}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className={`
                            text-[clamp(2.2rem,10vw,3.8rem)] sm:text-5xl md:text-[3.5rem] 
                            select-none cursor-grab active:cursor-grabbing
                            font-bold leading-none
                          `}
                          style={{
                            color: piece.color === "w" ? "#FFFEF0" : "#1a1a1a",
                            WebkitTextStroke: piece.color === "w" ? "1.5px #333" : "1px #666",
                            textShadow: piece.color === "w"
                              ? "3px 3px 6px rgba(0,0,0,0.6), -1px -1px 2px rgba(0,0,0,0.4), 0 0 12px rgba(0,0,0,0.3)"
                              : "2px 2px 4px rgba(0,0,0,0.4), 0 0 8px rgba(255,255,255,0.2)",
                            filter: selectedSquare === square ? "brightness(1.15) drop-shadow(0 0 8px rgba(255,215,0,0.6))" : "drop-shadow(2px 2px 3px rgba(0,0,0,0.3))",
                          }}
                        >
                          {pieceSymbols[`${piece.color}${piece.type}`]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Arrow Overlay for suggestions */}
          {arrowCoords && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#f59e0b" />
                </marker>
                <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              {/* Shadow */}
              <line
                x1={arrowCoords.startX} y1={arrowCoords.startY}
                x2={arrowCoords.endX} y2={arrowCoords.endY}
                stroke="rgba(0,0,0,0.3)" strokeWidth="3" strokeLinecap="round"
              />
              {/* Main arrow */}
              <line
                x1={arrowCoords.startX} y1={arrowCoords.startY}
                x2={arrowCoords.endX} y2={arrowCoords.endY}
                stroke="url(#arrowGradient)" strokeWidth="2" strokeLinecap="round" 
                markerEnd="url(#arrowhead)"
                filter="url(#arrowGlow)"
              />
              {/* Start point */}
              <circle cx={arrowCoords.startX} cy={arrowCoords.startY} r="2.5" fill="#22c55e" className="animate-pulse" />
              {/* End point */}
              <circle cx={arrowCoords.endX} cy={arrowCoords.endY} r="3" fill="#f59e0b" className="animate-pulse" />
            </svg>
          )}
        </div>
      </div>

      {/* Promotion Dialog */}
      <AnimatePresence>
        {promotionSquare && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl sm:rounded-2xl z-20"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-card rounded-2xl p-4 sm:p-6 shadow-2xl border-2 border-primary/20"
            >
              <p className="text-center font-display font-bold text-lg sm:text-xl mb-4 text-foreground">
                Choose your piece! 🎉
              </p>
              <div className="flex gap-2 sm:gap-3">
                {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                  <motion.button
                    key={p}
                    className="w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center bg-muted hover:bg-primary/20 rounded-xl sm:rounded-2xl transition-colors text-4xl sm:text-5xl shadow-lg"
                    onClick={() => handlePromotion(p)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pieceSymbols[`${playerColor}${p}`]}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ChessBoard.displayName = "ChessBoard";

export default ChessBoard;
