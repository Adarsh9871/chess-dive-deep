import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Calendar, Clock, User, Phone, PhoneOff, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isTomorrow } from "date-fns";
import { VideoCallButton } from "@/components/video/VideoCallRoom";

interface UpcomingClass {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  coach_id: string;
  student_id: string;
  notes: string | null;
  coach_name?: string;
  student_name?: string;
}

interface VideoSessionsTabProps {
  isCoach?: boolean;
}

const VideoSessionsTab = ({ isCoach = false }: VideoSessionsTabProps) => {
  const { user } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingClasses();
    }
  }, [user]);

  const fetchUpcomingClasses = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Fetch classes where user is either coach or student
      const { data: classes, error } = await supabase
        .from("classes")
        .select("*")
        .gte("scheduled_date", today)
        .eq("status", "scheduled")
        .or(isCoach ? `coach_id.eq.${user.id}` : `student_id.eq.${user.id}`)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(5);

      if (error) throw error;

      if (classes) {
        // Fetch profile names for coaches/students
        const userIds = new Set<string>();
        classes.forEach(c => {
          if (c.coach_id) userIds.add(c.coach_id);
          if (c.student_id) userIds.add(c.student_id);
        });

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", Array.from(userIds));

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name || p.email?.split("@")[0] || "User"]) || []);

        const enrichedClasses = classes.map(c => ({
          ...c,
          coach_name: profileMap.get(c.coach_id || "") || "Coach",
          student_name: profileMap.get(c.student_id || "") || "Student",
        }));

        setUpcomingClasses(enrichedClasses);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load upcoming classes");
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const handleCallStart = (classId: string) => {
    setActiveSession(classId);
  };

  const handleCallEnd = () => {
    setActiveSession(null);
    toast.info("Video call ended");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-emerald-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Video Sessions</h2>
            <p className="text-sm text-muted-foreground">
              {isCoach ? "Meet with your students" : "Meet with your coach"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Active session */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-secondary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="w-4 h-4 text-secondary animate-pulse" />
                Active Video Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingClasses.find(c => c.id === activeSession) && (
                <VideoCallButton
                  classId={activeSession}
                  coachId={upcomingClasses.find(c => c.id === activeSession)?.coach_id || ""}
                  studentId={upcomingClasses.find(c => c.id === activeSession)?.student_id || ""}
                  coachName={upcomingClasses.find(c => c.id === activeSession)?.coach_name || "Coach"}
                  studentName={upcomingClasses.find(c => c.id === activeSession)?.student_name || "Student"}
                  isCoach={isCoach}
                  onCallEnd={handleCallEnd}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upcoming classes */}
      {upcomingClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">No Upcoming Sessions</h3>
            <p className="text-muted-foreground text-sm">
              {isCoach 
                ? "You don't have any scheduled classes yet."
                : "Book a session with your coach to get started!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingClasses.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-bold text-foreground">
                            {getDateLabel(cls.scheduled_date)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {cls.scheduled_time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {isCoach ? cls.student_name : cls.coach_name}
                        </p>
                        {cls.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{cls.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeSession !== cls.id ? (
                        <Button
                          onClick={() => handleCallStart(cls.id)}
                          className="gap-2 bg-gradient-to-r from-secondary to-emerald-500"
                        >
                          <Video className="w-4 h-4" />
                          Start Call
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={handleCallEnd}
                          className="gap-2"
                        >
                          <PhoneOff className="w-4 h-4" />
                          End Call
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick join info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">How it works</p>
              <p className="text-xs text-muted-foreground">
                Click "Start Call" to open a video session. Share the link with your {isCoach ? "student" : "coach"} to join. 
                Video calls use Jitsi Meet - free, secure, and no account needed!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoSessionsTab;
