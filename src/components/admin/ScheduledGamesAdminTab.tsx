import { useState, useEffect } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, Clock, User, Video, Loader2, CheckCircle2, 
  UserPlus, Play, ExternalLink, Gamepad2, Users
} from "lucide-react";
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
  user_email?: string;
}

interface Coach {
  user_id: string;
  display_name: string;
}

const ScheduledGamesAdminTab = () => {
  const { user } = useAuth();
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch scheduled games
    const { data: gamesData, error: gamesError } = await supabase
      .from("scheduled_games")
      .select("*")
      .order("scheduled_date", { ascending: true });

    if (gamesError) {
      console.error("Error fetching games:", gamesError);
    }

    // Fetch all coaches
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "coach");

    const coachIds = rolesData?.map(r => r.user_id) || [];

    // Fetch profiles
    const userIds = [...new Set([
      ...(gamesData?.map(g => g.user_id) || []),
      ...coachIds,
    ])];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    // Enrich games with user info
    const enrichedGames = gamesData?.map(g => ({
      ...g,
      user_name: profiles?.find(p => p.user_id === g.user_id)?.display_name || "Unknown",
      user_email: profiles?.find(p => p.user_id === g.user_id)?.email || "",
    })) || [];

    // Get coach profiles
    const coachProfiles = coachIds.map(id => ({
      user_id: id,
      display_name: profiles?.find(p => p.user_id === id)?.display_name || "Coach",
    }));

    setGames(enrichedGames);
    setCoaches(coachProfiles);
    setLoading(false);
  };

  const assignCoachAndCreateSession = async (game: ScheduledGame) => {
    const coachId = selectedCoach[game.id];
    if (!coachId) {
      toast.error("Please select a coach first");
      return;
    }

    setProcessingId(game.id);

    try {
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from("coach_student_assignments")
        .select("id")
        .eq("coach_id", coachId)
        .eq("student_id", game.user_id)
        .single();

      if (!existingAssignment) {
        // Create coach-student assignment
        const { error: assignError } = await supabase
          .from("coach_student_assignments")
          .insert({
            coach_id: coachId,
            student_id: game.user_id,
            assigned_by: user!.id,
            status: "active",
          });

        if (assignError) {
          console.error("Assignment error:", assignError);
          if (assignError.code !== "23505") { // Ignore duplicate key error
            throw assignError;
          }
        }
      }

      // Create a class with Google Meet integration
      const scheduledDateTime = `${game.scheduled_date}T${game.scheduled_time}:00`;
      const endDateTime = new Date(scheduledDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + 45);

      // Create the class first
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert({
          coach_id: coachId,
          student_id: game.user_id,
          scheduled_date: game.scheduled_date,
          scheduled_time: game.scheduled_time,
          duration_minutes: 45,
          status: "scheduled",
          notes: `Coaching session for scheduled game (${game.bot_difficulty} difficulty)`,
        })
        .select()
        .single();

      if (classError) throw classError;

      // Try to create Google Calendar event
      try {
        const coachProfile = coaches.find(c => c.user_id === coachId);
        const { data: studentProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", game.user_id)
          .single();

        const { data: coachEmail } = await supabase
          .from("profiles")
          .select("email")
          .eq("user_id", coachId)
          .single();

        const attendees = [studentProfile?.email, coachEmail?.email].filter(Boolean);

        const { data: calendarResult, error: calendarError } = await supabase.functions.invoke("create-calendar-event", {
          body: {
            title: `Chess Coaching: ${game.user_name} with ${coachProfile?.display_name}`,
            description: `1-on-1 chess coaching session.\nDifficulty focus: ${game.bot_difficulty}`,
            startDateTime: new Date(scheduledDateTime).toISOString(),
            endDateTime: endDateTime.toISOString(),
            attendees,
            classId: classData.id,
          },
        });

        if (calendarError) {
          console.error("Calendar error:", calendarError);
          toast.warning("Session created but Google Calendar failed. Add Meet link manually.");
        } else if (calendarResult?.meetLink) {
          toast.success("Session created with Google Meet!");
        }
      } catch (calError) {
        console.error("Calendar integration error:", calError);
        toast.warning("Session created. Google Calendar integration may need configuration.");
      }

      // Update game status
      await supabase
        .from("scheduled_games")
        .update({ status: "completed" })
        .eq("id", game.id);

      // Send notification to student
      await supabase.functions.invoke("send-notification", {
        body: {
          userId: game.user_id,
          title: "Coach Assigned!",
          message: `A coach has been assigned for your ${game.scheduled_date} session. Check your calendar for the Google Meet link.`,
          type: "class_scheduled",
        },
      });

      toast.success("Coach assigned and session created!");
      fetchData();
    } catch (error) {
      console.error("Error processing game:", error);
      toast.error("Failed to process game request");
    } finally {
      setProcessingId(null);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-500/20 text-green-600",
      easy: "bg-blue-500/20 text-blue-600",
      intermediate: "bg-amber-500/20 text-amber-600",
      advanced: "bg-orange-500/20 text-orange-600",
      expert: "bg-red-500/20 text-red-600",
    };
    return (
      <Badge className={colors[difficulty] || "bg-muted text-muted-foreground"}>
        {difficulty}
      </Badge>
    );
  };

  const pendingGames = games.filter(g => g.status === "scheduled");
  const processedGames = games.filter(g => g.status !== "scheduled").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingGames.length}</p>
              <p className="text-xs text-muted-foreground">Pending Games</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{games.filter(g => g.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Sessions Created</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coaches.length}</p>
              <p className="text-xs text-muted-foreground">Available Coaches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Scheduled Games Awaiting Coach
          </CardTitle>
          <CardDescription>
            Assign coaches to students who scheduled games. This will create a coaching session with Google Meet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingGames.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending scheduled games. Students can schedule games from the Play page.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingGames.map((game) => (
                <div
                  key={game.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-primary/10 rounded-lg p-2 min-w-[60px]">
                      <p className="text-lg font-bold">{format(parseISO(game.scheduled_date), "d")}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(game.scheduled_date), "MMM")}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{game.user_name}</span>
                        {getDifficultyBadge(game.bot_difficulty)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {getDateLabel(game.scheduled_date)} at {game.scheduled_time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Select
                      value={selectedCoach[game.id] || ""}
                      onValueChange={(value) => setSelectedCoach(prev => ({ ...prev, [game.id]: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select coach..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {coaches.map((coach) => (
                          <SelectItem key={coach.user_id} value={coach.user_id}>
                            {coach.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => assignCoachAndCreateSession(game)}
                      disabled={!selectedCoach[game.id] || processingId === game.id}
                      size="sm"
                    >
                      {processingId === game.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-1" />
                          Assign & Create Meet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Processed */}
      {processedGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm">
                      {game.user_name} - {format(parseISO(game.scheduled_date), "MMM d")} at {game.scheduled_time}
                    </span>
                  </div>
                  <Badge variant="secondary">{game.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduledGamesAdminTab;
