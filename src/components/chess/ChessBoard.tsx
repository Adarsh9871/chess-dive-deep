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

// SVG chess pieces - clean modern design like reference
const ChessPiece = ({ type, color, size = 45 }: { type: string; color: string; size?: number }) => {
  const isWhite = color === "w";
  const fill = isWhite ? "#CD853F" : "#1E3A5F"; // Brown for white, Navy for black
  const stroke = isWhite ? "#8B4513" : "#0F172A";
  
  const pieces: Record<string, JSX.Element> = {
    k: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" strokeWidth="1.5"/>
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill={fill} strokeLinecap="butt"/>
          <path d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7" fill={fill}/>
          <path d="M12.5 30c5.5-3 14.5-3 20 0M12.5 33.5c5.5-3 14.5-3 20 0M12.5 37c5.5-3 14.5-3 20 0"/>
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.75"/>
          <circle cx="14" cy="9" r="2.75"/>
          <circle cx="22.5" cy="8" r="2.75"/>
          <circle cx="31" cy="9" r="2.75"/>
          <circle cx="39" cy="12" r="2.75"/>
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-3.5-7-5.5 6.5-5.5-6.5-3.5 7-7.5-13.5L9 26z" strokeLinecap="butt"/>
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt"/>
          <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" strokeLinecap="butt"/>
          <path d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0" fill="none"/>
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt"/>
          <path d="M34 14l-3 3H14l-3-3"/>
          <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter"/>
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
          <path d="M11 14h23" fill="none" strokeLinejoin="miter"/>
        </g>
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <g strokeLinecap="butt">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/>
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
          </g>
          <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" fill="none" strokeLinejoin="miter"/>
        </g>
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
          <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill={fill}/>
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill={isWhite ? "#0F172A" : "#FFF"}/>
          <path d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill={isWhite ? "#0F172A" : "#FFF"}/>
        </g>
      </svg>
    ),
    p: (
      <svg viewBox="0 0 45 45" width={size} height={size}>
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };

  return pieces[type] || null;
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
    
    // Clean mint green and cream like reference
    const lightColor = "bg-[#F5F5DC]"; // Cream/beige
    const darkColor = "bg-[#90EE90]"; // Light green
    const baseColor = isLight ? lightColor : darkColor;
    
    let highlight = "";
    if (highlightedSquares?.from === square) {
      highlight = "bg-[#7DD3FC] ring-2 ring-cyan-400";
    } else if (highlightedSquares?.to === square) {
      highlight = "bg-[#FDE68A] ring-2 ring-amber-400";
    } else if (selectedSquare === square) {
      highlight = "bg-[#7DD3FC] ring-2 ring-sky-400";
    } else if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      highlight = "bg-[#FEF08A]/80";
    } else if (kingInCheckSquare === square) {
      highlight = "bg-red-400/60 ring-2 ring-red-500";
    }

    return `${baseColor} ${highlight}`;
  }, [highlightedSquares, selectedSquare, lastMove, kingInCheckSquare]);

  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="relative w-full max-w-[min(90vw,380px)] sm:max-w-[420px] md:max-w-[460px] mx-auto">
      {/* Board frame - gradient border like reference */}
      <div className="rounded-2xl overflow-hidden shadow-2xl p-1 bg-gradient-to-br from-teal-400 via-cyan-400 to-emerald-400">
        {/* Inner board */}
        <div className="relative rounded-xl overflow-hidden bg-[#F5F5DC]">
          {displayRanks.map((rank, rankIndex) => (
            <div key={rank} className="flex">
              {displayFiles.map((file, fileIndex) => {
                const square = `${file}${rank}` as Square;
                const piece = boardState[square];
                const isLegalMove = showHints && legalMoves.includes(square);
                const actualFileIndex = isFlipped ? 7 - fileIndex : fileIndex;
                const actualRankIndex = isFlipped ? 7 - rankIndex : rankIndex;

                return (
                  <div
                    key={square}
                    className={`
                      relative aspect-square flex-1
                      flex items-center justify-center cursor-pointer 
                      transition-all duration-100
                      ${getSquareClasses(square, actualFileIndex, actualRankIndex)}
                      ${!disabled && piece?.color === playerColor ? "hover:brightness-105" : ""}
                    `}
                    onClick={() => handleSquareClick(square)}
                  >
                    {/* Coordinates */}
                    {fileIndex === 0 && (
                      <span className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold text-slate-600/70 select-none">
                        {rank}
                      </span>
                    )}
                    {rankIndex === 7 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold text-slate-600/70 select-none">
                        {file}
                      </span>
                    )}

                    {/* Legal move indicator */}
                    {isLegalMove && !piece && (
                      <motion.div 
                        className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-800/25"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      />
                    )}
                    {isLegalMove && piece && (
                      <motion.div 
                        className="absolute inset-1 ring-[3px] ring-slate-800/25 ring-inset rounded-full"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      />
                    )}

                    {/* Chess piece - SVG */}
                    <AnimatePresence mode="popLayout">
                      {piece && (
                        <motion.div
                          key={`${square}-${piece.color}${piece.type}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          className={`
                            select-none cursor-grab active:cursor-grabbing
                            ${selectedSquare === square ? "scale-110" : ""}
                          `}
                          style={{
                            filter: selectedSquare === square 
                              ? "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" 
                              : "drop-shadow(2px 2px 3px rgba(0,0,0,0.3))",
                          }}
                        >
                          <ChessPiece 
                            type={piece.type} 
                            color={piece.color} 
                            size={typeof window !== 'undefined' && window.innerWidth < 640 ? 38 : 48}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
              </defs>
              {/* Shadow */}
              <line
                x1={arrowCoords.startX} y1={arrowCoords.startY}
                x2={arrowCoords.endX} y2={arrowCoords.endY}
                stroke="rgba(0,0,0,0.2)" strokeWidth="4" strokeLinecap="round"
              />
              {/* Main arrow */}
              <line
                x1={arrowCoords.startX} y1={arrowCoords.startY}
                x2={arrowCoords.endX} y2={arrowCoords.endY}
                stroke="url(#arrowGradient)" strokeWidth="2.5" strokeLinecap="round" 
                markerEnd="url(#arrowhead)"
              />
              {/* Start point */}
              <circle cx={arrowCoords.startX} cy={arrowCoords.startY} r="2.5" fill="#22c55e" />
              {/* End point */}
              <circle cx={arrowCoords.endX} cy={arrowCoords.endY} r="3" fill="#f59e0b" />
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl"
            >
              <p className="text-center font-bold text-lg sm:text-xl mb-4 text-slate-800">
                Choose your piece! 🎉
              </p>
              <div className="flex gap-3">
                {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                  <motion.button
                    key={p}
                    className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-slate-100 hover:bg-emerald-100 rounded-xl transition-colors shadow-md"
                    onClick={() => handlePromotion(p)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChessPiece type={p} color={playerColor} size={40} />
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