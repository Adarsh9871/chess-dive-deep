import { motion } from "framer-motion";
import { Star, Trophy, Zap, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { usePlayerStore, levelConfig, PlayerLevel } from "@/stores/playerStore";

const PlayerLevelCard = () => {
  const { level, xp, gamesPlayed, gamesWon } = usePlayerStore();
  const config = levelConfig[level];
  
  // Calculate progress to next level
  const currentLevelXp = level === 'beginner' ? 0 : 
    level === 'intermediate' ? 500 :
    level === 'advanced' ? 1500 : 3500;
  
  const nextLevelXp = config.nextLevelXp;
  const progressXp = xp - currentLevelXp;
  const requiredXp = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, (progressXp / requiredXp) * 100);
  
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border-2 border-border shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className={`${config.color} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <motion.span 
            className="text-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {config.emoji}
          </motion.span>
          <div>
            <h3 className="font-display font-bold text-card text-lg">{config.name}</h3>
            <p className="text-card/70 text-xs">{config.description}</p>
          </div>
        </div>
        <Badge className="bg-white/30 text-card border-0">
          Level {level === 'beginner' ? 1 : level === 'intermediate' ? 2 : level === 'advanced' ? 3 : 4}
        </Badge>
      </div>

      {/* XP Progress */}
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground flex items-center gap-1">
              <Star className="w-4 h-4 text-gold" />
              Experience
            </span>
            <span className="text-sm text-muted-foreground">
              {xp} / {nextLevelXp} XP
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {level !== 'expert' && (
            <p className="text-xs text-muted-foreground mt-1">
              {nextLevelXp - xp} XP to next level
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-xl p-3 text-center">
            <Trophy className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="font-display font-bold text-foreground">{gamesWon}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-display font-bold text-foreground">{gamesPlayed}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <Target className="w-5 h-5 text-secondary mx-auto mb-1" />
            <p className="font-display font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerLevelCard;