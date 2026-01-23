import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, addDays, getDay, startOfToday } from "date-fns";
import { CalendarIcon, Clock, User, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Coach {
  id: string;
  coach_id: string;
  display_name: string | null;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface SlotRequest {
  id: string;
  coach_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  coach_name?: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const StudentSlotBookingTab = () => {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedCoaches();
    fetchMyRequests();
  }, [user]);

  useEffect(() => {
    if (selectedCoach) {
      fetchCoachAvailability(selectedCoach);
    }
  }, [selectedCoach]);

  const fetchAssignedCoaches = async () => {
    if (!user) return;

    const { data: assignments, error } = await supabase
      .from("coach_student_assignments")
      .select("coach_id")
      .eq("student_id", user.id)
      .eq("status", "active");

    if (error || !assignments) {
      setLoading(false);
      return;
    }

    const coachIds = assignments.map(a => a.coach_id);
    
    if (coachIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", coachIds);

    if (profiles) {
      setCoaches(profiles.map(p => ({
        id: p.user_id,
        coach_id: p.user_id,
        display_name: p.display_name || "Coach",
      })));
    }
    setLoading(false);
  };

  const fetchCoachAvailability = async (coachId: string) => {
    const { data } = await supabase
      .from("coach_availability")
      .select("day_of_week, start_time, end_time")
      .eq("coach_id", coachId)
      .eq("is_available", true);

    if (data) {
      setAvailability(data);
    }
  };

  const fetchMyRequests = async () => {
    if (!user) return;

    const { data: requests } = await supabase
      .from("slot_requests")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (requests) {
      // Get coach names
      const coachIds = [...new Set(requests.map(r => r.coach_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", coachIds);

      const enrichedRequests = requests.map(r => ({
        ...r,
        coach_name: profiles?.find(p => p.user_id === r.coach_id)?.display_name || "Coach",
      }));

      setMyRequests(enrichedRequests);
    }
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    const dayOfWeek = getDay(date);
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
    
    if (dayAvailability.length === 0) return [];

    const times: string[] = [];
    dayAvailability.forEach(slot => {
      let current = parseInt(slot.start_time.split(":")[0]);
      const end = parseInt(slot.end_time.split(":")[0]);
      
      while (current < end) {
        times.push(`${current.toString().padStart(2, "0")}:00`);
        current++;
      }
    });

    return times.sort();
  };

  const isDateAvailable = (date: Date) => {
    const dayOfWeek = getDay(date);
    return availability.some(a => a.day_of_week === dayOfWeek);
  };

  const handleSubmitRequest = async () => {
    if (!user || !selectedCoach || !selectedDate || !selectedTime) {
      toast.error("Please select coach, date and time");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("slot_requests").insert({
      student_id: user.id,
      coach_id: selectedCoach,
      requested_date: format(selectedDate, "yyyy-MM-dd"),
      requested_time: selectedTime,
      notes: notes || null,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit request");
      setSubmitting(false);
      return;
    }

    // Send notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: selectedCoach,
          type: 'slot_request',
          title: 'New Session Request',
          message: `A student has requested a session on ${format(selectedDate, "MMM d")} at ${selectedTime}`,
        }
      });
    } catch (e) {
      console.log("Notification failed:", e);
    }

    toast.success("Request submitted! Your coach will review it.");
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    setSubmitting(false);
    fetchMyRequests();
  };

  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: "bg-yellow-500", icon: <Clock className="w-3 h-3" /> },
    approved: { color: "bg-green-500", icon: <CheckCircle className="w-3 h-3" /> },
    declined: { color: "bg-red-500", icon: <XCircle className="w-3 h-3" /> },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Coach Assigned</h3>
          <p className="text-muted-foreground">
            You don't have a coach assigned yet. Please contact admin to get paired with a coach.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Request a Session
          </CardTitle>
          <CardDescription>
            Select your coach and preferred time slot to request a session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coach Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Coach</label>
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your coach..." />
              </SelectTrigger>
              <SelectContent>
                {coaches.map(coach => (
                  <SelectItem key={coach.id} value={coach.coach_id}>
                    {coach.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCoach && (
            <>
              {/* Available Days Info */}
              {availability.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-1">Coach Available On:</p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(availability.map(a => a.day_of_week))].sort().map(day => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {dayNames[day]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime("");
                      }}
                      disabled={(date) => 
                        date < startOfToday() || !isDateAvailable(date)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Time</label>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableTimes.map(time => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No available slots for this date
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  placeholder="Any specific topics you'd like to cover..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitRequest}
                disabled={!selectedDate || !selectedTime || submitting}
                className="w-full"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Request
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
          <CardDescription>Track your session requests</CardDescription>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              No requests yet. Book your first session above!
            </p>
          ) : (
            <div className="space-y-3">
              {myRequests.map(request => {
                const config = statusConfig[request.status] || statusConfig.pending;
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {format(new Date(request.requested_date), "EEE, MMM d")} at {request.requested_time}
                        </p>
                        <Badge className={`${config.color} text-white gap-1`}>
                          {config.icon}
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coach: {request.coach_name}
                      </p>
                      {request.admin_notes && (
                        <p className="text-sm text-primary mt-1">
                          Note: {request.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentSlotBookingTab;