import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { Users, GraduationCap, Video, Calendar, Clock, MessageSquare, ExternalLink } from "lucide-react";
import ScheduleClassDialog from "@/components/calendar/ScheduleClassDialog";

interface Student {
  student_id: string;
  student_name?: string;
  student_email?: string;
  status: string;
  created_at: string;
  notes?: string | null;
}

interface UpcomingClass {
  id: string;
  student_id: string;
  scheduled_date: string;
  scheduled_time: string;
  meet_link: string | null;
  status: string;
}

const MyStudentsTab = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    fetchStudents();
    fetchUpcomingClasses();
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from("coach_student_assignments")
      .select("*")
      .eq("coach_id", user.id)
      .eq("status", "active");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email");

    if (assignments && profiles) {
      const enriched = assignments.map(a => ({
        ...a,
        student_name: profiles.find(p => p.user_id === a.student_id)?.display_name || 'Unknown Student',
        student_email: profiles.find(p => p.user_id === a.student_id)?.email || '',
      }));
      setStudents(enriched);
    }

    setLoading(false);
  };

  const fetchUpcomingClasses = async () => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("coach_id", user.id)
      .gte("scheduled_date", today)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true })
      .order("scheduled_time", { ascending: true })
      .limit(10);

    setUpcomingClasses(data || []);
  };

  const handleQuickSchedule = (studentId: string) => {
    setSelectedStudentId(studentId);
    setShowScheduleDialog(true);
  };

  const startInstantMeet = async (studentId: string, studentName: string) => {
    // Generate a quick meet link
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const generateCode = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    
    const meetCode = `${generateCode(3)}-${generateCode(4)}-${generateCode(3)}`;
    const meetLink = `https://meet.google.com/${meetCode}`;

    // Create an instant class entry
    const today = new Date();
    const { error } = await supabase.from("classes").insert({
      coach_id: user?.id,
      student_id: studentId,
      scheduled_date: format(today, "yyyy-MM-dd"),
      scheduled_time: format(today, "HH:mm"),
      status: "scheduled",
      meet_link: meetLink,
      notes: "Instant session",
      duration_minutes: 60,
    });

    if (error) {
      toast.error("Failed to create session");
      return;
    }

    // Send notification
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: studentId,
          type: 'class_scheduled',
          title: '🎥 Instant Class Started!',
          message: `Your coach has started an instant 1-on-1 session. Join now!`,
          meetLink: meetLink,
        }
      });
    } catch (e) {
      console.log("Notification failed:", e);
    }

    toast.success("Session created! Opening Google Meet...");
    window.open(meetLink, "_blank");
    fetchUpcomingClasses();
  };

  const getNextClassForStudent = (studentId: string) => {
    return upcomingClasses.find(c => c.student_id === studentId);
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
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            My Students
            <Badge variant="secondary" className="ml-2">{students.length}</Badge>
          </CardTitle>
          <CardDescription>
            Students assigned to you for 1-on-1 coaching. Schedule classes or start instant sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {students.map((s) => {
                const nextClass = getNextClassForStudent(s.student_id);
                
                return (
                  <div
                    key={s.student_id}
                    className="p-4 rounded-xl border bg-background hover:border-primary/50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{s.student_name}</p>
                          {s.student_email && (
                            <p className="text-xs text-muted-foreground">{s.student_email}</p>
                          )}
                          <Badge variant="secondary" className="text-xs mt-1">
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Next scheduled class */}
                    {nextClass && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Next class:</span>
                          <span className="text-muted-foreground">
                            {format(new Date(nextClass.scheduled_date), "MMM d")} at {nextClass.scheduled_time}
                          </span>
                        </div>
                        {nextClass.meet_link && (
                          <a
                            href={nextClass.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <Video className="w-4 h-4" />
                            Join Meet
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => startInstantMeet(s.student_id, s.student_name || '')}
                        className="flex-1 gap-2"
                      >
                        <Video className="w-4 h-4" />
                        Start Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickSchedule(s.student_id)}
                        className="flex-1 gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No students assigned yet</p>
              <p className="text-sm">Admin will assign students to you</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Classes Overview */}
      {upcomingClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingClasses.slice(0, 5).map((c) => {
                const student = students.find(s => s.student_id === c.student_id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student?.student_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(c.scheduled_date), "EEEE, MMM d")} at {c.scheduled_time}
                        </p>
                      </div>
                    </div>
                    {c.meet_link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={c.meet_link} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 mr-1" />
                          Join
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <ScheduleClassDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSuccess={() => {
          fetchUpcomingClasses();
          toast.success("Class scheduled!");
        }}
        isCoach={true}
        preselectedStudent={selectedStudentId}
      />
    </div>
  );
};

export default MyStudentsTab;
