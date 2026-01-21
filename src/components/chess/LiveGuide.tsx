import { useState, useEffect, useCallback } from "react";
import { Chess, Move, Square } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Volume2, VolumeX, Loader2, Crown, Swords, ChevronUp, TrendingUp, Shield, Target, Zap, HelpCircle, Eye, EyeOff, Castle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useIsMobile } from "@/hooks/use-mobile";
import { analyzePositionFast } from "@/lib/chessBot";
import { usePlayerStore } from "@/stores/playerStore";
import MoveExplanation from "./MoveExplanation";

interface LiveGuideProps {
  game: Chess;
  isPlayerTurn: boolean;
  playerColor: "w" | "b";
  isGameOver: boolean;
  onHighlightSquares?: (squares: { from: Square; to: Square } | null) => void;
}

interface MoveAnalysis {
  move: Move;
  score: number;
  reason: string;
  type: "best" | "good" | "capture" | "safe" | "danger" | "check" | "castle";
  priority: number;
}

const pieceNames: { [key: string]: string } = {
  p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King"
};

const pieceValues: { [key: string]: number } = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100
};

const pieceEmojis: { [key: string]: string } = {
  p: "♟️", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔"
};

// Fast move analysis - optimized for responsiveness with variety
const analyzeMoves = (game: Chess, playerColor: "w" | "b", maxSuggestions: number): MoveAnalysis[] => {
  const moves = game.moves({ verbose: true });
  const analyses: MoveAnalysis[] = [];
  const opponentColor = playerColor === "w" ? "b" : "w";

  // Use fast analysis from chessBot - now returns varied suggestions each time
  const botAnalysis = analyzePositionFast(game, playerColor, maxSuggestions + 2);
  
  // Find all attacked squares by opponent
  const getAttackedPieces = () => {
    const attacked: { square: Square; piece: string; value: number }[] = [];
    const board = game.board();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === playerColor) {
          const square = String.fromCharCode(97 + col) + (8 - row) as Square;
          if (game.isAttacked(square, opponentColor)) {
            attacked.push({ square, piece: piece.type, value: pieceValues[piece.type] });
          }
        }
      }
    }
    return attacked.sort((a, b) => b.value - a.value);
  };

  const attackedPieces = getAttackedPieces();
  
  // Process moves with variety - mix bot analysis with tactical analysis
  const processedMoves = new Set<string>();
  
  // First add bot-recommended moves
  for (let i = 0; i < botAnalysis.length && i < maxSuggestions; i++) {
    const ba = botAnalysis[i];
    processedMoves.add(ba.move.san);
    
    let type: MoveAnalysis["type"] = "safe";
    let reason = "";
    let priority = 5 - i;
    
    if (i === 0) {
      type = "best";
      priority = 10;
    }
    
    // Determine move characteristics
    const testGame = new Chess(game.fen());
    testGame.move(ba.move);
    
    if (testGame.isCheckmate()) {
      reason = "🎉 CHECKMATE! You win the game!";
      type = "best";
      priority = 100;
    } else if (testGame.inCheck()) {
      reason = "Puts the King in CHECK! ⚡";
      type = "check";
      priority = Math.max(priority, 7);
    } else if (ba.move.captured) {
      const capturedValue = pieceValues[ba.move.captured];
      const isRecapturable = testGame.isAttacked(ba.move.to, opponentColor);
      if (!isRecapturable) {
        reason = `FREE ${pieceNames[ba.move.captured].toUpperCase()}! Take it! 🎯`;
        type = "capture";
        priority = Math.max(priority, 8);
      } else {
        reason = `Capture their ${pieceNames[ba.move.captured]}!`;
        type = "capture";
        priority = Math.max(priority, 6);
      }
    } else if (ba.move.flags.includes("k") || ba.move.flags.includes("q")) {
      reason = "🏰 CASTLE! Your King is safe now!";
      type = "castle";
      priority = Math.max(priority, 6);
    }
    
    // Check if saving attacked piece
    const savedPiece = attackedPieces.find(ap => ap.square === ba.move.from);
    if (savedPiece && savedPiece.value > 1 && !reason) {
      reason = `Saves your ${pieceNames[savedPiece.piece]} from capture!`;
      type = "good";
      priority = Math.max(priority, savedPiece.value);
    }
    
    if (!reason) {
      const centerSquares = ["d4", "d5", "e4", "e5"];
      if (centerSquares.includes(ba.move.to)) {
        reason = "Controls the center! 🎯";
      } else {
        reason = `Strong ${pieceNames[ba.move.piece]} move to ${ba.move.to.toUpperCase()}`;
      }
    }
    
    analyses.push({
      move: ba.move,
      score: ba.score,
      reason,
      type,
      priority
    });
  }
  
  // Add tactical variety - find moves not in top bot recommendations
  for (const move of moves) {
    if (processedMoves.has(move.san)) continue;
    if (analyses.length >= maxSuggestions + 2) break;
    
    let score = 0;
    let reason = "";
    let type: MoveAnalysis["type"] = "safe";
    let priority = 0;
    
    const testGame = new Chess(game.fen());
    testGame.move(move);
    
    // Only include interesting tactical moves
    if (move.captured) {
      const capturedValue = pieceValues[move.captured];
      const isRecapturable = testGame.isAttacked(move.to, opponentColor);
      if (!isRecapturable && capturedValue >= 3) {
        reason = `Capture their ${pieceNames[move.captured]}`;
        type = "capture";
        priority = capturedValue;
        score = capturedValue * 100;
        analyses.push({ move, score, reason, type, priority });
      }
    } else if (testGame.inCheck()) {
      reason = "Gives check!";
      type = "check";
      priority = 3;
      score = 200;
      analyses.push({ move, score, reason, type, priority });
    }
  }

  // Sort by priority first, then score
  return analyses.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.score - a.score;
  }).slice(0, maxSuggestions);
};

// Find urgent threats
const findThreats = (game: Chess, playerColor: "w" | "b"): { piece: string; square: Square; value: number; canEscape: boolean }[] => {
  const threats: { piece: string; square: Square; value: number; canEscape: boolean }[] = [];
  const board = game.board();
  const opponentColor = playerColor === "w" ? "b" : "w";
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === playerColor && piece.type !== "p") {
        const square = String.fromCharCode(97 + col) + (8 - row) as Square;
        
        if (game.isAttacked(square, opponentColor)) {
          const isDefended = game.isAttacked(square, playerColor);
          const value = pieceValues[piece.type];
          
          // Check if piece can escape
          const moves = game.moves({ verbose: true });
          const escapes = moves.filter(m => m.from === square);
          const canEscape = escapes.some(m => !game.isAttacked(m.to, opponentColor));
          
          if (!isDefended || value >= 3) {
            threats.push({
              piece: piece.type.toUpperCase(),
              square,
              value,
              canEscape
            });
          }
        }
      }
    }
  }

  return threats.sort((a, b) => b.value - a.value).slice(0, 2);
};

// Get game phase tip
const getGamePhaseTip = (game: Chess, playerColor: "w" | "b"): { emoji: string; message: string; type: "tip" | "warning" | "praise" } => {
  const moveCount = game.history().length;
  
  if (game.isCheckmate()) {
    return game.turn() !== playerColor
      ? { emoji: "🏆", message: "CHECKMATE! You're a CHESS CHAMPION! 🎉", type: "praise" }
      : { emoji: "💪", message: "Good game! You'll win next time!", type: "tip" };
  }
  
  if (game.isDraw()) {
    return { emoji: "🤝", message: "It's a draw! Well played!", type: "praise" };
  }
  
  if (game.inCheck()) {
    return { emoji: "🚨", message: "Your King is in CHECK! Save him!", type: "warning" };
  }

  if (moveCount < 8) {
    return { emoji: "🚀", message: "Opening: Control the center and develop pieces!", type: "tip" };
  }
  if (moveCount < 25) {
    return { emoji: "⚔️", message: "Look for tactics! Forks and pins win games!", type: "tip" };
  }
  return { emoji: "👑", message: "Endgame: Activate your King!", type: "tip" };
};

const LiveGuide = ({ game, isPlayerTurn, playerColor, isGameOver, onHighlightSquares }: LiveGuideProps) => {
  const isMobile = useIsMobile();
  const { autoSuggestions, toggleAutoSuggestions, getSuggestionCount, level } = usePlayerStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestedMoves, setSuggestedMoves] = useState<MoveAnalysis[]>([]);
  const [threats, setThreats] = useState<{ piece: string; square: Square; value: number; canEscape: boolean }[]>([]);
  const [currentTip, setCurrentTip] = useState<{ emoji: string; message: string; type: string } | null>(null);
  const [hoveredMove, setHoveredMove] = useState<Move | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastSpokenMessage, setLastSpokenMessage] = useState<string>("");
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(0);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanationMove, setExplanationMove] = useState<{ move: Move; type: string; reason: string } | null>(null);
  
  const { speak, stop, isSpeaking, isLoading } = useTextToSpeech();
  
  const suggestionCount = getSuggestionCount();

  // Update analysis when it's player's turn - runs asynchronously to avoid blocking UI
  useEffect(() => {
    let cancelled = false;
    
    if (isPlayerTurn && !isGameOver && autoSuggestions) {
      // Run analysis in next frame to avoid blocking UI
      const timeoutId = setTimeout(() => {
        if (cancelled) return;
        
        const analyses = analyzeMoves(game, playerColor, suggestionCount);
        setSuggestedMoves(analyses);
        
        const foundThreats = findThreats(game, playerColor);
        setThreats(foundThreats);
        
        const tip = getGamePhaseTip(game, playerColor);
        setCurrentTip(tip);
        
        setSelectedMoveIndex(0);
        
        // Auto-highlight the best move
        if (analyses.length > 0) {
          onHighlightSquares?.({ from: analyses[0].move.from, to: analyses[0].move.to });
        }
        
        // Auto-expand on desktop
        if (!isMobile && analyses.length > 0) {
          setIsExpanded(true);
        }
      }, 50); // Small delay to let UI render first
      
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    } else if (isGameOver) {
      const tip = getGamePhaseTip(game, playerColor);
      setCurrentTip(tip);
      setSuggestedMoves([]);
      setThreats([]);
      onHighlightSquares?.(null);
    } else if (!autoSuggestions) {
      setSuggestedMoves([]);
      onHighlightSquares?.(null);
      const tip = getGamePhaseTip(game, playerColor);
      setCurrentTip(tip);
    } else {
      onHighlightSquares?.(null);
    }
  }, [isPlayerTurn, game.fen(), playerColor, isGameOver, onHighlightSquares, isMobile, autoSuggestions, suggestionCount]);

  // Voice narration
  useEffect(() => {
    if (!voiceEnabled || !isPlayerTurn || isGameOver || !autoSuggestions) return;
    
    let message = "";
    
    if (threats.length > 0) {
      const threatPiece = pieceNames[threats[0].piece.toLowerCase()];
      message = `Watch out! Your ${threatPiece} on ${threats[0].square} is under attack!`;
    }
    
    if (suggestedMoves.length > 0) {
      const bestMove = suggestedMoves[0];
      message += ` Best move: ${pieceNames[bestMove.move.piece]} from ${bestMove.move.from} to ${bestMove.move.to}. ${bestMove.reason}`;
    }
    
    if (message && message !== lastSpokenMessage) {
      setLastSpokenMessage(message);
      speak(message);
    }
  }, [voiceEnabled, isPlayerTurn, isGameOver, threats, suggestedMoves, speak, lastSpokenMessage, autoSuggestions]);

  const handleMoveHover = useCallback((analysis: MoveAnalysis | null, index: number) => {
    if (analysis) {
      setHoveredMove(analysis.move);
      setSelectedMoveIndex(index);
      onHighlightSquares?.({ from: analysis.move.from, to: analysis.move.to });
    }
  }, [onHighlightSquares]);

  const handleMoveLeave = useCallback(() => {
    setHoveredMove(null);
    // Reset to best move highlight
    if (suggestedMoves.length > 0) {
      const best = suggestedMoves[0];
      onHighlightSquares?.({ from: best.move.from, to: best.move.to });
    }
  }, [suggestedMoves, onHighlightSquares]);

  const toggleVoice = useCallback(() => {
    if (voiceEnabled) {
      stop();
      setLastSpokenMessage("");
    }
    setVoiceEnabled(!voiceEnabled);
  }, [voiceEnabled, stop]);

  const openExplanation = (analysis: MoveAnalysis) => {
    setExplanationMove({
      move: analysis.move,
      type: analysis.type,
      reason: analysis.reason
    });
    setExplanationOpen(true);
  };

  const getMoveTypeStyles = (type: string, isSelected: boolean) => {
    const base = isSelected ? "ring-2 ring-offset-2 scale-[1.02]" : "";
    switch (type) {
      case "best": return `bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 ${base} ${isSelected ? "ring-amber-400" : ""}`;
      case "capture": return `bg-gradient-to-r from-red-400 to-rose-500 text-white ${base} ${isSelected ? "ring-red-400" : ""}`;
      case "check": return `bg-gradient-to-r from-purple-400 to-violet-500 text-white ${base} ${isSelected ? "ring-purple-400" : ""}`;
      case "castle": return `bg-gradient-to-r from-blue-400 to-cyan-500 text-white ${base} ${isSelected ? "ring-blue-400" : ""}`;
      case "good": return `bg-gradient-to-r from-emerald-400 to-green-500 text-white ${base} ${isSelected ? "ring-emerald-400" : ""}`;
      case "danger": return `bg-gradient-to-r from-orange-400 to-amber-500 text-orange-900 ${base} ${isSelected ? "ring-orange-400" : ""}`;
      default: return `bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 ${base} ${isSelected ? "ring-slate-400" : ""}`;
    }
  };

  const getMoveTypeIcon = (type: string) => {
    switch (type) {
      case "best": return <Crown className="w-4 h-4" />;
      case "capture": return <Swords className="w-4 h-4" />;
      case "check": return <Zap className="w-4 h-4" />;
      case "castle": return <Castle className="w-4 h-4" />;
      case "good": return <TrendingUp className="w-4 h-4" />;
      case "danger": return <AlertTriangle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getMoveLabel = (type: string, index: number) => {
    if (index === 0 && type !== "danger") return "BEST";
    switch (type) {
      case "capture": return "TAKE";
      case "check": return "CHECK";
      case "castle": return "CASTLE";
      case "good": return "GOOD";
      case "danger": return "RISKY";
      default: return "SAFE";
    }
  };

  // Don't show if not player's turn and no game over message
  if (!isPlayerTurn && !isGameOver) {
    return (
      <div className="fixed lg:relative bottom-4 right-4 lg:bottom-auto lg:right-auto z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border-2 border-muted flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5 text-primary" />
            </motion.div>
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground">Bot is thinking...</p>
            <p className="text-xs text-muted-foreground">Wait for your turn!</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Move Explanation Modal */}
      <MoveExplanation
        isOpen={explanationOpen}
        onClose={() => setExplanationOpen(false)}
        move={explanationMove?.move || null}
        moveType={explanationMove?.type || "safe"}
        reason={explanationMove?.reason || ""}
        playerColor={playerColor}
      />

      {/* Always-Visible Suggestion Cards */}
      <div className="fixed lg:relative bottom-0 left-0 right-0 lg:bottom-auto lg:left-auto lg:right-auto z-40 lg:z-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/95 backdrop-blur-md rounded-t-3xl lg:rounded-2xl shadow-2xl border-2 border-gold overflow-hidden"
        >
          {/* Header */}
          <div 
            className="bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-4 py-3 flex items-center justify-between cursor-pointer lg:cursor-default"
            onClick={() => isMobile && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <motion.span 
                className="text-2xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🧙‍♂️
              </motion.span>
              <div>
                <span className="font-display font-bold text-foreground block">Chess Buddy</span>
                <span className="text-xs text-foreground/70">
                  {isGameOver ? "Game Over!" : !autoSuggestions ? "Hints off" : threats.length > 0 ? "⚠️ Watch out!" : `${suggestedMoves.length} moves found!`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Auto-suggestions toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); toggleAutoSuggestions(); }}
                  className="p-2 h-8 w-8 hover:bg-foreground/10"
                  title={autoSuggestions ? "Hide suggestions" : "Show suggestions"}
                >
                  {autoSuggestions ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4 opacity-50" />
                  )}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
                className="p-2 h-8 w-8 hover:bg-foreground/10"
                title={voiceEnabled ? "Disable voice" : "Enable voice"}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-secondary animate-pulse" />
                ) : voiceEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-50" />
                )}
              </Button>
              {isMobile && (
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                  <ChevronUp className="w-5 h-5 text-foreground" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Content - Auto-expanded on desktop */}
          <AnimatePresence>
            {(!isMobile || isExpanded) && (
              <motion.div
                initial={isMobile ? { height: 0, opacity: 0 } : false}
                animate={{ height: "auto", opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : undefined}
                className="p-4 space-y-4 max-h-[60vh] lg:max-h-[500px] overflow-y-auto"
              >
                {/* Level Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {level === 'beginner' ? '🐣' : level === 'intermediate' ? '🦊' : level === 'advanced' ? '🦁' : '🐉'} {level.charAt(0).toUpperCase() + level.slice(1)} Level
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {suggestionCount} hints/turn
                  </span>
                </div>

                {/* Threats Alert */}
                {autoSuggestions && threats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-destructive/15 border-2 border-destructive/40 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <span className="font-display font-bold text-sm text-destructive">Pieces in Danger!</span>
                    </div>
                    {threats.map((threat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{pieceEmojis[threat.piece]}</span>
                        <span className="text-foreground">
                          {pieceNames[threat.piece.toLowerCase()]} on <strong>{threat.square.toUpperCase()}</strong>
                          {threat.canEscape ? " - can escape!" : " - trapped!"}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Tip */}
                {currentTip && (
                  <motion.div
                    key={currentTip.message}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl ${
                      currentTip.type === "warning"
                        ? "bg-destructive/10 border-2 border-destructive/30"
                        : currentTip.type === "praise"
                        ? "bg-secondary/10 border-2 border-secondary/30"
                        : "bg-accent/10 border-2 border-accent/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentTip.emoji}</span>
                      <p className="font-nunito text-sm text-foreground flex-1">{currentTip.message}</p>
                    </div>
                  </motion.div>
                )}

                {/* Suggestions disabled message */}
                {!autoSuggestions && isPlayerTurn && !isGameOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6"
                  >
                    <EyeOff className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Suggestions are hidden</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAutoSuggestions}
                      className="mt-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Show Hints
                    </Button>
                  </motion.div>
                )}

                {/* Suggested Moves - Multiple automatically shown */}
                {autoSuggestions && suggestedMoves.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-gold" />
                      <span className="font-display font-bold text-sm text-foreground">
                        Top {suggestedMoves.length} Moves
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {suggestedMoves.map((analysis, index) => (
                        <motion.div
                          key={`${analysis.move.san}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${getMoveTypeStyles(
                            index === 0 && analysis.type !== "danger" ? "best" : analysis.type,
                            selectedMoveIndex === index
                          )}`}
                          onMouseEnter={() => handleMoveHover(analysis, index)}
                          onMouseLeave={handleMoveLeave}
                          onTouchStart={() => handleMoveHover(analysis, index)}
                          onClick={() => {
                            setSelectedMoveIndex(index);
                            onHighlightSquares?.({ from: analysis.move.from, to: analysis.move.to });
                            if (voiceEnabled) {
                              speak(`Move ${pieceNames[analysis.move.piece]} from ${analysis.move.from} to ${analysis.move.to}. ${analysis.reason}`);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                                <span className="text-xl">
                                  {pieceEmojis[playerColor === 'w' ? analysis.move.piece.toUpperCase() : analysis.move.piece]}
                                </span>
                              </div>
                              <div>
                                <div className="font-display font-bold text-sm flex items-center gap-1">
                                  {analysis.move.from.toUpperCase()} → {analysis.move.to.toUpperCase()}
                                  {analysis.move.captured && (
                                    <span className="text-xs">×{pieceEmojis[analysis.move.captured]}</span>
                                  )}
                                </div>
                                <p className="text-xs opacity-90 line-clamp-1">{analysis.reason}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Why this move button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openExplanation(analysis);
                                }}
                                className="p-1 h-7 w-7 bg-white/20 hover:bg-white/40"
                                title="Why this move?"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </Button>
                              <div className="flex items-center gap-1 bg-white/30 px-2 py-1 rounded-lg">
                                {getMoveTypeIcon(index === 0 && analysis.type !== "danger" ? "best" : analysis.type)}
                                <span className="text-xs font-bold">{getMoveLabel(analysis.type, index)}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Game Over State */}
                {isGameOver && suggestedMoves.length === 0 && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-center py-6"
                  >
                    <motion.span 
                      className="text-6xl block mb-3"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {game.isCheckmate() && game.turn() !== playerColor ? "🏆" : "🤝"}
                    </motion.span>
                    <p className="font-display font-bold text-lg text-foreground">
                      {game.isCheckmate() 
                        ? (game.turn() !== playerColor ? "You Won!" : "Nice Try!")
                        : "It's a Draw!"}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Preview for Mobile (when collapsed) - Shows all moves */}
          {isMobile && !isExpanded && autoSuggestions && suggestedMoves.length > 0 && (
            <div className="px-4 pb-4 pt-2">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {suggestedMoves.map((analysis, index) => (
                  <motion.div
                    key={`preview-${analysis.move.san}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-2 ${getMoveTypeStyles(
                      index === 0 ? "best" : analysis.type,
                      selectedMoveIndex === index
                    )}`}
                    onClick={() => {
                      setSelectedMoveIndex(index);
                      onHighlightSquares?.({ from: analysis.move.from, to: analysis.move.to });
                    }}
                  >
                    <span className="text-lg">
                      {pieceEmojis[playerColor === 'w' ? analysis.move.piece.toUpperCase() : analysis.move.piece]}
                    </span>
                    <span className="font-bold text-sm whitespace-nowrap">
                      {analysis.move.from.toUpperCase()}→{analysis.move.to.toUpperCase()}
                    </span>
                    <Badge className="text-xs bg-white/30 text-inherit">
                      {getMoveLabel(analysis.type, index)}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default LiveGuide;