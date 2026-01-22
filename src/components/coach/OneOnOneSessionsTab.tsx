import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, addMinutes, parseISO } from "date-fns";
import { Video, Calendar, Clock, Users, ExternalLink, Play, CheckCircle, XCircle } from "lucide-react";

interface ClassSession {
  id: string;
  student_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  meet_link: string | null;
  status: string;
  notes: string | null;
  student_name?: string;
}

const OneOnOneSessionsTab = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    const { data: classesData } = await supabase
      .from("classes")
      .select("*")
      .eq("coach_id", user.id)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    if (classesData && profiles) {
      const enriched = classesData.map(c => ({
        ...c,
        student_name: profiles.find(p => p.user_id === c.student_id)?.display_name || 'Unknown Student',
      }));
      setSessions(enriched);
    }

    setLoading(false);
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    const { error } = await supabase
      .from("classes")
      .update({ status })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to update session");
      return;
    }

    toast.success(`Session marked as ${status}`);
    fetchSessions();
  };

  const generateNewMeetLink = async (sessionId: string, studentId: string) => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const generateCode = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    
    const meetLink = `https://meet.google.com/${generateCode(3)}-${generateCode(4)}-${generateCode(3)}`;

    const { error } = await supabase
      .from("classes")
      .update({ meet_link: meetLink })
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to generate link");
      return;
    }

    // Notify student
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: studentId,
          type: 'class_scheduled',
          title: '🔗 New Meeting Link',
          message: `A new Google Meet link has been generated for your upcoming class.`,
          meetLink: meetLink,
        }
      });
    } catch (e) {
      console.log("Notification failed:", e);
    }

    toast.success("New link generated and sent to student!");
    window.open(meetLink, "_blank");
    fetchSessions();
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMM d");
  };

  const isSessionNow = (date: string, time: string, duration: number) => {
    const sessionStart = new Date(`${date}T${time}`);
    const sessionEnd = addMinutes(sessionStart, duration);
    const now = new Date();
    return now >= sessionStart && now <= sessionEnd;
  };

  const getStatusBadge = (session: ClassSession) => {
    if (session.status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (session.status === 'canceled') {
      return <Badge variant="destructive">Canceled</Badge>;
    }
    if (isSessionNow(session.scheduled_date, session.scheduled_time, session.duration_minutes)) {
      return <Badge className="bg-orange-500 animate-pulse">Live Now</Badge>;
    }
    return <Badge variant="secondary">{session.status}</Badge>;
  };

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const dateKey = session.scheduled_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, ClassSession[]>);

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
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            1-on-1 Sessions
            <Badge variant="secondary" className="ml-2">{sessions.length} upcoming</Badge>
          </CardTitle>
          <CardDescription>
            Manage your scheduled 1-on-1 teaching sessions with Google Meet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedSessions).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date}>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {getDateLabel(date)}
                    <Badge variant="outline" className="ml-2">
                      {dateSessions.length} session{dateSessions.length > 1 ? 's' : ''}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {dateSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSessionNow(session.scheduled_date, session.scheduled_time, session.duration_minutes)
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                            : 'bg-background hover:border-primary/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{session.student_name}</p>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {session.scheduled_time}
                                </span>
                                <span>•</span>
                                <span>{session.duration_minutes} min</span>
                                {getStatusBadge(session)}
                              </div>
                              {session.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {session.meet_link ? (
                              <Button size="sm" asChild className="gap-2">
                                <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                                  <Play className="w-4 h-4" />
                                  Join Meet
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => generateNewMeetLink(session.id, session.student_id)}
                                className="gap-2"
                              >
                                <Video className="w-4 h-4" />
                                Generate Link
                              </Button>
                            )}

                            {session.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSessionStatus(session.id, 'completed')}
                                  className="gap-1"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Done
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSessionStatus(session.id, 'canceled')}
                                  className="gap-1"
                                >
                                  <XCircle className="w-4 h-4 text-destructive" />
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No upcoming sessions</p>
              <p className="text-sm">Schedule classes from the "My Students" tab</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OneOnOneSessionsTab;
