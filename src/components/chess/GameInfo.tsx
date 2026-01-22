import { Chess, Color } from "chess.js";
<<<<<<< HEAD
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, Flag, Zap, Brain, Timer, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
=======
import { motion } from "framer-motion";
import { Clock, Trophy, AlertTriangle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
>>>>>>> target/main
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

<<<<<<< HEAD
const pieceSymbols: Record<string, Record<string, string>> = {
  white: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  black: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};

=======
>>>>>>> target/main
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
<<<<<<< HEAD
  const botColor = playerColor === "w" ? "b" : "w";

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      const winner = turn === playerColor ? "Bot" : "You";
      return { text: winner === "You" ? "🎉 You Win!" : `${bot?.name} Wins!`, type: "end", isWin: winner === "You" };
    }
    if (game.isDraw()) {
      if (game.isStalemate()) return { text: "Stalemate!", type: "draw" };
      if (game.isThreefoldRepetition()) return { text: "Draw by Repetition", type: "draw" };
      if (game.isInsufficientMaterial()) return { text: "Draw - Insufficient Material", type: "draw" };
      return { text: "Draw!", type: "draw" };
    }
    if (game.inCheck()) {
      return { text: turn === playerColor ? "You're in Check!" : "Bot in Check!", type: "check" };
    }
    if (isThinking) {
      return { text: "Bot is thinking...", type: "thinking" };
    }
    if (turn === playerColor) {
      return { text: "Your Turn", type: "your-turn" };
    }
    return { text: "Bot's Turn", type: "bot-turn" };
=======

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
>>>>>>> target/main
  };

  const status = getGameStatus();

  const calculateScore = (pieces: string[]) => {
    return pieces.reduce((acc, p) => acc + (pieceValues[p.toLowerCase()] || 0), 0);
  };

<<<<<<< HEAD
  const playerCaptured = playerColor === "w" ? capturedPieces.white : capturedPieces.black;
  const botCaptured = playerColor === "w" ? capturedPieces.black : capturedPieces.white;
  const playerScore = calculateScore(playerCaptured);
  const botScore = calculateScore(botCaptured);
  const scoreDiff = playerScore - botScore;

  return (
    <div className="bg-card rounded-2xl border shadow-xl overflow-hidden">
      {/* Bot Player Card - Top */}
      <div className={`p-4 transition-all ${turn === botColor && !isGameOver ? 'bg-primary/10 border-l-4 border-l-primary' : 'bg-muted/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative"
              animate={isThinking ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <span className="text-3xl">{bot?.emoji}</span>
              {isThinking && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
            </motion.div>
            <div>
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                {bot?.name}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {botColor === "w" ? "♔ White" : "♚ Black"}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">ELO {bot?.rating}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg">
              {botCaptured.slice(0, 8).map((p, i) => (
                <span key={i} className="text-muted-foreground">
                  {pieceSymbols[playerColor === "w" ? "white" : "black"][p]}
                </span>
              ))}
            </div>
            {botScore > playerScore && (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                +{botScore - playerScore}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Game Status - Center */}
      <div className="px-4 py-3 border-y">
        <AnimatePresence mode="wait">
          <motion.div
            key={status.text}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`text-center py-3 rounded-xl font-display font-bold flex items-center justify-center gap-2 ${
              status.type === "end"
                ? (status as any).isWin 
                  ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                  : "bg-destructive/20 text-destructive"
                : status.type === "draw"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : status.type === "check"
                ? "bg-destructive/20 text-destructive animate-pulse"
                : status.type === "thinking"
                ? "bg-primary/10 text-primary"
                : status.type === "your-turn"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {status.type === "thinking" && <Brain className="w-4 h-4 animate-pulse" />}
            {status.type === "your-turn" && <Zap className="w-4 h-4" />}
            {status.type === "check" && <Swords className="w-4 h-4" />}
            {status.text}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* You Player Card - Bottom */}
      <div className={`p-4 transition-all ${turn === playerColor && !isGameOver ? 'bg-primary/10 border-l-4 border-l-primary' : 'bg-muted/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-lg font-bold">
              You
            </div>
            <div>
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                You
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {playerColor === "w" ? "♔ White" : "♚ Black"}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Playing against {bot?.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg">
              {playerCaptured.slice(0, 8).map((p, i) => (
                <span key={i} className="text-muted-foreground">
                  {pieceSymbols[botColor === "w" ? "white" : "black"][p]}
                </span>
              ))}
            </div>
            {scoreDiff > 0 && (
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                +{scoreDiff}
              </Badge>
            )}
          </div>
=======
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
>>>>>>> target/main
        </div>
      </div>

      {/* Move History */}
<<<<<<< HEAD
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-display font-semibold text-sm text-muted-foreground flex items-center gap-1.5">
            <Timer className="w-4 h-4" />
            Moves
          </h4>
          <Badge variant="outline" className="text-xs">
            {Math.ceil(moveHistory.length / 2)} moves
          </Badge>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 max-h-24 overflow-y-auto scrollbar-thin">
          {moveHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Game starting...
            </p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {moveHistory.map((move, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono ${
                    index === moveHistory.length - 1
                      ? "bg-primary/20 text-primary font-bold"
                      : index % 2 === 0
                      ? "bg-background text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {index % 2 === 0 && (
                    <span className="text-muted-foreground mr-0.5 text-[10px]">
=======
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
>>>>>>> target/main
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
<<<<<<< HEAD
      <div className="p-4 border-t bg-muted/20">
        <div className="flex gap-2">
          {!isGameOver ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onResign}
                disabled={isThinking}
              >
                <Flag className="w-4 h-4 mr-1.5" />
                Resign
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1" 
                onClick={onNewGame}
              >
                New Game
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              className="flex-1 gap-2" 
              onClick={onNewGame}
            >
              <Trophy className="w-4 h-4" />
              Play Again
            </Button>
          )}
        </div>
=======
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
>>>>>>> target/main
      </div>
    </div>
  );
};

export default GameInfo;
