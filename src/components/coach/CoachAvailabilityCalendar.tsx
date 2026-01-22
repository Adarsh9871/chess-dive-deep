import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Calendar, Copy, Check } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
];

const workingHours = timeOptions.filter(t => {
  const hour = parseInt(t.split(":")[0]);
  return hour >= 8 && hour <= 20;
});

const CoachAvailabilityCalendar = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Form state for adding
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

  // Week view state
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("coach_availability")
      .select("*")
      .eq("coach_id", user.id)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      console.error("Error fetching availability:", error);
    } else {
      setAvailability(data || []);
    }
    setLoading(false);
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(a => a.day_of_week === dayOfWeek);
  };

  const getAvailabilityForSlot = (dayOfWeek: number, time: string) => {
    return availability.find(
      a => a.day_of_week === dayOfWeek && 
           a.start_time <= time && 
           a.end_time > time
    );
  };

  const handleSlotClick = (dayOfWeek: number, time: string) => {
    const existingSlot = getAvailabilityForSlot(dayOfWeek, time);
    if (existingSlot) {
      // Toggle availability
      toggleAvailability(existingSlot.id, existingSlot.is_available);
    } else {
      // Open add dialog
      setSelectedDay(dayOfWeek);
      setSelectedTime(time);
      setNewStart(time);
      // Default end time to 1 hour later
      const startHour = parseInt(time.split(":")[0]);
      const endHour = Math.min(startHour + 1, 21);
      setNewEnd(`${endHour.toString().padStart(2, "0")}:00`);
      setShowAddDialog(true);
    }
  };

  const addAvailability = async () => {
    if (selectedDay === null || !newStart || !newEnd) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newStart >= newEnd) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("coach_availability").insert({
      coach_id: user?.id,
      day_of_week: selectedDay,
      start_time: newStart,
      end_time: newEnd,
      is_available: true,
    });

    setSaving(false);

    if (error) {
      toast.error("Failed to add availability");
      return;
    }

    toast.success("Availability added!");
    setShowAddDialog(false);
    setSelectedDay(null);
    setNewStart("");
    setNewEnd("");
    fetchAvailability();
  };

  const toggleAvailability = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("coach_availability")
      .update({ is_available: !currentState })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    fetchAvailability();
  };

  const deleteAvailability = async (id: string) => {
    const { error } = await supabase
      .from("coach_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }

    toast.success("Slot removed");
    fetchAvailability();
  };

  const copyDayAvailability = async (fromDay: number, toDay: number) => {
    const slotsToday = getAvailabilityForDay(fromDay);
    if (slotsToday.length === 0) {
      toast.error("No slots to copy from this day");
      return;
    }

    for (const slot of slotsToday) {
      await supabase.from("coach_availability").insert({
        coach_id: user?.id,
        day_of_week: toDay,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available,
      });
    }

    toast.success(`Copied ${slotsToday.length} slots to ${dayNames[toDay]}`);
    fetchAvailability();
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                My Availability Calendar
              </CardTitle>
              <CardDescription>
                Click on time slots to set your availability for student bookings
              </CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedDay(1); // Monday
              setShowAddDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border" />
              <span className="text-sm">Unavailable / Not Set</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">Disabled</span>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div className="p-2 text-xs font-medium text-muted-foreground">Time</div>
                {dayNames.map((day, i) => (
                  <div key={i} className="p-2 text-center">
                    <p className="text-xs font-medium text-muted-foreground hidden sm:block">{day}</p>
                    <p className="text-xs font-medium text-muted-foreground sm:hidden">{shortDayNames[i]}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {getAvailabilityForDay(i).filter(a => a.is_available).length} slots
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="border rounded-lg overflow-hidden">
                {workingHours.map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 gap-px bg-border">
                    <div className="p-2 text-xs font-mono text-muted-foreground bg-muted">
                      {time}
                    </div>
                    {dayNames.map((_, dayIndex) => {
                      const slot = getAvailabilityForSlot(dayIndex, time);
                      const isStart = slot?.start_time === time;
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            p-1 min-h-[32px] cursor-pointer transition-all relative group
                            ${slot 
                              ? slot.is_available 
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30' 
                                : 'bg-amber-500/20 hover:bg-amber-500/30'
                              : 'bg-background hover:bg-muted/50'
                            }
                            ${isStart ? 'border-t-2 border-t-primary' : ''}
                          `}
                          onClick={() => handleSlotClick(dayIndex, time)}
                        >
                          {isStart && slot && (
                            <div className="absolute inset-0 p-1">
                              <div className={`
                                text-[10px] font-medium truncate
                                ${slot.is_available ? 'text-emerald-700' : 'text-amber-700'}
                              `}>
                                {slot.start_time}-{slot.end_time}
                              </div>
                            </div>
                          )}
                          
                          {/* Hover tooltip */}
                          {slot && (
                            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAvailability(slot.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-6">
            {dayNames.map((day, i) => {
              const daySlots = getAvailabilityForDay(i);
              const activeSlots = daySlots.filter(s => s.is_available);
              
              return (
                <Card key={i} className={activeSlots.length > 0 ? 'border-emerald-200 bg-emerald-50/50' : ''}>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-muted-foreground">{day}</p>
                    <p className="text-lg font-bold">{activeSlots.length}</p>
                    <p className="text-[10px] text-muted-foreground">active slots</p>
                    {daySlots.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 h-6 text-xs"
                        onClick={() => {
                          // Copy to next day
                          const nextDay = (i + 1) % 7;
                          copyDayAvailability(i, nextDay);
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy to {shortDayNames[(i + 1) % 7]}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Availability Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
            <DialogDescription>
              Set a time slot when you're available for student sessions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Day of Week</label>
              <Select 
                value={selectedDay?.toString() || ""} 
                onValueChange={(v) => setSelectedDay(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayNames.map((day, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Time</label>
                <Select value={newStart} onValueChange={setNewStart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Time</label>
                <Select value={newEnd} onValueChange={setNewEnd}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addAvailability} disabled={saving}>
              {saving ? "Adding..." : "Add Availability"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachAvailabilityCalendar;
