import { Chess, Color } from "chess.js";
import { motion } from "framer-motion";
import { Clock, Trophy, AlertTriangle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotDifficulty, bots } from "./BotSelector";

interface GameInfoProps {
  game: Chess;
  playerColor: Color;
  botDifficulty: BotDifficulty;
  moveHistory: string[];
  capturedPieces: { white: string[]; black: string[] };
  onResign: () => void;
  onNewGame: () => void;
  isThinking: boolean;
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const GameInfo = ({
  game,
  playerColor,
  botDifficulty,
  moveHistory,
  capturedPieces,
  onResign,
  onNewGame,
  isThinking,
}: GameInfoProps) => {
  const bot = bots.find((b) => b.id === botDifficulty);
  const isGameOver = game.isGameOver();
  const turn = game.turn();

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      const winner = turn === "w" ? "Black" : "White";
      return { text: `Checkmate! ${winner} wins! 🎉`, type: "end" };
    }
    if (game.isDraw()) {
      if (game.isStalemate()) return { text: "Stalemate! It's a draw! 🤝", type: "end" };
      if (game.isThreefoldRepetition()) return { text: "Draw by repetition! 🔄", type: "end" };
      if (game.isInsufficientMaterial()) return { text: "Draw - not enough pieces! 🤷", type: "end" };
      return { text: "It's a draw! 🤝", type: "end" };
    }
    if (game.inCheck()) {
      return { text: "Check! ⚠️", type: "check" };
    }
    if (isThinking) {
      return { text: `${bot?.name} is thinking... 🤔`, type: "thinking" };
    }
    if (turn === playerColor) {
      return { text: "Your turn! Make a move! ♟️", type: "turn" };
    }
    return { text: `${bot?.name}'s turn`, type: "waiting" };
  };

  const status = getGameStatus();

  const calculateScore = (pieces: string[]) => {
    return pieces.reduce((acc, p) => acc + (pieceValues[p.toLowerCase()] || 0), 0);
  };

  const whiteScore = calculateScore(capturedPieces.white);
  const blackScore = calculateScore(capturedPieces.black);
  const scoreDiff = whiteScore - blackScore;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
      {/* Bot Info */}
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <span className="text-4xl">{bot?.emoji}</span>
        <div>
          <h3 className="font-display font-bold text-lg">{bot?.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {botDifficulty} difficulty
          </p>
        </div>
      </div>

      {/* Game Status */}
      <motion.div
        key={status.text}
        className={`p-4 rounded-xl text-center font-display font-bold ${
          status.type === "end"
            ? "bg-gold/20 text-gold-dark"
            : status.type === "check"
            ? "bg-destructive/20 text-destructive"
            : status.type === "thinking"
            ? "bg-accent/20 text-accent"
            : "bg-muted text-foreground"
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {status.text}
      </motion.div>

      {/* Captured Pieces */}
      <div className="space-y-2">
        <h4 className="font-display font-semibold text-sm text-muted-foreground">
          Captured Pieces
        </h4>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-2xl">
              {capturedPieces.black.map((p, i) => (
                <span key={i} className="text-foreground">
                  {
                    {
                      p: "♟",
                      n: "♞",
                      b: "♝",
                      r: "♜",
                      q: "♛",
                    }[p]
                  }
                </span>
              ))}
            </span>
            {scoreDiff < 0 && (
              <span className="text-sm font-bold text-secondary">
                +{Math.abs(scoreDiff)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {scoreDiff > 0 && (
              <span className="text-sm font-bold text-secondary">
                +{scoreDiff}
              </span>
            )}
            <span className="text-2xl">
              {capturedPieces.white.map((p, i) => (
                <span
                  key={i}
                  className="text-card"
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {
                    {
                      p: "♙",
                      n: "♘",
                      b: "♗",
                      r: "♖",
                      q: "♕",
                    }[p]
                  }
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Move History */}
      <div className="space-y-2">
        <h4 className="font-display font-semibold text-sm text-muted-foreground">
          Move History
        </h4>
        <div className="bg-muted rounded-xl p-3 max-h-32 overflow-y-auto">
          {moveHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No moves yet
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
              {moveHistory.map((move, index) => (
                <span
                  key={index}
                  className={index % 2 === 0 ? "text-foreground" : "text-muted-foreground"}
                >
                  {index % 2 === 0 && (
                    <span className="text-muted-foreground mr-1">
                      {Math.floor(index / 2) + 1}.
                    </span>
                  )}
                  {move}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        {!isGameOver ? (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onResign}
            disabled={isThinking}
          >
            <Flag className="w-4 h-4 mr-2" />
            Resign
          </Button>
        ) : (
          <Button variant="default" className="flex-1" onClick={onNewGame}>
            <Trophy className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        )}
        <Button variant="secondary" className="flex-1" onClick={onNewGame}>
          New Game
        </Button>
      </div>
    </div>
  );
};

export default GameInfo;
