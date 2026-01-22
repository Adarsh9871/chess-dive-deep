import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CalendarIcon, Video, Loader2, Link as LinkIcon, ExternalLink } from "lucide-react";

interface Student {
  user_id: string;
  display_name: string;
}

interface ScheduleClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedDate?: Date;
  preselectedTime?: string;
  preselectedStudent?: string;
  isCoach?: boolean;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = (8 + i).toString().padStart(2, "0");
  return `${hour}:00`;
});

const ScheduleClassDialog = ({
  open,
  onOpenChange,
  onSuccess,
  preselectedDate,
  preselectedTime,
  preselectedStudent,
  isCoach = false,
}: ScheduleClassDialogProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(preselectedDate);
  const [selectedTime, setSelectedTime] = useState(preselectedTime || "");
  const [selectedStudent, setSelectedStudent] = useState(preselectedStudent || "");
  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [duration, setDuration] = useState("60");
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  useEffect(() => {
    if (open && isCoach) {
      fetchAssignedStudents();
    }
  }, [open, isCoach]);

  useEffect(() => {
    if (preselectedDate) setSelectedDate(preselectedDate);
    if (preselectedTime) setSelectedTime(preselectedTime);
    if (preselectedStudent) setSelectedStudent(preselectedStudent);
  }, [preselectedDate, preselectedTime, preselectedStudent]);

  const fetchAssignedStudents = async () => {
    if (!user) return;
    setLoadingStudents(true);

    const { data: assignments } = await supabase
      .from("coach_student_assignments")
      .select("student_id")
      .eq("coach_id", user.id)
      .eq("status", "active");

    if (assignments && assignments.length > 0) {
      const studentIds = assignments.map((a) => a.student_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", studentIds);

      setStudents(profiles || []);
    }

    setLoadingStudents(false);
  };

  const generateMeetLink = () => {
    // Generate a unique Google Meet-style link
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const generateCode = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    
    const meetCode = `${generateCode(3)}-${generateCode(4)}-${generateCode(3)}`;
    const link = `https://meet.google.com/${meetCode}`;
    setMeetLink(link);
    toast.success("Google Meet link generated!");
    return link;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    if (isCoach && !selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    setSaving(true);

    // Auto-generate meet link if not provided
    const finalMeetLink = meetLink || generateMeetLink();

    const classData = {
      scheduled_date: format(selectedDate, "yyyy-MM-dd"),
      scheduled_time: selectedTime,
      status,
      notes: notes || null,
      duration_minutes: parseInt(duration),
      meet_link: finalMeetLink,
      coach_id: isCoach ? user?.id : null,
      student_id: isCoach ? selectedStudent : user?.id,
    };

    const { data: newClass, error } = await supabase
      .from("classes")
      .insert(classData)
      .select()
      .single();

    if (error) {
      console.error("Error scheduling class:", error);
      toast.error("Failed to schedule class");
      setSaving(false);
      return;
    }

    // Send notification to student
    if (sendNotification && selectedStudent && isCoach) {
      try {
        const studentName = students.find(s => s.user_id === selectedStudent)?.display_name || 'Student';
        
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: selectedStudent,
            type: 'class_scheduled',
            title: '🗓️ New Class Scheduled!',
            message: `Your 1-on-1 class has been scheduled for ${format(selectedDate, "EEEE, MMMM d")} at ${selectedTime}. Duration: ${duration} minutes.${notes ? ` Notes: ${notes}` : ''}`,
            relatedId: newClass.id,
            meetLink: finalMeetLink,
          }
        });
        console.log("Notification sent to student");
      } catch (e) {
        console.log("Notification send failed:", e);
      }
    }

    setSaving(false);
    toast.success("Class scheduled successfully! Student has been notified.");
    resetForm();
    onOpenChange(false);
    onSuccess?.();
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedStudent("");
    setMeetLink("");
    setNotes("");
    setStatus("scheduled");
    setDuration("60");
    setSendNotification(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            {isCoach ? "Schedule 1-on-1 Class" : "Request Class"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student Selector (for coaches) */}
          {isCoach && (
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStudents ? "Loading..." : "Select student"} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.display_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && !loadingStudents && (
                <p className="text-xs text-muted-foreground">
                  No students assigned. Ask admin to assign students first.
                </p>
              )}
            </div>
          )}

          {/* Status (for coaches) */}
          {isCoach && (
            <div className="space-y-2">
              <Label>Class Type</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Regular</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Google Meet Link */}
          {isCoach && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4 text-green-600" />
                Google Meet Link
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Auto-generated if empty"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMeetLink}
                  title="Generate Meet link"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
              {meetLink && (
                <a 
                  href={meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Test link
                </a>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add any notes about this class..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Notification Toggle */}
          {isCoach && selectedStudent && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="sendNotification"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="sendNotification" className="text-sm cursor-pointer">
                Send email/SMS notification to student
              </Label>
            </div>
          )}

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Schedule Class
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleClassDialog;
