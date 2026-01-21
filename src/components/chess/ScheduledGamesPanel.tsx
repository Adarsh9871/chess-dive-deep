import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Trash2, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { BotDifficulty, bots } from "./BotSelector";

interface ScheduledGame {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  bot_difficulty: string;
  status: string;
}

interface ScheduledGamesPanelProps {
  onPlayGame: (difficulty: BotDifficulty) => void;
}

const ScheduledGamesPanel = ({ onPlayGame }: ScheduledGamesPanelProps) => {
  const { user } = useAuth();
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchGames();
    } else {
      setGames([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGames = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_games")
      .select("*")
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching games:", error);
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  const deleteGame = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from("scheduled_games")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete game");
    } else {
      setGames((prev) => prev.filter((g) => g.id !== id));
      toast.success("Game cancelled");
    }
    setDeletingId(null);
  };

  const playGame = async (game: ScheduledGame) => {
    // Update status to played
    await supabase
      .from("scheduled_games")
      .update({ status: "played" })
      .eq("id", game.id);

    onPlayGame(game.bot_difficulty as BotDifficulty);
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getBotInfo = (difficulty: string) => {
    return bots.find((b) => b.id === difficulty) || bots[0];
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center p-6 bg-muted/30 rounded-2xl border border-border">
        <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm">
          No scheduled games yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Your Scheduled Games
      </h3>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {games.map((game) => {
          const bot = getBotInfo(game.bot_difficulty);
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
            >
              <span className="text-2xl">{bot.emoji}</span>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  vs {bot.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{getDateLabel(game.scheduled_date)}</span>
                  <Clock className="w-3 h-3 ml-1" />
                  <span>{game.scheduled_time}</span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary hover:bg-primary/10"
                  onClick={() => playGame(game)}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteGame(game.id)}
                  disabled={deletingId === game.id}
                >
                  {deletingId === game.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduledGamesPanel;
