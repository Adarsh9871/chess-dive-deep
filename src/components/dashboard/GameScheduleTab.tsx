import { useState, useEffect } from "react";
import { format, isBefore, startOfToday, addDays, isSameDay, isToday, isTomorrow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Gamepad2, 
  CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Play,
  Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScheduledGame {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  bot_difficulty: string;
  status: string;
  created_at: string;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

const botOptions = [
  { id: "beginner", name: "Friendly Freddie", emoji: "🐣", rating: "~500" },
  { id: "easy", name: "Clever Charlie", emoji: "🦊", rating: "~1000" },
  { id: "medium", name: "Master Magnus", emoji: "🦁", rating: "~1400" },
  { id: "hard", name: "Expert Elena", emoji: "🐉", rating: "~1700" },
  { id: "master", name: "Grandmaster Gary", emoji: "👑", rating: "~2000+" },
];

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const GameScheduleTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  
  // Schedule form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedBot, setSelectedBot] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGames();
    }
  }, [user]);

  const fetchGames = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("scheduled_games")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching games:", error);
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  const scheduleGame = async () => {
    if (!user || !selectedDate || !selectedTime || !selectedBot) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("scheduled_games").insert({
      user_id: user.id,
      scheduled_date: format(selectedDate, "yyyy-MM-dd"),
      scheduled_time: selectedTime,
      bot_difficulty: selectedBot,
      status: "scheduled",
    });

    if (error) {
      toast.error("Failed to schedule game");
      setSaving(false);
      return;
    }

    const bot = botOptions.find(b => b.id === selectedBot);
    const dateLabel = isToday(selectedDate) ? "today" : isTomorrow(selectedDate) ? "tomorrow" : format(selectedDate, "MMM d");
    
    toast.success(`Game scheduled with ${bot?.name} for ${dateLabel} at ${selectedTime}!`);
    setSaving(false);
    setShowScheduleDialog(false);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedBot("");
    fetchGames();
  };

  const deleteGame = async (gameId: string) => {
    const { error } = await supabase
      .from("scheduled_games")
      .delete()
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to cancel game");
      return;
    }

    toast.success("Game cancelled");
    fetchGames();
  };

  const playNow = (difficulty: string) => {
    navigate(`/play?bot=${difficulty}`);
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const upcomingGames = games.filter(g => g.status === "scheduled");
  const pastGames = games.filter(g => g.status !== "scheduled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-primary" />
            My Game Schedule
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule chess games with bots and track your progress
          </p>
        </div>

        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Game
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Schedule a Chess Game
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Bot Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Choose Opponent
                </label>
                <Select value={selectedBot} onValueChange={setSelectedBot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {botOptions.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        <div className="flex items-center gap-2">
                          <span>{bot.emoji}</span>
                          <span>{bot.name}</span>
                          <Badge variant="outline" className="ml-1 text-xs">
                            ELO {bot.rating}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Select Date
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => isBefore(date, startOfToday())}
                  className="rounded-md border"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Select Time
                </label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose time" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={scheduleGame}
                disabled={saving || !selectedDate || !selectedTime || !selectedBot}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Game
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{upcomingGames.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming Games</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{pastGames.filter(g => g.status === "completed").length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Games */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming Games
              </CardTitle>
              <CardDescription>Your scheduled chess matches</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchGames}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : upcomingGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No scheduled games yet</p>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Game
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingGames.map((game) => {
                const bot = botOptions.find(b => b.id === game.bot_difficulty);
                const gameDate = new Date(game.scheduled_date);
                const isGameToday = isToday(gameDate);
                
                return (
                  <div
                    key={game.id}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      isGameToday ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{bot?.emoji || "🤖"}</span>
                      <div>
                        <p className="font-semibold">{bot?.name || "Bot"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{getDateLabel(game.scheduled_date)}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span>{game.scheduled_time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusColors[game.status]} text-white`}>
                        {game.status}
                      </Badge>
                      {isGameToday && (
                        <Button size="sm" onClick={() => playNow(game.bot_difficulty)}>
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGame(game.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Play */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Quick Play
          </CardTitle>
          <CardDescription>Jump into a game right now!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {botOptions.map((bot) => (
              <Button
                key={bot.id}
                variant="outline"
                className="flex flex-col h-auto py-4 hover:bg-primary/5 hover:border-primary"
                onClick={() => playNow(bot.id)}
              >
                <span className="text-2xl mb-1">{bot.emoji}</span>
                <span className="text-sm font-medium">{bot.name.split(" ")[1]}</span>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {bot.rating}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameScheduleTab;
