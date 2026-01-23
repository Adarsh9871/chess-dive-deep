import { motion } from "framer-motion";
import { Crown, Star, Zap, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type BotDifficulty = "easy" | "medium" | "hard" | "expert" | "master";

interface PremiumBotCardProps {
  bot: {
    id: BotDifficulty;
    name: string;
    description: string;
    emoji: string;
    rating: string;
    color: string;
    gradient: string;
    personality: string;
    isNew?: boolean;
    isPremium?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

const PremiumBotCard = ({ bot, isSelected, onSelect, index }: PremiumBotCardProps) => {
  return (
    <motion.button
      className={`
        relative w-full p-5 rounded-3xl text-left transition-all duration-300 overflow-hidden
        ${isSelected 
          ? `${bot.gradient} text-white shadow-2xl ring-4 ring-gold/50 scale-[1.02]` 
          : "bg-card hover:bg-muted/80 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-primary/20"
        }
      `}
      onClick={onSelect}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
      whileHover={{ scale: isSelected ? 1.02 : 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background decoration */}
      <div className={`absolute inset-0 opacity-10 ${isSelected ? "opacity-20" : ""}`}>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      </div>

      {/* New/Premium badges */}
      {bot.isNew && (
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1 z-10"
        >
          <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg px-2 py-0.5 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 mr-0.5" />
            NEW
          </Badge>
        </motion.div>
      )}
      
      {bot.isPremium && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -left-1 z-10"
        >
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0 shadow-lg px-2 py-0.5 text-[10px] font-bold">
            <Crown className="w-3 h-3 mr-0.5" />
            PRO
          </Badge>
        </motion.div>
      )}

      <div className="relative flex flex-col items-center text-center gap-3">
        {/* Animated emoji */}
        <motion.div
          className={`text-5xl sm:text-6xl ${isSelected ? "drop-shadow-lg" : ""}`}
          animate={{ 
            y: [0, -6, 0],
            rotate: [0, -3, 3, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: index * 0.3,
            ease: "easeInOut"
          }}
        >
          {bot.emoji}
        </motion.div>

        {/* Name */}
        <div>
          <h3 className={`font-display font-bold text-lg sm:text-xl ${
            isSelected ? "text-white" : "text-foreground"
          }`}>
            {bot.name}
          </h3>
          
          {/* Rating badge */}
          <Badge
            variant="outline"
            className={`mt-1.5 text-xs font-semibold ${
              isSelected 
                ? "border-white/40 text-white/90 bg-white/10" 
                : "border-primary/30 text-primary bg-primary/5"
            }`}
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            ELO {bot.rating}
          </Badge>
        </div>

        {/* Personality tag */}
        <p className={`text-xs sm:text-sm font-medium ${
          isSelected ? "text-white/80" : "text-muted-foreground"
        }`}>
          "{bot.personality}"
        </p>

        {/* Description */}
        <p className={`text-xs ${
          isSelected ? "text-white/70" : "text-muted-foreground/80"
        }`}>
          {bot.description}
        </p>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <span className="text-lg">✓</span>
        </motion.div>
      )}

      {/* Hover glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-3xl pointer-events-none ${
          isSelected ? "ring-2 ring-white/30" : ""
        }`}
        animate={isSelected ? {
          boxShadow: ["0 0 20px rgba(255,255,255,0.1)", "0 0 40px rgba(255,255,255,0.2)", "0 0 20px rgba(255,255,255,0.1)"]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.button>
  );
};

export default PremiumBotCard;
