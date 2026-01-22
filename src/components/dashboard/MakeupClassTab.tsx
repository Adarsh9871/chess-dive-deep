import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Clock, Plus, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface MakeupRequest {
  id: string;
  original_class_id: string;
  requested_date: string;
  requested_time: string;
  status: string;
  reason: string | null;
  created_at: string;
}

interface ClassData {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00"
];

const MakeupClassTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MakeupRequest[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [requestedDate, setRequestedDate] = useState<Date | undefined>();
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch makeup requests
    const { data: requestsData } = await supabase
      .from("makeup_requests")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (requestsData) {
      setRequests(requestsData);
    }

    // Fetch user's classes that can be rescheduled
    const { data: classesData } = await supabase
      .from("classes")
      .select("*")
      .eq("student_id", user.id)
      .in("status", ["scheduled", "canceled"])
      .order("scheduled_date", { ascending: false });

    if (classesData) {
      setClasses(classesData);
    }

    setLoading(false);
  };

  const submitRequest = async () => {
    if (!selectedClassId || !requestedDate || !requestedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("makeup_requests").insert({
      original_class_id: selectedClassId,
      student_id: user?.id,
      requested_date: format(requestedDate, "yyyy-MM-dd"),
      requested_time: requestedTime,
      reason: reason || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit request");
      return;
    }

    toast.success("Makeup class request submitted!");
    setShowForm(false);
    setSelectedClassId("");
    setRequestedDate(undefined);
    setRequestedTime("");
    setReason("");
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Request Makeup Class
              </CardTitle>
              <CardDescription>
                Reschedule a missed or canceled class
              </CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            )}
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Original Class</label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class to reschedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {format(new Date(c.scheduled_date), "MMM d")} at {c.scheduled_time} - {c.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Requested Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {requestedDate ? format(requestedDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={requestedDate}
                      onSelect={setRequestedDate}
                      disabled={(date) => isBefore(date, startOfToday())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Time</label>
                <Select value={requestedTime} onValueChange={setRequestedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
                <Input
                  placeholder="Why do you need to reschedule?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={submitRequest} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Existing Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>Track the status of your makeup class requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(r.status)}
                    <div>
                      <p className="font-medium">
                        Requested for {format(new Date(r.requested_date), "MMM d, yyyy")} at {r.requested_time}
                      </p>
                      {r.reason && (
                        <p className="text-sm text-muted-foreground">{r.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {format(new Date(r.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No makeup requests yet</p>
              <p className="text-sm">Click "New Request" to reschedule a class</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MakeupClassTab;
