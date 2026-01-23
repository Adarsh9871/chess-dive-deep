import { motion, AnimatePresence } from "framer-motion";
import { Trophy, AlertTriangle, Clock, Loader2, Crown, Swords, Sparkles } from "lucide-react";
import { Chess } from "chess.js";

interface GameStatusBannerProps {
  game: Chess;
  isThinking: boolean;
  isPlayerTurn: boolean;
  playerColor: "w" | "b";
  botName?: string;
  thinkingTime?: number;
}

const GameStatusBanner = ({ 
  game, 
  isThinking, 
  isPlayerTurn, 
  playerColor, 
  botName = "Bot",
  thinkingTime = 0
}: GameStatusBannerProps) => {
  const getStatus = () => {
    if (game.isCheckmate()) {
      const youWon = game.turn() !== playerColor;
      return {
        type: "gameEnd",
        icon: youWon ? Trophy : Crown,
        title: youWon ? "🎉 CHECKMATE!" : "Checkmate!",
        subtitle: youWon ? "You're a CHESS CHAMPION!" : `${botName} wins! Great game!`,
        gradient: youWon ? "from-amber-400 via-yellow-400 to-orange-400" : "from-violet-500 to-purple-600",
        animate: true
      };
    }

    if (game.isDraw()) {
      return {
        type: "draw",
        icon: Swords,
        title: "🤝 It's a Draw!",
        subtitle: game.isStalemate() ? "Stalemate - No legal moves!" : "Well played by both sides!",
        gradient: "from-slate-400 to-slate-600",
        animate: false
      };
    }

    if (game.inCheck()) {
      return {
        type: "check",
        icon: AlertTriangle,
        title: "⚡ CHECK!",
        subtitle: isPlayerTurn ? "Your King is in danger!" : `${botName}'s King is attacked!`,
        gradient: "from-red-500 to-rose-600",
        animate: true
      };
    }

    if (isThinking) {
      return {
        type: "thinking",
        icon: Loader2,
        title: `${botName} is thinking...`,
        subtitle: `${(thinkingTime / 1000).toFixed(1)}s`,
        gradient: "from-blue-500 to-cyan-500",
        animate: false
      };
    }

    if (isPlayerTurn) {
      return {
        type: "yourTurn",
        icon: Sparkles,
        title: "✨ Your Turn!",
        subtitle: "Make your move, champion!",
        gradient: "from-emerald-400 to-green-500",
        animate: true
      };
    }

    return {
      type: "waiting",
      icon: Clock,
      title: "Waiting...",
      subtitle: `${botName}'s turn`,
      gradient: "from-slate-400 to-slate-500",
      animate: false
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.type}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${status.gradient} text-white shadow-xl`}
      >
        {/* Animated background */}
        {status.animate && (
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{ 
              x: ["-100%", "100%"],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}

        <div className="relative flex items-center justify-center gap-3 px-6 py-4">
          <motion.div
            animate={status.type === "thinking" ? { rotate: 360 } : status.animate ? { scale: [1, 1.2, 1] } : {}}
            transition={status.type === "thinking" ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.5, repeat: Infinity }}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
          
          <div className="text-center">
            <h3 className="font-display font-bold text-lg sm:text-xl tracking-wide">
              {status.title}
            </h3>
            <p className="text-sm text-white/80">{status.subtitle}</p>
          </div>

          {/* Sparkles for game end */}
          {status.type === "gameEnd" && (
            <>
              <motion.div
                className="absolute top-2 left-4"
                animate={{ rotate: 360, scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ⭐
              </motion.div>
              <motion.div
                className="absolute bottom-2 right-6"
                animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                🌟
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameStatusBanner;
