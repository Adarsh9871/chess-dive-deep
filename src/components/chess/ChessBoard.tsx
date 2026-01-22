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
  isThinking?: boolean;
}

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
  isThinking = false,
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

  // Arrow coordinates
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
    const baseColor = isLight 
      ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-200/80 dark:to-amber-300/80" 
      : "bg-gradient-to-br from-amber-700 to-amber-800 dark:from-amber-800 dark:to-amber-900";
    
    let highlight = "";
    if (highlightedSquares?.from === square) {
      highlight = "ring-2 ring-emerald-400 ring-inset bg-emerald-400/30";
    } else if (highlightedSquares?.to === square) {
      highlight = "ring-2 ring-amber-400 ring-inset bg-amber-400/40";
    } else if (selectedSquare === square) {
      highlight = "ring-4 ring-primary ring-inset bg-primary/20";
    } else if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      highlight = isLight ? "bg-yellow-300/60" : "bg-yellow-600/50";
    } else if (kingInCheckSquare === square) {
      highlight = "bg-red-500/60 ring-2 ring-red-500 ring-inset";
    }

    return `${baseColor} ${highlight}`;
  }, [highlightedSquares, selectedSquare, lastMove, kingInCheckSquare]);

  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="relative">
      {/* Board wrapper with shadow and border */}
      <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-amber-900/30 dark:border-amber-700/40">
        {/* Board frame */}
        <div className="bg-amber-900/90 dark:bg-amber-950 p-1">
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
                      relative w-[38px] h-[38px] xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-[50px] lg:h-[50px] xl:w-14 xl:h-14
                      flex items-center justify-center cursor-pointer transition-all duration-150
                      ${getSquareClasses(square, actualFileIndex, actualRankIndex)}
                      ${disabled ? 'cursor-not-allowed' : 'hover:brightness-110'}
                    `}
                    onClick={() => handleSquareClick(square)}
                    whileHover={!disabled ? { scale: 1.02 } : {}}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                  >
                    {/* Coordinates */}
                    {fileIndex === 0 && (
                      <span className={`absolute top-0.5 left-0.5 text-[9px] font-bold ${
                        (actualFileIndex + actualRankIndex) % 2 === 0 
                          ? "text-amber-800/60 dark:text-amber-900/70" 
                          : "text-amber-200/70"
                      }`}>
                        {rank}
                      </span>
                    )}
                    {rankIndex === 7 && (
                      <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-bold ${
                        (actualFileIndex + actualRankIndex) % 2 === 0 
                          ? "text-amber-800/60 dark:text-amber-900/70" 
                          : "text-amber-200/70"
                      }`}>
                        {file}
                      </span>
                    )}

                    {/* Legal move indicator */}
                    {isLegalMove && !piece && (
                      <motion.div 
                        className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary/50"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      />
                    )}
                    {isLegalMove && piece && (
                      <motion.div 
                        className="absolute inset-1 ring-4 ring-primary/50 ring-inset rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}

                    {/* Piece */}
                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.span
                          key={`${square}-${piece.color}${piece.type}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className={`text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[42px] xl:text-5xl select-none ${
                          piece.color === "w" 
                            ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
                            : "text-gray-900 drop-shadow-[0_2px_3px_rgba(255,255,255,0.3)]"
                        }`}
                          style={{
                            textShadow: piece.color === "w"
                              ? "2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(0,0,0,0.2)"
                              : "1px 1px 3px rgba(255,255,255,0.3)",
                            filter: isThinking && piece.color !== playerColor 
                              ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))" 
                              : undefined,
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
        </div>

        {/* Arrow Overlay */}
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
              <filter id="glow">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line
              x1={arrowCoords.startX} y1={arrowCoords.startY}
              x2={arrowCoords.endX} y2={arrowCoords.endY}
              stroke="rgba(0,0,0,0.4)" strokeWidth="3" strokeLinecap="round"
            />
            <line
              x1={arrowCoords.startX} y1={arrowCoords.startY}
              x2={arrowCoords.endX} y2={arrowCoords.endY}
              stroke="url(#arrowGradient)" strokeWidth="2" strokeLinecap="round" 
              markerEnd="url(#arrowhead)" filter="url(#glow)"
            />
            <circle cx={arrowCoords.startX} cy={arrowCoords.startY} r="2.5" fill="#22c55e" className="animate-pulse" />
            <circle cx={arrowCoords.endX} cy={arrowCoords.endY} r="3" fill="#f59e0b" className="animate-pulse" />
          </svg>
        )}
      </div>

      {/* Promotion Dialog */}
      <AnimatePresence>
        {promotionSquare && (
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-card rounded-2xl p-4 shadow-2xl border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <p className="text-center font-display font-bold text-lg mb-4">
                Choose Promotion 👑
              </p>
              <div className="flex gap-2">
                {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                  <motion.button
                    key={p}
                    className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-muted hover:bg-primary/20 rounded-xl transition-colors text-4xl border-2 border-transparent hover:border-primary"
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
