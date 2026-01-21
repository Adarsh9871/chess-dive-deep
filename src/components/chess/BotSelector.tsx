import { motion } from "framer-motion";
import { Bot, Smile, Brain, Zap, Crown, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type BotDifficulty = "easy" | "medium" | "hard" | "expert" | "master";

interface BotSelectorProps {
  selectedDifficulty: BotDifficulty | null;
  onSelect: (difficulty: BotDifficulty) => void;
}

const bots = [
  {
    id: "easy" as BotDifficulty,
    name: "Friendly Freddie",
    description: "Perfect for beginners! Makes some mistakes on purpose.",
    icon: Smile,
    color: "bg-secondary",
    emoji: "🐣",
    depth: 1,
    rating: "~500",
  },
  {
    id: "medium" as BotDifficulty,
    name: "Clever Charlie",
    description: "A balanced challenge. Good for learning new strategies!",
    icon: Brain,
    color: "bg-accent",
    emoji: "🦊",
    depth: 2,
    rating: "~1000",
  },
  {
    id: "hard" as BotDifficulty,
    name: "Master Magnus",
    description: "Our toughest regular bot! Can you beat the chess master?",
    icon: Zap,
    color: "bg-primary",
    emoji: "🦁",
    depth: 3,
    rating: "~1400",
  },
  {
    id: "expert" as BotDifficulty,
    name: "Expert Elena",
    description: "Tournament-level play. Uses advanced tactics and strategy!",
    icon: Crown,
    color: "bg-gold",
    emoji: "🦅",
    depth: 4,
    rating: "~1700",
    isNew: true,
  },
  {
    id: "master" as BotDifficulty,
    name: "Grandmaster Gary",
    description: "The ultimate challenge! Plays like a grandmaster.",
    icon: Star,
    color: "bg-destructive",
    emoji: "🐉",
    depth: 5,
    rating: "~2000+",
    isNew: true,
  },
];

const BotSelector = ({ selectedDifficulty, onSelect }: BotSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-0">
      {bots.map((bot, index) => (
        <motion.button
          key={bot.id}
          className={`
            relative p-4 sm:p-6 rounded-2xl text-left transition-all
            ${
              selectedDifficulty === bot.id
                ? `${bot.color} text-card ring-4 ring-gold shadow-xl scale-[1.02]`
                : "bg-card hover:bg-muted shadow-lg hover:shadow-xl"
            }
          `}
          onClick={() => onSelect(bot.id)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          whileHover={{ scale: selectedDifficulty === bot.id ? 1.02 : 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {bot.isNew && (
            <Badge className="absolute -top-2 -right-2 bg-gold text-foreground animate-pulse">
              NEW!
            </Badge>
          )}
          
          <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
            <motion.span 
              className="text-4xl sm:text-5xl"
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: index * 0.5
              }}
            >
              {bot.emoji}
            </motion.span>
            
            <div>
              <h3
                className={`font-display font-bold text-base sm:text-lg ${
                  selectedDifficulty === bot.id
                    ? "text-card"
                    : "text-foreground"
                }`}
              >
                {bot.name}
              </h3>
              
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${
                  selectedDifficulty === bot.id
                    ? "border-card/50 text-card/90"
                    : "border-muted-foreground/30"
                }`}
              >
                ELO {bot.rating}
              </Badge>
            </div>
            
            <p
              className={`text-xs sm:text-sm ${
                selectedDifficulty === bot.id
                  ? "text-card/80"
                  : "text-muted-foreground"
              }`}
            >
              {bot.description}
            </p>
          </div>

          {selectedDifficulty === bot.id && (
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-foreground shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              ✓
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default BotSelector;
export { bots };