import { useState, useEffect } from "react";
import { format, startOfWeek, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import WeeklyCalendar, { CalendarEvent } from "@/components/calendar/WeeklyCalendar";
import ScheduleClassDialog from "@/components/calendar/ScheduleClassDialog";
import EventDetailDialog from "@/components/calendar/EventDetailDialog";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

const CalendarTab = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showScheduleGameDialog, setShowScheduleGameDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>();
  const [isCoach, setIsCoach] = useState(false);
  
  // Game scheduling state
  const [gameDate, setGameDate] = useState<Date | undefined>();
  const [gameTime, setGameTime] = useState("");
  const [gameDifficulty, setGameDifficulty] = useState("beginner");
  const [savingGame, setSavingGame] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClasses();
      checkIfCoach();
    }
  }, [user]);

  const checkIfCoach = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setIsCoach(data?.some(r => r.role === 'coach' || r.role === 'admin') || false);
  };

  const fetchClasses = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch classes for this user (as coach or student)
    const { data: classesData, error } = await supabase
      .from("classes")
      .select("*")
      .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
      return;
    }

    if (classesData) {
      // Get unique coach and student IDs
      const coachIds = [...new Set(classesData.map(c => c.coach_id).filter(Boolean))];
      const studentIds = [...new Set(classesData.map(c => c.student_id).filter(Boolean))];
      const allUserIds = [...new Set([...coachIds, ...studentIds])];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allUserIds);

      const enrichedClasses: CalendarEvent[] = classesData.map(c => ({
        ...c,
        coach_name: profiles?.find(p => p.user_id === c.coach_id)?.display_name || undefined,
        student_name: profiles?.find(p => p.user_id === c.student_id)?.display_name || undefined,
      }));

      setClasses(enrichedClasses);
    }

    setLoading(false);
  };

  const handleSlotClick = (date: Date, time: string) => {
    setPreselectedDate(date);
    setPreselectedTime(time);
    setGameDate(date);
    setGameTime(time);
    
    if (isCoach) {
      // Coaches can schedule classes
      setShowScheduleDialog(true);
    } else {
      // Students can schedule play games
      setShowScheduleGameDialog(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const scheduleGame = async () => {
    if (!gameDate || !gameTime) {
      toast.error("Please select date and time");
      return;
    }

    setSavingGame(true);

    const { error } = await supabase.from("scheduled_games").insert({
      user_id: user?.id,
      scheduled_date: format(gameDate, "yyyy-MM-dd"),
      scheduled_time: gameTime,
      bot_difficulty: gameDifficulty,
      status: "scheduled",
    });

    setSavingGame(false);

    if (error) {
      toast.error("Failed to schedule game");
      return;
    }

    toast.success("Game scheduled! You'll be notified when it's time to play.");
    setShowScheduleGameDialog(false);
    setGameDate(undefined);
    setGameTime("");
    setGameDifficulty("beginner");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            My Calendar
          </h2>
          <p className="text-muted-foreground">
            {isCoach 
              ? "Manage your classes and schedule sessions with students" 
              : "View your classes and schedule practice games. Click any slot to schedule!"}
          </p>
        </div>

        <div className="flex gap-2">
          {!isCoach && (
            <Button onClick={() => setShowScheduleGameDialog(true)} variant="outline">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Schedule Game
            </Button>
          )}
          {isCoach && (
            <Button onClick={() => setShowScheduleDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Class
            </Button>
          )}
        </div>
      </div>

      {/* Calendar */}
      <WeeklyCalendar
        events={classes}
        loading={loading}
        onEventClick={handleEventClick}
        onSlotClick={handleSlotClick}
        showMeetLink={true}
      />

      {/* Schedule Class Dialog (for coaches) */}
      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSuccess={fetchClasses}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
        isCoach={isCoach}
      />

      {/* Schedule Game Dialog (for students) */}
      <Dialog open={showScheduleGameDialog} onOpenChange={setShowScheduleGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              Schedule Practice Game
            </DialogTitle>
            <DialogDescription>
              Schedule a chess game session. Admin will be notified and may assign a coach.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Date</Label>
              <p className="text-sm font-medium">
                {gameDate ? format(gameDate, "EEEE, MMMM d, yyyy") : "Click a slot on the calendar"}
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Time</Label>
              <Select value={gameTime} onValueChange={setGameTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Your Level</Label>
              <Select value={gameDifficulty} onValueChange={setGameDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleGameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={scheduleGame} disabled={savingGame || !gameDate || !gameTime}>
              {savingGame ? "Scheduling..." : "Schedule Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        onUpdate={fetchClasses}
        canEdit={isCoach}
      />
    </div>
  );
};

export default CalendarTab;
