import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react";

interface ClassEvent {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  student_id: string | null;
  duration_minutes: number;
}

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

const statusColors: Record<string, string> = {
  scheduled: "bg-yellow-400",
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Add class form
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState("");
  const [newStatus, setNewStatus] = useState("scheduled");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchClasses();
  }, [user, currentWeek]);

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

  const addClass = async () => {
    if (!newDate || !newTime) {
      toast.error("Please select date and time");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("classes").insert({
      coach_id: user?.id,
      scheduled_date: format(newDate, "yyyy-MM-dd"),
      scheduled_time: newTime,
      status: newStatus,
      notes: newNotes || null,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to add class");
      return;
    }

    toast.success("Class added successfully!");
    setShowAddDialog(false);
    setNewDate(undefined);
    setNewTime("");
    setNewStatus("scheduled");
    setNewNotes("");
    fetchClasses();
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

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            My Calendar
          </h2>
          <p className="text-muted-foreground">Manage your classes and availability</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {newDate ? format(newDate, "MMM d, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newDate}
                        onSelect={setNewDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Time</label>
                  <Select value={newTime} onValueChange={setNewTime}>
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
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="makeup">Makeup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea
                    placeholder="Add notes..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>

                <Button onClick={addClass} disabled={saving} className="w-full">
                  {saving ? "Adding..." : "Add Class"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-xs capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-background p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h3 className="font-display font-semibold text-lg">
          {format(weekStart, "MMMM d")} – {format(addDays(weekStart, 6), "d, yyyy")}
        </h3>

        <div className="w-24" /> {/* Spacer for alignment */}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 text-xs text-muted-foreground font-medium">Time</div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-3 text-center border-l ${
                    isSameDay(day, new Date()) ? "bg-primary/10" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                  <p className={`text-lg font-bold ${isSameDay(day, new Date()) ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="max-h-[500px] overflow-y-auto">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                  <div className="p-2 text-xs text-muted-foreground font-medium">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const slotClasses = getClassesForSlot(day, time);
                    return (
                      <div
                        key={dayIndex}
                        className={`p-1 border-l min-h-[60px] hover:bg-muted/30 ${
                          isSameDay(day, new Date()) ? "bg-primary/5" : ""
                        }`}
                      >
                        {slotClasses.map((c) => (
                          <div
                            key={c.id}
                            className={`text-xs p-1.5 rounded text-white mb-1 cursor-pointer ${
                              statusColors[c.status] || "bg-gray-400"
                            }`}
                            onClick={() => {
                              const newStatus = c.status === "scheduled" ? "completed" : "scheduled";
                              updateClassStatus(c.id, newStatus);
                            }}
                          >
                            <p className="font-medium truncate">
                              {c.status === "trial" ? "Trial Class" : "Class"}
                            </p>
                            {c.notes && (
                              <p className="opacity-80 truncate">{c.notes}</p>
                            )}
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
    </div>
  );
};

export default CalendarTab;
