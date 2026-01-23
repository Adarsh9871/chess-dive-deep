import { Chess, Color } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Swords, Clock, TrendingUp, Crown } from "lucide-react";

interface PremiumGameInfoProps {
  game: Chess;
  playerColor: Color;
  botName: string;
  botEmoji: string;
  botRating: string;
  moveHistory: string[];
  capturedPieces: { white: string[]; black: string[] };
}

const pieceValues: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9,
};

const whitePieceSymbols: Record<string, string> = {
  p: "♙", n: "♘", b: "♗", r: "♖", q: "♕",
};

const blackPieceSymbols: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛",
};

const PremiumGameInfo = ({
  game,
  playerColor,
  botName,
  botEmoji,
  botRating,
  moveHistory,
  capturedPieces,
}: PremiumGameInfoProps) => {
  const calculateScore = (pieces: string[]) => {
    return pieces.reduce((acc, p) => acc + (pieceValues[p.toLowerCase()] || 0), 0);
  };

  const whiteScore = calculateScore(capturedPieces.white);
  const blackScore = calculateScore(capturedPieces.black);
  const scoreDiff = whiteScore - blackScore;
  const playerAdvantage = playerColor === "w" ? -scoreDiff : scoreDiff;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-card via-card to-muted/50 rounded-3xl shadow-xl border border-border/50 overflow-hidden"
    >
      {/* Bot header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <motion.span 
            className="text-4xl"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            {botEmoji}
          </motion.span>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg text-foreground">{botName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Crown className="w-3 h-3 mr-1" />
                ELO {botRating}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Material advantage */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Swords className="w-3 h-3" />
            Captured Pieces
          </span>
          {playerAdvantage !== 0 && (
            <Badge 
              variant={playerAdvantage > 0 ? "default" : "destructive"}
              className="text-xs"
            >
              {playerAdvantage > 0 ? "+" : ""}{playerAdvantage}
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          {/* Black captured (by white) */}
          <div className="flex items-center gap-0.5 flex-wrap max-w-[45%]">
            {capturedPieces.black.length > 0 ? (
              capturedPieces.black.map((p, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl text-foreground/80"
                >
                  {blackPieceSymbols[p]}
                </motion.span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* White captured (by black) */}
          <div className="flex items-center gap-0.5 flex-wrap max-w-[45%] justify-end">
            {capturedPieces.white.length > 0 ? (
              capturedPieces.white.map((p, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xl"
                  style={{ 
                    color: "white",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.5), -1px -1px 1px rgba(0,0,0,0.3)" 
                  }}
                >
                  {whitePieceSymbols[p]}
                </motion.span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Move history */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-3">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Move History</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {moveHistory.length} moves
          </Badge>
        </div>

        <ScrollArea className="h-32 rounded-xl bg-muted/30 p-2">
          {moveHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground text-center">
                Make the first move! 🎯
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm font-mono">
              {moveHistory.map((move, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-1 ${
                    index === moveHistory.length - 1 ? "text-primary font-bold" : ""
                  }`}
                >
                  {index % 2 === 0 && (
                    <span className="text-muted-foreground text-xs w-5">
                      {Math.floor(index / 2) + 1}.
                    </span>
                  )}
                  <span className={index % 2 === 0 ? "text-foreground" : "text-muted-foreground"}>
                    {move}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Game stats */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Your Progress</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {Math.floor(moveHistory.length / 2)} turns played
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumGameInfo;
