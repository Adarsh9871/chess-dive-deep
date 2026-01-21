import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Calendar } from "lucide-react";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
];

const CoachAvailabilityTab = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [newDay, setNewDay] = useState<string>("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [saving, setSaving] = useState(false);

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

  const addAvailability = async () => {
    if (!newDay || !newStart || !newEnd) {
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
      day_of_week: parseInt(newDay),
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
    setShowAdd(false);
    setNewDay("");
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

  // Group by day
  const groupedAvailability = dayNames.map((dayName, index) => ({
    day: dayName,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index),
  }));

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                My Availability
              </CardTitle>
              <CardDescription>
                Set your available time slots for students to book sessions
              </CardDescription>
            </div>
            <Button onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAdd && (
            <div className="p-4 mb-6 rounded-lg border bg-muted/30 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Day of Week</label>
                  <Select value={newDay} onValueChange={setNewDay}>
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

              <div className="flex gap-2">
                <Button onClick={addAvailability} disabled={saving}>
                  {saving ? "Adding..." : "Add Availability"}
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {groupedAvailability.map((group) => (
              <div key={group.dayIndex} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {group.day}
                  <Badge variant="secondary" className="ml-auto">
                    {group.slots.length} slots
                  </Badge>
                </div>
                {group.slots.length > 0 ? (
                  <div className="divide-y">
                    {group.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`px-4 py-3 flex items-center justify-between ${
                          !slot.is_available ? 'bg-muted/30 opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          {!slot.is_available && (
                            <Badge variant="outline">Unavailable</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={slot.is_available}
                            onCheckedChange={() => toggleAvailability(slot.id, slot.is_available)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAvailability(slot.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No availability set
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachAvailabilityTab;
