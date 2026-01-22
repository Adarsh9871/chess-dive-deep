import { useState, useEffect } from "react";
import { format, isBefore, startOfToday, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, Send, Video, User, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

interface CoachingRequest {
  id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  coach_name?: string;
}

const CoachingRequestTab = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [requests, setRequests] = useState<CoachingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCoach, setAssignedCoach] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchAssignedCoach();
    }
  }, [user]);

  const fetchAssignedCoach = async () => {
    if (!user) return;

    const { data: assignment } = await supabase
      .from("coach_student_assignments")
      .select("coach_id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .single();

    if (assignment) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", assignment.coach_id)
        .single();

      setAssignedCoach({
        id: assignment.coach_id,
        name: profile?.display_name || "Your Coach",
      });
    }
  };

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("slot_requests")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching requests:", error);
    } else if (data) {
      // Enrich with coach names
      const coachIds = [...new Set(data.map(r => r.coach_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", coachIds);

      const enriched = data.map(r => ({
        ...r,
        coach_name: profiles?.find(p => p.user_id === r.coach_id)?.display_name || "Coach",
      }));

      setRequests(enriched);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !selectedDate || !selectedTime || !assignedCoach) {
      toast.error("Please select a date and time");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("slot_requests").insert({
      student_id: user.id,
      coach_id: assignedCoach.id,
      requested_date: format(selectedDate, "yyyy-MM-dd"),
      requested_time: selectedTime,
      notes: notes || null,
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
      return;
    }

    toast.success("Coaching session request submitted!");
    setSelectedDate(undefined);
    setSelectedTime("");
    setNotes("");
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (!assignedCoach) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Request Coaching Session
            </CardTitle>
            <CardDescription>
              You don't have a coach assigned yet. Please contact an admin to get assigned to a coach.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Request Coaching Session
          </CardTitle>
          <CardDescription>
            Schedule a 1-on-1 session with your coach. They'll receive a notification and set up a Google Meet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Your Coach</p>
              <p className="text-muted-foreground text-sm">{assignedCoach.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Select Date
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {selectedDate ? format(selectedDate, "EEE, MMM d") : "Choose date..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => isBefore(date, startOfToday()) || isBefore(addDays(new Date(), 30), date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Select Time
              </label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose time..." />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="What would you like to focus on in this session?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Request Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>Track the status of your coaching session requests</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No requests yet. Submit your first request above!
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold">{format(new Date(request.requested_date), "d")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(request.requested_date), "MMM")}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(request.requested_date), "EEEE")} at {request.requested_time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {request.coach_name}
                      </p>
                      {request.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{request.admin_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachingRequestTab;
