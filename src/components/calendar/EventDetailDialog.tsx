import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle
} from "lucide-react";
import { CalendarEvent } from "./WeeklyCalendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  canEdit?: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-100 text-amber-800 border-amber-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  canceled: "bg-red-100 text-red-800 border-red-300",
  makeup: "bg-blue-100 text-blue-800 border-blue-300",
  trial: "bg-violet-100 text-violet-800 border-violet-300",
};

const EventDetailDialog = ({
  event,
  open,
  onOpenChange,
  onUpdate,
  canEdit = false,
}: EventDetailDialogProps) => {
  if (!event) return null;

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("classes")
      .update({ status: newStatus })
      .eq("id", event.id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(`Class marked as ${newStatus}`);
    onUpdate?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Class Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`${statusColors[event.status]} capitalize`}
            >
              {event.status}
            </Badge>
            {event.is_makeup && (
              <Badge variant="secondary">Makeup Class</Badge>
            )}
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">
                {format(new Date(event.scheduled_date), "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.scheduled_time} • {event.duration_minutes} minutes
              </p>
            </div>
          </div>

          {/* Coach/Student Info */}
          {event.coach_name && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Coach</p>
                <p className="font-medium">{event.coach_name}</p>
              </div>
            </div>
          )}

          {event.student_name && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{event.student_name}</p>
              </div>
            </div>
          )}

          {/* Meet Link */}
          {event.meet_link && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Video className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Google Meet</p>
                <a 
                  href={event.meet_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm truncate block"
                >
                  {event.meet_link}
                </a>
              </div>
              <Button
                size="sm"
                onClick={() => window.open(event.meet_link!, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Join
              </Button>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{event.notes}</p>
              </div>
            </div>
          )}

          {/* Actions (for coaches/admins) */}
          {canEdit && event.status === "scheduled" && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => updateStatus("completed")}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => updateStatus("canceled")}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Join Meeting Button (prominent for students) */}
          {!canEdit && event.meet_link && event.status === "scheduled" && (
            <Button
              size="lg"
              className="w-full"
              onClick={() => window.open(event.meet_link!, "_blank")}
            >
              <Video className="w-5 h-5 mr-2" />
              Join Google Meet
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
