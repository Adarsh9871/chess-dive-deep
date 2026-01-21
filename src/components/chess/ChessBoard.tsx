import { useState, useCallback, useMemo, memo } from "react";
import { Chess, Square, PieceSymbol, Color } from "chess.js";

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  playerColor: Color;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  showHints?: boolean;
  highlightedSquares?: { from: Square; to: Square } | null;
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
    const baseColor = isLight ? "bg-board-light" : "bg-board-dark";
    
    let highlight = "";
    if (highlightedSquares?.from === square) {
      highlight = "ring-2 ring-emerald-400/60 ring-inset bg-emerald-400/20";
    } else if (highlightedSquares?.to === square) {
      highlight = "ring-2 ring-amber-400/60 ring-inset bg-amber-400/25";
    } else if (selectedSquare === square) {
      highlight = "ring-4 ring-primary ring-inset";
    } else if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      highlight = "bg-gold/40";
    } else if (kingInCheckSquare === square) {
      highlight = "bg-destructive/50";
    }

    return `${baseColor} ${highlight}`;
  }, [highlightedSquares, selectedSquare, lastMove, kingInCheckSquare]);

  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="relative">
      <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl border-2 sm:border-4 border-foreground/20">
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
                    relative w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-12 lg:h-12 xl:w-14 xl:h-14
                    flex items-center justify-center cursor-pointer transition-colors duration-100
                    ${getSquareClasses(square, actualFileIndex, actualRankIndex)}
                  `}
                  onClick={() => handleSquareClick(square)}
                >
                  {/* Coordinates */}
                  {fileIndex === 0 && (
                    <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-bold text-foreground/50">
                      {rank}
                    </span>
                  )}
                  {rankIndex === 7 && (
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] sm:text-[10px] font-bold text-foreground/50">
                      {file}
                    </span>
                  )}

                  {/* Legal move dot */}
                  {isLegalMove && !piece && (
                    <div className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary/40" />
                  )}
                  {isLegalMove && piece && (
                    <div className="absolute inset-0 ring-4 ring-primary/40 ring-inset rounded-sm" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      className={`text-3xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl select-none drop-shadow-md ${
                        piece.color === "w" ? "text-white" : "text-gray-900"
                      }`}
                      style={{
                        textShadow: piece.color === "w"
                          ? "1px 1px 2px rgba(0,0,0,0.6), -1px -1px 1px rgba(0,0,0,0.3)"
                          : "1px 1px 2px rgba(255,255,255,0.4)",
                      }}
                    >
                      {pieceSymbols[`${piece.color}${piece.type}`]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

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
            </defs>
            <line
              x1={arrowCoords.startX} y1={arrowCoords.startY}
              x2={arrowCoords.endX} y2={arrowCoords.endY}
              stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round"
            />
            <line
              x1={arrowCoords.startX} y1={arrowCoords.startY}
              x2={arrowCoords.endX} y2={arrowCoords.endY}
              stroke="url(#arrowGradient)" strokeWidth="1.8" strokeLinecap="round" markerEnd="url(#arrowhead)"
            />
            <circle cx={arrowCoords.startX} cy={arrowCoords.startY} r="2" fill="#22c55e" className="animate-pulse" />
            <circle cx={arrowCoords.endX} cy={arrowCoords.endY} r="2.5" fill="#f59e0b" className="animate-pulse" />
          </svg>
        )}
      </div>

      {/* Promotion Dialog */}
      {promotionSquare && (
        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center rounded-xl sm:rounded-2xl z-20">
          <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
            <p className="text-center font-display font-bold text-sm sm:text-lg mb-2 sm:mb-3">
              Choose your piece! 🎉
            </p>
            <div className="flex gap-1.5 sm:gap-2">
              {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                <button
                  key={p}
                  className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-muted hover:bg-primary/20 rounded-lg sm:rounded-xl transition-colors text-3xl sm:text-4xl"
                  onClick={() => handlePromotion(p)}
                >
                  {pieceSymbols[`${playerColor}${p}`]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ChessBoard.displayName = "ChessBoard";

export default ChessBoard;
