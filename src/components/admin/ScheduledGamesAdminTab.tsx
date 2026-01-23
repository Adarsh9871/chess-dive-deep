import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Gamepad2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ScheduledGame {
  id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  bot_difficulty: string;
  status: string;
  created_at: string;
  user_name?: string;
}

const botEmojis: Record<string, string> = {
  beginner: "🐣",
  easy: "🦊",
  medium: "🦁",
  hard: "🐉",
  master: "👑",
};

const ScheduledGamesAdminTab = () => {
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchScheduledGames();
  }, []);

  const fetchScheduledGames = async () => {
    setLoading(true);
    
    const { data: gamesData, error } = await supabase
      .from("scheduled_games")
      .select("*")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    if (error) {
      console.error("Error fetching games:", error);
      setLoading(false);
      return;
    }

    if (gamesData) {
      // Get user names
      const userIds = [...new Set(gamesData.map(g => g.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const enrichedGames = gamesData.map(g => ({
        ...g,
        user_name: profiles?.find(p => p.user_id === g.user_id)?.display_name || "Unknown",
      }));

      setGames(enrichedGames);
    }
    setLoading(false);
  };

  const deleteGame = async (gameId: string) => {
    const { error } = await supabase
      .from("scheduled_games")
      .delete()
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to delete game");
      return;
    }

    toast.success("Game deleted");
    fetchScheduledGames();
  };

  const updateGameStatus = async (gameId: string, status: string) => {
    const { error } = await supabase
      .from("scheduled_games")
      .update({ status })
      .eq("id", gameId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
    fetchScheduledGames();
  };

  const filteredGames = games.filter(g =>
    g.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.bot_difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    scheduled: "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Scheduled Games
            </CardTitle>
            <CardDescription>
              View all scheduled bot games from users
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchScheduledGames}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled games found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGames.map(game => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.user_name}</TableCell>
                    <TableCell>{format(new Date(game.scheduled_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{game.scheduled_time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{botEmojis[game.bot_difficulty] || "🤖"}</span>
                        <span className="capitalize">{game.bot_difficulty}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[game.status] || "bg-gray-500"} text-white`}>
                        {game.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {game.status === "scheduled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateGameStatus(game.id, "completed")}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGame(game.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledGamesAdminTab;