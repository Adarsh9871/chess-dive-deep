import { useState, useEffect } from "react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  addWeeks, 
  subWeeks, 
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfDay
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video,
  ExternalLink,
  Clock,
  User
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CalendarEvent {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes: string | null;
  student_id: string | null;
  coach_id: string | null;
  duration_minutes: number;
  meet_link?: string | null;
  coach_name?: string;
  student_name?: string;
  is_makeup?: boolean;
}

interface WeeklyCalendarProps {
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (date: Date, time: string) => void;
  viewType?: "week" | "month" | "day" | "agenda";
  showMeetLink?: boolean;
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

const workingHoursSlots = timeSlots.filter((t) => {
  const hour = parseInt(t.split(":")[0]);
  return hour >= 8 && hour <= 21;
});

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  upcoming: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
  canceled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  makeup: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  trial: { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-300" },
};

const WeeklyCalendar = ({
  events,
  loading = false,
  onEventClick,
  onSlotClick,
  viewType = "week",
  showMeetLink = true,
}: WeeklyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "workWeek" | "day" | "agenda">(viewType === "month" ? "month" : "week");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const workWeekDays = weekDays.slice(1, 6); // Mon-Fri

  const getEventsForSlot = (day: Date, time: string) => {
    return events.filter(
      (e) =>
        isSameDay(new Date(e.scheduled_date), day) &&
        e.scheduled_time === time
    );
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((e) => isSameDay(new Date(e.scheduled_date), day));
  };

  const navigate = (direction: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === "day") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 1) : addDays(currentDate, -1));
    } else {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const getDateRangeLabel = () => {
    if (view === "month") {
      return format(currentDate, "MMMM yyyy");
    } else if (view === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else {
      return `${format(weekStart, "MMMM d")} – ${format(addDays(weekStart, 6), "d, yyyy")}`;
    }
  };

  const displayDays = view === "workWeek" ? workWeekDays : weekDays;
  const displaySlots = workingHoursSlots;

  // Month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={`bg-background p-2 min-h-[100px] ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
              onClick={() => onSlotClick?.(day, "09:00")}
            >
              <p className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${
                      statusColors[event.status]?.bg || "bg-muted"
                    } ${statusColors[event.status]?.text || "text-foreground"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.scheduled_time} - {event.coach_name || event.student_name || "Class"}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Day view
  const renderDayView = () => (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted p-3 text-center border-b">
        <p className="text-lg font-bold">{format(currentDate, "EEEE")}</p>
        <p className={`text-2xl font-bold ${isSameDay(currentDate, new Date()) ? "text-primary" : ""}`}>
          {format(currentDate, "d")}
        </p>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {displaySlots.map((time) => {
          const slotEvents = getEventsForSlot(currentDate, time);
          return (
            <div
              key={time}
              className="grid grid-cols-[80px_1fr] border-b last:border-b-0 hover:bg-muted/30"
              onClick={() => onSlotClick?.(currentDate, time)}
            >
              <div className="p-3 text-sm text-muted-foreground font-medium border-r">
                {time}
              </div>
              <div className="p-2 min-h-[60px]">
                {slotEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => onEventClick?.(event)}
                    showMeetLink={showMeetLink}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Agenda view
  const renderAgendaView = () => {
    const sortedEvents = [...events]
      .filter((e) => new Date(e.scheduled_date) >= startOfDay(new Date()))
      .sort((a, b) => {
        const dateCompare = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.scheduled_time.localeCompare(b.scheduled_time);
      })
      .slice(0, 20);

    return (
      <div className="space-y-2">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <Card 
              key={event.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onEventClick?.(event)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.scheduled_date), "EEE")}
                    </p>
                    <p className="text-lg font-bold">
                      {format(new Date(event.scheduled_date), "d")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.scheduled_date), "MMM")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{event.scheduled_time}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.coach_name || event.student_name || "Chess Class"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`${statusColors[event.status]?.bg} ${statusColors[event.status]?.text} ${statusColors[event.status]?.border}`}
                  >
                    {event.status}
                  </Badge>
                  {event.meet_link && showMeetLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(event.meet_link!, "_blank");
                      }}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  // Week/WorkWeek view
  const renderWeekView = () => (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`grid ${view === "workWeek" ? "grid-cols-6" : "grid-cols-8"} border-b`}>
        <div className="p-3 text-xs text-muted-foreground font-medium bg-muted">Time</div>
        {displayDays.map((day, i) => (
          <div
            key={i}
            className={`p-3 text-center border-l bg-muted ${
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
        {displaySlots.map((time) => (
          <div 
            key={time} 
            className={`grid ${view === "workWeek" ? "grid-cols-6" : "grid-cols-8"} border-b last:border-b-0`}
          >
            <div className="p-2 text-xs text-muted-foreground font-medium">
              {time}
            </div>
            {displayDays.map((day, dayIndex) => {
              const slotEvents = getEventsForSlot(day, time);
              return (
                <div
                  key={dayIndex}
                  className={`p-1 border-l min-h-[50px] hover:bg-muted/30 cursor-pointer ${
                    isSameDay(day, new Date()) ? "bg-primary/5" : ""
                  }`}
                  onClick={() => onSlotClick?.(day, time)}
                >
                  {slotEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => onEventClick?.(event)}
                      compact
                      showMeetLink={showMeetLink}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h3 className="font-display font-semibold text-lg ml-2">
            {getDateRangeLabel()}
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {(["month", "week", "workWeek", "day", "agenda"] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
              size="sm"
              onClick={() => setView(v)}
              className="text-xs capitalize"
            >
              {v === "workWeek" ? "Work Week" : v}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(statusColors).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
            <span className="text-xs capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {view === "month" && renderMonthView()}
      {view === "day" && renderDayView()}
      {view === "agenda" && renderAgendaView()}
      {(view === "week" || view === "workWeek") && renderWeekView()}
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
  showMeetLink?: boolean;
}

const EventCard = ({ event, onClick, compact = false, showMeetLink = true }: EventCardProps) => {
  const colors = statusColors[event.status] || statusColors.scheduled;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`text-xs p-1.5 rounded mb-1 cursor-pointer border ${colors.bg} ${colors.text} ${colors.border}`}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <div className="flex items-center gap-1">
                {event.meet_link && showMeetLink && <Video className="w-3 h-3" />}
                <span className="truncate font-medium">
                  {event.coach_name || event.student_name || "Class"}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{event.scheduled_time}</p>
              <p>{event.coach_name ? `Coach: ${event.coach_name}` : ""}</p>
              <p>{event.student_name ? `Student: ${event.student_name}` : ""}</p>
              {event.notes && <p className="text-xs opacity-80">{event.notes}</p>}
              {event.meet_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => window.open(event.meet_link!, "_blank")}
                >
                  <Video className="w-3 h-3 mr-1" />
                  Join Meeting
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer mb-2 ${colors.bg} ${colors.text} ${colors.border}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{event.coach_name || event.student_name || "Chess Class"}</p>
          <p className="text-sm opacity-80">{event.duration_minutes} min</p>
        </div>
        {event.meet_link && showMeetLink && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(event.meet_link!, "_blank");
            }}
          >
            <Video className="w-4 h-4 mr-1" />
            Join
          </Button>
        )}
      </div>
      {event.notes && <p className="text-xs mt-1 opacity-70">{event.notes}</p>}
    </div>
  );
};

export default WeeklyCalendar;
