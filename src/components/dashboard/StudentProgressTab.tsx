import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Gamepad2, 
  Puzzle, 
  TrendingUp, 
  Star, 
  Target, 
  Crown,
  Zap,
  Award,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerStore, levelConfig } from "@/stores/playerStore";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  gamesThisWeek: number;
  winsThisWeek: number;
}

interface PuzzleStats {
  totalSolved: number;
  totalStars: number;
  averageAttempts: number;
}

const StudentProgressTab = () => {
  const { user } = useAuth();
  const { level, xp, gamesPlayed, gamesWon } = usePlayerStore();
  const config = levelConfig[level];
  
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    gamesThisWeek: 0,
    winsThisWeek: 0,
  });
  const [puzzleStats, setPuzzleStats] = useState<PuzzleStats>({
    totalSolved: 0,
    totalStars: 0,
    averageAttempts: 1,
  });
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch game history
      const { data: games } = await supabase
        .from("game_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (games) {
        const wins = games.filter(g => g.result === "win").length;
        const losses = games.filter(g => g.result === "loss").length;
        const draws = games.filter(g => g.result === "draw").length;
        
        const weekStart = startOfWeek(new Date());
        const weekGames = games.filter(g => new Date(g.created_at) >= weekStart);
        
        setGameStats({
          totalGames: games.length,
          wins,
          losses,
          draws,
          winRate: games.length > 0 ? Math.round((wins / games.length) * 100) : 0,
          gamesThisWeek: weekGames.length,
          winsThisWeek: weekGames.filter(g => g.result === "win").length,
        });
        
        setRecentGames(games.slice(0, 5));
      }

      // Fetch puzzle progress
      const { data: puzzles } = await supabase
        .from("puzzle_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("solved", true);

      if (puzzles) {
        const totalStars = puzzles.reduce((acc, p) => acc + (p.stars_earned || 0), 0);
        const avgAttempts = puzzles.length > 0 
          ? puzzles.reduce((acc, p) => acc + p.attempts, 0) / puzzles.length 
          : 1;
          
        setPuzzleStats({
          totalSolved: puzzles.length,
          totalStars,
          averageAttempts: Math.round(avgAttempts * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate XP progress
  const currentLevelXp = level === 'beginner' ? 0 : 
    level === 'intermediate' ? 500 :
    level === 'advanced' ? 1500 : 3500;
  const nextLevelXp = config.nextLevelXp;
  const progressXp = xp - currentLevelXp;
  const requiredXp = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, (progressXp / requiredXp) * 100);

  // Use local store if no DB data yet
  const displayStats = gameStats.totalGames > 0 ? gameStats : {
    totalGames: gamesPlayed,
    wins: gamesWon,
    losses: gamesPlayed - gamesWon,
    draws: 0,
    winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0,
    gamesThisWeek: gamesPlayed,
    winsThisWeek: gamesWon,
  };

  return (
    <div className="space-y-6">
      {/* Level Card - Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-orange-500 to-secondary p-6 text-white shadow-2xl"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -left-5 -bottom-5 h-32 w-32 rounded-full bg-white/5" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl sm:text-7xl"
          >
            {config.emoji}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-display font-bold">{config.name}</h2>
              <Badge className="bg-white/20 text-white border-0">
                Level {level === 'beginner' ? 1 : level === 'intermediate' ? 2 : level === 'advanced' ? 3 : 4}
              </Badge>
            </div>
            <p className="text-white/80 mb-4">{config.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" /> {xp} XP
                </span>
                <span className="text-white/70">{nextLevelXp} XP needed</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-white/20" />
              {level !== 'expert' && (
                <p className="text-xs text-white/60">{nextLevelXp - xp} XP to next level</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{displayStats.totalGames}</p>
              <p className="text-sm text-muted-foreground">Games Played</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 hover:border-secondary/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{displayStats.wins}</p>
              <p className="text-sm text-muted-foreground">Victories</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 hover:border-accent/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <Puzzle className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{puzzleStats.totalSolved}</p>
              <p className="text-sm text-muted-foreground">Puzzles Solved</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 hover:border-gold/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground">{displayStats.winRate}%</p>
              <p className="text-sm text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Progress & Achievements */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-medium">Games Played</span>
                </div>
                <Badge variant="secondary">{displayStats.gamesThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-secondary" />
                  <span className="font-medium">Victories</span>
                </div>
                <Badge className="bg-secondary text-secondary-foreground">{displayStats.winsThisWeek}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-gold" />
                  <span className="font-medium">Stars Earned</span>
                </div>
                <Badge className="bg-gold text-gold-foreground">{puzzleStats.totalStars}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-gold" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div 
                className={`flex items-center gap-3 p-3 rounded-xl ${displayStats.totalGames >= 1 ? 'bg-secondary/20' : 'bg-muted/30 opacity-50'}`}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{displayStats.totalGames >= 1 ? '🎮' : '🔒'}</span>
                <div>
                  <p className="font-semibold text-sm">First Game</p>
                  <p className="text-xs text-muted-foreground">Play your first chess game</p>
                </div>
              </motion.div>
              <motion.div 
                className={`flex items-center gap-3 p-3 rounded-xl ${displayStats.wins >= 1 ? 'bg-gold/20' : 'bg-muted/30 opacity-50'}`}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{displayStats.wins >= 1 ? '🏆' : '🔒'}</span>
                <div>
                  <p className="font-semibold text-sm">First Victory</p>
                  <p className="text-xs text-muted-foreground">Win your first game</p>
                </div>
              </motion.div>
              <motion.div 
                className={`flex items-center gap-3 p-3 rounded-xl ${displayStats.wins >= 10 ? 'bg-primary/20' : 'bg-muted/30 opacity-50'}`}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{displayStats.wins >= 10 ? '👑' : '🔒'}</span>
                <div>
                  <p className="font-semibold text-sm">Champion</p>
                  <p className="text-xs text-muted-foreground">Win 10 games</p>
                </div>
              </motion.div>
              <motion.div 
                className={`flex items-center gap-3 p-3 rounded-xl ${puzzleStats.totalSolved >= 5 ? 'bg-accent/20' : 'bg-muted/30 opacity-50'}`}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl">{puzzleStats.totalSolved >= 5 ? '🧩' : '🔒'}</span>
                <div>
                  <p className="font-semibold text-sm">Puzzle Master</p>
                  <p className="text-xs text-muted-foreground">Solve 5 puzzles</p>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentGames.map((game, i) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {game.result === 'win' ? '🏆' : game.result === 'draw' ? '🤝' : '💪'}
                      </span>
                      <div>
                        <p className="font-medium text-sm">vs {game.opponent_name || 'Bot'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(game.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={game.result === 'win' ? 'default' : game.result === 'draw' ? 'secondary' : 'outline'}>
                        {game.result.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">+{game.xp_earned} XP</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default StudentProgressTab;
