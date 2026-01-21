import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Target, Shield, Crown, Swords, Zap, Castle, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Move } from "chess.js";

interface MoveExplanationProps {
  isOpen: boolean;
  onClose: () => void;
  move: Move | null;
  moveType: string;
  reason: string;
  playerColor: "w" | "b";
}

const pieceNames: { [key: string]: string } = {
  p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King"
};

// Chess strategy explanations based on move type
const getStrategyExplanation = (moveType: string, move: Move | null): {
  title: string;
  concept: string;
  explanation: string;
  tips: string[];
  emoji: string;
} => {
  if (!move) {
    return {
      title: "Chess Tip",
      concept: "General Strategy",
      explanation: "Every move in chess should have a purpose!",
      tips: ["Control the center", "Develop your pieces", "Keep your king safe"],
      emoji: "💡"
    };
  }

  switch (moveType) {
    case "best":
      return {
        title: "Best Move!",
        concept: "Optimal Play",
        explanation: `Moving your ${pieceNames[move.piece]} to ${move.to.toUpperCase()} is the strongest move in this position. It improves your position while limiting your opponent's options.`,
        tips: [
          "The best move often combines multiple ideas",
          "It can attack, defend, or improve piece position",
          "Sometimes the best move is quiet, preparing for later"
        ],
        emoji: "👑"
      };

    case "capture":
      return {
        title: "Capture!",
        concept: "Material Advantage",
        explanation: `Capturing with your ${pieceNames[move.piece]} wins material! In chess, having more pieces usually means a winning advantage.`,
        tips: [
          "Always check if the capture is safe",
          "MVV-LVA: Capture high-value pieces with low-value ones",
          "Sometimes NOT capturing is better (zwischenzug)",
          "Count attackers vs defenders before capturing"
        ],
        emoji: "⚔️"
      };

    case "check":
      return {
        title: "Check!",
        concept: "King Attack",
        explanation: `Your ${pieceNames[move.piece]} attacks the enemy King! The opponent MUST respond to check - they can't ignore it.`,
        tips: [
          "Check forces your opponent to react",
          "Double check is extremely powerful",
          "Use checks to gain tempo (time)",
          "Check can help escape from danger"
        ],
        emoji: "⚡"
      };

    case "castle":
      return {
        title: "Castle!",
        concept: "King Safety",
        explanation: "Castling is a special move that tucks your King into safety while activating your Rook! It's one of the most important moves in the opening.",
        tips: [
          "Castle early to protect your King",
          "Castling connects your Rooks",
          "Kingside castling (short) is usually safer",
          "Don't move pawns in front of your castled King"
        ],
        emoji: "🏰"
      };

    case "good":
      return {
        title: "Good Move!",
        concept: "Positional Play",
        explanation: `This ${pieceNames[move.piece]} move improves your position. Good chess is about making many small improvements!`,
        tips: [
          "Place pieces on their best squares",
          "Knights love outposts (protected squares)",
          "Bishops need open diagonals",
          "Rooks belong on open files"
        ],
        emoji: "📈"
      };

    case "danger":
      return {
        title: "Risky Move",
        concept: "Calculated Risk",
        explanation: "This move involves some risk. It might work, but be careful! Make sure you've calculated the consequences.",
        tips: [
          "Check all opponent responses",
          "Ask: What's the worst that can happen?",
          "Sometimes risks are necessary",
          "Blunders often come from rushed moves"
        ],
        emoji: "⚠️"
      };

    default:
      return {
        title: "Safe Move",
        concept: "Solid Development",
        explanation: `Moving your ${pieceNames[move.piece]} to ${move.to.toUpperCase()} is a safe, sensible move that keeps your position solid.`,
        tips: [
          "Safe moves prevent mistakes",
          "Improve your worst-placed piece",
          "When in doubt, develop a piece",
          "Control important squares"
        ],
        emoji: "🛡️"
      };
  }
};

// Chess principles based on game phase
const getChessPrinciple = (move: Move | null): string => {
  if (!move) return "";
  
  const principles = [
    "🎯 Control the Center: d4, d5, e4, e5 are the most important squares!",
    "🐴 Develop Knights before Bishops: Knights need more time to reach good squares.",
    "🏰 Castle Early: Get your King to safety before attacking!",
    "👑 Don't move your Queen too early: She can be chased by weaker pieces.",
    "♜ Connect your Rooks: After castling, try to get your Rooks working together.",
    "⚔️ Attack the base of a pawn chain: Target the pawn that defends others.",
    "🔄 When ahead, trade pieces: Simplify the position to an easy win.",
    "🚀 When behind, keep pieces: More pieces = more chances for tricks!",
    "🎪 Knights before Rook pawns: a- and h-pawns are usually less important.",
    "💪 Two Bishops are strong: Keep both bishops when possible!"
  ];
  
  return principles[Math.floor(Math.random() * principles.length)];
};

const MoveExplanation = ({ isOpen, onClose, move, moveType, reason, playerColor }: MoveExplanationProps) => {
  const strategy = getStrategyExplanation(moveType, move);
  const principle = getChessPrinciple(move);

  const getTypeIcon = () => {
    switch (moveType) {
      case "best": return <Crown className="w-6 h-6" />;
      case "capture": return <Swords className="w-6 h-6" />;
      case "check": return <Zap className="w-6 h-6" />;
      case "castle": return <Castle className="w-6 h-6" />;
      case "good": return <TrendingUp className="w-6 h-6" />;
      case "danger": return <AlertTriangle className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getTypeColor = () => {
    switch (moveType) {
      case "best": return "from-amber-400 to-yellow-500";
      case "capture": return "from-red-400 to-rose-500";
      case "check": return "from-purple-400 to-violet-500";
      case "castle": return "from-blue-400 to-cyan-500";
      case "good": return "from-emerald-400 to-green-500";
      case "danger": return "from-orange-400 to-amber-500";
      default: return "from-slate-400 to-slate-500";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-card rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${getTypeColor()} p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center text-white">
                  {getTypeIcon()}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white">{strategy.title}</h2>
                  <p className="text-white/80 text-sm">{strategy.concept}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
              {/* Move Display */}
              {move && (
                <div className="bg-muted rounded-xl p-4 flex items-center gap-4">
                  <span className="text-4xl">{strategy.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-lg text-foreground">
                      {pieceNames[move.piece]} {move.from.toUpperCase()} → {move.to.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground">Why This Move?</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {strategy.explanation}
                </p>
              </div>

              {/* Tips */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-secondary" />
                  <h3 className="font-display font-bold text-foreground">Chess Tips</h3>
                </div>
                <ul className="space-y-2">
                  {strategy.tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-gold mt-0.5">★</span>
                      <span>{tip}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Chess Principle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-gold/20 to-amber-500/20 border border-gold/30 rounded-xl p-4"
              >
                <p className="text-sm font-medium text-foreground">{principle}</p>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4">
              <Button onClick={onClose} className="w-full">
                Got it! 👍
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MoveExplanation;