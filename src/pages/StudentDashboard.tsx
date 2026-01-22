import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageSquare,
  BookOpen,
  Trophy,
  Clock,
  GraduationCap,
  PlayCircle,
  LogOut,
  Bell,
  ChevronRight,
  LayoutDashboard,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import CalendarTab from "@/components/dashboard/CalendarTab";
import MessagesTab from "@/components/dashboard/MessagesTab";
import MakeupClassTab from "@/components/dashboard/MakeupClassTab";
import CoachingRequestTab from "@/components/dashboard/CoachingRequestTab";

interface UpcomingClass {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  coach_name: string;
  status: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading, getDashboardPath } = useUserRole();
  const navigate = useNavigate();
  
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && !roleLoading) {
      navigate("/");
      return;
    }

    // Redirect coaches and admins to their respective dashboards
    if (!roleLoading && role && role !== 'student') {
      navigate(getDashboardPath());
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, role, roleLoading, navigate, getDashboardPath]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch upcoming classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, scheduled_date, scheduled_time, coach_id, status")
      .eq("student_id", user.id)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date", { ascending: true })
      .limit(5);

    if (classes) {
      // Fetch coach profiles
      const coachIds = [...new Set(classes.map(c => c.coach_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", coachIds);

      const enrichedClasses = classes.map(c => ({
        ...c,
        coach_name: profiles?.find(p => p.user_id === c.coach_id)?.display_name || "Unknown Coach",
      }));

      setUpcomingClasses(enrichedClasses);
    }

    // Fetch notifications
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (notifs) {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    }

    // Fetch unread messages count
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .or(`recipient_id.eq.${user.id},is_announcement.eq.true`)
      .eq("is_read", false);

    setUnreadCount(prev => prev + (count || 0));
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const markNotificationRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      {/* Dashboard Header */}
      <div className="bg-background border-b pt-20">
        <div className="container px-4 mx-auto py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl">My Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.email?.split("@")[0]}! 👋
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to="/play" className="gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Play Chess
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 mx-auto py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingClasses.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming Classes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Games Won</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Lessons Done</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread Messages</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-background border h-auto p-1 flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 relative">
              <MessageSquare className="w-4 h-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="coaching" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Video className="w-4 h-4" />
              Request Session
            </TabsTrigger>
            <TabsTrigger value="makeup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Makeup Class
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Classes
                  </CardTitle>
                  <CardDescription>Your scheduled lessons this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingClasses.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{cls.coach_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(cls.scheduled_date), "MMM d")} at {cls.scheduled_time}
                              </p>
                            </div>
                          </div>
                          <Badge variant={cls.status === 'scheduled' ? 'secondary' : 'default'}>
                            {cls.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No upcoming classes scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Recent updates and announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            notif.is_read ? 'bg-background' : 'bg-primary/5 border-primary/20'
                          }`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(notif.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump to your favorite activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/play">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <PlayCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">Play Chess</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/lessons">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">Lessons</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/puzzles">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">Puzzles</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/explore">
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <GraduationCap className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-sm">Explore</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarTab />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="coaching">
            <CoachingRequestTab />
          </TabsContent>

          <TabsContent value="makeup">
            <MakeupClassTab />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
