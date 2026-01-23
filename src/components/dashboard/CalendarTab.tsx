import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isBefore, startOfToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Video, Clock, User, Loader2 } from "lucide-react";

interface ClassEvent {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  student_id: string | null;
  coach_id: string | null;
  duration_minutes: number;
}

interface CoachInfo {
  coach_id: string;
  display_name: string | null;
}

interface AvailabilitySlot {
  id: string;
  coach_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
];

const statusColors: Record<string, string> = {
  scheduled: "bg-primary",
  completed: "bg-green-500",
  canceled: "bg-red-400",
  makeup: "bg-blue-500",
  trial: "bg-purple-400",
};

const CalendarTab = () => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [assignedCoaches, setAssignedCoaches] = useState<CoachInfo[]>([]);
  const [coachAvailability, setCoachAvailability] = useState<AvailabilitySlot[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  
  // Booking form
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchClasses();
      fetchAssignedCoaches();
    }
  }, [user, currentWeek]);

  const checkUserRole = async () => {
    if (!user) return;
    
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    if (roles) {
      setIsCoach(roles.some(r => r.role === 'coach'));
      setIsStudent(roles.some(r => r.role === 'student') || roles.length === 0);
    }
  };

  const fetchAssignedCoaches = async () => {
    if (!user) return;
    
    const { data: assignments } = await supabase
      .from("coach_student_assignments")
      .select("coach_id")
      .eq("student_id", user.id)
      .eq("status", "active");
    
    if (assignments && assignments.length > 0) {
      const coachIds = assignments.map(a => a.coach_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", coachIds);
      
      if (profiles) {
        setAssignedCoaches(profiles.map(p => ({
          coach_id: p.user_id,
          display_name: p.display_name
        })));
      }
      
      // Fetch availability for these coaches
      const { data: availability } = await supabase
        .from("coach_availability")
        .select("*")
        .in("coach_id", coachIds)
        .eq("is_available", true);
      
      if (availability) {
        setCoachAvailability(availability);
      }
    }
  };

  const fetchClasses = async () => {
    if (!user) return;

    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
      .gte("scheduled_date", startDate)
      .lte("scheduled_date", endDate)
      .order("scheduled_time");

    if (error) {
      console.error("Error fetching classes:", error);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const getAvailableTimesForDate = (date: Date) => {
    if (!selectedCoach || !date) return [];
    
    const dayOfWeek = date.getDay();
    const availableSlots = coachAvailability.filter(
      slot => slot.coach_id === selectedCoach && slot.day_of_week === dayOfWeek
    );
    
    if (availableSlots.length === 0) return [];
    
    // Get all times within available ranges
    const availableTimes: string[] = [];
    for (const slot of availableSlots) {
      for (const time of timeSlots) {
        if (time >= slot.start_time && time < slot.end_time) {
          availableTimes.push(time);
        }
      }
    }
    
    return [...new Set(availableTimes)].sort();
  };

  const submitBookingRequest = async () => {
    if (!user || !bookingDate || !bookingTime) {
      toast.error("Please select a date and time");
      return;
    }
    
    setSaving(true);
    
    // If coach is assigned, use that coach_id, otherwise leave null for admin to assign
    const { error } = await supabase.from("slot_requests").insert({
      student_id: user.id,
      coach_id: selectedCoach || null,
      requested_date: format(bookingDate, "yyyy-MM-dd"),
      requested_time: bookingTime,
      notes: bookingNotes || null,
      status: "pending",
    });
    
    if (error) {
      toast.error("Failed to submit booking request");
      setSaving(false);
      return;
    }
    
    // Send notification to coach
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: selectedCoach,
          type: 'slot_request',
          title: 'New Session Request',
          message: `A student has requested a session on ${format(bookingDate, "MMM d")} at ${bookingTime}`,
        }
      });
    } catch (e) {
      console.log("Notification failed:", e);
    }
    
    setSaving(false);
    toast.success("Booking request submitted! Your coach will review it.");
    setShowBookingDialog(false);
    setSelectedCoach("");
    setBookingDate(undefined);
    setBookingTime("");
    setBookingNotes("");
  };

  const updateClassStatus = async (classId: string, newStatus: string) => {
    const { error } = await supabase
      .from("classes")
      .update({ status: newStatus })
      .eq("id", classId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success("Status updated");
    fetchClasses();
  };

  const getClassesForSlot = (day: Date, time: string) => {
    return classes.filter(
      (c) =>
        isSameDay(new Date(c.scheduled_date), day) &&
        c.scheduled_time === time
    );
  };

  const handleCellClick = (day: Date, time: string) => {
    if (!isStudent) return;

    setBookingDate(day);
    setBookingTime(time);
    setShowScheduleDialog(true);
  };

  // New state for direct booking dialog (without coach requirement)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            My Calendar
          </h2>
          <p className="text-sm text-muted-foreground">
            {isStudent ? "View classes & book sessions with your coach" : "Manage your classes"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStudent && (
            <Button className="gap-2" onClick={() => setShowScheduleDialog(true)}>
              <Plus className="w-4 h-4" />
              Book Session
            </Button>
          )}
        </div>
      </div>

      {/* Direct Booking Dialog - Works for all students */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Book a Session
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Coach Selection - Optional if coaches are assigned */}
            {assignedCoaches.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Select Coach (optional)
                </label>
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger>
                    <SelectValue placeholder="Admin will assign a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedCoaches.map((coach) => (
                      <SelectItem key={coach.coach_id} value={coach.coach_id}>
                        {coach.display_name || "Coach"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Select Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {bookingDate ? format(bookingDate, "EEE, MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={setBookingDate}
                    disabled={(date) => isBefore(date, startOfToday())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Select Time
              </label>
              <Select 
                value={bookingTime} 
                onValueChange={setBookingTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
              <Textarea
                placeholder="Any topics you'd like to focus on..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={submitBookingRequest} 
              disabled={saving || !bookingDate || !bookingTime} 
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Request Session
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              {assignedCoaches.length > 0 
                ? "Your coach will review and confirm the session"
                : "Admin will assign a coach and confirm your session"
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${color}`} />
            <span className="text-xs capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-background p-3 sm:p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h3 className="font-display font-semibold text-sm sm:text-lg text-center">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </h3>

        <div className="w-24 hidden sm:block" />
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[600px] sm:min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 sm:p-3 text-xs text-muted-foreground font-medium">Time</div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-2 sm:p-3 text-center border-l ${
                    isSameDay(day, new Date()) ? "bg-primary/10" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                  <p className={`text-base sm:text-lg font-bold ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {timeSlots.filter((_, i) => i % 2 === 0).map((time) => (
                <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="p-1.5 sm:p-2 text-xs text-muted-foreground font-medium">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const slotClasses = getClassesForSlot(day, time);
                    const isPast = isBefore(day, startOfToday());
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`p-0.5 sm:p-1 border-l min-h-[50px] sm:min-h-[60px] transition-colors ${
                          isSameDay(day, new Date()) ? "bg-primary/5" : ""
                        } ${!isPast && isStudent ? "hover:bg-muted/50 cursor-pointer" : ""}`}
                        onClick={() => !isPast && handleCellClick(day, time)}
                      >
                        {slotClasses.map((c) => (
                          <div
                            key={c.id}
                            className={`text-xs p-1 sm:p-1.5 rounded text-white mb-0.5 cursor-pointer ${
                              statusColors[c.status] || "bg-gray-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCoach) {
                                const newStatus = c.status === "scheduled" ? "completed" : "scheduled";
                                updateClassStatus(c.id, newStatus);
                              }
                            }}
                          >
                            <p className="font-medium truncate text-[10px] sm:text-xs">
                              {c.status === "trial" ? "Trial" : "Class"}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info for students without coaches */}
      {isStudent && assignedCoaches.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">No Coach Assigned Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              An admin will assign you a coach soon. Once assigned, you'll be able to book 1-on-1 sessions directly from this calendar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarTab;
